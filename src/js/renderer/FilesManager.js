import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"

enablePatches() // Required by immer

// Svelte store
export const files = writable({})

// Current state as JS object:
// See: StateManager for explaination of how we use this object.
// (StateManager has equivalent, called `stateAsObject`.
let filesAsObject = {}


/**
 * Set Svelte stores from `stateAsObject`.
 */
function setStore() {
  files.set(filesAsObject)
}

export function init(initialFiles) {

  // When we start the app, we try to fetch `files` from main. If case files aren't ready yet (most commmonly on first run, when the user has not yet defined a project directory), this will be skipped, and we'll instead set files when `initialFilesFromMain` is received.

  // During full app reload (main and render process), 
  if (initialFiles) {
    filesAsObject = initialFiles
    setStore()
  }

  // Create listener: Main sends initial `files` when the project's Watcher instance has does its first `mapProject`.
  window.api.receive('initialFilesFromMain', (files) => {
    filesAsObject = files
    setStore()
  })

  // Create listener: Update files when patches arrive from main...
  window.api.receive("filesPatchesFromMain", (patches) => {
    console.log('filesPatchesFromMain')
    filesAsObject = applyPatches(filesAsObject, patches)
    setStore()
  })
}
