import { app, Menu, MenuItem, nativeTheme } from 'electron'
import { newFile } from './actions/index.js'
import { createNewWindow } from './windows.js'

let store = {}
let state = {}

let menuItems = {}

const isMac = process.platform === 'darwin'
const separator = new MenuItem({ type: 'separator' })

function makeMenuItems() {

  const mI = { topLevel: [] } // reset

  // -------- App (Mac-only) -------- //

  if (isMac) {
    mI.topLevel.push(new MenuItem({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }))
  }

  // -------- File (Mac-only) -------- //
  if (isMac) {

    mI.newDocument = new MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      async click(item, focusedWindow) {
        store.dispatch(await newFile(state))
      }
    })

    mI.newWindow = new MenuItem({
      label: 'New Window',
      accelerator: 'CmdOrCtrl+Shift+N',
      async click(item, focusedWindow) {
        createEmptyWindow(store)
      }
    })

    mI.save = new MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveFile')
      }
    })

    mI.moveToTrash = new MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      enabled: state.focusedLayoutSection == 'navigation',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsDeleteFile')
      }
    })

    mI.topLevel.push(new MenuItem({
      label: 'File',
      submenu: [
        mI.newDocument,
        mI.newWindow,
        separator,
        mI.save,
        mI.moveToTrash
      ]
    }))
  }


  // -------- Edit -------- //

  // mI.undo = new MenuItem({ label: 'Undo', role: 'undo' })
  // mI.redo = new MenuItem({ label: 'Redo', role: 'redo' })
  // mI.cut = new MenuItem({ role: 'cut' })
  // mI.copy = new MenuItem({ role: 'copy' })
  // mI.paste = new MenuItem({ role: 'paste' })
  // mI.deleteItem = new MenuItem({ role: 'delete' })
  // mI.selectall = new MenuItem({ role: 'selectall' })
  // mI.startspeaking = new MenuItem({ role: 'startspeaking' })
  // mI.stopspeaking = new MenuItem({ role: 'stopspeaking' })
  // mI.findInFiles = new MenuItem({
  //   label: 'Find in Files',
  //   type: 'normal',
  //   accelerator: 'CmdOrCtrl+Shift+F',
  //   click(item, focusedWindow) {
  //     if (focusedWindow) {
  //       focusedWindow.webContents.send('findInFiles')
  //     }
  //   }
  // })

  // mI.topLevel.push(new MenuItem(
  //   {
  //     label: 'Edit',
  //     submenu: [
  //       mI.undo,
  //       mI.redo,
  //       separator,
  //       mI.cut,
  //       mI.copy,
  //       mI.paste,
  //       mI.deleteItem,
  //       mI.selectall,
  //       separator,
  //       mI.findInFiles,
  //       // If macOS, add speech options to Edit menu
  //       ...isMac ? [
  //         separator,
  //         {
  //           label: 'Speech',
  //           submenu: [
  //             mI.startspeaking,
  //             mI.stopspeaking
  //           ]
  //         }
  //       ] : []
  //     ]
  //   }
  // ))

  // // -------- View -------- //

  // mI.source_mode = new MenuItem({
  //   label: 'Source mode',
  //   type: 'checkbox',
  //   checked: state.sourceMode,
  //   accelerator: 'CmdOrCtrl+/',
  //   click(item, focusedWindow) {
  //     if (focusedWindow) {
  //       store.dispatch({
  //         type: 'SET_SOURCE_MODE',
  //         active: !state.sourceMode,
  //       })
  //     }
  //   }
  // })

  // mI.appearance_system = new MenuItem({
  //   label: 'Match System',
  //   type: 'checkbox',
  //   checked: state.appearance.userPref == 'match-system',
  //   click(item, focusedWindow) {
  //     store.dispatch({
  //       type: 'SET_APPEARANCE',
  //       userPref: 'match-system',
  //       theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
  //     })
  //   }
  // })

  // mI.appearance_light = new MenuItem({
  //   label: 'Light',
  //   type: 'checkbox',
  //   checked: state.appearance.userPref == 'light',
  //   click() {
  //     store.dispatch({
  //       type: 'SET_APPEARANCE',
  //       userPref: 'light',
  //       theme: 'gambier-light'
  //     })
  //   }
  // })

  // mI.appearance_dark = new MenuItem({
  //   label: 'Dark',
  //   type: 'checkbox',
  //   checked: state.appearance.userPref == 'dark',
  //   click(item, focusedWindow) {
  //     store.dispatch({
  //       type: 'SET_APPEARANCE',
  //       userPref: 'dark',
  //       theme: 'gambier-dark'
  //     })
  //   }
  // })

  // mI.appearance = new MenuItem({
  //   label: 'Appearance',
  //   submenu: [
  //     mI.appearance_system,
  //     separator,
  //     mI.appearance_light,
  //     mI.appearance_dark
  //   ]
  // })

  // mI.toggle_dev_tools = new MenuItem({
  //   label: 'Toggle Developer Tools',
  //   accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
  //   role: 'toggleDevTools'
  //   // click(item, focusedWindow) {
  //   //   if (focusedWindow) focusedWindow.webContents.toggleDevTools()
  //   // }
  // })

  // mI.reload = new MenuItem({
  //   label: 'Reload',
  //   accelerator: 'CmdOrCtrl+R',
  //   role: 'reload'
  //   // click(item, focusedWindow) {
  //   //   if (focusedWindow) focusedWindow.reload()
  //   // }
  // })

  // mI.togglePreview = new MenuItem({
  //   label: state.sideBar2.preview.isOpen ? 'Hide Preview' : 'Show Preview',
  //   accelerator: 'Alt+CmdOrCtrl+P',
  //   click(item, focusedWindow) {
  //     if (focusedWindow) {
  //       store.dispatch({ type: 'TOGGLE_SIDEBAR_PREVIEW' })
  //     }
  //   }
  // })

  // mI.sideBarTabs = state.sideBar2.tabs.map((t, index) => {
  //   return new MenuItem({
  //     index: index,
  //     label: t.title,
  //     type: 'checkbox',
  //     accelerator: `Cmd+${index + 1}`,
  //     checked: state.sideBar2.activeTab.index == index,
  //     click(item, focusedWindow) {
  //       store.dispatch({
  //         type: 'SELECT_SIDEBAR_TAB_BY_INDEX',
  //         index: index
  //       })
  //     }
  //   })
  // })

  // mI.topLevel.push(new MenuItem({
  //   label: 'View',
  //   submenu: [
  //     mI.source_mode,
  //     mI.appearance,
  //     ...app.isPackaged ? [] : [separator, mI.toggle_dev_tools, mI.reload],
  //     separator,
  //     mI.togglePreview,
  //     separator,
  //     ...mI.sideBarTabs
  //   ]
  // }))

  return mI
}

function makeMenu() {

  const menu = new Menu()
  menuItems = makeMenuItems()
  // console.log(menuItems)
  // for (const item in menuItems) {
  //   console.log(`menuItems.${item} = ${menuItems[item]}`);
  // }
  // menuItems.topLevel.forEach((item) => console.log(item))
  menuItems.topLevel.forEach((item) => menu.append(item))
  return menu




  // -------- Window -------- //

  // Different menus for macOS vs others
  if (isMac) {

    const window = new MenuItem(
      {
        role: 'window',
        submenu: [
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          },
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          { label: 'Zoom', role: 'zoom' },
          { type: 'separator' },
          { label: 'Bring All to Front', role: 'front' }
        ]
      }
    )

    menu.append(window)

  } else {

    const window = new MenuItem(
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    )

    menu.append(window)
  }

  return menu
}

function rebuild() {
  const menu = makeMenu()
  Menu.setApplicationMenu(menu)
}

function update() {

}

/**
 * Note: App and File menus are macOS only. 
 */
function setup(testStore) {
  
  store = testStore
  state = store.store
  Menu.setApplicationMenu(makeMenu())

  // -------- Setup change listeners -------- //

  // store.onDidAnyChange((newState, oldState) => {
  //   state = newState
  // })

  // store.onDidChange('sourceMode', () => {
  //   source_mode.checked = state.sourceMode
  // })

  // store.onDidChange('focusedLayoutSection', () => {
  //   moveToTrash.enabled = state.focusedLayoutSection == 'navigation'
  // })

  // store.onDidChange('appearance', () => {
  //   appearance_system.checked = state.appearance.userPref == 'match-system'
  //   appearance_light.checked = state.appearance.userPref == 'light'
  //   appearance_dark.checked = state.appearance.userPref == 'dark'
  // })

  // store.onDidChange('sideBar2', () => {
  //   sideBarTabs.forEach((t, index) => {
  //     t.checked = state.sideBar2.activeTab.index == index
  //   });
  // })

}

export { setup } 