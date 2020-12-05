import { BrowserWindow } from 'electron'
import produce, { enablePatches } from 'immer'
import { newProject } from './Store.js'
import { accessSync, renameSync } from 'fs-extra'
import fs from 'fs'
import path from 'path'

enablePatches()

export const update = (state, action, windowId) =>
  produce(state, (draft) => {

    // Set a few useful, commonly-used variables
    const win = windowId !== undefined ? BrowserWindow.fromId(windowId) : undefined
    const project = windowId !== undefined ? draft.projects.find((p) => p.window.id == windowId) : undefined

    switch (action.type) {

      // -------- APP -------- //

      case 'START_COLD_START': {

        // Update appStatus
        draft.appStatus = 'coldStarting'

        // If there are existing projects, check their directories. Prune any that 1) are missing a directory (blank value, or path doesn't exist), or 2) that we don't have write permissions for.
        if (draft.projects.length) {
          draft.projects = draft.projects.filter((project) => {
            if (!project.directory) return false
            try {
              accessSync(project.directory, fs.constants.W_OK)
              return true
            } catch(err) {
              return false
            }
          })
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.length) {
          draft.projects.push(createNewProject())
        }

        break
      }

      case 'FINISH_COLD_START': {
        draft.appStatus = 'open'
        break
      }

      case 'START_TO_QUIT': {
        draft.appStatus = 'wantsToQuit'
        break
      }

      case 'CAN_SAFELY_QUIT': {
        draft.appStatus = 'safeToQuit'
        break
      }

      // -------- APPEARANCE & TIMING -------- //

      case 'SAVE_SYSTEM_APPEARANCE_SETTINGS': {
        draft.appearance.os = action.settings
        break
      }


      // -------- PROJECT/WINDOW: CREATE AND CLOSE -------- //

      case 'CREATE_NEW_PROJECT': {
        draft.projects.push(createNewProject())
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        // Do we have write permissions for the selected directory?
        // If yes, proceed.
        try {
          accessSync(action.directory, fs.constants.W_OK)
          project.directory = action.directory
        } catch(err) {
          console.log(err)
        }
        break
      }

      case 'OPENED_WINDOW': {
        // Update window status
        const project = draft.projects[action.projectIndex]
        project.window.status = 'open'
        project.window.id = windowId
        break
      }

      case 'START_TO_CLOSE_WINDOW': {
        project.window.status = 'wantsToClose'
        break
      }

      case 'CAN_SAFELY_CLOSE_WINDOW': {
        project.window.status = 'safeToClose'
        break
      }

      case 'REMOVE_PROJECT': {
        const projects = draft.projects.slice(0)
        const indexOfProjectToRemove = projects.findIndex((p) => p.window.id == windowId)
        projects.splice(indexOfProjectToRemove, 1)
        draft.projects = { ...projects }
        break
      }


      // -------- PROJECT -------- //

      // Citations

      case 'SET_PROJECT_CITATIONS_FILE': {
        // Do we have read and write permissions for the selected file?
        // If yes, proceed.
        // See: https://nodejs.org/api/fs.html#fs_fs_accesssync_path_mode
        try {
          accessSync(action.path, fs.constants.W_OK)
          project.citations = action.path
        } catch (err) {
          console.log(err)
        }
        break
      }

      // UI

      case 'SET_LAYOUT_FOCUS': {
        project.focusedLayoutSection = action.section
        break
      }

      // Window

      // Save window bounds to state, so we can restore later
      case 'SAVE_WINDOW_BOUNDS': {
        project.window.bounds = action.windowBounds
        break
      }



      // -------- SIDEBAR 2 -------- //

      case 'SELECT_SIDEBAR_TAB_BY_ID': {
        project.sidebar.activeTabId = action.id
        break
      }

      case 'SELECT_SIDEBAR_TAB_BY_INDEX': {
        project.sidebar.activeTabId = project.sidebar.tabsAll[action.index]
        break
      }

      case 'SIDEBAR_SET_SORTING': {
        const tab = project.sidebar.tabsById[action.tabId]
        tab.sortBy = action.sortBy
        tab.sortOrder = action.sortOrder
        break
      }

      case 'SIDEBAR_SET_EXPANDED': {
        const tab = project.sidebar.tabsById[action.tabId]
        tab.expanded = action.expanded
        break
      }

      case 'SIDEBAR_SET_SELECTED': {
        const tab = project.sidebar.tabsById[action.tabId]
        tab.lastSelected = action.lastSelected
        tab.selected = action.selected
        break
      }

      case 'SIDEBAR_SELECT_TAGS': {
        const tab = project.sidebar.tabsById[action.tabId]
        tab.selectedTags = action.tags
        break
      }

      case 'SIDEBAR_SET_SEARCH_PARAMS': {
        const tab = project.sidebar.tabsById.search
        tab.options = action.options
        break
      }

      case 'TOGGLE_SIDEBAR_PREVIEW': {
        project.sidebar.isPreviewOpen = !project.sidebar.isPreviewOpen
        break
      }

      case 'DRAG_INTO_FOLDER': {
        // const tab = project.sidebar.tabsById.project
        const fileName = path.basename(action.filePath)
        const newFilePath = path.format({
          dir: action.folderPath,
          base: fileName
        })
        renameSync(action.filePath, newFilePath)
      }

    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches
  })



/**
* Each project needs to store the ID of the window it's associated with. The BrowserWindow hasn't been created yet for this project (that's handled by WindowManager), but we know what ID the window will be: BrowserWindow ids start at 1 and go up. And removed BrowserWindows do not release their IDs back into the available set. So the next BrowserWindow id is always +1 of the highest existing.
*/
function getNextWindowId() {
  const existingWindowIds = BrowserWindow.getAllWindows()
    .map((win) => win.id)
  const nextWindowId = Math.max(existingWindowIds) + 1
  return nextWindowId
}

/**
 * Insert a new blank project into state.projects array
 */
function createNewProject() {
  const project = { ...newProject }
  project.window.id = getNextWindowId()
  return project
}
