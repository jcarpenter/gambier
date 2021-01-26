import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"

enablePatches() // Required by immer

export const files = writable({})

// This (seemingly redundant) `filesAsObject` variable is for performance reasons. When we applyPatches(files, patches), we need to pass it the current files. We could get that from `files` writable by using `get(files)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify files. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `filesAsObject`, apply patches to it, and then pass it to files.set(...).

let filesAsObject = {}

// -------- SETUP AND UPDATE -------- //

export class FilesManager {
  constructor(initialFiles) {

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
      console.log('filesPatchesFromMain')
      filesAsObject = applyPatches(filesAsObject, patches)
      updateFilesStore()
    })
  }
}

function updateFilesStore() {
  files.set(filesAsObject)
}