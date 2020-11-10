import chokidar from 'chokidar'
import path from 'path'
import { pathExists } from 'fs-extra'
import { produceWithPatches, enablePatches } from 'immer'
import { mapProject, mapDocument, mapMedia } from './index.js'
import { imageFormats, avFormats } from './formats'
import { execFile } from 'child_process'

enablePatches()

export class Watcher {
  constructor(project) {
    this.id = project.window.id
    this.directory = project.directory
    this.files = { ...newFiles }

    // If directory is not empty (e.g. when restarting the app with a project already set up), start the watcher. 
    // Else, start listening for directory value changes. Once user selects a project directory (e.g. in the first run experience), catch it 

    const directoryIsDefined = this.directory !== ''
    if (directoryIsDefined) {
      this.start()
    } else {
      // Create listener for directory changes
      global.store.onDidAnyChange((state, oldState) => {
        const directory = state.projects.find((p) => p.window.id == this.id).directory
        const directoryIsDefined = directory !== ''
        if (directoryIsDefined) {
          this.directory = directory
          this.start()
        }
      })
    }
  }

  chokidarInstance = undefined
  changes = []
  changeTimer = undefined
  directory = ''
  files = {}
  id = 0

  async start() {
    // TODO: This is a potential dead end. The watcher will not start, because the directory is invalid (e.g. perhaps it was deleted since last cold start)
    const directoryExists = await pathExists(this.directory)
    if (!directoryExists) return

    this.files = await mapProject(this.directory)
    // console.log(this.files)

    // Start watcher
    this.chokidarInstance = chokidar.watch(this.directory, chokidarConfig)

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.trackChanges('change', filePath))
      .on('add', (filePath) => this.trackChanges('add', filePath))
      .on('unlink', (filePath) => this.trackChanges('unlink', filePath))
      .on('addDir', (filePath) => this.trackChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.trackChanges('unlinkDir', filePath))
  }

  applyUpdates() {
    const [nextFiles, patches, inversePatches] = produceWithPatches(files, draftFiles => {
      const newProj = { ...newProject, windowId: project.window.id }
      draftFiles.push(newProj)
    })
  }

  sendPatchesToRenderProcess(patches) {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', patches))
    }
  }

  stop() {
    // await watcher.close()

  }

  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them.We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  trackChanges(event, filePath, stats) {
    const change = { event: event, path: filePath }

    if (stats) change.stats = stats
    // console.log(event)

    // Make the timer longer if `addDir` event comes through. 
    // If it's too quick, subsequent `add` events are not caught by the timer.
    const timerDuration = event == 'addDir' ? 500 : 100

    // Start a new timer if one is not already active.
    // Or refresh a timer already in progress.
    if (this.changeTimer == undefined || !this.changeTimer.hasRef()) {
      this.changes = [change]
      this.changeTimer = setTimeout(() => this.applyChanges(this.changes), timerDuration);
    } else {
      this.changes.push(change)
      this.changeTimer.refresh()
    }
  }

  async applyChanges(changes) {

    console.log(
      this.files.folders.allIds.length,
      this.files.docs.allIds.length,
      this.files.media.allIds.length
    )

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir')

    if (directoryWasAddedOrRemoved) {
      this.files = await mapProject(this.directory)
    } else {

      const [nextFiles, patches, inversePatches] = produceWithPatches(this.files, draft => {
        changes.forEach(async (c) => {

          const ext = path.extname(c.path)
          const type = getFileType(ext)
          const parentPath = path.dirname(c.path)
          const parentFolder = getFileByPath(this.files.folders, parentPath)

          // TODO: Fix use of `await` inside `produceWithPatches`... Is throwing error in `add` and `change`.

          switch (c.event) {
            case 'add':
              if (type == 'doc') {
                const doc = await mapDocument(c.path, c.stats, parentFolder.id)
                draft.docs.byId[doc.id] = doc
                draft.docs.allIds.push(doc.id)
              } else if (type == 'media') {
                const media = await mapMedia(c.path, c.stats, parentFolder.id, ext)
                draft.media.byId[media.id] = media
                draft.media.allIds.push(media.id)
              }
              break
            case 'change':
              if (type == 'doc') {
                const doc = await mapDocument(c.path, c.stats, parentFolder.id)
                draft.docs.byId[doc.id] = doc
              } else if (type == 'media') {
                const media = await mapMedia(c.path, c.stats, parentFolder.id, ext)
                draft.media.byId[media.id] = media
              }
              break
            case 'unlink':
              if (type == 'doc') {
                const doc = getFileByPath(this.files.docs, c.path)
                delete draft.docs.byId[doc.id]
                draft.docs.allIds.splice(doc.index, 1)
              } else if (type == 'media') {
                const media = getFileByPath(this.files.media, c.path)
                delete draft.media.byId[media.id]
                draft.media.allIds.splice(media.index, 1)
              }
              break
          }
        })
      })

      this.files = nextFiles
      console.log(
        this.files.folders.allIds.length,
        this.files.docs.allIds.length,
        this.files.media.allIds.length
      )
    }
  }
}

/** Utility function for determining file type. */
function getFileType(ext) {
  if (ext == '.md' || ext == '.markdown') {
    return 'doc'
  } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
    return 'media'
  } else {
    return 'unknown'
  }
}

/**
 * Utility function for getting objects (folders, docs, or media), from `files` by path.
 * @param {*} lookIn - `files.folders`, `files.docs`, or `files.media`
 * @param {*} path 
 */
function getFileByPath(lookIn, path) {
  let file = {}
  lookIn.allIds.find((id, index) => {
    if (lookIn.byId[id].path == path) {
      file = {
        id: id,
        file: lookIn.byId[id],
        index: index,
      }
      return true
    }
  })
  return file
}

// Do initial project map, if projectPath has been set)
// if (store.store.projectPath !== '') {
//   mapProject(store.store.projectPath, store)
// }

const newFiles = {
  folders: {
    byId: [],
    allIds: []
  },
  docs: {
    byId: [],
    allIds: []
  },
  media: {
    byId: [],
    allIds: []
  }
}

/**
 * Chokida rdocs: https://www.npmjs.com/package/chokidar
 */
const chokidarConfig = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 400,
    pollInterval: 200
  }
}
