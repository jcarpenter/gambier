import { BrowserWindow } from 'electron'
import chokidar from 'chokidar'
import path from 'path'
import { pathExists } from 'fs-extra'
import produce, { enablePatches } from 'immer'
import { mapProject } from './mapProject'
import { mapDocument } from './mapDocument'
import { mapMedia } from './mapMedia'
import { findInTree, getFileType, isDoc, isMedia } from '../../shared/utils.js'

enablePatches()

export class Watcher {
  constructor(project) {
    this.id = project.window.id
    this.directory = project.directory
    this.files = {}

    // Start listening for directory value changes. Once user selects a project directory (e.g. in the first run experience), catch it 

    // Create listener for directory changes
    global.store.onDidAnyChange((state, oldState) => {

      const directory = state.projects.find((p) => p.window.id == this.id).directory
      const directoryIsDefined = directory !== ''
      const directoryWasEmpty = this.directory == ''
      const directoryHasChanged = directory !== this.directory

      if (directoryIsDefined) {
        if (directoryWasEmpty) {
          this.directory = directory
          this.start()
        } else if (directoryHasChanged) {
          this.update()
        }
      }
    })

    if (this.directory) {
      this.start()
    }
  }

  chokidarInstance = undefined
  changes = []
  changeTimer = undefined
  directory = ''
  files = {}
  id = 0

  async start() {
    
    const stmt = global.db.prepare('INSERT INTO docs (id, name, title, body) VALUES (?, ?, ?, ?)')

    this.files = await mapProject(this.directory)
    // console.log(JSON.stringify(this.files.tree, null, 2))
    // Start watcher
    this.chokidarInstance = chokidar.watch(this.directory, chokidarConfig)

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.batchChanges('change', filePath))
      .on('add', (filePath) => this.batchChanges('add', filePath))
      .on('unlink', (filePath) => this.batchChanges('unlink', filePath))
      .on('addDir', (filePath) => this.batchChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.batchChanges('unlinkDir', filePath))

    // Send initial files to browser window
    const win = BrowserWindow.fromId(this.id)
    win.webContents.send('initialFilesFromMain', this.files)

    // Index files into DB
    this.files.allIds.forEach((id) => {
      const file = this.files.byId[id]
      if (file.type == 'doc') {
        stmt.run(id, file.name, file.title, file.excerpt)
      }
    })

    const getAll = global.db.prepare('SELECT * FROM docs')
    console.log(getAll.all())
  }

  stop() {
    // await watcher.close()

  }

  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them. We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  batchChanges(event, filePath, stats) {
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

  /**
   * Take batched changes and update `files`, then send patches to associated BrowserWindow.
   * @param {*} changes 
   */
  async applyChanges(changes) {

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir')

    if (directoryWasAddedOrRemoved) {
      this.files = await mapProject(this.directory)
    } else {
      this.files = await produce(this.files, async (draft) => {
        for (const c of changes) {
          const ext = path.extname(c.path)
          const parentPath = path.dirname(c.path)
          const parentFolder = getFileByPath(draft, parentPath)
          const parentTreeItem = findInTree(draft.tree, parentFolder.id, 'id')

          if (isDoc(ext) || isMedia(ext)) {

            switch (c.event) {
              case 'add': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats)
                // Add to `byId`, `allIds`, and parent's children.
                draft.byId[file.id] = file
                draft.allIds.push(file.id)
                parentTreeItem.children.push({
                  id: file.id,
                  parentId: file.parentId,
                  type: file.type
                })
                break
              }
              case 'change': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats)
                draft.byId[file.id] = file
                break
              }
              case 'unlink': {
                const file = getFileByPath(draft, c.path)
                // Remove from `byId`, `allIds`, and parent's children.
                delete draft.byId[file.id]
                draft.allIds.splice(file.index, nnpm1)
                const indexInChildren = parentTreeItem.children.findIndex((child) => child.id == file.id)
                parentTreeItem.children.splice(indexInChildren, 1)
                break
              }
            }
          }
        }
      }, (patches, inversePatches) => {
        const win = BrowserWindow.fromId(this.id)
        console.log(patches)
        win.webContents.send('filesPatchesFromMain', patches)
      })
    }
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
        nestDepth: lookIn.byId[id].nestDepth,
        index: index,
      }
      return true
    }
  })
  return file
}

/**
 * Chokidar docs: https://www.npmjs.com/package/chokidar
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
