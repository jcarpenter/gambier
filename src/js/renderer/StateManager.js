import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"

enablePatches() // Required by immer

// -------- STORES -------- //

export let state = writable({})
export let project = writable({})
export let sidebar = writable({})
export let files = writable({})

// This (seemingly redundant) `stateAsObject` variable is for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
let stateAsObject = {}
let filesAsObject = {}

// -------- SETUP AND UPDATE -------- //

export class StateManager {
  constructor(initialState, initialFiles) {

    // Set `window.id`
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id')

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      stateAsObject = applyPatches(stateAsObject, patches)
      updateStores()
    })

    // Update files when patches arrive from main...
    window.api.receive("filesPatchesFromMain", (patches) => {
      filesAsObject = applyPatches(filesAsObject, patches)
      updateFiles()
    })

    // Set initial value
    stateAsObject = initialState
    filesAsObject = initialFiles
    updateStores()
  }
}

function updateStores() {

  state.set(stateAsObject)
  const proj = stateAsObject.projects.find((p) => p.window.id == window.id)
  project.set(proj)
  sidebar.set(proj.sidebar)

  files.set(filesAsObject)
}

