import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export const menu = new MenuItem({
  label: 'Edit',
  submenu: [

    new MenuItem({
      label: 'Undo',
      id: 'edit-undo',
      accelerator: 'CmdOrCtrl+Z',
      selector: 'undo:'
    }),

    new MenuItem({
      label: 'Redo',
      id: 'edit-redo',
      accelerator: 'CmdOrCtrl+Shift+Z',
      selector: 'redo:'
    }),

    ______________________________,

    new MenuItem({
      label: 'Cut',
      id: 'edit-cut',
      accelerator: 'CmdOrCtrl+X',
      selector: 'cut:'
    }),

    new MenuItem({
      label: 'Copy',
      id: 'edit-copy',
      accelerator: 'CmdOrCtrl+C',
      selector: 'copy:'
    }),

    new MenuItem({
      label: 'Paste',
      id: 'edit-paste',
      accelerator: 'CmdOrCtrl+V',
      selector: 'paste:'
    }),

    new MenuItem({
      label: 'Paste as Plain Text',
      id: 'edit-pasteAsPlainText',
      accelerator: 'CmdOrCtrl+Shift+Alt+V',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('pasteAsPlainText')
      }
    }),

    new MenuItem({
      label: 'Select All',
      id: 'edit-selectAll',
      accelerator: 'CmdOrCtrl+A',
      selector: 'selectAll:'
    }),

    ______________________________,

    new MenuItem({
      label: 'Find in Files',
      id: 'edit-findInFiles',
      accelerator: 'CmdOrCtrl+Shift+F',
      click(item, focusedWindow) {
        // Tell Search tab to open. And if there's text selected in 
        // the active editor instance, make it the query value.
        focusedWindow.webContents.send('findInFiles')
      }
    }),

    new MenuItem({
      label: 'Replace in Files',
      id: 'edit-replaceInFiles',
      accelerator: 'CmdOrCtrl+Shift+R',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('replaceInFiles')
      }
    }),

    ______________________________,

    {
      label: 'Speech',
      submenu: [
        { role: 'startspeaking' },
        { role: 'stopspeaking' }
      ]
    }

  ]
})

export function update(applicationMenu) {
  const m = applicationMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const focusedSectionId = project?.focusedSectionId
  const prefsIsFocused = state.focusedWindowId == 'preferences'  

  const aProjectWindowIsFocused = project !== undefined
  const isSideBarFocused = project && focusedSectionId == 'sidebar'
  const isAPanelFocused = panel && focusedSectionId == 'editor'

  m.getMenuItemById('edit-undo').enabled = isAPanelFocused
  m.getMenuItemById('edit-redo').enabled = isAPanelFocused

  m.getMenuItemById('edit-cut').enabled = isAPanelFocused
  m.getMenuItemById('edit-copy').enabled = isAPanelFocused
  m.getMenuItemById('edit-paste').enabled = isAPanelFocused
  m.getMenuItemById('edit-pasteAsPlainText').enabled = isAPanelFocused
  m.getMenuItemById('edit-selectAll').enabled = isAPanelFocused

  m.getMenuItemById('edit-findInFiles').enabled = aProjectWindowIsFocused
  m.getMenuItemById('edit-replaceInFiles').enabled = aProjectWindowIsFocused

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, applicationMenu) {
  update(applicationMenu)
}