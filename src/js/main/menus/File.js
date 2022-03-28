import { MenuItem } from "electron";
import { selectProjectDirectoryFromDialog } from "../actions/index.js";
import { ______________________________ } from './Separator.js'


function isMoveToTrashEnabled() {
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const sideBarIsOpen = project?.sidebar.isOpen
  const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId]
  const fileIsSelectedInSidebar = selectedTab?.selected.length
  return sideBarIsOpen && fileIsSelectedInSidebar
}

export function create() {

  return new MenuItem({
    label: 'File',
    submenu: [
  
      new MenuItem({
        label: 'New Document',
        id: 'file-newDocument',
        accelerator: 'CmdOrCtrl+N',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsCreateNewDocInFocusedPanel')
        }
      }),
  
      new MenuItem({
        label: 'New Editor',
        id: 'file-newEditor',
        accelerator: 'CmdOrCtrl+T',
        async click(item, focusedWindow) {
          
          const state = global.state()
          const project = state.projects.byId[state.focusedWindowId]
        
          // Create new panel to right of the current focused panel
          global.store.dispatch({
            type: 'OPEN_NEW_PANEL',
            docId: 'newDoc',
            panelIndex: project.focusedPanelIndex + 1
          }, focusedWindow)
        }
      }),
  
      new MenuItem({
        label: 'New Window',
        id: 'file-newWindow',
        enabled: true,
        accelerator: 'CmdOrCtrl+Shift+N',
        async click(item, focusedWindow) {
          global.store.dispatch({ type: 'CREATE_NEW_PROJECT' })
        }
      }),
  
      ______________________________,
  
      new MenuItem({
        label: 'Open Project...',
        id: 'file-openProject',
        accelerator: 'CmdOrCtrl+Shift+O',
        async click(item, focusedWindow) {
          global.store.dispatch(await selectProjectDirectoryFromDialog(), focusedWindow)
        }
      }),
  
      ______________________________,
  
      new MenuItem({
        label: 'Save',
        id: 'file-save',
        accelerator: 'CmdOrCtrl+S',
        click(item, focusedWindow) {
          const state = global.state()
          const project = state.projects.byId[state.focusedWindowId]
          const panel = project?.panels[project?.focusedPanelIndex]
          if (panel?.unsavedChanges) {
            focusedWindow.webContents.send('mainRequestsSaveFocusedPanel')
          }
        }
      }),
  
      new MenuItem({
        label: 'Save As',
        id: 'file-saveAs',
        accelerator: 'CmdOrCtrl+Shift+S',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsSaveAsFocusedPanel')
        }
      }),
  
      new MenuItem({
        label: 'Save All',
        id: 'file-saveAll',
        accelerator: 'CmdOrCtrl+Alt+S',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsSaveAll')
        }
      }),
  
      new MenuItem({
        label: 'Move to Trash',
        id: 'file-moveToTrash',
        accelerator: 'CmdOrCtrl+Backspace',
        async click(item, focusedWindow) {
      
          // Get selected file paths
          const state = global.state()
          const project = state.projects.byId[state.focusedWindowId]
          const watcher = global.watchers.find((w) => w.id == focusedWindow.projectId)
  
          const activeSidebarTab = project.sidebar.tabsById[project.sidebar.activeTabId]
          let filePathsToDelete = []
          activeSidebarTab.selected.forEach((id) => {
            const filepath = watcher.files.byId[id]?.path
            filePathsToDelete.push(filepath)
          })
      
          // Delete
          await Promise.all(
            filePathsToDelete.map(async (filepath) => {
              await remove(filepath)
            })
          )
        }
      }),
  
      ______________________________,
  
      new MenuItem({
        label: 'Close Editor',
        id: 'file-closeEditor',
        accelerator: 'CmdOrCtrl+W',
        click(item, focusedWindow) {
      
          const state = global.state()
          const project = state.projects.byId[state.focusedWindowId]
          const prefsIsFocused = state.focusedWindowId == 'preferences'  
  
          // In dev mode, we can get into state where there's no focused window, and/or no project. I think it may happen when dev tools is open in a panel. Check before proceeding, or we'll get errors.
          if (!focusedWindow || !project) return
      
          // If prefs is open, Cmd-W should close it.
          // Else, if there are multiple panels open, close focused one. 
          if (prefsIsFocused) {
            focusedWindow.close()
          } else if (project.panels.length >= 1) {
            focusedWindow.webContents.send('mainRequestsCloseFocusedPanel')
          }
        }
      }),
  
      new MenuItem({
        label: 'Close Window',
        id: 'file-closeWindow',
        accelerator: 'CmdOrCtrl+Shift+W',
        click(item, focusedWindow) {
          focusedWindow.close()
        }
      })
    ]
  })
}



export function update(appMenu) {

  const m = appMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const prefsIsFocused = state.focusedWindowId == 'preferences'  

  m.getMenuItemById('file-newDocument').enabled = project !== undefined
  m.getMenuItemById('file-newEditor').enabled = project !== undefined
  // m.getMenuItemById('file-newWindow').enabled = true
  
  m.getMenuItemById('file-openProject').enabled = project !== undefined
  
  m.getMenuItemById('file-save').enabled = project !== undefined
  m.getMenuItemById('file-saveAs').enabled = project !== undefined
  m.getMenuItemById('file-saveAll').enabled = project !== undefined
  m.getMenuItemById('file-moveToTrash').enabled = isMoveToTrashEnabled()
  
  m.getMenuItemById('file-closeEditor').enabled = panel !== undefined
  // m.getMenuItemById('file-closeWindow').label = prefsIsFocused ? 'Winder' : 'Close Window'
  // m.getMenuItemById('file-closeWindow').accelerator = prefsIsFocused ? 'CmdOrCtrl+W' : 'CmdOrCtrl+Shift+W',
  m.getMenuItemById('file-closeWindow').enabled = prefsIsFocused || project !== undefined

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, appMenu) {
  update(appMenu)
}