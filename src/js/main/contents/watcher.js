import chokidar from 'chokidar'
import { pathExists } from 'fs-extra'
import { mapProject, mapDocument, mapMedia, imageFormats, avFormats } from './index.js'
import { default as mapFolder } from './mapFolder'
import { isWorkingPath } from '../utils-main'
import path from 'path'
import { isObject } from 'util'
// import diff from 'deep-diff'


let store = undefined
let state = {}
let watcher = undefined
let changeTimer = undefined
let changes = []

/**
 * Chokidar config
 * Docs: https://www.npmjs.com/package/chokidar
 */
const config = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 400,
    pollInterval: 200
  }
}


/**
 * Setup watcher module
 * @param {*} projectPath - Path to watch
 */
async function setup(storeRef) {

  // Check if undefined
  if (storeRef == undefined) console.error("Store not defined")

  // Set `store` and `state`
  store = storeRef
  state = store.store

  // Listen for state changes. When `projectPath` changes, watch it.
  store.onDidAnyChange(async (newState, oldState) => {

    state = newState

    if (newState.changed.includes('projectPath')) {

      // If watcher was already active on another directory, close it.
      if (watcher !== undefined) {
        await watcher.close()
      }

      // Watch new path
      startWatcher(newState.projectPath)
    }
  })

  // Start initial watcher
  startWatcher(state.projectPath)
}


/**
 * Start watcher
 */
async function startWatcher(projectPath) {

  // If new projectPath is not valid, return
  if (!await pathExists(projectPath)) return

  // Start watcher
  watcher = chokidar.watch(projectPath, config)

  // On any event, track changes. Some events include `stats`.
  watcher
    .on('change', (filePath) => trackChanges('change', filePath))
    .on('add', (filePath) => trackChanges('add', filePath))
    .on('unlink', (filePath) => trackChanges('unlink', filePath))
    .on('addDir', (filePath) => trackChanges('addDir', filePath))
    .on('unlinkDir', (filePath) => trackChanges('unlinkDir', filePath))
}


/**
 * Create a tally of changes as they occur, and once things settle down, evaluate them.We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
 */
function trackChanges(event, filePath, stats) {
  const change = { event: event, path: filePath }

  if (stats) change.stats = stats
  // console.log(event)

  // Make the timer longer if `addDir` event comes through. 
  // If it's too quick, subsequent `add` events are not caught by the timer.
  const timerDuration = event == 'addDir' ? 500 : 100

  // Either start a new timer, or if one is already active, refresh it.
  if (
    changeTimer == undefined ||
    !changeTimer.hasRef()
  ) {
    changes = [change]
    changeTimer = setTimeout(onChangesFinished, timerDuration, changes);
  } else {
    changes.push(change)
    changeTimer.refresh()
  }
}

/**
 * When changes are finished, discern what happened, and dispatch the appropriate actions.
 * @param {*} changes - Array of objects: `{ event: 'add', path: './Notes/mynote.md' }`
 */
async function onChangesFinished(changes) {

  // If change events include directories added or removed, remap everything.
  // Else, sort changes by event (changed, added, removed), and call appro
  if (
    changes.some((c) => c.event == 'addDir') ||
    changes.some((c) => c.event == 'unlinkDir')
  ) {
    // A directory was added or removed
    mapProject(state.projectPath, store)
  } else {
    // Files were changed (saved or over-written, added, or removed)
    // Most commonly, this will be a single file saved.
    // But in other cases, it may be a mix of events.
    // Sort the events into arrays then pass them to right handlers.
    let filesChanged = []
    let filesAdded = []
    let filesUnlinked = []
    for (var c of changes) {
      switch (c.event) {
        case 'change':
          filesChanged.push(c)
          break
        case 'add':
          filesAdded.push(c)
          break
        case 'unlink':
          filesUnlinked.push(c)
          break
      }
    }
    if (filesChanged.length > 0) onFilesChanged(filesChanged)
    if (filesAdded.length > 0) onFilesAdded(filesAdded)
    if (filesUnlinked.length > 0) onFilesUnlinked(filesUnlinked)
  }
}

async function onFilesChanged(filesChanged) {

  let documents = []
  let media = []

  await Promise.all(
    filesChanged.map(async (f) => {

      const ext = path.extname(f.path)
      const parentPath = path.dirname(f.path)
      const parentId = state.folders.find((folder) => folder.path == parentPath).id

      if (ext == '.md' || ext == '.markdown') {
        documents.push(await mapDocument(f.path, f.stats, parentId))
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        media.push(await mapMedia(f.path, f.stats, parentId, ext))
      }

    })
  )

  // Dispatch results to store
  if (documents.length > 0) {
    store.dispatch({ type: 'UPDATE_DOCUMENTS', documents: documents })
  }

  if (media.length > 0) {
    store.dispatch({ type: 'UPDATE_MEDIA', media: media })
  }
}

async function onFilesAdded(filesAdded) {

  let documents = []
  let media = []

  await Promise.all(
    filesAdded.map(async (f) => {

      const ext = path.extname(f.path)
      const parentPath = path.dirname(f.path)
      const parentId = state.folders.find((folder) => folder.path == parentPath).id

      if (ext == '.md' || ext == '.markdown') {
        documents.push(await mapDocument(f.path, f.stats, parentId))
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        media.push(await mapMedia(f.path, f.stats, parentId, ext))
      }

    })
  )

  // Dispatch results to store
  if (documents.length > 0) {
    store.dispatch({ type: 'ADD_DOCUMENTS', documents: documents })
  }

  if (media.length > 0) {
    store.dispatch({ type: 'ADD_MEDIA', media: media })
  }
}

async function onFilesUnlinked(filesUnlinked) {
  let documentPaths = []
  let mediaPaths = []

  await Promise.all(
    filesUnlinked.map(async (f) => {

      const ext = path.extname(f.path)

      if (ext == '.md' || ext == '.markdown') {
        documentPaths.push(f.path)
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        mediaPaths.push(f.path)
      }
    })
  )

  // Dispatch results to store
  if (documentPaths.length > 0) {
    store.dispatch({ type: 'REMOVE_DOCUMENTS', documentPaths: documentPaths })
  }

  if (mediaPaths.length > 0) {
    store.dispatch({ type: 'REMOVE_MEDIA', mediaPaths: mediaPaths })
  }
}


export { setup }