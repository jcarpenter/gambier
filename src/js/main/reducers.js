import { BrowserWindow, dialog } from 'electron'
import produce, { enablePatches } from 'immer'
import { newProject, newPanel } from './Store.js'
import { accessSync, renameSync, existsSync, readdirSync } from 'fs-extra'
import fs from 'fs'
import path from 'path'
import { nanoid } from 'nanoid/non-secure'
import { themes } from './Themes.js'


enablePatches()

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

          // Re-apply theme values (they may change, during development)
          // If theme has not yet been define, use the default.
          applyTheme(draft, draft.theme.id)

          // Update `allIds` to match `byId`
          draft.projects.allIds = Object.keys(draft.projects.byId)
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.allIds.length) {
          const id = nanoid()
          draft.projects.byId[id] = { ...newProject }
          draft.projects.allIds.push(id)
        }

        // Make sure preferences are closed
        draft.prefs.isOpen = false

        // Reset cursor position histories
        // The first time each session that we open a doc, we want the 
        // cursor to start at the top.
        draft.cursorPositionHistory = {}

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

      case 'FOCUS_PREFERENCES_WINDOW': {
        const prefsWindow = BrowserWindow.getAllWindows().find(({ projectId }) => projectId == 'preferences')
        prefsWindow.focus()
        // draft.focusedWindowId = 'preferences'
        break
      }

      case 'CLOSE_PREFERENCES': {
        draft.prefs.isOpen = false
        break
      }

      // THEME

      case 'SET_ACCENT_COLOR': {
        draft.theme.accentColor = action.name
        break
      }

      case 'SET_OVERRIDES': {
        // `action.overrides` is an array of objects.
        draft.theme.overrides = action.overrides
        break
      }

      case 'SET_APP_THEME': {
        applyTheme(draft, action.id)
        break
      }

      case 'SET_BACKGROUND': {
        draft.theme.background = action.name
        break
      }

      case 'SET_EDITOR_THEME': {
        draft.theme.editorTheme = action.name
        break
      }

      case 'SET_DARK_MODE': {
        draft.darkMode = action.value
        break
      }

      // CHROMIUM VALUES

      case 'SAVE_CHROMIUM_VALUES': {
        draft.chromium = action.values
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

      // If window is already safe to close, do it
      // Else, start to close window by setting 'wantsToClose'
      // Editor instances in the window catch this store change
      // and if the have unsaved changes, save them.
      // As each save is mode, 'SAVE_DOC_SUCCESS' is dispatched
      // If app wants

      case 'START_TO_CLOSE_PROJECT_WINDOW': {
        const allPanelsAreSafeToClose = project.panels.every((p) => !p.unsavedChanges)
        if (allPanelsAreSafeToClose) {
          // Close the window by setting 'safeToClose'. 
          // ProjectManager catches this, and closes the window.
          project.window.status = 'safeToClose'
        } else {
          // Start closing the window
          project.window.status = 'wantsToClose'
        }
        break
      }

      // case 'CAN_SAFELY_CLOSE_PROJECT_WINDOW': {

      //   project.window.status = 'safeToClose'

      //   // Every time a window marks itself 'safeToClose', check if the app is quitting. If true, check if all windows are 'safeToClose' yet. If true, we can safely quit the app.

      //   if (draft.appStatus == 'wantsToQuit') {

      //     const allWindowsAreSafeToClose = draft.projects.allIds.every((id) => {
      //       const windowStatus = draft.projects.byId[id].window.status
      //       return windowStatus == 'safeToClose'
      //     })

      //     if (allWindowsAreSafeToClose) {
      //       draft.appStatus = 'canSafelyQuit'
      //     }
      //   }

      //   break
      // }

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
        
        // If panel has unsaved changes, prompt panel to save them.
        // We'll open the selected doc once that's done.
        if (panel.unsavedChanges) {
          panel.status = 'userWantsToLoadDoc'
          panel.pendingDocIdToLoad = action.docId
        } else {
          panel.docId = action.docId
          panel.unsavedChanges = false
        }

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
        const panel = project.panels[action.panelIndex]
        
        // If panel has unsaved changes, prompt panel to save them.
        // We'll close the panel once the changes are saved.
        if (panel.unsavedChanges) {
          panel.status = 'userWantsToClosePanel'
        } else {
          closePanel(project, action.panelIndex)
        }
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

        // Several app processes gate on unsavedChanges being saved.
        // As changes are saved, we check the following.
        
        if (project.window.status == 'wantsToClose') {

          // If window wantsToClose, and there are no unsavedChanges,
          // mark it 'safeToClose`
          const allDocsHaveSaved = project.panels.every((p) => !p.unsavedChanges)
          if (allDocsHaveSaved) {
            project.window.status = 'safeToClose'
          }

        } else if (panel.status == 'userWantsToLoadDoc') {

          // If panel was waiting to open new doc, open it
          panel.docId = panel.pendingDocIdToLoad
          panel.pendingDocIdToLoad = ''
          panel.status = ''

        } else if (panel.status == 'userWantsToClosePanel') {

          // If panel was waiting to close, close it.
          closePanel(project, action.panelIndex)
          panel.status = ''

        }
        break
      }

      case 'SAVE_CURSOR_POSITION': {
        draft.cursorPositionHistory[action.docId] = { 
          line: action.line, 
          ch: action.ch
        }
        break
      }



    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches
  }
  )

/**
 * Remove panel from the `panels` index of the selected project.
 * Then update index of other panels as needed.
 */
function closePanel(project, panelIndex) {
  project.panels.splice(panelIndex, 1)

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
    const closedPanelWasLeftOfFocusedPanel = panelIndex < project.focusedPanelIndex
    const closedPanelWasFocusedAndFurthestRight = panelIndex == project.focusedPanelIndex && panelIndex == project.panels.length

    if (closedPanelWasLeftOfFocusedPanel) {
      project.focusedPanelIndex = project.focusedPanelIndex - 1
    } else if (closedPanelWasFocusedAndFurthestRight) {
      project.focusedPanelIndex = project.panels.length - 1
    }
  }

  // Update panel indexes
  project.panels.forEach((p, i) => p.index = i)
}

/**
 * Get current theme and copy values to draft.theme properties.
 */
function applyTheme(draft, id) {
  console.log(id)
  const { backgroundComponent, baseColorScheme, colorOverrides, editorTheme } = themes.byId[id]
  draft.theme.id = id
  draft.theme.baseColorScheme = baseColorScheme
  draft.theme.backgroundComponent = backgroundComponent
  draft.theme.colorOverrides = colorOverrides
  draft.theme.editorTheme = editorTheme
}

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

/**
 * Check that directory exists, and we can write to it.
 * @param {} directory - System path to check
 */
function isDirectoryAccessible(directory) {
  try {
    accessSync(directory, fs.constants.W_OK)
    return true
  } catch (err) {
    return false
  }
}