import { app, BrowserWindow } from 'electron'
import ElectronStore from 'electron-store'
import { update } from './reducers'

import colors from 'colors'
import deepEql from 'deep-eql'
import { detailedDiff } from 'deep-object-diff'


export class Store extends ElectronStore {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      defaults: storeDefault
      // schema: StoreSchema
    })
  }

  async dispatch(action, windowId = undefined) {

    if (!app.isPackaged) this.logTheAction(action)

    // Get next state
    // const nextState = await reducers(action, windowId)

    const [nextState, patches, inversePatches] = update(store.store, action, windowId)

    // if (!app.isPackaged) this.logTheDiff(global.state(), nextState)

    // Apply nextState to Store
    this.set(nextState)

    // Send patches to render proces
    const windows = BrowserWindow.getAllWindows()
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', patches))
    }
  }

  logTheAction(action) {
    console.log(
      // `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      // `(Store.js)`.green
    )
  }

  // logTheDiff(currentState, nextState) {
  //   const hasChanged = !deepEql(currentState, nextState)
  //   if (hasChanged) {
  //     // const diff = detailedDiff(currentState, nextState)
  //     // console.log(`Changed: ${JSON.stringify(diff, null, 2)}`.yellow)
  //     console.log(`Changed: ${nextState.changed}`.bgBrightGreen.black.bold)
  //   } else {
  //     console.log('No changes'.bgBrightGreen.black.bold)
  //   }
  // }
}

const storeDefault = {

  // ----------- APP ----------- //

  appStatus: 'open',

  // App theme. See Readme.
  appearance: {
    userPref: 'match-system',
    theme: 'gambier-light'
  },

  // ----------- PROJECTS ----------- //

  projects: []

}

export const newProject = {

  window: {
    // Used to associate windows with projects
    id: 0,
    // Used when closing window (to check if it's safe to do so or not)
    status: 'open'
  },

  // User specified directory to folder containing their project files
  directory: '',

  // User specified path to CSL-JSON file containing their citatons
  citations: '',

  focusedLayoutSection: 'sidebar',

  // A copy of the object of the document currently visible in the editor.
  openDoc: {},

  // SideBar
  sidebar: {
    isOpen: true,
    previewIsOpen: true,
    width: 250,
    tabs: [
      {
        title: 'Project', name: 'project',
        active: true,
        lastSelectedItem: {}, // id and type
        selectedItems: [], // Array of ids
        expandedItems: [], // Array of folder ids
      },
      {
        title: 'All Documents', name: 'all-documents',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      },
      {
        title: 'Most Recent', name: 'most-recent',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      },
      {
        title: 'Tags', name: 'tags',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      },
      {
        title: 'Media', name: 'media',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      },
      {
        title: 'Citations', name: 'citations',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      },
      {
        title: 'Search', name: 'search',
        active: false,
        lastSelectedItem: {},
        selectedItems: [],
      }
    ],
  }
}
