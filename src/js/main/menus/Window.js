import { MenuItem } from "electron";
import { ______________________________ } from './Separator.js'
import { setMenuEnabled } from "./setMenuEnabled.js";

export function create() {

  return new MenuItem({
    label: 'Window',
    id: 'window',
    submenu: []
  })
}

export function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, applicationMenu) {
  
  // TODO
}

