import { app, Menu, MenuItem, nativeTheme } from 'electron'
import { stateHasChanged } from '../shared/utils.js'
import { selectProjectDirectoryFromDialog } from './actions/index.js'
import { remove } from 'fs-extra'
import { themes } from './Themes.js'
import * as appMenu from './menus/App.js'
import * as fileMenu from './menus/File.js'
import * as editMenu from './menus/Edit.js'
import * as formatMenu from './menus/Format.js'
import * as viewMenu from './menus/View.js'
import * as windowMenu from './menus/Window.js'

const isMac = process.platform === 'darwin'

/**
 * On startup, create initial menu bar, and create change listeners.
 * When state changes, we check if value we care about has changed.
 * If yes, we update the application menu.
 */
export function init() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // We need to rebuild the menu whenever any of the follow change,
  // because they drive one or more menu items' `enabled` states.

  // global.store.onDidAnyChange((state, oldState) => {

  //   const somethingWeCareAboutHasChanged = 
  //     // Focused window
  //     stateHasChanged(global.patches, "focusedWindowId") ||
  //     // Focused panel
  //     stateHasChanged(global.patches, ["projects", "byId", "focusedPanelIndex"]) ||
  //     // Source mode
  //     stateHasChanged(global.patches, "sourceMode") ||
  //     // Appearance
  //     stateHasChanged(global.patches, "theme") ||
  //     stateHasChanged(global.patches, "chromium")

  //   if (somethingWeCareAboutHasChanged) {
  //     Menu.setApplicationMenu(getMenu())
  //   }
  // })
  
  

  // ------ DO INITIAL SETUP ------ //

  // Create menu
  const menu = new Menu()
  menu.append(appMenu.menu)
  menu.append(fileMenu.menu)
  menu.append(editMenu.menu)
  menu.append(formatMenu.menu)
  menu.append(viewMenu.menu)
  menu.append(windowMenu.menu)
  Menu.setApplicationMenu(menu)
  
  // Set dynamic values in submenus
  appMenu.update(menu)
  fileMenu.update(menu)
  editMenu.update(menu)
  // viewMenu.update(menu)
  formatMenu.update(menu)
  windowMenu.update(menu)

  // On state change, prompt 
  global.store.onDidAnyChange((state, oldState) => {

    const project = state.projects.byId[state.focusedWindowId]
    const panel = project?.panels[project?.focusedPanelIndex]
    const prefsIsFocused = state.focusedWindowId == 'preferences'  

    appMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    fileMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    editMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    // viewMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    formatMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    windowMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
  })
  
}














/**
 * Return Menu Items. These are appended to a new Menu instance.
 */
function getMenuItems() {

  // Separator
  const _______________ = new MenuItem({ type: 'separator' })


  // -------- Format -------- //

  items.emphasis = new MenuItem({
    label: 'Emphasis',
    accelerator: 'CmdOrCtrl+I',
    enabled: project !== undefined,
    click(item, focusedWindow) {
      focusedWindow.webContents.send('formatCommand', 'emphasis')
    }
  })

  items.topLevel.push(new MenuItem(
    {
      label: 'Format',
      submenu: [
        items.emphasis
      ]
    }
  ))


  // -------- View -------- //

  const name = new MenuItem({
    label: 'App Theme',
    submenu: themes.allIds.map((id) => {
      const theme = themes.byId[id]
      return new MenuItem({
        label: theme.name,
        type: 'checkbox',
        checked: state.theme.id == id,
        click() {
          global.store.dispatch({ type: 'SET_APP_THEME', id })
        }
      })
    })
  })

  const accentColor = new MenuItem({
    label: 'Accent Color',
    submenu: [
      new MenuItem({
        label: 'Match System',
        type: 'checkbox',
        checked: state.theme.accentColor == 'match-system',
        click() {
          global.store.dispatch({ type: 'SET_ACCENT_COLOR', name: 'match-system', })
        }
      }),
      _______________,
    ]
  })

  const background = new MenuItem({
    label: 'Background',
    submenu: [
      new MenuItem({
        label: 'Placeholder',
        type: 'checkbox',
        checked: state.theme.background == 'placeholder',
        click() {
          global.store.dispatch({ type: 'SET_BACKGROUND', name: 'placeholder', })
        }
      }),
    ]
  })

  const darkMode = new MenuItem({
    label: 'Dark Mode',
    submenu: [
      new MenuItem({
        label: 'Match System',
        type: 'checkbox',
        checked: state.darkMode == 'match-system',
        click() {
          global.store.dispatch({ type: 'SET_DARK_MODE', value: 'match-system', })
        }
      }),
      _______________,
      new MenuItem({
        label: 'Dark',
        type: 'checkbox',
        checked: state.darkMode == 'dark',
        click() {
          global.store.dispatch({ type: 'SET_DARK_MODE', value: 'dark' })
        }
      }),
      new MenuItem({
        label: 'Light',
        type: 'checkbox',
        checked: state.darkMode == 'light',
        click() {
          global.store.dispatch({ type: 'SET_DARK_MODE', value: 'light' })
        }
      })
    ]
  })

  const editorTheme = new MenuItem({
    label: 'Editor Theme',
    submenu: [
      new MenuItem({
        label: 'Placeholder',
        type: 'checkbox',
        checked: state.theme.editorTheme == 'placeholder',
        click() {
          global.store.dispatch({ type: 'SET_EDITOR_THEME', name: 'placeholder' })
        }
      }),
    ]
  })

  items.sourceMode = new MenuItem({
    label: 'Source mode',
    type: 'checkbox',
    checked: state.sourceMode,
    accelerator: 'CmdOrCtrl+/',
    click(item, focusedWindow) {
      if (focusedWindow) {
        global.store.dispatch({
          type: 'SET_SOURCE_MODE',
          enabled: !global.state().sourceMode,
        }, focusedWindow)
      }
    }
  })

  const developer = new MenuItem({
    label: 'Developer',
    submenu: [
      new MenuItem({
        label: 'Toggle Developer Tools',
        accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        role: 'toggleDevTools',
      }),
      new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload'
      })
    ]
  })

  items.topLevel.push(new MenuItem({
    label: 'View',
    submenu: [
      name,
      _______________,
      accentColor,
      background,
      darkMode,
      editorTheme,
      _______________,
      items.sourceMode,
      ...app.isPackaged ? [] : [
        _______________,
        developer
      ],
    ]
  }))

  return items
}

