import * as StateManager from './StateManager'
import * as ThemeManager from './ThemeManager'
import Preferences from './component/preferences/Preferences.svelte'

// ------ SETUP ------ //

async function init() {

  // Get initial state and files
  const state = await window.api.invoke('getState')

  // Set initial values
  StateManager.init(state)  
  ThemeManager.init(state)

  // Create layout
  const layout = new Preferences({
    target: document.querySelector('#layout')
  })
}

window.addEventListener('DOMContentLoaded', init)