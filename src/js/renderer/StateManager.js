import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"
import { stateHasChanged, wait } from "../shared/utils";
import { updateTheme } from './ThemeManager'

enablePatches() // Required by immer

// Svelte stores:
// These are accessed by Svelte components.
export const state = writable({})
export const isWindowFocused = writable(false)
export const isMetaKeyDown = writable(false)
export const project = writable({})
export const sidebar = writable({})

// Current state as JS object:
// This may seem redundant (why not access state store?, but it's here for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
export let stateAsObject = {}


/**
 * Set Svelte stores from `stateAsObject`.
 */
function setStores() {
  
  // Set `state` store
  state.set(stateAsObject)

  // Set `isWindowFocused` store
  isWindowFocused.set(stateAsObject.focusedWindowId == window.id)
  
  // Set `project` and `sidebar` stores, if this is NOT the prefs window.
  if (window.id !== 'preferences') {
    const proj = stateAsObject.projects.byId[window.id]
    project.set(proj)
    sidebar.set(proj.sidebar)
  }
}

function updateFromPatches(patches) {

  // Update stateAsObject
  stateAsObject = applyPatches(stateAsObject, patches)

  // Update `window.state`
  window.state = stateAsObject

  // Update stores
  setStores()

  // Update theme values
  updateTheme(stateAsObject, patches)
}


/**
 * Set initial value of stores and `stateAsObject`
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



