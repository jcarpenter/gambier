import * as StateManager from './StateManager'
import Preferences from './component/preferences/Preferences.svelte'

// Going to need to read and set state
// Going to need to get state to Svelte components

async function init() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState')
  const initialColors = await window.api.invoke('getColors', false)

  // Set initial values
  StateManager.init(initialState)
  ThemeManager.init(initialState, initialColors)

  // Create layout
  const layout = new Preferences({
    target: document.querySelector('#layout')
  })
}

window.addEventListener('DOMContentLoaded', init)