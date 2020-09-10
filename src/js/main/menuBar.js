import { Menu, MenuItem, app } from 'electron'
import { newFile } from './actions/index.js'

let store = {}
let state = {}

/**
 * Note: App and File menus are macOS only. 
 */
function setup(gambierStore) {

  store = gambierStore
  state = gambierStore.store

  const menu = new Menu()

  // -------- App -------- //
  if (process.platform === 'darwin') {
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


  // -------- File -------- //
  if (process.platform === 'darwin') {

    var saveNewFile = new MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      async click(item, focusedWindow) {

        store.dispatch(await newFile(state))
      }
    })


    var save = new MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveFile')
      }
    })

    var moveToTrash = new MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
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

  const edit = new MenuItem(
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    }
  )

  // If macOS, add speech options to Edit menu
  if (process.platform === 'darwin') {
    edit.submenu.append(
      new MenuItem(
        { type: 'separator' }
      ),
      new MenuItem(
        {
          label: 'Speech',
          submenu: [
            { role: 'startspeaking' },
            { role: 'stopspeaking' }
          ]
        }
      ),
    )
  }

  menu.append(edit)


  // -------- View -------- //

  var source_mode = new MenuItem({
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
        // focusedWindow.webContents.send('mainRequestsToggleSource', item.checked)
      }
    }
  })

  var select_editor_theme_dark = new MenuItem({
    label: 'Dark',
    type: 'checkbox',
    checked: state.editorTheme == 'gambier-dark',
    click(item, focusedWindow) {
      store.dispatch({
        type: 'SELECT_EDITOR_THEME',
        theme: 'gambier-dark',
      })
    }
  })

  var select_editor_theme_light = new MenuItem({
    label: 'Light',
    type: 'checkbox',
    checked: state.editorTheme == 'gambier-light',
    click() {
      store.dispatch({
        type: 'SELECT_EDITOR_THEME',
        theme: 'gambier-light',
      })
    }
  })


  const view = new MenuItem(
    {
      label: 'View',
      submenu: [
        source_mode,
        {
          label: 'Theme',
          submenu: [
            select_editor_theme_dark,
            select_editor_theme_light
          ]
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  )

  menu.append(view)


  // -------- Window -------- //

  // Different menus for macOS vs others
  if (process.platform === 'darwin') {

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

  moveToTrash.enabled = store.store.focusedLayoutSection == 'navigation'


  // -------- Change listeners -------- //

  store.onDidAnyChange((newState, oldState) => {
    state = newState
  })

  store.onDidChange('sourceMode', () => {
    source_mode.checked = state.sourceMode
  })

  store.onDidChange('focusedLayoutSection', () => {
    if (store.store.focusedLayoutSection == 'navigation') {
      moveToTrash.enabled = true
    } else {
      moveToTrash.enabled = false
    }
  })

  store.onDidChange('editorTheme', () => {
    select_editor_theme_dark.checked = state.editorTheme == 'gambier-dark'
    select_editor_theme_light.checked = state.editorTheme == 'gambier-light'
  })


  // -------- Create menu -------- //

  Menu.setApplicationMenu(menu)
}

export { setup } 