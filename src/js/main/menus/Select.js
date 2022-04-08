import { MenuItem } from "electron";
import { selectProjectDirectoryFromDialog } from "../actions/index.js";
import { ______________________________ } from './Separator.js'
import { setMenuEnabled } from "./setMenuEnabled.js";


// function isMoveToTrashEnabled() {
//   const state = global.state()
//   const project = state.projects.byId[state.focusedWindowId]
//   const sideBarIsOpen = project?.sidebar.isOpen
//   const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId]
//   const fileIsSelectedInSidebar = selectedTab?.selected.length
//   return sideBarIsOpen && fileIsSelectedInSidebar
// }

export function create() {
  return new MenuItem({
    label: 'Select',
    id: 'select',
    submenu: [      
      new MenuItem({
        label: 'Select Next Entity',
        id: 'select-selectNextEntity',
        accelerator: 'Alt+Tab',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectNextEntity')
        }
      }),
      new MenuItem({
        label: 'Select Previous Entity',
        id: 'select-selectPrevEntity',
        accelerator: 'Shift+Alt+Tab',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectPrevEntity')
        }
      }),
      ______________________________,
      new MenuItem({
        label: 'Add Next Occurence',
        id: 'select-selectNextOccurence',
        accelerator: 'Cmd+D',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectNextOccurence')
        }
      }),
      ______________________________,
      new MenuItem({
        label: 'Select Line',
        id: 'select-selectLine',
        accelerator: 'Cmd+L',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectLine')
        }
      }),

      new MenuItem({
        label: 'Cut Line',
        id: 'select-cutLine',
        accelerator: 'Cmd+X',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'cutLine')
        }
      }),
      new MenuItem({
        label: 'Delete Line',
        id: 'select-deleteLine',
        accelerator: 'Cmd+Shift+K',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'deleteLine')
        }
      }),
      new MenuItem({
        label: 'Duplicate Line',
        id: 'select-duplicateLine',
        accelerator: 'Shift+Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'duplicateLine')
        }
      }),
      new MenuItem({
        label: 'Move Line Up',
        id: 'select-moveLineUp',
        accelerator: 'Alt+Up',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'moveLineUp')
        }
      }),
      new MenuItem({
        label: 'Move Line Down',
        id: 'select-moveLineDown',
        accelerator: 'Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'moveLineDown')
        }
      }),
      ______________________________,
      new MenuItem({
        label: 'Add Cursor to Previous Line',
        id: 'select-addCursorToPrevLine',
        accelerator: 'Cmd+Alt+Up',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'addCursorToPrevLine')
        }
      }),
      new MenuItem({
        label: 'Add Cursor to Next Line',
        id: 'select-addCursorToNextLine',
        accelerator: 'Cmd+Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'addCursorToNextLine')
        }
      }),
    ]
  })
}



/**
 * Update menu when state changes
 */
export function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {
  
  /* --------------------------------- Update --------------------------------- */
  
  const isProjectDirectoryDefined = project?.directory
  const focusedSectionId = project?.focusedSectionId
  const editorIsFocused = focusedSectionId == "editor"
    
  // Disable all and return if project directory is not yet defined. 
  // Disable all when editor is not focused.
  if (!isProjectDirectoryDefined || !editorIsFocused) {
    setMenuEnabled("select", false)
  } else {
    setMenuEnabled("select", true)
  }
}
