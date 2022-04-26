import * as CitationManager from './CitationManager'
import * as FilesManager from './FilesManager'
import * as StateManager from './StateManager'
import * as ThemeManager from './ThemeManager'
import { defineCodeMirrorMode } from './editor/codeMirrorMode'
import Layout from './component/Layout.svelte'
import { wait } from '../shared/utils'


// ------ SETUP ------ //

async function init() {
  
  // Get initial state and files
  const state = await window.api.invoke('getState')
  const files = await window.api.invoke('getFiles')

  // Set initial values
  StateManager.init(state)
  FilesManager.init(files)
  CitationManager.init()

  // Define CodeMirror "Gambier" mode. We only need to do this once.
  // Individual CodeMirror instances load via `mode: 'gambier'` in their setup configs.
  defineCodeMirrorMode()

  // Define an array of CodeMirror instances on window.
  // We push to these in onMount of Editor components.
  // We use these when we need to access a CM instance's contents
  // from outside the scope of its parent Editor component.
  window.cmInstances = []

  // Once we have state, start drawing the layout.
  // This takes a while, so we do it before we load the theme
  // (which has to pull in theme images).
  const layout = new Layout({
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