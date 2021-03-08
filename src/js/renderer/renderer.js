
import * as StateManager from './StateManager'
import * as FilesManager from './FilesManager'
import * as ThemeManager from './ThemeManager'
import { defineGambierMode } from './editor/gambierCodeMirrorMode'
import Layout from './component/Layout.svelte'



// ------ SETUP ------ //

async function init() {

  // Get initial state and files
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

  // Define an array of CodeMirror instances on window.
  // We push to these in onMount of Editor components.
  // We use these when we need to a CM instance's contents
  // from outside the scope of its parent Editor component.
  window.cmInstances = []

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  })

  // Finish setup by showing window
  window.api.send('showWindow')
}


window.addEventListener('DOMContentLoaded', init)