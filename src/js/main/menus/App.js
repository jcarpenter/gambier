import { app, MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

const preferences = new MenuItem({
  id: 'app-preferences',
  label: 'Preferences...',
  accelerator: 'CmdOrCtrl+,',
  click() {
    const state = global.state()
    const prefsIsAlreadyOpen = state.prefs.isOpen
    const prefsIsNotFocused = state.focusedWindowId !== 'preferences'
    if (prefsIsAlreadyOpen) {
      if (prefsIsNotFocused) {
        global.store.dispatch({ type: 'FOCUS_PREFERENCES_WINDOW' })
      }
    } else {
      global.store.dispatch({ type: 'OPEN_PREFERENCES' })
    }
  }
})

export const menu = new MenuItem({
  label: app.name,
  submenu: [
    { role: 'about' },
    ______________________________,
    preferences,
    ______________________________,
    { role: 'services', submenu: [] },
    ______________________________,
    { role: 'hide' },
    { role: 'hideothers' },
    { role: 'unhide' },
    ______________________________,
    { role: 'quit' }
  ]
})

export function update(applicationMenu) {

  // Nothing in app menu is dynamic...

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, menu) {

  // Nothing in app menu is dynamic...

}