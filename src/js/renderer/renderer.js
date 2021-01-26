
import { propHasChangedTo } from '../shared/utils'
import { StateManager } from './StateManager'
import { FilesManager } from './FilesManager'
import Layout from './component/Layout.svelte'
import { defineGambierMode } from './editor/gambierCodeMirrorMode'

window.api.receive('mainWantsToCloseWindow', (files) => {
  // TODO: DO stuff... Save files, etc
  window.api.send('dispatch', {
    type: 'CAN_SAFELY_CLOSE_PROJECT_WINDOW',
  })
})


// ------ DELETE FILES ------ //

// window.api.receive('mainRequestsDeleteFile', () => {
  
// })


// ------ SYSTEM COLORS ------ //

window.api.receive('updatedSystemColors', applySystemColorsAsCssVariables)

function applySystemColorsAsCssVariables(colors) {
  for (const [varName, rgbaHex] of Object.entries(colors)) {
    document.body.style.setProperty(`--${varName}`, rgbaHex)
  }
}


// ------ SETUP ------ //

async function init() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState')
  const initialFiles = await window.api.invoke('getFiles')
  const initialSystemColors = await window.api.invoke('getSystemColors')

  // Create managers
  const stateManager = new StateManager(initialState)
  const filesManager = new FilesManager(initialFiles)

  // Define CodeMirror "Gambier" mode. We only need to do this once.
  // Individual CodeMirror instances load via `mode: 'gambier'` in their setup configs.
  defineGambierMode()

  // Apply initial system colors
  applySystemColorsAsCssVariables(initialSystemColors)

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  })

  // Finish setup by showing window
  window.api.send('showWindow')
}


window.addEventListener('DOMContentLoaded', init)