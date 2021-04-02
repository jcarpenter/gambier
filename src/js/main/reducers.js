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

        if (draft.projects.allIds.length) {
          draft.projects.allIds.forEach((id) => {

            const project = draft.projects.byId[id]

            // Delete existing projects that 1) are missing their directory, or 2) have an inaccessible directory
            const directoryIsMissing = !project.directory
            const directoryIsInaccessible = !isDirectoryAccessible(project.directory)
            if (directoryIsMissing || directoryIsInaccessible) {
              delete draft.projects.byId[id]
            }

            // Set unsavedChanages on all panels to false
            // This shouldn't be necessary, when app is working normally, user is saving changes before closing, etc. Should only be needed when app crashes with unsaved changes. They're lost, unfortunately, so this should be false on next cold start.
            project.panels.forEach((p) => p.unsavedChanges = false)

            // Same as above: this shouldn't 
            project.window.status = 'open'
          })

          // Update `allIds` to match `byId`
          draft.projects.allIds = Object.keys(draft.projects.byId)
        }

        // Re-apply theme values (they may change, during development)
        // If theme has not yet been define, use the default.
        applyTheme(draft, draft.theme.id)

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

      case 'SET_TABBABLES': {
        if (action.blockquote) draft.tabbables.blockquote = action.blockquote
        if (action.citation) draft.tabbables.citation = action.citation
        if (action.code) draft.tabbables.code = action.code
        if (action.emphasis) draft.tabbables.emphasis = action.emphasis
        if (action.fencedcodeblock) draft.tabbables.fencedcodeblock = action.fencedcodeblock
        if (action.footnote) draft.tabbables.footnote = action.footnote
        if (action.header) draft.tabbables.header = action.header
        if (action.hr) draft.tabbables.hr = action.hr
        if (action.image) draft.tabbables.image = action.image
        if (action.link) draft.tabbables.link = action.link
        if (action.list) draft.tabbables.list = action.list
        if (action.math) draft.tabbables.math = action.math
        if (action.strikethrough) draft.tabbables.strikethrough = action.strikethrough
        if (action.strong) draft.tabbables.strong = action.strong
        if (action.taskList) draft.tabbables.taskList = action.taskList
        break
      }

      // CHROMIUM VALUES

      case 'SAVE_CHROMIUM_VALUES': {
        draft.chromium = action.values
        break
      }

      // ------------------------ MARKDOWN ------------------------ //

      case 'SET_MARKDOWN_OPTIONS': {
        draft.markdown = action.markdownOptions
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
        // Tell panel to load first file in project
        project.focusedPanelIndex = 0
        project.panels = [{ ...newPanel, id: nanoid() }]

        break
      }

      case 'PROJECT_FILES_MAPPED': {
        // If project directory contains docs, select the first one.
        if (action.firstDocId) {

          // Load doc in editor
          project.panels[0].docId = action.firstDocId

          // Select doc in sidebar 
          project.sidebar.tabsById.project.selected = [action.firstDocId]
        }
        break
      }

      case 'PROJECT_FILES_UPDATED': {
        // Called whenever a Watcher instance catches a change
        // and updates files (note: does not fire when a directory)
        // is added or removed.

        // See if project panels are effected
        project.panels.forEach((panel) => {

          // Get watcher
          const watcher = global.watchers.find((w) => {
            return w.id == window.projectId
          })

          // If panel is waiting for a new file, 
          // check files from watcher to see if it exists yet.
          // If yes, set `panel.docId` to the file's id.
          // This will load it in the editor.
          if (panel.status == 'justSavedAsAndWaitingToLoadTheNewFile') {
            const newDocId = watcher.files.allIds.find((id) => {
              const file = watcher.files.byId[id]
              return file.path == panel.pendingFilePathToLoad
            })
            if (newDocId) {
              panel.docId = newDocId
              panel.status = ''
              delete panel.pendingFilePathToLoad

              // Select doc in sidebar
              const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId]
              activeTab.selected = [newDocId]
            }
          } else {

            console.log('1')

            // Else, check if panel's file was deleted.
            // If yes, show an empty doc.
            const panelFileWasDeleted = !watcher.files.allIds.includes(panel.docId)
            if (panelFileWasDeleted) {
              console.log('2')
              panel.docId = 'newDoc'
              panel.unsavedChanges = false
            }
          }
        })

        // Are any of the project panels waiting for a file?
        const aPanelIsWaitingForAFile = project.panels.some((p) => {
          return p.status == 'justSavedAsAndWaitingToLoadTheNewFile'
        })

        // If yes, check if the file exists yet
        if (aPanelIsWaitingForAFile) {

          // Get watcher
          const watcher = global.watchers.find((w) => {
            return w.id == window.projectId
          })

          // For each panel that is waiting for a new file, 
          // check files from watcher to see if it exists yet.
          // If yes, `panel.docId` to the file's id.
          // This will load it in the editor.
          project.panels.forEach((panel) => {
            if (panel.status == 'justSavedAsAndWaitingToLoadTheNewFile') {
              const newDocId = watcher.files.allIds.find((id) => {
                const file = watcher.files.byId[id]
                return file.path == panel.pendingFilePathToLoad
              })
              if (newDocId) {
                panel.docId = newDocId
                panel.status = ''
                delete panel.pendingFilePathToLoad

                // Select doc in sidebar
                const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId]
                activeTab.selected = [newDocId]
              }
            }
          })
        }


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
        project.focusedSectionId = 'sidebar'
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

      case 'SET_SEARCH_QUERY': {
        project.sidebar.tabsById.search.queryValue = action.query
        break
      }

      case 'SHOW_SEARCH': {

        // Open sidebar > search
        project.focusedSectionId = 'sidebar'
        project.sidebar.activeTabId = 'search'
        
        // Set which input (search or replace) to focus, on open
        if (action.inputToFocus !== undefined) {
          const search = project.sidebar.tabsById.search
          search.inputToFocusOnOpen = action.inputToFocus
          
          // Make sure Replace expandable is open
          if (action.inputToFocus == 'replace') {
            search.replace.isOpen = true
          }
        }
        
        break
      }

      case 'SIDEBAR_SET_SEARCH_OPTIONS': {
        const tab = project.sidebar.tabsById.search
        tab.options = action.options
        break
      }

      case 'SAVE_SEARCH_QUERY_VALUE' : {
        project.sidebar.tabsById.search.queryValue = action.value
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

      case 'CREATE_NEW_DOC': {
        // Tell the focused panel to load a new (empty) doc 
        const panel = project.panels[project.focusedPanelIndex]
        panel.docId = 'newDoc'
        // Focus the editor
        project.focusedSectionId = 'editor'
        // Deselect everything in active sidebar tab
        const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId]
        activeTab.selected = []
        break
      }

      case 'OPEN_NEW_DOC_IN_PANEL': {

        const panel = project.panels[action.panelIndex]

        const canCreateNewDoc =
          action.saveOutcome == "noUnsavedChanges" ||
          action.saveOutcome == "saved" ||
          action.saveOutcome == "dontSave"

        if (canCreateNewDoc) {
          panel.docId = 'newDoc'
          panel.unsavedChanges = false
        } else {
          // Do nothing
        }

        break
      }

      case 'OPEN_DOC_IN_PANEL': {

        const panel = project.panels[action.panelIndex]

        const canOpenDoc =
          action.saveOutcome == "noUnsavedChanges" ||
          action.saveOutcome == "saved" ||
          action.saveOutcome == "dontSave"

        // If we can open the doc, do so. Else, do nothing. 
        if (canOpenDoc) {
          // Open doc
          panel.docId = action.doc.id
          panel.unsavedChanges = false
          // Select doc in sidebar 
          if (action.selectInSideBar) {
            const tab = project.sidebar.tabsById[project.sidebar.activeTabId]
            tab.lastSelected = action.doc.id
            tab.selected = [action.doc.id]
          }
        } else {
          // Do nothing
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

        const canClosePanel =
          action.saveOutcome == "noUnsavedChanges" ||
          action.saveOutcome == "saved" ||
          action.saveOutcome == "dontSave"

        // If it's safe to close the panel, do so. 
        // Else, do nothing. 
        if (canClosePanel) {
          closePanel(project, action.panelIndex)
        } else {
          // Do nothing
        }

        break
      }

      case 'SAVE_PANEL_CHANGES_SO_WE_CAN_CLOSE_WINDOW': {

        const panel = project.panels[action.panelIndex]

        const panelChangesAreSaved =
          action.saveOutcome == 'noUnsavedChanges' ||
          action.saveOutcome == 'saved' ||
          action.saveOutcome == 'dontSave'

        // If there are no unsaved changes in any panels,
        // mark the window `safeToClose`.
        // Else, if the user cancelled a save flow.
        // cancel the window closing.
        if (panelChangesAreSaved && project.window.status == 'wantsToClose') {

          panel.unsavedChanges = false

          const allPanelsHaveSaved = project.panels.every((p) => !p.unsavedChanges)
          if (allPanelsHaveSaved) {
            project.window.status = 'safeToClose'
          }

        } else if (action.saveOutcome == 'cancelled' && project.window.status == 'wantsToClose') {

          // Cancel window closing
          project.window.status = 'open'

          // Cancel app quitting (if it's in progress)
          if (draft.appStatus == 'wantsToQuit') {
            draft.appStatus = 'open'
          }

        }

        break
      }

      case 'SET_PANEL_WIDTHS': {
        project.panels.forEach((panel, i) => panel.width = action.widths[i])
        break
      }

      case 'FOCUS_PANEL': {
        project.focusedPanelIndex = action.panelIndex
        const panel = project.panels[action.panelIndex]
        // Select the file in the sidebar
        const activeSideBarTab = project.sidebar.tabsById[project.sidebar.activeTabId]
        activeSideBarTab.lastSelected = panel.docId
        activeSideBarTab.selected = [panel.docId]
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

      case 'SAVE_DOC': {
        const panel = project.panels[action.panelIndex]
        if (action.saveOutcome == 'saved') {
          panel.unsavedChanges = false
        }
        break
      }

      case 'SAVE_DOC_AS': {
        const panel = project.panels[action.panelIndex]

        // If saved successfully, set unsavedChanges false,
        // and tell panel to load the new file.
        if (action.saveOutcome == 'saved') {
          panel.unsavedChanges = false
          panel.status = 'justSavedAsAndWaitingToLoadTheNewFile'
          panel.pendingFilePathToLoad = action.saveToPath
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

      // WIZARD

      case 'TOGGLE_WIZARD_OPTIONAL_LINK_FIELDS': {
        draft.wizard.showOptionalLinkFields = action.value
        break
      }

      case 'TOGGLE_WIZARD_OPTIONAL_IMAGE_FIELDS': {
        draft.wizard.showOptionalImageFields = action.value
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