import { MenuItem } from "electron";
import { selectProjectDirectoryFromDialog } from "../actions/index.js";
import { ______________________________ } from './Separator.js'


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

export function update(appMenu) {
  const m = appMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const focusedSectionId = project?.focusedSectionId
  const editorIsFocused = focusedSectionId == "editor"
    
  // Disable when editor is not focused

  m.getMenuItemById('select-selectNextEntity').enabled = editorIsFocused
  m.getMenuItemById('select-selectPrevEntity').enabled = editorIsFocused
  m.getMenuItemById('select-selectNextOccurence').enabled = editorIsFocused
  m.getMenuItemById('select-selectLine').enabled = editorIsFocused
  m.getMenuItemById('select-cutLine').enabled = editorIsFocused
  m.getMenuItemById('select-deleteLine').enabled = editorIsFocused
  m.getMenuItemById('select-duplicateLine').enabled = editorIsFocused
  m.getMenuItemById('select-moveLineUp').enabled = editorIsFocused
  m.getMenuItemById('select-moveLineDown').enabled = editorIsFocused
  m.getMenuItemById('select-addCursorToPrevLine').enabled = editorIsFocused
  m.getMenuItemById('select-addCursorToNextLine').enabled = editorIsFocused

}

/**
 * Determine whether we need to update the menu,
 * based on what has changed.
 */
export function onStateChanged(state, oldState, project, panel, prefsIsFocused, appMenu) {
  update(appMenu)
}