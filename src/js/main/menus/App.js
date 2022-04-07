import { app, MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export function create() {
 
  return new MenuItem({
    label: app.name,
    submenu: [
      { role: 'about' },
      ______________________________,
      new MenuItem({
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
      }),
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
}


export function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {

  // Nothing in app menu is dynamic...

}