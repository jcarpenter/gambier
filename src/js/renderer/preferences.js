import * as StateManager from './StateManager'
import * as ThemeManager from './ThemeManager'
import Preferences from './component/preferences/Preferences.svelte'

// ------ SETUP ------ //

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