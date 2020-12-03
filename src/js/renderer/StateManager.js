import { writable } from "svelte/store";
import { applyPatches, enablePatches } from "immer"
import { propHasChanged } from "../shared/utils";

enablePatches() // Required by immer

// -------- STORES -------- //

export const state = writable({})
export const project = writable({})
export const sidebar = writable({})

export const files = writable({})
export const tooltip = writable({ 
  status: 'hide', // 'show', 'hide', or 'hideAfterDelay'
  text: '', 
  x: 0, 
  y: 0 
})

export const menu = writable({
  id: undefined,
  isOpen: false,
  isCompact: false,
  buttonType: 'text', // 'text' or 'icon'
  menuType: 'pulldown', // 'pulldown' or 'popup'
  options: [],
  selectedOption: undefined,
  width: 0,
  itemHeight: 0,
  x: 0,
  y: 0,
})

export function openMenu(params) {
  menu.update((m) => { return {...m, ...params}})
}

export function selectMenuOption(option) {
  menu.update((m) => { return {...m, selectedOption: option, isOpen: false}})
}

export function closeMenu() {
  menu.update((m) => { return { ...m, isOpen: false }})
}


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

    // -------- FILES -------- //

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
      filesAsObject = applyPatches(filesAsObject, patches)
      updateFilesStore()
    })

    // -------- STATE -------- //

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      stateAsObject = applyPatches(stateAsObject, patches)
      updateStateStores()
      const osAppearanceHasChanged = propHasChanged(patches, ['appearance', 'os'])
      if (osAppearanceHasChanged) updateAppearance()
    })

    // Set initial values
    stateAsObject = initialState
    updateStateStores()
    updateAppearance()
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

function updateAppearance() {

  const root = document.documentElement
  const themeName = stateAsObject.appearance.theme
  const colors = stateAsObject.appearance.os.colors
  const isDarkMode = stateAsObject.appearance.os.isDarkMode
  // const isHighContrast = stateAsObject.appearance.os.isHighContrast
  // const isInverted = stateAsObject.appearance.os.isInverted
  // const isReducedMotion = stateAsObject.appearance.os.isReducedMotion

  // Set stylesheet href in index.html to new theme's stylesheet.
  // If stylesheet name = 'gambier-light',
  // then stylesheet href = './styles/themes/gambier-light/gambier-light.css'.
  const stylesheet = document.getElementById('theme-stylesheet')
  const href = `./styles/themes/${themeName}/${themeName}.css`
  stylesheet.setAttribute('href', href)

  // Make system colors available app-wide as CSS variables on the root element.
  for (const [varName, rgbaHex] of Object.entries(colors)) {
    root.style.setProperty(`--${varName}`, rgbaHex)
  }

  // Set dark/light mode class on bod
  if (isDarkMode) {
    root.classList.add('darkMode')
    root.classList.remove('lightMode')
  } else {
    root.classList.remove('darkMode')
    root.classList.add('lightMode')
  }
}
