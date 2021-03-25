import { BrowserWindow } from 'electron'
import chokidar from 'chokidar'
import path from 'path'
import { pathExists } from 'fs-extra'
import produce, { enablePatches } from 'immer'
import { mapProject } from './mapProject'
import { mapDocument, removeMarkdown } from './mapDocument'
import { mapMedia } from './mapMedia'
import { findInTree, getFileType, isDoc, isMedia } from '../../shared/utils.js'
import matter from 'gray-matter'
import { debounce } from 'debounce'

enablePatches()

/**
 * Chokidar docs: https://www.npmjs.com/package/chokidar
 */
const chokidarConfig = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 200, // 3/9: Was 400
    pollInterval: 50 // 3/9: Was 200
  }
}

export class Watcher {
  constructor(id, project, window) {

    this.id = id
    this.directory = project.directory
    this.window = window

    // If directory is populated, create the watcher
    if (this.directory) {
      this.start()
    }
  }

  // ------ VARIABLES ------ //

  id = ''
  directory = ''
  window = undefined

  files = {}
  chokidarInstance = undefined
  pendingChanges = []
  changeTimer = undefined


  // ------ METHODS ------ //

  /**
   * Start the chokidar instance. Called once `this.directory` is first defined.
   */
  async start() {

    // Start watcher
    this.chokidarInstance = chokidar.watch(this.directory, chokidarConfig)

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.batchChanges('change', filePath))
      .on('add', (filePath) => this.batchChanges('add', filePath))
      .on('unlink', (filePath) => this.batchChanges('unlink', filePath))
      .on('addDir', (filePath) => this.batchChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.batchChanges('unlinkDir', filePath))

    // Map project
    this.files = await mapProject(this.directory)

    // Send initial files to browser window
    this.window.webContents.send('initialFilesFromMain', this.files)

    // Tell reducers when first project map is complete, 
    // and pass along first file. Reducer then sets this as
    // file that the focused panel should display.
    const firstDocId = this.files.allIds.find((id) => {
      const file = this.files.byId[id]
      return file.type == 'doc'
    })

    global.store.dispatch({
      type: 'PROJECT_FILES_MAPPED',
      firstDocId
    }, this.window)

    // Index files into DB
    insertAllDocsIntoDb(this.files)
  }

  changeDirectories(newDirectory) {
    this.chokidarInstance.unwatch(this.directory)
    this.directory = newDirectory
    this.start()
  }


  /**
   * Stop the chokidar instance. Called when project is closed.
   */
  stop() {
    // TODO: Stop watcher when project is closed
    this.chokidarInstance.close()
  }


  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them. We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  debounceFunc = debounce(() => {
    this.applyChanges(this.pendingChanges)
    this.pendingChanges = [] // Reset
  }, 200) // 3/9: Was 400

  batchChanges(event, filePath, stats) {
    const change = { event: event, path: filePath }

    if (stats) change.stats = stats

    // Push into list of pending changes
    this.pendingChanges.push(change)

    // Wait a bit, then apply the pending changes. Make the debounce timer longer if `addDir` event comes through. If it's too quick, subsequent `add` events are not caught by the timer.
    // const debounceTimer = event == 'addDir' ? 500 : 100

    this.debounceFunc()
  }


  /**
   * Take batched changes and update `files`, then send patches to associated BrowserWindow. If a directory was added or removede, remap everything.
   * @param {*} changes 
   */
  async applyChanges(changes) {

    // console.log(changes)

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir')

    if (directoryWasAddedOrRemoved) {

      /* 
      NOTE: This code is identical to what we do in start()
      If making changes, make sure to make them in both places.
      Could abstract into one function, but I don't know what
      to call it. `mapProject` is most logical, but already used.
      */

      // Map project
      this.files = await mapProject(this.directory)

      // Send initial files to browser window
      this.window.webContents.send('initialFilesFromMain', this.files)

      // Tell reducers when first project map is complete, 
      // and pass along first file. Reducer then sets this as
      // file that the focused panel should display.
      const firstDocId = this.files.allIds.find((id) => {
        const file = this.files.byId[id]
        return file.type == 'doc'
      })

      global.store.dispatch({
        type: 'PROJECT_FILES_MAPPED',
        firstDocId
      }, this.window)

      // Index files into DB
      insertAllDocsIntoDb(this.files)

    } else {

      // Do not proceed if app is quitting. At this point, `this.files` is destroyed, and Immer will throw error if we try to proceed.
      if (global.state().appStatus == 'wantsToQuit') return

      // Update `files` using Immer: 

      this.files = await produce(this.files, async (draft) => {
        for (const c of changes) {
          const ext = path.extname(c.path)
          const parentPath = path.dirname(c.path)
          const parentId = draft.allIds.find((id) => draft.byId[id].path == parentPath)
          const parentFolder = draft.byId[parentId]
          const parentTreeItem = findInTree(draft.tree, parentFolder.id, 'id')

          if (isDoc(ext) || isMedia(ext)) {

            switch (c.event) {

              case 'add': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats)
                // Add to `byId`
                draft.byId[file.id] = file
                // Add to `allIds`
                draft.allIds.push(file.id)
                // Add to `tree`
                parentTreeItem.children.push({
                  id: file.id,
                  parentId: file.parentId,
                  type: file.type
                })
                // Increment `numChildren` of parent folder
                parentFolder.numChildren++
                // Recursively increment parent folder(s) `numDescendants`
                incrementNumDescendants(parentFolder)
                function incrementNumDescendants(folder) {
                  folder.numDescendants++
                  if (folder.parentId !== '') {
                    incrementNumDescendants(draft.byId[folder.parentId])
                  }
                }
                // Add to database (if it's a doc)
                if (isDoc(ext)) insertDocIntoDb(file)
                break
              }

              case 'change': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats)
                draft.byId[file.id] = file
                // If doc, update row in db
                if (isDoc) insertDocIntoDb(file)
                break
              }

              case 'unlink': {
                const id = draft.allIds.find((id) => draft.byId[id].path == c.path)
                // Remove from `byId`
                delete draft.byId[id]
                // Remove from `allIds`
                draft.allIds.splice(draft.allIds.indexOf(id), 1)
                // Remove from `tree`
                parentTreeItem.children.splice(parentTreeItem.children.findIndex((child) => child.id == id), 1)
                // Decrement `numChidren` of parent folder
                parentFolder.numChildren--
                // Recursively decrement parent folder(s) `numDescendants`
                decrementNumDescendants(parentFolder)
                function decrementNumDescendants(folder) {
                  folder.numDescendants--
                  if (folder.parentId !== '') {
                    decrementNumDescendants(draft.byId[folder.parentId])
                  }
                }
                // Delete from database (if it's a doc)
                if (isDoc(ext)) global.db.delete(id)
                break
              }
            }
          }

        }
      }, (patches, inversePatches) => {
        this.window.webContents.send('filesPatchesFromMain', patches)
      })

      global.store.dispatch({ type: 'PROJECT_FILES_UPDATED' }, this.window)
    }
  }
}




// ------ UTILITY FUNCTIONS ------ //

/**
 * For each doc found in files, add it to the sqlite database. Most important is the document body, which we need for full text search. We get it as plain text by 1) loading the doc using gray-matter, which returns `content` for us, without front matter, and 2) removing markdown formatting.
 */
function insertAllDocsIntoDb(files) {
  const filesForDb = []
  files.allIds.forEach((id) => {
    const file = files.byId[id]
    if (file.type == 'doc') {
      filesForDb.push(getDbReadyFile(file))
    }
  })
  // Insert the files into the db
  global.db.insertMany(filesForDb)
}

/** 
 * Insert specified file in the sqlite database. If a row with the same `file.id` already exists, it will be replaced.
 */
function insertDocIntoDb(file) {
  global.db.insert(getDbReadyFile(file))
}

/**
 * Utility function that returns an object with 1) the file's metadata, and 2) it's full text content, stripped of markdown characters, excess whitespace, etc. We'll insert this object as a row in the sql database, for later full text searching.
 * @param {*} file - Taken from `files.byId`. Has title, path, etc.
 */
function getDbReadyFile(file) {

  // Get doc text, minus any front matter
  let { content } = matter.read(file.path)

  // Remove markdown formatting from text
  content = removeMarkdown(content)

  // Return object, ready for the db.
  return {
    id: file.id,
    name: file.name,
    title: file.title,
    path: file.path,
    body: content
  }
}