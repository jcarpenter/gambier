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

    console.log('StateManager: constructor')

    // Set `window.id`
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id')

    // Set initial files. 
    // When we start the app, we try to fetch `files` from main. In case files aren't ready yet (e.g. on project first run the directory is initially undefined), we also create a listener for main process to send the initial files. 
    // During full app reload (main and render process), 
    if (initialFiles) {
      filesAsObject = initialFiles
      updateFilesStore()
    }

    // Main sends initial `files` when the project's Watcher instance has does its first `mapProject`.
    window.api.receive('initialFilesFromMain', (files) => {
      filesAsObject = files
      updateFilesStore()
    })  

    // Update files when patches arrive from main...
    window.api.receive("filesPatchesFromMain", (patches) => {
      console.log('StateManager: filesPatchesFromMain: ', patches)
      filesAsObject = applyPatches(filesAsObject, patches)
      updateFilesStore()
    })

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      stateAsObject = applyPatches(stateAsObject, patches)
      updateStateStores()
    })

    // Set initial state value
    stateAsObject = initialState
    updateStateStores()
  }
}

function updateStateStores() {
  state.set(stateAsObject)
  const proj = stateAsObject.projects.find((p) => p.window.id == window.id)
  project.set(proj)
  sidebar.set(proj.sidebar)
}

function updateFilesStore() {
  files.set(filesAsObject)
}