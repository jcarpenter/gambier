import { app, BrowserWindow } from 'electron'
import ElectronStore from 'electron-store'
import { update } from './reducers'

import colors from 'colors'


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

    if (!app.isPackaged) logTheAction(action)

    // Get next state. 
    // `update` function also updates `global.patches`.
    const nextState = update(store.store, action, windowId)

    // Apply next state to Store
    this.set(nextState)

    // Send patches to render proces
    const windows = BrowserWindow.getAllWindows()
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', global.patches))
    }
  }
}

function logTheAction(action) {
  console.log(
    // `Action:`.bgBrightGreen.black,
    `${action.type}`.bgBrightGreen.black.bold,
    // `(Store.js)`.green
  )
}

const storeDefault = {

  // ----------- APP ----------- //

  appStatus: 'open',

  // App theme. See Readme.
  appearance: {
    userPref: 'match-system',
    theme: 'gambier-light',
    os: {
      themeSource: 'system',
      isDarkMode: false,
      isHighContrast: false,
      isInverted: false,
      isReducedMotion: false,
      colors: {
        // System Colors
        systemBlue: [],
        systemBrown: [],
        systemGray: [],
        systemGreen: [],
        systemIndigo: [],
        systemOrange: [],
        systemPink: [],
        systemPurple: [],
        systemRed: [],
        systemTeal: [],
        systemYellow: [],
        // Dynamic System Colors
        alternateSelectedControlTextColor: [],
        controlAccentColor: [],
        controlBackgroundColor: [],
        controlColor: [],
        controlTextColor: [],
        disabledControlTextColor: [],
        findHighlightColor: [],
        gridColor: [],
        headerTextColor: [],
        highlightColor: [],
        keyboardFocusIndicatorColor: [],
        labelColor: [],
        linkColor: [],
        placeholderTextColor: [],
        quaternaryLabelColor: [],
        secondaryLabelColor: [],
        selectedContentBackgroundColor: [],
        selectedControlColor: [],
        selectedControlTextColor: [],
        selectedMenuItemTextColor: [],
        selectedTextBackgroundColor: [],
        selectedTextColor: [],
        separatorColor: [],
        shadowColor: [],
        tertiaryLabelColor: [],
        textBackgroundColor: [],
        textColor: [],
        unemphasizedSelectedContentBackgroundColor: [],
        unemphasizedSelectedTextBackgroundColor: [],
        unemphasizedSelectedTextColor: [],
        windowBackgroundColor: [],
        windowFrameTextColor: [],
      }
    }
  },

  timing: {
    treeListFolder: 300,
  },

  // ----------- PROJECTS ----------- //

  projects: []

}


export const newProject = {

  window: {
    // Used to associate windows with projects
    id: 0,
    // Used when closing window (to check if it's safe to do so or not)
    status: 'open',
    isFocused: false,
    isDraggedOver: false,
    bounds: { x: 0, y: 0, width: 1600, height: 1200 }
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
    isPreviewOpen: true,
    activeTabId: 'project',
    width: 250,
    tabsById: {
      project: {
        title: 'Project',
        lastSelected: {}, // id
        selected: [], // Array of ids
        expanded: [], // Array of folder ids
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      allDocs: {
        title: 'All Documents',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      mostRecent: {
        title: 'Most Recent',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      tags: {
        title: 'Tags',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending',
        selectedTags: []
      },
      media: {
        title: 'Media',
        lastSelected: {},
        selected: [],
        sortBy: 'By Name',
        sortOrder: 'Ascending'
      },
      citations: {
        title: 'Citations',
        lastSelected: {},
        selected: [],
      },
      search: {
        title: 'Search',
        lastSelected: {},
        selected: [],
        options: {
          matchCase: false,
          matchExactPhrase: false,
          lookIn: 'all-folders',
          tags: []
        }
      }
    },
    tabsAll: ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'citations', 'search']
  }
}
