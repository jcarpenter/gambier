import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'

export function create() {

  return new MenuItem({
    label: 'Window',
    submenu: []
  })
}


export function update(applicationMenu) {
  const m = applicationMenu
  const state = global.state()
  const project = state.projects.byId[state.focusedWindowId]
  const panel = project?.panels[project?.focusedPanelIndex]
  const prefsIsFocused = state.focusedWindowId == 'preferences'  

}

export function onStateChanged(state, oldState, project, panel, prefsIsFocused, applicationMenu) {
  update(applicationMenu)
}