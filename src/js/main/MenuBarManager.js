import { Menu } from 'electron'
import * as appMenu from './menus/App.js'
import * as fileMenu from './menus/File.js'
import * as editMenu from './menus/Edit.js'
import * as selectMenu from './menus/Select.js'
import * as formatMenu from './menus/Format.js'
import * as viewMenu from './menus/View.js'
import * as windowMenu from './menus/Window.js'

/**
 * On startup, create initial menu bar, and create change listeners.
 * When state changes, we check if value we care about has changed.
 * If yes, we update the application menu.
 */
export function init() {

  // const darkModeChanged = stateHasChanged(global.patches, "darkMode")
  // if (darkModeChanged) setNativeTheme(false)

  /*
  If project directory is not yet specified, do not show menu?
  */

  // global.store.onDidAnyChange((state, oldState) => {

  //   // Get window
  //   // Get project
  //   // Get project.directory

  //   const project = state.projects.byId[state.focusedWindowId]
  //   if (!)

  // })

  // Create menu
  const menu = new Menu()
  menu.append(appMenu.create())
  menu.append(fileMenu.create())
  menu.append(editMenu.create())
  menu.append(selectMenu.create())
  menu.append(formatMenu.create())
  menu.append(viewMenu.create())
  menu.append(windowMenu.create())
  Menu.setApplicationMenu(menu)
 
  // Set initial values by triggering update()
  appMenu.update(menu)
  fileMenu.update(menu)
  editMenu.update(menu)
  selectMenu.update(menu)
  formatMenu.update(menu)
  viewMenu.update(menu)
  windowMenu.update(menu)

  // On state change, trigger update() 
  global.store.onDidAnyChange((state, oldState) => {

    const project = state.projects.byId[state.focusedWindowId]
    const panel = project?.panels[project?.focusedPanelIndex]
    const prefsIsFocused = state.focusedWindowId == 'preferences'  

    appMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    fileMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    editMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    selectMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    formatMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    viewMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
    windowMenu.onStateChanged(state, oldState, project, panel, prefsIsFocused, menu)
  })  
}
