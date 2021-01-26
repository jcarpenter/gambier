import { StateManager } from './StateManager';
import Preferences from './component/preferences/Preferences.svelte'

// Going to need to read and set state
// Going to need to get state to Svelte components

async function init() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState')
  // const initialFiles = await window.api.invoke('getFiles')

  // Create managers
  const stateManager = new StateManager(initialState)

  // Create layout
  const layout = new Preferences({
    target: document.querySelector('#layout')
  })
}

window.addEventListener('DOMContentLoaded', init)