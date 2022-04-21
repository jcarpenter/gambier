import * as StateManager from './StateManager'
import * as ThemeManager from './ThemeManager'
import Preferences from './component/preferences/Preferences.svelte'
import { wait } from '../shared/utils'

// ------ SETUP ------ //

async function init() {

  // Get initial state and files
  const state = await window.api.invoke('getState')

  // Set initial values
  StateManager.init(state)  

  // Once we have state, start drawing the layout.
  // This takes a while, so we do it before we load the theme
  // (which has to pull in theme images).
  const layout = new Preferences({
    target: document.querySelector('#layout')
  })

  // Load theme (stylesheet, associated images, etc)
  await ThemeManager.init(state)

  // Wait a beat before showing window. Wish we didn't have
  // to do this, but it's necessary to give Svelte enough time
  // to fully draw UI. Else we get little multi-millisecond
  // flashes as varibles take effect, images pop-in, etc.
  await wait(50)

  // Finish setup by showing window
  window.api.send('showWindow')
}

// Call init once all page resources have loaded
window.addEventListener('load', init)