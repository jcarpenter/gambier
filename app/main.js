'use strict';

var electron = require('electron');
var path = require('path');
var fsExtra = require('fs-extra');
var ElectronStore = require('electron-store');
var produce = require('immer');
var fs = require('fs');
require('colors');
var Database = require('better-sqlite3');
require('deep-eql');
var chokidar = require('chokidar');
var matter = require('gray-matter');
var removeMd = require('remove-markdown');
var sizeOf = require('image-size');
var debounce = require('debounce');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ElectronStore__default = /*#__PURE__*/_interopDefaultLegacy(ElectronStore);
var produce__default = /*#__PURE__*/_interopDefaultLegacy(produce);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var Database__default = /*#__PURE__*/_interopDefaultLegacy(Database);
var chokidar__default = /*#__PURE__*/_interopDefaultLegacy(chokidar);
var matter__default = /*#__PURE__*/_interopDefaultLegacy(matter);
var removeMd__default = /*#__PURE__*/_interopDefaultLegacy(removeMd);
var sizeOf__default = /*#__PURE__*/_interopDefaultLegacy(sizeOf);

produce.enablePatches();

const update = (state, action, windowId) =>
  produce__default['default'](state, (draft) => {

    // Set a few useful, commonly-used variables
    const win = windowId !== undefined ? electron.BrowserWindow.fromId(windowId) : undefined;
    const project = windowId !== undefined ? draft.projects.find((p) => p.window.id == windowId) : undefined;

    switch (action.type) {

      // -------- APP -------- //

      case 'START_COLD_START': {

        // Update appStatus
        draft.appStatus = 'coldStarting';

        // If there are existing projects, check their directories. Prune any that 1) are missing a directory (blank value, or path doesn't exist), or 2) that we don't have write permissions for.
        if (draft.projects.length) {
          draft.projects = draft.projects.filter((project) => {
            if (!project.directory) return false
            try {
              fsExtra.accessSync(project.directory, fs__default['default'].constants.W_OK);
              return true
            } catch(err) {
              return false
            }
          });
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.length) {
          draft.projects.push(createNewProject());
        }

        break
      }

      case 'FINISH_COLD_START': {
        draft.appStatus = 'open';
        break
      }

      case 'START_TO_QUIT': {
        draft.appStatus = 'wantsToQuit';
        break
      }

      case 'CAN_SAFELY_QUIT': {
        draft.appStatus = 'safeToQuit';
        break
      }

      // -------- APPEARANCE & TIMING -------- //

      case 'SAVE_SYSTEM_APPEARANCE_SETTINGS': {
        draft.appearance.os = action.settings;
        break
      }


      // -------- PROJECT/WINDOW: CREATE AND CLOSE -------- //

      case 'CREATE_NEW_PROJECT': {
        draft.projects.push(createNewProject());
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        // Do we have write permissions for the selected directory?
        // If yes, proceed.
        try {
          fsExtra.accessSync(action.directory, fs__default['default'].constants.W_OK);
          project.directory = action.directory;
        } catch(err) {
          console.log(err);
        }
        break
      }

      case 'OPENED_WINDOW': {
        // Update window status
        const project = draft.projects[action.projectIndex];
        project.window.status = 'open';
        project.window.id = windowId;
        break
      }

      case 'START_TO_CLOSE_WINDOW': {
        project.window.status = 'wantsToClose';
        break
      }

      case 'CAN_SAFELY_CLOSE_WINDOW': {
        project.window.status = 'safeToClose';
        break
      }

      case 'REMOVE_PROJECT': {
        const projects = draft.projects.slice(0);
        const indexOfProjectToRemove = projects.findIndex((p) => p.window.id == windowId);
        projects.splice(indexOfProjectToRemove, 1);
        draft.projects = { ...projects };
        break
      }


      // -------- PROJECT -------- //

      // Citations

      case 'SET_PROJECT_CITATIONS_FILE': {
        // Do we have read and write permissions for the selected file?
        // If yes, proceed.
        // See: https://nodejs.org/api/fs.html#fs_fs_accesssync_path_mode
        try {
          fsExtra.accessSync(action.path, fs__default['default'].constants.W_OK);
          project.citations = action.path;
        } catch (err) {
          console.log(err);
        }
        break
      }

      // UI

      case 'SET_LAYOUT_FOCUS': {
        project.focusedLayoutSection = action.section;
        break
      }

      // Window

      // Save window bounds to state, so we can restore later
      case 'SAVE_WINDOW_BOUNDS': {
        project.window.bounds = action.windowBounds;
        break
      }



      // -------- SIDEBAR 2 -------- //

      case 'SELECT_SIDEBAR_TAB_BY_ID': {
        project.sidebar.activeTabId = action.id;
        break
      }

      case 'SELECT_SIDEBAR_TAB_BY_INDEX': {
        project.sidebar.activeTabId = project.sidebar.tabsAll[action.index];
        break
      }

      case 'SIDEBAR_SET_SORTING': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.sortBy = action.sortBy;
        tab.sortOrder = action.sortOrder;
        break
      }

      case 'SIDEBAR_SET_EXPANDED': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.expanded = action.expanded;
        break
      }

      case 'SIDEBAR_SET_SELECTED': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.lastSelected = action.lastSelected;
        tab.selected = action.selected;
        break
      }

      case 'SIDEBAR_SELECT_TAGS': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.selectedTags = action.tags;
        break
      }

      case 'SIDEBAR_SET_SEARCH_PARAMS': {
        const tab = project.sidebar.tabsById.search;
        tab.options = action.options;
        break
      }

      case 'TOGGLE_SIDEBAR_PREVIEW': {
        project.sidebar.isPreviewOpen = !project.sidebar.isPreviewOpen;
        break
      }

    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches;
  });



/**
* Each project needs to store the ID of the window it's associated with. The BrowserWindow hasn't been created yet for this project (that's handled by WindowManager), but we know what ID the window will be: BrowserWindow ids start at 1 and go up. And removed BrowserWindows do not release their IDs back into the available set. So the next BrowserWindow id is always +1 of the highest existing.
*/
function getNextWindowId() {
  const existingWindowIds = electron.BrowserWindow.getAllWindows()
    .map((win) => win.id);
  const nextWindowId = Math.max(existingWindowIds) + 1;
  return nextWindowId
}

/**
 * Insert a new blank project into state.projects array
 */
function createNewProject() {
  const project = { ...newProject };
  project.window.id = getNextWindowId();
  return project
}

class Store extends ElectronStore__default['default'] {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      defaults: storeDefault
      // schema: StoreSchema
    });
  }

  async dispatch(action, windowId = undefined) {

    if (!electron.app.isPackaged) logTheAction(action);

    // Get next state. 
    // `update` function also updates `global.patches`.
    const nextState = update(store.store, action, windowId);

    // Apply next state to Store
    this.set(nextState);

    // Send patches to render proces
    const windows = electron.BrowserWindow.getAllWindows();
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', global.patches));
    }
  }
}

function logTheAction(action) {
  console.log(
    // `Action:`.bgBrightGreen.black,
    `${action.type}`.bgBrightGreen.black.bold,
    // `(Store.js)`.green
  );
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

};


const newProject = {

  window: {
    // Used to associate windows with projects
    id: 0,
    // Used when closing window (to check if it's safe to do so or not)
    status: 'open',
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
};

class AppearanceManager {
  constructor() {

    // Listen for system appearance changes (e.g. when user sets Dark mode in System Preferences). The `nativTheme` API emits 'updated' event: "...when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."

    electron.nativeTheme.on('updated', systemAppearanceChanged);


  }

  startup() {
    systemAppearanceChanged();
  }

}

/**
 * When system appearance changes, save values to state.
 */
function systemAppearanceChanged() {

  const isDarkMode = electron.nativeTheme.shouldUseDarkColors;
  const isHighContrast = electron.nativeTheme.shouldUseHighContrastColors;
  const isInverted = electron.nativeTheme.shouldUseInvertedColorScheme;

  store.dispatch({
    type: 'SAVE_SYSTEM_APPEARANCE_SETTINGS',
    settings: {
      themeSource: electron.nativeTheme.themeSource,
      isDarkMode: isDarkMode,
      isHighContrast: isHighContrast,
      isInverted: isInverted,
      isReducedMotion: electron.systemPreferences.getAnimationSettings().prefersReducedMotion,
      colors: isDarkMode ? getColors(true) : getColors(false)
    }
  });

  // const userPref = store.store.appearance.userPref
  // console.log("main.js: nativeTheme updated")
  // if (userPref == 'match-system') {
  //   store.dispatch({
  //     type: 'SET_APPEARANCE',
  //     theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
  //   })
  // }
}

function getColors(isDarkMode, isHighContrast, isInverted) {

  if (isDarkMode) {
    return {
      // System Colors
      systemBlue: '#0A84FFFF',
      systemBrown: '#AC8E68FF',
      systemGray: '#98989DFF',
      systemGreen: '#32D74BFF',
      systemIndigo: '#5E5CE6FF',
      systemOrange: '#FF9F0AFF',
      systemPink: '#FF375FFF',
      systemPurple: '#BF5AF2FF',
      systemRed: '#FF453AFF',
      systemTeal: '#64D2FFFF',
      systemYellow: '#FFD60AFF',
      // Dynamic System Colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlAccentColor: '#007AFFFF',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      highlightColor: '#B4B4B4FF',
      keyboardFocusIndicatorColor: '#1AA9FF4C',
      labelColor: '#FFFFFFD8',
      linkColor: '#419CFFFF',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedContentBackgroundColor: '#0058D0FF',
      selectedControlColor: '#3F638BFF',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      selectedTextBackgroundColor: '#3F638BFF',
      selectedTextColor: '#FFFFFFFF',
      separatorColor: '#FFFFFF19',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#FFFFFF3F',
      textBackgroundColor: '#1E1E1EFF',
      textColor: '#FFFFFFFF',
      unemphasizedSelectedContentBackgroundColor: '#464646FF',
      unemphasizedSelectedTextBackgroundColor: '#464646FF',
      unemphasizedSelectedTextColor: '#FFFFFFFF',
      windowBackgroundColor: '#323232FF',
      windowFrameTextColor: '#FFFFFFD8',
      // Gambier-specific colors.
      foregroundColor: '255, 255, 255',
      backgroundColor: '0, 0, 0',
      menuMaterialColor: rgbaHexToRgbaCSS('#1E1E1EFF', 0.1)
    }
  } else {
    return {
      //System Colors
      systemBlue: '#007AFFFF',
      systemBrown: '#A2845EFF',
      systemGray: '#8E8E93FF',
      systemGreen: '#28CD41FF',
      systemIndigo: '#5856D6FF',
      systemOrange: '#FF9500FF',
      systemPink: '#FF2D55FF',
      systemPurple: '#AF52DEFF',
      systemRed: '#FF3B30FF',
      systemTeal: '#55BEF0FF',
      systemYellow: '#FFCC00FF',
      // Dynamic System Colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlAccentColor: '#007AFFFF',
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      highlightColor: '#FFFFFFFF',
      keyboardFocusIndicatorColor: '#0067F43F',
      labelColor: '#000000D8',
      linkColor: '#0068DAFF',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedContentBackgroundColor: '#0063E1FF',
      selectedControlColor: '#B3D7FFFF',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      selectedTextBackgroundColor: '#B3D7FFFF',
      selectedTextColor: '#000000FF',
      separatorColor: '#00000019',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#00000042',
      textBackgroundColor: '#FFFFFFFF',
      textColor: '#000000FF',
      unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
      unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
      unemphasizedSelectedTextColor: '#000000FF',
      windowBackgroundColor: '#ECECECFF',
      windowFrameTextColor: '#000000D8',
      // Gambier-specific colors
      foregroundColor: '0, 0, 0',
      backgroundColor: '255, 255, 255',
      // menuMaterialColor: Used in `material-menu` mixin (which simulates the `menu` macOS material), this is `controlBackgroundColor` with low opacity. 
      menuMaterialColor: rgbaHexToRgbaCSS('#FFFFFFFF', 0.9, -5)
    }
  }
}

function rgbaHexToRgbaCSS(hex, alphaOveride, brightnessAdjustment = 0) {
  const r = parseInt(hex.slice(1, 3), 16) + brightnessAdjustment;
  const g = parseInt(hex.slice(3, 5), 16) + brightnessAdjustment;
  const b = parseInt(hex.slice(5, 7), 16) + brightnessAdjustment;
  const a = alphaOveride ? alphaOveride : parseInt(hex.slice(8, 9), 16);

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// // -------- Theme -------- //

/**
 * When OS appearance changes, update app theme to match (dark or light):
 * NOTE: Is also called on startup.
 * Listen for changes to nativeTheme. These are triggered when the OS appearance changes (e.g. when the user modifies "Appearance" in System Preferences > General, on Mac). If the user has selected the "Match System" appearance option in the app, we need to match the new OS appearance. Check the `nativeTheme.shouldUseDarkColors` value, and set the theme accordingly (dark or light).
 * nativeTheme.on('updated'): "Emitted when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."
 */


/**
 * When user modifies "Appearance" setting (e.g in `View` menu), update `nativeTheme`
 */
// store.onDidChange('appearance', () => {
//   setNativeTheme()
// })



// /**
//  * Update `nativeTheme` electron property
//  * Setting `nativeTheme.themeSource` has several effects. E.g. it tells Chrome how to UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
//  * Per: https://www.electronjs.org/docs/api/native-theme
//  */
// export function setNativeTheme() {
//   const userPref = store.store.appearance.userPref
//   switch (userPref) {
//     case 'match-system':
//       nativeTheme.themeSource = 'system'
//       break
//     case 'light':
//       nativeTheme.themeSource = 'light'
//       break
//     case 'dark':
//       nativeTheme.themeSource = 'dark'
//       break
//   }

//   // console.log('setNativeTheme(). nativeTheme.themeSource = ', nativeTheme.themeSource)
//   // console.log('setNativeTheme(). userPref = ', userPref)
//   // console.log('setNativeTheme(). systemPreferences.getAccent   Color() = ', systemPreferences.getAccentColor())
//   // console.log('setNativeTheme(). window-background = ', systemPreferences.getColor('window-background'))
//   // 

//   // Reload (close then open) DevTools to force it to load the new theme. Unfortunately DevTools does not respond to `nativeTheme.themeSource` changes automatically. In Electron, or in Chrome.
//   if (!app.isPackaged && win && win.webContents && win.webContents.isDevToolsOpened()) {
//     win.webContents.closeDevTools()
//     win.webContents.openDevTools()
//   }
// }

// console.log("Hi ------ ")
// console.log(systemPreferences.isDarkMode())
// console.log(systemPreferences.getUserDefault('AppleInterfaceStyle', 'string'))
// console.log(systemPreferences.getUserDefault('AppleAquaColorVariant', 'integer'))
// console.log(systemPreferences.getUserDefault('AppleHighlightColor', 'string'))
// console.log(systemPreferences.getUserDefault('AppleShowScrollBars', 'string'))
// console.log(systemPreferences.getAccentColor())
// console.log(systemPreferences.getSystemColor('blue'))
// console.log(systemPreferences.effectiveAppearance)

class DbManager {
  constructor() {
  }

  init() {

    // Create Database object.
    // Pass ":memory:" as the first argument to create an in-memory db.
    global.db = new Database__default['default'](':memory:', { verbose: console.log });
    const createTable = global.db.prepare('CREATE VIRTUAL TABLE docs USING FTS5(id, name, title, body)');
    createTable.run();
    
    // const insertTest = global.db.prepare('INSERT INTO docs (title, path) VALUES (?, ?)')
    // const info = insertTest.run("My time in Tuscany", "Was mostly unremarkable, to be perfectly honest.")
    // console.log(info.changes)

    // const insert = global.db.prepare('INSERT INTO docs (id, name, title, body) VALUES (?, ?, ?, ?)');

    // const insertMany = global.db.transaction((data) => {
    //   for (const item of data) {
    //     insert.run(item)
    //   }
    // });

    // insertMany([
    //   { title: 'Joey', path: 'docs/joey.md' },
    //   { title: 'Sally', path: 'docs/salley.md' },
    //   { title: 'Junior', path: 'docs/junior.md' },
    // ]);

    // const joey = global.db.prepare('SELECT * FROM docs WHERE title = ?').get('Junior')
    // console.log(joey)

    // const deleteTest = global.db.prepare('DELETE FROM docs WHERE title = ?').run("Sally")
   
    // const getAll = global.db.prepare('SELECT * FROM docs')
    // console.log(getAll.all())
    
    // const updateTest = global.db.prepare('UPDATE docs SET title = ? WHERE title = ?').run('Zelda!', 'Joey')
    
    // console.log(getAll.all())

  }
}

const formats = {
  document: ['.md', '.markdown'],
  image: [
    '.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
  ],
  av: [
    '.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'
  ]
};

function isDoc(fileExtension) {
  return formats.document.includes(fileExtension)
}

function isMedia(fileExtension) {
  const isImage = formats.image.includes(fileExtension);
  const isAV = formats.av.includes(fileExtension);
  return isImage || isAV
}

function getMediaType(fileExtension) {
  const isImage = formats.image.includes(fileExtension);
  const isAV = formats.av.includes(fileExtension);
  if (isImage) {
    return 'img'
  } else if (isAV) {
    return 'av'
  } else {
    console.error('File extension does not match supported media types');
  }
}

function findInTree (tree, value, key = 'id', reverse = false) {
  const stack = [ tree[0] ];
  while (stack.length) {
    const node = stack[reverse ? 'pop' : 'shift']();
    if (node[key] === value) return node
    node.children && stack.push(...node.children);
  }
  return null
}

function extractKeysFromString(keyAsString) {
	// Convert propAddress string to array of keys
  // Before: "projects[5].window"
  // After: ["projects", 5, "window"]
  const regex = /[^\.\[\]]+?(?=\.|\[|\]|$)/g;
  const keys = keyAsString.match(regex);
  if (keys && keys.length) {
    keys.forEach((p, index, thisArray) => {
      // Find strings that are just integers, and convert to integers
      if (/\d/.test(p)) {
        thisArray[index] = parseInt(p, 10);
      }
    });
  }
  return keys
}

/**
 * Check Immer patches to see if a property has changed, and (optionally) if it equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
function propHasChanged(patches, props, toValue = '') {
	return patches.some((patch) => {

  	const pathAsString = patch.path.toString();
		const checkMultipleProps = Array.isArray(props);

		const hasChanged = checkMultipleProps ?
    	props.every((key) => pathAsString.includes(key)) :
      pathAsString.includes(props);
    
    // If optional 'toValue' argument is specified, check it.
    // Else, only check `hasChanged`
    if (toValue) {
      const equalsValue = patch.value == toValue;
      return hasChanged && equalsValue
    } else {
      return hasChanged
    }
  })
}




const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
};

function hasChangedTo(keysAsString, value, objTo, objFrom) {
  if (!keysAsString || !value ) {
    // If either required arguments are missing or empty, return undefined
    return undefined
  } else {
    const keys = extractKeysFromString(keysAsString);
    const objToVal = getNestedObject(objTo, keys);
    const objFromVal = getNestedObject(objFrom, keys);
    if (typeof objToVal == 'object' || typeof objFromVal == 'object') {
      // If either value is an object, return undefined.
      // For now, we don't allow checking against objects.
      return undefined
    } else if (objToVal === objFromVal) {
      // If no change, return false
      return false
    } else {
      // Else, check if objTo equals value
      return objToVal === value
    }
  }
}

/**
 * For specified path, return document details
 */
async function mapDocument (filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await fsExtra.stat(filepath);

	const doc = {
		type: 'doc',
		name: '',
		path: filepath,
		id: `doc-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Doc-specific --- //
		title: '',
		excerpt: '',
		tags: [],
	};	

	// Get front matter
	const gm = matter__default['default'].read(filepath);

	// Set excerpt
	// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
	doc.excerpt = getExcerpt(gm.content);

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	const hasFrontMatter = !gm.isEmpty;
	if (hasFrontMatter) {
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		doc.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : [];
	}

	// Set title, if present. E.g. "Sea Level Rise"
	doc.title = getTitle(gm, path__default['default'].basename(filepath));

	// Set name from filename (minus file extension)
	doc.name = path__default['default'].basename(filepath);
	doc.name = doc.name.slice(0, doc.name.lastIndexOf('.'));

	return doc

	// if (oldVersion !== undefined) {
	//   const lhs = Object.assign({}, oldVersion)
	//   const rhs = file
	//   diff.observableDiff(lhs, rhs, (d) => {
	//     if (d.kind !== 'D') {
	//       diff.applyChange(lhs, rhs, d)
	//     }
	//   })
	//   return lhs
	// } else {
	// }
}

/**
 * Set title, in following order of preference:
 * 1. From first h1 in content
 * 2. From `title` field of front matter
 * 3. Leave blank (means no title was found)
 */
function getTitle(graymatter, filename) {

	let titleFromH1 = graymatter.content.match(/^# (.*)$/m);
	if (titleFromH1) {
		return titleFromH1[1]
	} else if (graymatter.data.hasOwnProperty('title')) {
		return graymatter.data.title
	} else {
		return ''
		// return filename.slice(0, filename.lastIndexOf('.'))
	}
}

/**
 * Return excerpt from content, stripped of markdown characters.
 * Per: https://github.com/jonschlinkert/gray-matter#optionsexcerpt
 * @param {*} file 
 */
function getExcerpt(content) {

	// Remove h1, if it exists. Then trim to 200 characters.
	let excerpt = content
		.replace(/^# (.*)\n/gm, '')
		.substring(0, 600);

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	excerpt = removeMd__default['default'](excerpt)
		.replace(/^> /gm, '')         // Block quotes
		.replace(/^\n/gm, '')         // New lines at start of line (usually doc)
		.replace(/\n/gm, ' ')         // New lines in-line (replace with spaces)
		.replace(/\t/gm, ' ')         // Artifact left from list replacement
		.replace(/\[@.*?\]/gm, '')    // Citations
		.replace(/:::.*?:::/gm, ' ')  // Bracketed spans
		.replace(/\s{2,}/gm, ' ')     // Extra spaces
		.substring(0, 450);            // Trim to 200 characters

	return excerpt
}

/**
 * For specified path, return document details
 */
async function mapMedia (filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await fsExtra.stat(filepath);
	const extension = path__default['default'].extname(filepath);
	const type = getMediaType(extension);
	const { width, height, type: format } = sizeOf__default['default'](filepath);

	return {
		type: type,
		name: path__default['default'].basename(filepath),
		path: filepath,
		id: `${type}-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Media-specific --- //
		format: format,
		sizeInBytes: stats.size,
		dimensions: { width: width, height: height },
	}
}

// import colors from 'colors'


/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} files - Reference to shared object we write changes to, and then return
 * @param {*} parentTreeItem - Tree item to add self to
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} nestDepth - Optional.
 */
async function mapFolder(files, parentTreeItem, folderPath, stats = undefined, parentId = '', nestDepth = 0) {

  // -------- New Folder -------- //

  if (!stats) stats = await fsExtra.stat(folderPath);

  // Create and populate new folder
  const folder = {
    type: 'folder',
    name: folderPath.substring(folderPath.lastIndexOf('/') + 1),
    path: folderPath,
    id: `folder-${stats.ino}`,
    parentId: parentId,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    nestDepth: nestDepth,
    // --- Folder-specific --- //
    numChildren: 0,
    numDescendants: 0,
  };

  // Add to `files`
  files.byId[folder.id] = folder;
  files.allIds.push(folder.id);

  // Populate tree details
  const treeItem = {
    id: folder.id,
    parentId: parentId,
    children: []
  };
  parentTreeItem.push(treeItem);


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of `fs.Dirent` objects.
  // https://nodejs.org/api/fs.html#fs_class_fs_dirent
  const directoryContents = await fsExtra.readdir(folderPath, { withFileTypes: true });

  await Promise.all(
    directoryContents.map(async (f) => {

      // Get path by combining folderPath with file name.
      const filepath = path__default['default'].join(folderPath, f.name);

      // Get extension
      const ext = path__default['default'].extname(f.name);

      if (f.isDirectory()) {

        const { numDescendants } = await mapFolder(files, treeItem.children, filepath, undefined, folder.id, nestDepth + 1);

        // Increment child counters
        folder.numChildren++;
        folder.numDescendants += numDescendants;

      } else if (isDoc(ext) || isMedia(ext)) {

        const file = isDoc(ext) ? 
          await mapDocument(filepath, folder.id, nestDepth + 1) : 
          await mapMedia(filepath, folder.id, nestDepth + 1);

        files.byId[file.id] = file;
        files.allIds.push(file.id);
        treeItem.children.push({
          id: file.id,
          parentId: folder.id,
        });

        // Increment child counters
        folder.numChildren++;
      }
    })
  );

  folder.numDescendants += folder.numChildren;

  return {
    numDescendants: folder.numDescendants
  }
}

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
async function mapProject (projectPath) {

  try {

    const files = {
      tree: [],
      byId: {},
      allIds: []
    };

    // Map project path, recursively
    await mapFolder(files, files.tree, projectPath);
    
    return files
    
    // console.log(JSON.stringify(files, null, 2))

  } catch (err) {
    console.log(err);
  }
}

produce.enablePatches();

class Watcher {
  constructor(project) {
    this.id = project.window.id;
    this.directory = project.directory;
    this.files = {};

    // Start listening for directory value changes. Once user selects a project directory (e.g. in the first run experience), catch it 

    // Create listener for directory changes
    global.store.onDidAnyChange((state, oldState) => {

      const directory = state.projects.find((p) => p.window.id == this.id).directory;
      const directoryIsDefined = directory !== '';
      const directoryWasEmpty = this.directory == '';
      const directoryHasChanged = directory !== this.directory;

      if (directoryIsDefined) {
        if (directoryWasEmpty) {
          this.directory = directory;
          this.start();
        } else if (directoryHasChanged) {
          this.update();
        }
      }
    });

    if (this.directory) {
      this.start();
    }
  }

  chokidarInstance = undefined
  changes = []
  changeTimer = undefined
  directory = ''
  files = {}
  id = 0

  async start() {
    
    const stmt = global.db.prepare('INSERT INTO docs (id, name, title, body) VALUES (?, ?, ?, ?)');

    this.files = await mapProject(this.directory);
    // console.log(JSON.stringify(this.files.tree, null, 2))
    // Start watcher
    this.chokidarInstance = chokidar__default['default'].watch(this.directory, chokidarConfig);

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.batchChanges('change', filePath))
      .on('add', (filePath) => this.batchChanges('add', filePath))
      .on('unlink', (filePath) => this.batchChanges('unlink', filePath))
      .on('addDir', (filePath) => this.batchChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.batchChanges('unlinkDir', filePath));

    // Send initial files to browser window
    const win = electron.BrowserWindow.fromId(this.id);
    win.webContents.send('initialFilesFromMain', this.files);

    // Index files into DB
    this.files.allIds.forEach((id) => {
      const file = this.files.byId[id];
      if (file.type == 'doc') {
        stmt.run(id, file.name, file.title, file.excerpt);
      }
    });

    const getAll = global.db.prepare('SELECT * FROM docs');
    console.log(getAll.all());
  }

  stop() {
    // await watcher.close()

  }

  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them. We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  batchChanges(event, filePath, stats) {
    const change = { event: event, path: filePath };

    if (stats) change.stats = stats;
    // console.log(event)

    // Make the timer longer if `addDir` event comes through. 
    // If it's too quick, subsequent `add` events are not caught by the timer.
    const timerDuration = event == 'addDir' ? 500 : 100;

    // Start a new timer if one is not already active.
    // Or refresh a timer already in progress.
    if (this.changeTimer == undefined || !this.changeTimer.hasRef()) {
      this.changes = [change];
      this.changeTimer = setTimeout(() => this.applyChanges(this.changes), timerDuration);
    } else {
      this.changes.push(change);
      this.changeTimer.refresh();
    }
  }

  /**
   * Take batched changes and update `files`, then send patches to associated BrowserWindow.
   * @param {*} changes 
   */
  async applyChanges(changes) {

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir');

    if (directoryWasAddedOrRemoved) {
      this.files = await mapProject(this.directory);
    } else {
      this.files = await produce__default['default'](this.files, async (draft) => {
        for (const c of changes) {
          const ext = path__default['default'].extname(c.path);
          const parentPath = path__default['default'].dirname(c.path);
          const parentFolder = getFileByPath(draft, parentPath);
          const parentTreeItem = findInTree(draft.tree, parentFolder.id, 'id');

          if (isDoc(ext) || isMedia(ext)) {

            switch (c.event) {
              case 'add': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                // Add to `byId`, `allIds`, and parent's children.
                draft.byId[file.id] = file;
                draft.allIds.push(file.id);
                parentTreeItem.children.push({
                  id: file.id,
                  parentId: file.parentId,
                  type: file.type
                });
                break
              }
              case 'change': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                draft.byId[file.id] = file;
                break
              }
              case 'unlink': {
                const file = getFileByPath(draft, c.path);
                // Remove from `byId`, `allIds`, and parent's children.
                delete draft.byId[file.id];
                draft.allIds.splice(file.index, nnpm1);
                const indexInChildren = parentTreeItem.children.findIndex((child) => child.id == file.id);
                parentTreeItem.children.splice(indexInChildren, 1);
                break
              }
            }
          }
        }
      }, (patches, inversePatches) => {
        const win = electron.BrowserWindow.fromId(this.id);
        console.log(patches);
        win.webContents.send('filesPatchesFromMain', patches);
      });
    }
  }
}

/**
 * Utility function for getting objects (folders, docs, or media), from `files` by path.
 * @param {*} lookIn - `files.folders`, `files.docs`, or `files.media`
 * @param {*} path 
 */
function getFileByPath(lookIn, path) {
  let file = {};
  lookIn.allIds.find((id, index) => {
    if (lookIn.byId[id].path == path) {
      file = {
        id: id,
        nestDepth: lookIn.byId[id].nestDepth,
        index: index,
      };
      return true
    }
  });
  return file
}

/**
 * Chokidar docs: https://www.npmjs.com/package/chokidar
 */
const chokidarConfig = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 400,
    pollInterval: 200
  }
};

// -------- DISK MANAGER -------- //


class DiskManager {
	constructor() {

		// Listen for state changes
		/*
			- Is it cold start?
				- If yes, try to 
			- Has a directory changed?
				- If yes, for that project, does a Watcher already exist?
					- If yes, update the Watcher.
						- TODO
				- If no, is the new directory path valid?
					- If yes, create Watcher and pass in project
					- If no, do nothing
		*/
		global.store.onDidAnyChange((state, oldState) => {
			
			if (state.appStatus !== 'open') return
			// const isColdStart = hasChangedTo('appStatus', 'coldStarting', state, oldState)
			// const isColdStart = propHasChanged(global.patches, ['appStatus', 'coldStarting'])
			const projectDirectoryChanged = propHasChanged(global.patches, ['projects', 'directory']);
			const projectAdded = state.projects.length > oldState.projects.length;
			const projectRemoved = state.projects.length < oldState.projects.length;

			// if (isColdStart) {

			// 	// For each project with a valid directory, create a watcher
			// 	state.projects.forEach((project) => {
			// 		if (project.directory) {
			// 			// Create Watcher and add to `watchers` array
			// 			const watcher = new Watcher(project)
			// 			this.watchers.push(watcher)
			// 		}
			// 	})
			// } else 
			// if (projectDirectoryChanged) {

			// 	// Create array of projects whose directories have changed
			// 	// First filter patches to those with directory changes
			// 	// Then get the associated projects from `state.projects`
			// 	const projectsWithNewDirectories = global.patches.filter((patch) => {
			// 		const pathAsString = patch.path.toString()
			// 		const dirHasChanged =
			// 			pathAsString.includes('projects') &&
			// 			pathAsString.includes('directory')
			// 		return dirHasChanged
			// 	}).map((patch) => {
			// 		// Format of patch path will be:
			// 		// `path: [ 'projects', 0, 'directory' ],`
			// 		// The project index is the integer (always second value).
			// 		const projectIndex = patch.path[1] //
			// 		const project = state.projects[projectIndex]
			// 		return project
			// 	})

			// 	projectsWithNewDirectories.forEach((project) => {
			// 		// Does corresponding watcher exist?
			// 		const watcher = global.watchers.find(({ id }) => id == project.id)

			// 		// If yes, update it. Else, create one.
			// 		if (watcher) {
			// 			console.log("TODO: Update watcher!!")
			// 		} else {
			// 			const watcher = new Watcher(project)
			// 			this.watchers.push(watcher)
			// 		}
			// 	})

			// } else if (projectAdded) {
			// 	// Get new project. Then create Watcher and add to `watchers` array
			// 	const project = state.projects[state.projects.length - 1]
			// 	const watcher = new Watcher(project)
			// 	this.watchers.push(watcher)
			// } else if (projectRemoved) {
			// 	// Remove the matching watcher. Do so by comparing projects and watchers. Find the watcher who does not have a corresponding project, by comparing IDs, then remove it.
			// }
		});
	}

	// Array of Watcher instances.
	watchers = []

	/**
	 * On startup, create a Watcher instance for each project. 
	 * If a project does not have a valid directory, the watcher will watch for 
	 * changes, and start itself when a directory is assigned.
	 */
	async startup() {
		for (const project of global.state().projects) {

			// Create Watcher and add to `watchers` array
			const watcher = new Watcher(project);
			this.watchers.push(watcher);
		}
	}
}

async function deleteFile(path) {
  try {
		await fsExtra.remove(path);
		return { type: 'DELETE_FILE_SUCCESS', path: path }
	} catch(err) {
		return { type: 'DELETE_FILE_FAIL', err: err }
	}
}

async function deleteFiles(paths) {
  try {
    let deletedPaths = await Promise.all(
      paths.map(async (path) => {
        await fsExtra.remove(path);
      })
    );
		return { type: 'DELETE_FILES_SUCCESS', paths: deletedPaths }
	} catch(err) {
		return { type: 'DELETE_FILES_FAIL', err: err }
	}
}

async function saveFile (path, data) {
	try {
		await fsExtra.writeFile(path, data, 'utf8');
		return {
			type: 'SAVE_FILE_SUCCESS',
			path: path,
		}
	} catch (err) {
		return {
			type: 'SAVE_FILE_FAIL',
			err: err
		}
	}
}

async function selectProjectDirectoryFromDialog () {

  const win = electron.BrowserWindow.getFocusedWindow();

  const selection = await electron.dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (!selection.canceled) {
    return { 
      type: 'SET_PROJECT_DIRECTORY', 
      directory: selection.filePaths[0] 
    }
  }
}

async function selectCitationsFileFromDialog () {

  const win = electron.BrowserWindow.getFocusedWindow();

  const selection = await electron.dialog.showOpenDialog(win, {
    title: 'Select Citations File',
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ]
  });

  if (!selection.canceled) {
    return { 
      type: 'SET_PROJECT_CITATIONS_FILE', 
      path: selection.filePaths[0] 
    }
  }
}

class IpcManager {
  constructor() {

    // -------- IPC: Renderer "receives" from Main -------- //

    // On change, send updated state to renderer (each BrowserWindow)
    // global.store.onDidAnyChange(async (state, oldState) => {
    //   const windows = BrowserWindow.getAllWindows()
    //   if (windows.length) {
    //     windows.forEach((win) => win.webContents.send(' ', state, oldState))
    //   }
    // })

    // -------- IPC: Renderer "sends" to Main -------- //

    electron.ipcMain.on('showWindow', (evt) => {
      const win = electron.BrowserWindow.fromWebContents(evt.sender);
      win.show();
    });

    electron.ipcMain.on('safelyCloseWindow', async (evt) => {
      const win = electron.BrowserWindow.fromWebContents(evt.sender);
      if (!global.state().areQuiting) {
        await global.store.dispatch({
          type: 'REMOVE_PROJECT'
        }, win.id);
      }
      win.destroy();
    });

    electron.ipcMain.on('dispatch', async (evt, action) => {
      const win = electron.BrowserWindow.fromWebContents(evt.sender);
      switch (action.type) {
        case ('SELECT_CITATIONS_FILE_FROM_DIALOG'):
          store.dispatch(await selectCitationsFileFromDialog(), win.id);
          break
        case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
          store.dispatch(await selectProjectDirectoryFromDialog(), win.id);
          break
        case ('SAVE_FILE'):
          store.dispatch(await saveFile(action.path, action.data), win.id);
          break
        case ('DELETE_FILE'):
          store.dispatch(await deleteFile(action.path), win.id);
          break
        case ('DELETE_FILES'):
          store.dispatch(await deleteFiles(action.paths), win.id);
          break
        default:
          store.dispatch(action, win.id);
          break
      }
    });

    // -------- IPC: Invoke -------- //

    electron.ipcMain.handle('queryDb', (evt, params) => {
      const { query } = params;
      const results = global.db.prepare(`
        SELECT highlight(docs, 2, '<b>', '</b>') title,
               highlight(docs, 3, '<b>', '</b>') body,
               id
        FROM docs 
        WHERE docs MATCH ? 
        ORDER BY rank`
      ).all(query);
      return results
    });

    electron.ipcMain.handle('getState', (evt) => {
      return global.state()
    });

    electron.ipcMain.handle('getFiles', (evt) => {
      const win = electron.BrowserWindow.fromWebContents(evt.sender);
      const watcher = global.watchers.find((watcher) => watcher.id == win.id);
      return watcher ? watcher.files : undefined
    });
  }
}



// -------- IPC: Renderer "sends" to Main -------- //


// // ipcMain.on('saveProjectStateToDisk', (evt, state) => {
// //   const win = BrowserWindow.fromWebContents(evt.sender)
// //   const projects = store.store.projects.slice(0)
// //   const indexOfProjectToUpdate = projects.findIndex((p) => p.windowId == state.windowId)
// //   projects[indexOfProjectToUpdate] = state
// //   store.set('projects', projects)
// // })

// // ipcMain.on('saveFileThenCloseWindow', async (event, path, data) => {
// //   await writeFile(path, data, 'utf8')
// //   canCloseWindowSafely = true
// //   win.close()
// // })

// // ipcMain.on('saveFileThenQuitApp', async (event, path, data) => {
// //   await writeFile(path, data, 'utf8')
// //   canQuitAppSafely = true
// //   app.quit()
// // })

// // ipcMain.on('openUrlInDefaultBrowser', (event, url) => {
// //   shell.openExternal(url)
// // })



// // // -------- IPC: Invoke -------- //

// // ipcMain.handle('getSystemColors', () => {

// //   // Get accent color, chop off last two characters (always `ff`, for 100% alpha), and prepend `#`.
// //   // `0a5fffff` --> `#0a5fff`
// //   let controlAccentColor = `#${systemPreferences.getAccentColor().slice(0, -2)}`

// //   const systemColors = [

// //     // -------------- System Colors -------------- //
// //     // Note: Indigo and Teal exist in NSColor, but do not seem to be supported by Electron.

// //     { name: 'systemBlue', color: systemPreferences.getSystemColor('blue') },
// //     { name: 'systemBrown', color: systemPreferences.getSystemColor('brown') },
// //     { name: 'systemGray', color: systemPreferences.getSystemColor('gray') },
// //     { name: 'systemGreen', color: systemPreferences.getSystemColor('green') },
// //     // { name: 'systemIndigo', color: systemPreferences.getSystemColor('systemIndigo')},
// //     { name: 'systemOrange', color: systemPreferences.getSystemColor('orange') },
// //     { name: 'systemPink', color: systemPreferences.getSystemColor('pink') },
// //     { name: 'systemPurple', color: systemPreferences.getSystemColor('purple') },
// //     { name: 'systemRed', color: systemPreferences.getSystemColor('red') },
// //     // { name: 'systemTeal', color: systemPreferences.getSystemColor('teal')},
// //     { name: 'systemYellow', color: systemPreferences.getSystemColor('yellow') },

// //     // -------------- Label Colors -------------- //

// //     { name: 'labelColor', color: systemPreferences.getColor('label') },
// //     { name: 'secondaryLabelColor', color: systemPreferences.getColor('secondary-label') },
// //     { name: 'tertiaryLabelColor', color: systemPreferences.getColor('tertiary-label') },
// //     { name: 'quaternaryLabelColor', color: systemPreferences.getColor('quaternary-label') },

// //     // -------------- Text Colors -------------- //

// //     { name: 'textColor', color: systemPreferences.getColor('text') },
// //     { name: 'placeholderTextColor', color: systemPreferences.getColor('placeholder-text') },
// //     { name: 'selectedTextColor', color: systemPreferences.getColor('selected-text') },
// //     { name: 'textBackgroundColor', color: systemPreferences.getColor('text-background') },
// //     { name: 'selectedTextBackgroundColor', color: systemPreferences.getColor('selected-text-background') },
// //     { name: 'keyboardFocusIndicatorColor', color: systemPreferences.getColor('keyboard-focus-indicator') },
// //     { name: 'unemphasizedSelectedTextColor', color: systemPreferences.getColor('unemphasized-selected-text') },
// //     { name: 'unemphasizedSelectedTextBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-text-background') },

// //     // -------------- Content Colors -------------- //

// //     { name: 'linkColor', color: systemPreferences.getColor('link') },
// //     { name: 'separatorColor', color: systemPreferences.getColor('separator') },
// //     { name: 'selectedContentBackgroundColor', color: systemPreferences.getColor('selected-content-background') },
// //     { name: 'unemphasizedSelectedContentBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-content-background') },

// //     // -------------- Menu Colors -------------- //

// //     { name: 'selectedMenuItemTextColor', color: systemPreferences.getColor('selected-menu-item-text') },

// //     // -------------- Table Colors -------------- //

// //     { name: 'gridColor', color: systemPreferences.getColor('grid') },
// //     { name: 'headerTextColor', color: systemPreferences.getColor('header-text') },

// //     // -------------- Control Colors -------------- //

// //     { name: 'controlAccentColor', color: controlAccentColor },
// //     { name: 'controlColor', color: systemPreferences.getColor('control') },
// //     { name: 'controlBackgroundColor', color: systemPreferences.getColor('control-background') },
// //     { name: 'controlTextColor', color: systemPreferences.getColor('control-text') },
// //     { name: 'disabledControlTextColor', color: systemPreferences.getColor('disabled-control-text') },
// //     { name: 'selectedControlColor', color: systemPreferences.getColor('selected-control') },
// //     { name: 'selectedControlTextColor', color: systemPreferences.getColor('selected-control-text') },
// //     { name: 'alternateSelectedControlTextColor', color: systemPreferences.getColor('alternate-selected-control-text') },

// //     // -------------- Window Colors -------------- //

// //     { name: 'windowBackgroundColor', color: systemPreferences.getColor('window-background') },
// //     { name: 'windowFrameTextColor', color: systemPreferences.getColor('window-frame-text') },

// //     // -------------- Highlight & Shadow Colors -------------- //

// //     { name: 'findHighlightColor', color: systemPreferences.getColor('find-highlight') },
// //     { name: 'highlightColor', color: systemPreferences.getColor('highlight') },
// //     { name: 'shadowColor', color: systemPreferences.getColor('shadow') },
// //   ]

// //   return systemColors
// // })


// // ipcMain.handle('getValidatedPathOrURL', async (event, docPath, pathToCheck) => {
// //   // return path.resolve(basePath, filepath)

// //   /*
// //   Element: Image, link, backlink, link reference definition
// //   File type: directory, html, png|jpg|gif, md|mmd|markdown
// //   */

// //   // console.log('- - - - - -')
// //   // console.log(pathToCheck.match(/.{0,2}\//))
// //   const directory = path.parse(docPath).dir
// //   const resolvedPath = path.resolve(directory, pathToCheck)

// //   const docPathExists = await pathExists(docPath)
// //   const pathToCheckExists = await pathExists(pathToCheck)
// //   const resolvedPathExists = await pathExists(resolvedPath)

// //   // console.log('docPath: ', docPath)
// //   // console.log('pathToCheck: ', pathToCheck)
// //   // console.log('resolvedPath: ', resolvedPath)
// //   // console.log(docPathExists, pathToCheckExists, resolvedPathExists)

// //   // if (pathToCheck.match(/.{0,2}\//)) {
// //   //   console.log()
// //   // }
// // })

// // ipcMain.handle('getResolvedPath', async (event, basePath, filepath) => {
// //   return path.resolve(basePath, filepath)
// // })

// // ipcMain.handle('getParsedPath', async (event, filepath) => {
// //   return path.parse(filepath)
// // })

// // ipcMain.handle('ifPathExists', async (event, filepath) => {
// //   const exists = await pathExists(filepath)
// //   return { path: filepath, exists: exists }
// // })



// // ipcMain.handle('getState', async (event) => {
// //   return store.store
// // })

// // ipcMain.handle('getCitations', (event) => {
// //   return projectCitations.getCitations()
// // })

// // ipcMain.handle('getFileByPath', async (event, filePath, encoding) => {

// //   // Load file and return
// //   let file = await readFile(filePath, encoding)
// //   return file
// // })

// // ipcMain.handle('getFileById', async (event, id, encoding) => {

// //   // Get path of file with matching id
// //   const filePath = store.store.contents.find((f) => f.id == id).path

// //   // Load file and return
// //   let file = await readFile(filePath, encoding)
// //   return file
// // })

// // ipcMain.handle('pathJoin', async (event, path1, path2) => {
// //   return path.join(path1, path2)
// // })

// // ipcMain.handle('getHTMLFromClipboard', (event) => {
// //   return clipboard.readHTML()
// // })

// // ipcMain.handle('getFormatOfClipboard', (event) => {
// //   return clipboard.availableFormats()
// // })

class MenuBarManager {
  constructor() {

    this.isMac = process.platform === 'darwin';
    this.menuItems = {};

    // Listen for state changes
    global.store.onDidAnyChange((state, oldState) => {
      // if (state.changed.includes('')) {

      // }
    });

    // Set initial menu bar
    this.setMenuBar();
  }

  setMenuBar() {
    electron.Menu.setApplicationMenu(this.getMenu());
  }

  update() {
    // TODO
  }

  getMenu() {
    const menu = new electron.Menu();
    this.menuItems = this.getMenuItems();
    this.menuItems.topLevel.forEach((item) => menu.append(item));
    return menu
  }

  getMenuItems() {
    const items = { topLevel: [] }; // reset
    const _______________ = new electron.MenuItem({ type: 'separator' });

    // -------- App (Mac-only) -------- //

    if (this.isMac) {
      items.topLevel.push(new electron.MenuItem({
        label: electron.app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }));
    }

    // -------- File (Mac-only) -------- //

    if (this.isMac) {

      items.newDocument = new electron.MenuItem({
        label: 'New Document',
        accelerator: 'CmdOrCtrl+N',
        async click(item, focusedWindow) {
          // global.store.dispatch(await newFile(state))
        }
      });

      items.newWindow = new electron.MenuItem({
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        async click(item, focusedWindow) {
          global.store.dispatch({ type: 'CREATE_NEW_PROJECT' });
        }
      });

      items.save = new electron.MenuItem({
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click(item, focusedWindow) {
          // focusedWindow.webContents.send('mainRequestsSaveFile')
        }
      });

      items.moveToTrash = new electron.MenuItem({
        label: 'Move to Trash',
        accelerator: 'CmdOrCtrl+Backspace',
        enabled: state.focusedLayoutSection == 'navigation',
        click(item, focusedWindow) {  
          // focusedWindow.webContents.send('mainRequestsDeleteFile')
        }
      });

      items.topLevel.push(new electron.MenuItem({
        label: 'File',
        submenu: [
          items.newDocument,
          items.newWindow,
          _______________,
          items.save,
          items.moveToTrash
        ]
      }));
    }

    return items
  }
}

class WindowManager {

  constructor() {

    // Listen for state changes
    global.store.onDidAnyChange((state, oldState) => {
      if (state.appStatus !== 'open') return
      if (state.projects.length > oldState.projects.length) {
        const newProjectIndex = state.projects.length - 1;
        const newProject = state.projects[newProjectIndex];
        this.createWindow(newProjectIndex, newProject);
      }
      // const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState)
      // if (isStartingUp) {
      //   state.projects.forEach(async (p, index) => {
      //     this.createWindow(index, p.window.bounds)
      //   })
      // } else if (state.projects.length > oldState.projects.length) {
      //   this.createWindow(state.projects.length - 1)
      // }
    });
  }

  /**
   * On startup, create a BrowserWindow for each project.
   */
  async startup() {
    let index = 0;
    for (const project of global.state().projects) {
      await this.createWindow(index, project);
      index++;
    }
  }

  async createWindow(projectIndex, project) {

    const win = new electron.BrowserWindow(browserWindowConfig);
    const isFirstRun = project.directory == '';

    // Set size. If project directory is empty, it's first run, and we set window centered, and filling most of the primary screen. Else we restore the previous window size and position (stored in `bounds` property)/
    // Else, create a new window centered on screen.
    if (isFirstRun) {
      const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
      const padding = 200;
      win.setBounds({
        x: padding,
        y: padding,
        width: width - padding * 2,
        height: height - padding * 2
      }, false);
    } else {
      win.setBounds(project.window.bounds, false);
    }

    // Load index.html
    await win.loadFile(path__default['default'].join(__dirname, 'index.html'), {
      query: {
        id: win.id
      },
    });

    // Have to manually set this to 1.0. That should be the default, but I've had problem where something was setting it to 0.91, resulting in the UI being slightly too-small.
    win.webContents.zoomFactor = 1.0;

    // Listen for close action. Is triggered by pressing close button on window, or close menu item, or app quit. Prevent default, and update state.
    win.on('close', async (evt) => {
      const state = global.state();
      const project = state.projects.find((p) => p.window.id == win.id);

      switch (project.window.status) {
        case 'open':
          evt.preventDefault();
          await global.store.dispatch({ type: 'START_TO_CLOSE_WINDOW' }, win.id);
          break
        case 'safeToClose':
          // Remove project from `state.projects` if window closing was NOT triggered by app quiting. When quiting, the user expects the project to still be there when the app is re-opened. 
          const shouldRemoveProject = state.appStatus !== 'wantsToQuit';
          if (shouldRemoveProject) {
            global.store.dispatch({ type: 'REMOVE_PROJECT' }, win.id);
          }
          break
      }
    });

    // On resize or move, save bounds to state (wait 1 second to avoid unnecessary spamming)
    // Using `debounce` package: https://www.npmjs.com/package/debounce
    win.on('resize', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));
    win.on('move', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));

    // Listen for app quiting, and start to close window
    global.store.onDidAnyChange(async (state, oldState) => {
      const appWantsToQuit = hasChangedTo('appStatus', 'wantsToQuit', state, oldState);
      if (appWantsToQuit) {
        await global.store.dispatch({ type: 'START_TO_CLOSE_WINDOW' }, win.id);
      } else {
        const project = state.projects.find((p) => p.window.id == win.id);
        const oldProject = oldState.projects.find((p) => p.window.id == win.id);
        const isSafeToCloseThisWindow = hasChangedTo('window.status', 'safeToClose', project, oldProject);
        if (isSafeToCloseThisWindow) {
          win.close();
        }
      }
    });

    // Open DevTools
    if (!electron.app.isPackaged) win.webContents.openDevTools();

    global.store.dispatch({
      type: 'OPENED_WINDOW',
      projectIndex: projectIndex,
    }, win.id);

    return win
  }
}

/**
 * Save window bounds to state, so we can restore after restart.
 */
function saveWindowBoundsToState(win) {
  global.store.dispatch({ type: 'SAVE_WINDOW_BOUNDS', windowBounds: win.getBounds() }, win.id);
}


const browserWindowConfig = {
  show: false,
  width: 200, 
  height: 200,
  zoomFactor: 1.0,
  vibrancy: 'sidebar',
  transparent: true,
  titleBarStyle: 'hiddenInset',
  webPreferences: {
    scrollBounce: false,
    // Security:
    allowRunningInsecureContent: false,
    contextIsolation: true,
    enableRemoteModule: false,
    nativeWindowOpen: false,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    safeDialogs: true,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
    // Preload
    preload: path__default['default'].join(__dirname, 'js/preload.js')
  }
};

// External dependencies


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;


// -------- Reload (Development-only) -------- //

if (!electron.app.isPackaged) {

  const watchAndReload = [
    path__default['default'].join(__dirname, '**/*.js'),
    path__default['default'].join(__dirname, '**/*.html'),
    path__default['default'].join(__dirname, '**/*.css'),
    path__default['default'].join(__dirname, '**/*.xml')
    // 'main.js',
    // '**/*.js',
    // '**/*.html',
    // '**/*.css',
    // '**/*.xml',
    // '**/*.png',
    // '**/*.jpg',
  ];

  require('electron-reload')(watchAndReload, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 10,
    //   pollInterval: 50
    // },
    electron: path__default['default'].join(__dirname, '../node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
    // argv: ['--inspect=5858'],
  });

  console.log('// - - - - - - - - - - - - - - -');
  console.log(`Gambier. Electron ${process.versions.electron}. Chrome ${process.versions['chrome']}`);
}


// -------- IPC TESTING -------- //

// ipc.config.id = 'world';
// ipc.config.retry = 1500;

// ipc.serve(() => {

//     ipc.server.on('message', (data, socket) => {
//       ipc.log('got a message : '.debug, data)
//       ipc.server.emit(
//         socket,
//         'message',  // This can be anything you want so long as your client knows.
//         data + ' world!'
//       )
//     })

//     ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
//       ipc.log('client ' + destroyedSocketID + ' has disconnected!')
//     })
//   }
// )

// ipc.server.start()



// -------- SETUP -------- //

// Create store (and global variables for store and state)
global.store = new Store();
global.state = () => global.store.store;
global.patches = []; // Most recent patches from Immer

// Create managers
const appearanceManager = new AppearanceManager();
const diskManager = new DiskManager();
const ipcManager = new IpcManager();
const menuBarManager = new MenuBarManager();
const windowManager = new WindowManager();
const dbManager = new DbManager();

// One more global variable
global.watchers = diskManager.watchers;

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

// Start app
electron.app.whenReady()
  .then(async () => {

    dbManager.init();

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' });
    // Get system appearance settings
    appearanceManager.startup();
    // Create a window for each project
    await windowManager.startup();
    // Create a Watcher instance for each project
    await diskManager.startup();
    // App startup complete!
    await global.store.dispatch({ type: 'FINISH_COLD_START' });
  });


// -------- LISTENERS -------- //

// Quit app: Start by setting appStatus to 'safeToQuit', if it is not yet so. This triggers windows to close. Once all of them have closed, update appStatus to 'safeToQuit', and then trigger `app.quit` again. This time it will go through.

electron.app.on('before-quit', async (evt) => {
  if (global.state().appStatus !== 'safeToQuit') {
    evt.preventDefault();
    await global.store.dispatch({
      type: 'START_TO_QUIT'
    });
  }
});

global.store.onDidAnyChange(async (state) => {
  if (state.appStatus == 'wantsToQuit') {
    const isAllWindowsSafelyClosed = state.projects.every((p) => p.window.status == 'safeToClose');
    if (isAllWindowsSafelyClosed) {
      await global.store.dispatch({ type: 'CAN_SAFELY_QUIT' });
      electron.app.quit();
    }
  }
});

// All windows closed
electron.app.on('window-all-closed', () => {
  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});
//# sourceMappingURL=main.js.map
