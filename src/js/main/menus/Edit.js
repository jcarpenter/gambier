import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'
import { setMenuEnabled } from "./setMenuEnabled.js";

export function create() {

  return new MenuItem({
    label: 'Edit',
    id: 'edit',
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
        // selector: 'paste:',
        click(item, focusedWindow) {
          // focusedWindow.webContents.send('replaceInFiles')
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
}




export function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {
  
  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("edit", false)
    return
  }

  const focusedSectionId = project?.focusedSectionId
  const isAProjectWindowFocused = project !== undefined
  const isAPanelFocused = panel && focusedSectionId == 'editor'

  appMenu.getMenuItemById('edit-undo').enabled = isAPanelFocused
  appMenu.getMenuItemById('edit-redo').enabled = isAPanelFocused

  appMenu.getMenuItemById('edit-cut').enabled = isAPanelFocused
  appMenu.getMenuItemById('edit-copy').enabled = isAPanelFocused
  appMenu.getMenuItemById('edit-paste').enabled = isAPanelFocused
  appMenu.getMenuItemById('edit-pasteAsPlainText').enabled = isAPanelFocused
  appMenu.getMenuItemById('edit-selectAll').enabled = isAPanelFocused

  appMenu.getMenuItemById('edit-findInFiles').enabled = isAProjectWindowFocused
  appMenu.getMenuItemById('edit-replaceInFiles').enabled = isAProjectWindowFocused

}
