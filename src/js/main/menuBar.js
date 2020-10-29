import { app, Menu, MenuItem, nativeTheme } from 'electron'
import { newFile } from './actions/index.js'

let store = {}
let state = {}

/**
 * Note: App and File menus are macOS only. 
 */
function setup(gambierStore) {

  store = gambierStore
  state = gambierStore.store

  const isMac = process.platform === 'darwin'
  const separator = new MenuItem({ type: 'separator' })

  const menu = new Menu()

  // -------- App (Mac-only) -------- //

  if (isMac) {
    const appMenu = new MenuItem(
      {
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
      }
    )

    menu.append(appMenu)
  }


  // -------- File (Mac-only) -------- //
  if (isMac) {

    const saveNewFile = new MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      async click(item, focusedWindow) {
        store.dispatch(await newFile(state))
      }
    })

    const save = new MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveFile')
      }
    })

    var moveToTrash = new MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      enabled: state.focusedLayoutSection == 'navigation',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsDeleteFile')
      }
    })

    const file = new MenuItem({
      label: 'File',
      submenu: [
        saveNewFile,
        save,
        moveToTrash
      ]
    })

    menu.append(file)
  }


  // -------- Edit -------- //

  const undo = new MenuItem({ label: 'Undo', role: 'undo' })
  const redo = new MenuItem({ label: 'Redo', role: 'redo' })
  const cut = new MenuItem({ role: 'cut' })
  const copy = new MenuItem({ role: 'copy' })
  const paste = new MenuItem({ role: 'paste' })
  const deleteItem = new MenuItem({ role: 'delete' })
  const selectall = new MenuItem({ role: 'selectall' })
  const startspeaking = new MenuItem({ role: 'startspeaking' })
  const stopspeaking = new MenuItem({ role: 'stopspeaking' })

  const findInFiles = new MenuItem({
    label: 'Find in Files',
    type: 'normal',
    accelerator: 'CmdOrCtrl+Shift+F',
    click(item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.webContents.send('findInFiles')
      }
    }
  })

  const edit = new MenuItem(
    {
      label: 'Edit',
      submenu: [
        undo,
        redo,
        separator,
        cut,
        copy,
        paste,
        deleteItem,
        selectall,
        separator,
        findInFiles,
        // If macOS, add speech options to Edit menu
        ...isMac ? [
          separator,
          {
            label: 'Speech',
            submenu: [
              startspeaking,
              stopspeaking
            ]
          }
        ] : []
      ]
    }
  )

  menu.append(edit)


  // -------- View -------- //

  const source_mode = new MenuItem({
    label: 'Source mode',
    type: 'checkbox',
    checked: state.sourceMode,
    accelerator: 'CmdOrCtrl+/',
    click(item, focusedWindow) {
      if (focusedWindow) {
        store.dispatch({
          type: 'SET_SOURCE_MODE',
          active: !state.sourceMode,
        })
      }
    }
  })

  const appearance_system = new MenuItem({
    label: 'Match System',
    type: 'checkbox',
    checked: state.appearance.userPref == 'match-system',
    click(item, focusedWindow) {
      store.dispatch({
        type: 'SET_APPEARANCE',
        userPref: 'match-system',
        theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
      })
    }
  })

  const appearance_light = new MenuItem({
    label: 'Light',
    type: 'checkbox',
    checked: state.appearance.userPref == 'light',
    click() {
      store.dispatch({
        type: 'SET_APPEARANCE',
        userPref: 'light',
        theme: 'gambier-light'
      })
    }
  })

  const appearance_dark = new MenuItem({
    label: 'Dark',
    type: 'checkbox',
    checked: state.appearance.userPref == 'dark',
    click(item, focusedWindow) {
      store.dispatch({
        type: 'SET_APPEARANCE',
        userPref: 'dark',
        theme: 'gambier-dark'
      })
    }
  })

  const appearance = new MenuItem({
    label: 'Appearance',
    submenu: [
      appearance_system,
      separator,
      appearance_light,
      appearance_dark
    ]
  })

  const toggle_dev_tools = new MenuItem({
    label: 'Toggle Developer Tools',
    accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    role: 'toggleDevTools'
    // click(item, focusedWindow) {
    //   if (focusedWindow) focusedWindow.webContents.toggleDevTools()
    // }
  })

  const reload = new MenuItem({
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    role: 'reload'
    // click(item, focusedWindow) {
    //   if (focusedWindow) focusedWindow.reload()
    // }
  })

  const sideBarTabs = state.sideBar2.tabs.map((t, index) => {
    return new MenuItem({
      label: t.title,
      type: 'checkbox',
      accelerator: `Cmd+${index + 1}`,
      checked: state.sideBar2.activeTab.index == index,
      click(item, focusedWindow) {
        store.dispatch({
          type: 'SELECT_SIDEBAR_TAB_BY_INDEX',
          index: index
        })
      }
    })
  })

  const view = new MenuItem({
    label: 'View',
    // submenu: new Menu()
    submenu: [
      source_mode,
      appearance,
      ...app.isPackaged ? [] : [separator, toggle_dev_tools, reload],
      separator,
      ...sideBarTabs
    ]
  })

  menu.append(view)


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


  // -------- Set initial values -------- //




  // -------- Change listeners -------- //

  store.onDidAnyChange((newState, oldState) => {
    state = newState
  })

  store.onDidChange('sourceMode', () => {
    source_mode.checked = state.sourceMode
  })

  store.onDidChange('focusedLayoutSection', () => {
    moveToTrash.enabled = state.focusedLayoutSection == 'navigation'
  })

  store.onDidChange('appearance', () => {
    appearance_system.checked = state.appearance.userPref == 'match-system'
    appearance_light.checked = state.appearance.userPref == 'light'
    appearance_dark.checked = state.appearance.userPref == 'dark'
  })

  store.onDidChange('sideBar2', () => {
    sideBarTabs.forEach((t, index) => {
      t.checked = state.sideBar2.activeTab.index == index
    });
  })


  // -------- Create menu -------- //

  Menu.setApplicationMenu(menu)
}

export { setup } 