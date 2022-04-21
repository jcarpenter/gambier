import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"
import { objHasChanged  } from "../shared/utils";
import { updateTheme } from './ThemeManager'

enablePatches() // Required by immer

// Svelte stores:
// These are accessed by Svelte components.
export const state = writable({})
export const isWindowFocused = writable(false)
export const isMetaKeyDown = writable(false)
export const project = writable({})
export const sidebar = writable({})
export const markdownOptions = writable({})

// Current state as JS object:
// This may seem redundant (why not access state store?, but it's here for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
export let stateAsObject = {}

// Copy of the previous state, so we can check for changes
let oldState = {} 


/**
 * Set initial value of state (stores and `stateAsObject`)
 */
 export function init(initialState) {

  // Create listeners for changes
  window.api.receive("statePatchesFromMain", updateFromPatches)

  // Set window.id. Retreive value from url params.
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString);
  window.id = urlParams.get('id')

  // Set initial state values
  stateAsObject = initialState
  setStores()

  // Expose stateAsObject on window
  window.state = stateAsObject

  // Listen for metakey presses
  document.addEventListener('keydown', (evt) => {
    if (evt.metaKey) {
      isMetaKeyDown.set(true)
    }
  })

  document.addEventListener('keyup', (evt) => {
    isMetaKeyDown.set(false)
  })
}


/**
 * Update state (stores and `stateAsObject`) from patches
 * received from main process
 */
function updateFromPatches(patches) {

  console.log('updateFromPatches')

  // Update stateAsObject
  oldState = {...stateAsObject}
  stateAsObject = applyPatches(stateAsObject, patches)

  // Update `window.state`
  window.state = stateAsObject

  // Update stores
  setStores()

  // Update theme values
  updateTheme(stateAsObject, patches)
}


/**
 * Set Svelte stores from `stateAsObject`.
 */
 function setStores() {
   
  // Set `state` store
  state.set(stateAsObject)

  // Set `isWindowFocused` store
  isWindowFocused.set(stateAsObject.focusedWindowId == window.id)

  // Set isMetaKeyDown false when window is not focused
  if (stateAsObject.focusedWindowId !== window.id) {
    isMetaKeyDown.set(false)
  }

  // Set `project` and `sidebar` stores, if this is NOT the prefs window.
  if (window.id !== 'preferences') {
    const proj = stateAsObject.projects.byId[window.id]
    project.set(proj)
    sidebar.set(proj.sidebar)
  }

  const markdownOptionsHaveChanged = objHasChanged(oldState.markdown, stateAsObject.markdown)
  if (markdownOptionsHaveChanged) {
    markdownOptions.set(stateAsObject.markdown)
  }
}