import { BrowserWindow } from "electron"
import { copySync } from "fs-extra"
import { getArrayDiff, propHasChangedTo, stateHasChanged } from "../shared/utils"
import { Watcher } from "./watcher/Watcher"
import { createWindow } from "./WindowManager"

// let projects = {
//   allIds: [],
//   byId: {}
// }

export function init() {

  // ------ SETUP CHANGE LISTENERS ------ //

  global.store.onDidAnyChange(async (state, oldState) => {

    const projectAdded = state.projects.allIds.length > oldState.projects.allIds.length

    const projectRemoved = state.projects.allIds.length < oldState.projects.allIds.length

    const aProjectDirectoryHasChanged = stateHasChanged(global.patches, ['projects', 'byId', 'directory'])

    const aWindowIsSafeToClose = stateHasChanged(global.patches, ['window', 'status'], 'safeToClose')

    const appIsQuitting = propHasChangedTo('appStatus', 'wantsToQuit', state, oldState)


    // If project added, create a Window and Watcher 
    // Determine new project by comparing new and old `allIds`.
    if (projectAdded) {
      const id = getArrayDiff(state.projects.allIds, oldState.projects.allIds)[0]
      createWindowAndWatcher(state, id)
    }

    // If project directory changed, update (or start) the Watcher
    if (aProjectDirectoryHasChanged) {
      const projectIds = getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState)
      projectIds.forEach((id) => {
        const project = state.projects.byId[id]
        const watcher = global.watchers.find((watcher) => watcher.id == id)
        const watcherIsRunning = watcher.directory !== ''
        if (!watcherIsRunning) {
          watcher.directory = project.directory
          watcher.start()
        } else {
          watcher.changeDirectories(project.directory)
        }
      })
    }

    // If project removed, stop the watcher, then remove from `global.watchers`.
    // Determine removed project by comparing old and new `allIds`.
    if (projectRemoved) {
      const id = getArrayDiff(oldState.projects.allIds, state.projects.allIds)[0]
      const watcher = global.watchers.find((w) => w.id == id)
      const indexOfWatcher = global.watchers.findIndex((w) => w.id == id)
      watcher.stop()
      global.watchers.splice(indexOfWatcher, 1)
    }

    // Close any window whose `window.status` just changed to 'safeToClose'
    if (aWindowIsSafeToClose) {
      const windowsToClose = getWindowsThatAreSafeToClose(state, oldState)
      windowsToClose.forEach((window) => window.close())
    }

    // If app is quitting, initiate closing procedure for all windows
    if (appIsQuitting) {
      startToCloseAllWindows()
    }
  })


  // ------ DO INITIAL SETUP ------ //

  const state = global.state()

  // On startup, for each project, create a Window and Watcher
  state.projects.allIds.forEach((id) => {
    createWindowAndWatcher(state, id)
  })
}






/**
 * Create a window and watcher for a project
 * @param {*} id - Of the project
 */
async function createWindowAndWatcher(state, id) {
  const project = state.projects.byId[id]
  const window = await createWindow(id, project)
  const watcher = new Watcher(id, project, window)
  global.watchers.push(watcher)
}
 

/**
 * Get projects whose directories have changed
 */
function getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState) {
  let projects = []
  state.projects.allIds.forEach((id) => {
    const directory = state.projects.byId[id].directory
    const oldDirectory = oldState.projects.byId[id].directory
    if (directory !== oldDirectory) {
      projects.push(id)
    }
  })
  return projects
}

/**
 * Get windows that are safe to close
 */
function getWindowsThatAreSafeToClose(state, oldState) {
  let windows = []
  state.projects.allIds.forEach((id) => {
    const windowStatus = state.projects.byId[id].window.status
    const oldWindowStatus = oldState.projects.byId[id]?.window.status
    if (windowStatus == 'safeToClose' && oldWindowStatus !== 'safeToClose') {
      const window = BrowserWindow.getAllWindows().find((win) => win.projectId == id)
      windows.push(window)
    }
  })
  return windows
}

/**
 * Called when appStatus changes to `wantsToQuit`.
 */
function startToCloseAllWindows() {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length) {
    windows.forEach((win) => win.webContents.send('mainWantsToCloseWindow'))
  }
}