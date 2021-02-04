
import * as StateManager from './StateManager'
import * as FilesManager from './FilesManager'
import * as ThemeManager from './ThemeManager'
import { defineGambierMode } from './editor/gambierCodeMirrorMode'
import Layout from './component/Layout.svelte'



// ------ SETUP ------ //

async function init() {

  const initialState = await window.api.invoke('getState')
  const initialFiles = await window.api.invoke('getFiles')
  const initialColors = await window.api.invoke('getColors', true)

  // Set initial values
  StateManager.init(initialState)
  FilesManager.init(initialFiles)
  ThemeManager.init(initialState, initialColors)

  // Define CodeMirror "Gambier" mode. We only need to do this once.
  // Individual CodeMirror instances load via `mode: 'gambier'` in their setup configs.
  defineGambierMode()

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  })

  // Finish setup by showing window
  window.api.send('showWindow')
}


window.addEventListener('DOMContentLoaded', init)