import { BrowserWindow } from 'electron'
import { produceWithPatches, enablePatches } from 'immer'
import { newProject } from './Store.js'
import { existsSync, pathExists } from 'fs-extra'

enablePatches()

export const update = (state, action, windowId) =>
  produceWithPatches(state, (draft) => {

    // Set a few useful, commonly-used variables
    const win = windowId !== undefined ? BrowserWindow.fromId(windowId) : undefined
    const project = windowId !== undefined ? draft.projects.find((p) => p.window.id == windowId) : undefined

    switch (action.type) {

      // -------- APP -------- //

      case 'START_COLD_START': {
        // Update appStatus
        draft.appStatus = 'coldStarting'
        // Create new project, if there are none existing
        const noExistingProjects = state.projects.length == 0
        if (noExistingProjects) {
          createNewProject(draft)
        } else {
          // Check if directory still exists. Perhaps they've been deleted since the app was last opened. If it does not exist, or is empty '', remove the project.
          state.projects.forEach((p, index) => {
            const directoryExists = existsSync(p.directory)
            if (!directoryExists) {
              draft.projects.splice(index, 1)
            }
          })
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


      // -------- PROJECT/WINDOW: CREATE AND CLOSE -------- //

      case 'CREATE_NEW_PROJECT': {
        createNewProject(draft)
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        project.directory = action.directory
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


      // Directory

      case 'SET_PROJECTPATH_SUCCESS': {
        project.directory = action.path
        break
      }

      case 'SET_PROJECTPATH_FAIL': {
        // DO NOTHING
        break
      }

      // UI

      case 'SET_LAYOUT_FOCUS': {
        project.focusedLayoutSection = action.section
        break
      }

      case 'SELECT_SIDEBAR_TAB_BY_NAME': {
        project.sidebar.tabs.forEach((t) => t.active = t.name == action.name)
        break
      }

    }
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
function createNewProject(draft) {
  const project = { ...newProject }
  project.window.id = getNextWindowId()
  draft.projects.push(project)
}
