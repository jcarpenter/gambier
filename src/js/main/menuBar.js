import { Menu, MenuItem, app } from 'electron'

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

  const view = new MenuItem(
    {
      label: 'View',
      submenu: [
        {
          label: 'Source mode',
          type: 'checkbox',
          checked: false,
          accelerator: 'CmdOrCtrl+/',
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.send('mainRequestsToggleSource', item.checked )
            }
          }
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

  var save = new MenuItem({
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
    click(item, focusedWindow) {
      focusedWindow.webContents.send('mainRequestsSaveFile')
    }
  })

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

  store.onDidChange('focusedLayoutSection', () => {
    if (store.store.focusedLayoutSection == 'navigation') {
      moveToTrash.enabled = true
    } else {
      moveToTrash.enabled = false
    }
  })


  // -------- Create menu -------- //

  Menu.setApplicationMenu(menu)
}

export { setup } 