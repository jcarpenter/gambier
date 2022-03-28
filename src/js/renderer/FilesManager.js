import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"

enablePatches() // Required by immer

// Svelte store
export const files = writable({})

// Current state as JS object:
// See: StateManager for explaination of how we use these objects.
// (StateManager has equivalent, called `stateAsObject`.
let filesAsObject = {}
let tagsAsArray = {}


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
    tagsAsArray = getTagsFromFiles()
    // Expose filesAsObject on window
    window.files = filesAsObject
    // Expose tagsAsObject on window
    window.tags = tagsAsArray
    setStore()
  }

  // Create listener: Main sends initial `files` when the project's Watcher instance has does its first `mapProject`.
  window.api.receive('initialFilesFromMain', (files) => {
    filesAsObject = files
    tagsAsArray = getTagsFromFiles()
    window.files = filesAsObject
    window.tags = tagsAsArray
    setStore()
  })

  // Create listener: Update files when patches arrive from main...
  window.api.receive("filesPatchesFromMain", (patches) => {
    filesAsObject = applyPatches(filesAsObject, patches)
    tagsAsArray = getTagsFromFiles()
    window.files = filesAsObject
    window.tags = tagsAsArray
    setStore()
  })

}

/**
 * Iterate through files and extract each unique tag into an 
 * array, and return that array.
 */
function getTagsFromFiles() {

  if (!filesAsObject.byId) return []

  let tags = []

  for (const [id, file] of Object.entries(filesAsObject.byId)) {
    file.tags?.forEach((tag) => {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    })
  }

  // Sort alphabetically
  tags.sort((a, b) => a.localeCompare(b))

  return tags

}