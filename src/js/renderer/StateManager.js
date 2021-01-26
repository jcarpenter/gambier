import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"
import { stateHasChanged, wait } from "../shared/utils";

enablePatches() // Required by immer

// -------- STORES -------- //

export const state = writable({})
export const isWindowFocused = writable(false)
export const project = writable({})
export const sidebar = writable({})


// This (seemingly redundant) `stateAsObject` variable is for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
export let stateAsObject = {}

// -------- SETUP AND UPDATE -------- //

export class StateManager {
  constructor(initialState) {

    // Get and set window paramaters
    // Note: These are only used for normal app windows——not Preferences windows.
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id')

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      
      // Apply patches to state, and update stores
      stateAsObject = applyPatches(stateAsObject, patches)
      updateStateStores()
      
      // Update theme stylesheet
      if (stateHasChanged(patches, 'theme')) {
        setThemeStylesheet()
      }

      // Update `isWindowFocused` store when `focusedWindowId` changes. If it equals this `window.id`, set true. Else, set false.
      const focusedWindowHasChanged = stateHasChanged(patches, ['focusedWindowId'])
      if (focusedWindowHasChanged) {
        if (stateAsObject.focusedWindowId == window.id) {
          isWindowFocused.set(true)
        } else {
          isWindowFocused.set(false)
        }
      }
    })

    // Set initial values
    stateAsObject = initialState
    isWindowFocused.set(stateAsObject.focusedWindowId == window.id)
    updateStateStores()
    setThemeStylesheet()
  }
}

// Listen for window closing, save files, then issue the all-clear to main.
// const windowStatusHasChanged = stateHasChanged(patches, ['window', 'status'])
// if (windowStatusHasChanged) {
//   if (stateAsObject) {
//     const proj = stateAsObject.projects.find((p) => p.window.id == window.id)
//     if (proj.window.status == 'wantsToClose') {
//       // TODO. Save files
//       window.api.send('dispatch', {
//         type: 'CAN_SAFELY_CLOSE_PROJECT_WINDOW',
//       })
//     }
//   }
// }


function updateStateStores() {
  state.set(stateAsObject)
  const proj = stateAsObject.projects.byId[window.id]

  // We use if statement here because `project` and `sidebar` are only relevant
  // to normal app windows——not to a Preferences window.
  if (proj) {
    project.set(proj)
    sidebar.set(proj.sidebar)
  }
}

/**
 * Set stylesheet href in index.html per `theme.editor`
 * If `theme.editor` name is 'solarized', then stylesheet 
 * href is './styles/themes/solarized/solarized.css'.
 */
function setThemeStylesheet() {
  const editorTheme = stateAsObject.theme.editor
  const stylesheet = document.getElementById('editor-theme')
  const href = `./styles/themes/${editorTheme}/${editorTheme}.css`
  stylesheet.setAttribute('href', href)
}
