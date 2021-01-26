import { BrowserWindow, dialog } from 'electron'
import produce, { enablePatches } from 'immer'
import { newProject, newPanel } from './Store.js'
import { accessSync, renameSync, existsSync, readdirSync } from 'fs-extra'
import fs from 'fs'
import path from 'path'
import { nanoid } from 'nanoid/non-secure'

enablePatches()

function isDirectoryAccessible(directory) {
  try {
    accessSync(directory, fs.constants.W_OK)
    return true
  } catch (err) {
    return false
  }
}


export const update = (state, action, window) =>
  produce(state, (draft) => {

    // Set a few useful, commonly-used variables
    // const project = window?.projectId !== undefined ? draft.projects.byId[window.projectId] : undefined
    const project = draft.projects.byId[window?.projectId]

    switch (action.type) {


      // ------------------------ APP-WIDE ------------------------ //

      case 'START_COLD_START': {

        // Update appStatus 
        draft.appStatus = 'coldStarting'

        // Delete existing projects that 1) are missing their directory, or 2) have an inaccessible directory
        if (draft.projects.allIds.length) {
          draft.projects.allIds.forEach((id) => {

            const project = draft.projects.byId[id]
            const directoryIsMissing = !project.directory
            const directoryIsInaccessible = !isDirectoryAccessible(project.directory)

            if (directoryIsMissing || directoryIsInaccessible) {
              delete draft.projects.byId[id]
            }
          })

          // Update `allIds` to match `byId`
          draft.projects.allIds = Object.keys(draft.projects.byId)
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.allIds.length) {
          const id = nanoid()
          draft.projects.byId[id] = { ...newProject }
          draft.projects.allIds.push(id)
        }

        // Close preferences
        draft.prefs.isOpen = false

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

      // case 'CAN_SAFELY_QUIT': {
      //   draft.appStatus = 'canSafelyQuit'
      //   break
      // }

      // FOCUSED/UNFOCUSED WINDOW

      case 'FOCUSED_WINDOW': {
        draft.focusedWindowId = window.projectId
        break
      }

      case 'NO_WINDOW_FOCUSED': {
        draft.focusedWindowId = ""
        break
      }

      // PREFERENCES

      case 'OPEN_PREFERENCES': {
        draft.prefs.isOpen = true
        break
      }

      case 'CLOSE_PREFERENCES': {
        draft.prefs.isOpen = false
        break
      }

      // APPEARANCE

      case 'SET_APP_THEME': {
        draft.theme.app = action.theme
        break
      }

      case 'SAVE_CHROMIUM_VALUES': {
        draft.chromium = action.values
        break
      }

      case 'SAVE_COLORS': {
        draft.colors = action.colors
        break
      }




      // ------------------------ PROJECT-SPECIFIC ------------------------ //

      // CREATE, EDIT, REMOVE

      case 'CREATE_NEW_PROJECT': {
        const id = nanoid()
        draft.projects.byId[id] = { ...newProject }
        draft.projects.allIds.push(id)
        break
      }

      case 'REMOVE_PROJECT': {
        delete draft.projects.byId[window.projectId]
        draft.projects.allIds = Object.keys(draft.projects.byId)
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        // Do we have write permissions for the selected directory? If yes, proceed. 
        // Else, if current directory is valid, keep using it.
        // Else, set directory as blank.
        if (isDirectoryAccessible(action.directory)) {
          project.directory = action.directory
        } else {
          if (isDirectoryAccessible(project.directory)) {
            // Do nothing
          } else {
            project.directory = ""
          }
        }

        // Reset panels
        project.focusedPanelIndex = 0
        project.panels = [{ ...newPanel, id: nanoid() }]
        break
      }

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

      // PROJECT WINDOW

      case 'OPENED_PROJECT_WINDOW': {
        // Update window status
        project.window.status = 'open'
        break
      }

      case 'START_TO_CLOSE_PROJECT_WINDOW': {
        project.window.status = 'wantsToClose'
        break
      }

      case 'CAN_SAFELY_CLOSE_PROJECT_WINDOW': {

        project.window.status = 'safeToClose'

        // Every time a window marks itself 'safeToClose', check if the app is quitting. If true, check if all windows are 'safeToClose' yet. If true, we can safely quit the app.

        if (draft.appStatus == 'wantsToQuit') {

          const allWindowsAreSafeToClose = draft.projects.allIds.every((id) => {
            const windowStatus = draft.projects.byId[id].window.status
            return windowStatus == 'safeToClose'
          })

          if (allWindowsAreSafeToClose) {
            draft.appStatus = 'canSafelyQuit'
          }
        }

        break
      }

      // Save window bounds to state, so we can restore later
      case 'SAVE_PROJECT_WINDOW_BOUNDS': {
        project.window.bounds = action.windowBounds
        break
      }

      case 'PROJECT_WINDOW_DRAG_OVER': {
        project.window.isDraggedOver = true
        break
      }

      case 'PROJECT_WINDOW_DRAG_LEAVE': {
        project.window.isDraggedOver = false
        break
      }

      case 'SET_LAYOUT_FOCUS': {
        project.focusedSectionId = action.section
        break
      }

      // case 'SET_DRAGGED_FILE': {
      //   project.draggedFileId = action.id
      //   break
      // }

      // SIDEBAR

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
        if (tab.sortBy) {
          tab.sortBy = action.sortBy
        }
        if (tab.sortOrder) {
          tab.sortOrder = action.sortOrder
        }
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

      case 'SIDEBAR_SET_SEARCH_OPTIONS': {
        const tab = project.sidebar.tabsById.search
        tab.options = action.options
        break
      }

      case 'SIDEBAR_TOGGLE_EXPANDABLE': {
        const tab = project.sidebar.tabsById[action.tabId]
        tab[action.expandable].isOpen = !tab[action.expandable].isOpen
        break
      }

      case 'TOGGLE_SIDEBAR_PREVIEW': {
        project.sidebar.isPreviewOpen = !project.sidebar.isPreviewOpen
        break
      }

      // PANEL

      case 'OPEN_DOC_IN_PANEL': {
        const panel = project.panels[action.panelIndex]
        panel.docId = action.docId
        panel.unsavedChanges = false
        break
      }

      case 'OPEN_DOC_IN_FOCUSED_PANEL': {
        const focusedPanel = project.panels[project.focusedPanelIndex]
        focusedPanel.docId = action.docId
        focusedPanel.unsavedChanges = false
        break
      }

      case 'OPEN_NEW_PANEL': {

        // Insert new panel at specified index
        project.panels.splice(action.panelIndex, 0, {
          ...newPanel,
          id: nanoid(),
          docId: action.docId,
        })

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i)

        // Focus new panel
        project.focusedPanelIndex = action.panelIndex

        // Set all panels equal width
        const panelWidth = (100 / project.panels.length).toFixed(1)
        project.panels.forEach((p) => p.width = panelWidth)

        break
      }

      case 'MOVE_PANEL': {

        // Delete the panel from it's current position.
        // Splice returns the moved panel's array item.
        const movedPanel = project.panels.splice(action.fromIndex, 1);

        // Move the item to its new position
        project.panels.splice(action.toIndex, 0, movedPanel[0]);

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i)

        // Focus the panel  
        project.focusedPanelIndex = action.toIndex

        break
      }

      case 'CLOSE_PANEL': {
        project.panels.splice(action.panelIndex, 1)

        // Set all panels to equal percentage of total
        const panelWidth = (100 / project.panels.length).toFixed(1)
        project.panels.forEach((p) => p.width = panelWidth)

        // Update focusedPanel:
        // If there is only one panel left, focus it. Else...
        // * If it was to LEFT of the closed panel, the value is unchanged.
        // * If it WAS closed the closed panel, the value is unchanged (this will focus the adjacent panel).
        // * ...unless it was the panel furthest right, in which case we focus the new last panel.
        // * If it was to RIGHT of the closed panel, decrement the value by one.

        if (project.panels.length == 1) {
          project.focusedPanelIndex = 0
        } else {
          const closedPanelWasLeftOfFocusedPanel = action.panelIndex < project.focusedPanelIndex
          const closedPanelWasFocusedAndFurthestRight = action.panelIndex == project.focusedPanelIndex && action.panelIndex == project.panels.length

          if (closedPanelWasLeftOfFocusedPanel) {
            project.focusedPanelIndex = project.focusedPanelIndex - 1
          } else if (closedPanelWasFocusedAndFurthestRight) {
            project.focusedPanelIndex = project.panels.length - 1
          }
        }

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i)

        break
      }

      // case 'SET_PANEL_WIDTH': {
      //   // Set width of the panel of `panelIndex`, and the one to it's right (if there is one)
      //   const panel = project.panels[action.panelIndex]
      //   const panelToRight = project.panels[action.panelIndex + 1]

      //   break
      // }

      case 'SET_PANEL_WIDTHS': {
        project.panels.forEach((panel, i) => panel.width = action.widths[i])
        break
      }

      case 'FOCUS_PANEL': {
        project.focusedPanelIndex = action.panelIndex
        break
      }

      // EDITING

      case 'SET_SOURCE_MODE': {
        draft.sourceMode = action.enabled
        break
      }

      case 'SET_UNSAVED_CHANGES': {
        const panel = project.panels[action.panelIndex]
        panel.unsavedChanges = action.value
        break
      }

      case 'SAVE_DOC_SUCCESS': {
        const panel = project.panels[action.panelIndex]
        panel.unsavedChanges = false
        break
      }



    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches
  }
  )


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
  const project = { ...newProject, id: nanoid() }
  // Immer won't let us assign `window.id = getNextWindowId()`.
  // Because window is itself an object, we need to immutably modify it.
  // By assigning it a new object (instead of modifying the original).
  project.window = { ...project.window, id: getNextWindowId() }
  return project
}

