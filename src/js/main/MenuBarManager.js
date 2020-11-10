import { app, Menu, MenuItem, nativeTheme } from 'electron'

export class MenuBarManager {
  constructor() {

    this.isMac = process.platform === 'darwin'
    this.menuItems = {}

    // Listen for state changes
    global.store.onDidAnyChange((state, oldState) => {
      // if (state.changed.includes('')) {

      // }
    })

    // Set initial menu bar
    this.setMenuBar()
  }

  setMenuBar() {
    Menu.setApplicationMenu(this.getMenu())
  }

  update() {
    // TODO
  }

  getMenu() {
    const menu = new Menu()
    this.menuItems = this.getMenuItems()
    this.menuItems.topLevel.forEach((item) => menu.append(item))
    return menu
  }

  getMenuItems() {
    const items = { topLevel: [] } // reset
    const _______________ = new MenuItem({ type: 'separator' })

    // -------- App (Mac-only) -------- //

    if (this.isMac) {
      items.topLevel.push(new MenuItem({
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

    if (this.isMac) {

      items.newDocument = new MenuItem({
        label: 'New Document',
        accelerator: 'CmdOrCtrl+N',
        async click(item, focusedWindow) {
          // global.store.dispatch(await newFile(state))
        }
      })

      items.newWindow = new MenuItem({
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        async click(item, focusedWindow) {
          global.store.dispatch({ type: 'CREATE_NEW_PROJECT' })
        }
      })

      items.save = new MenuItem({
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click(item, focusedWindow) {
          // focusedWindow.webContents.send('mainRequestsSaveFile')
        }
      })

      items.moveToTrash = new MenuItem({
        label: 'Move to Trash',
        accelerator: 'CmdOrCtrl+Backspace',
        enabled: state.focusedLayoutSection == 'navigation',
        click(item, focusedWindow) {  
          // focusedWindow.webContents.send('mainRequestsDeleteFile')
        }
      })

      items.topLevel.push(new MenuItem({
        label: 'File',
        submenu: [
          items.newDocument,
          items.newWindow,
          _______________,
          items.save,
          items.moveToTrash
        ]
      }))
    }

    return items
  }
}