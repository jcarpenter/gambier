'use strict';

var electron = require('electron');
var path = require('path');
var ElectronStore = require('electron-store');
var produce = require('immer');
var fsExtra = require('fs-extra');
var fs = require('fs');
var nonSecure = require('nanoid/non-secure');
require('colors');
var chroma = require('chroma-js');
require('deep-eql');
var Database = require('better-sqlite3');
var chokidar = require('chokidar');
var matter = require('gray-matter');
var removeMd = require('remove-markdown');
var sizeOf = require('image-size');
var debounce = require('debounce');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ElectronStore__default = /*#__PURE__*/_interopDefaultLegacy(ElectronStore);
var produce__default = /*#__PURE__*/_interopDefaultLegacy(produce);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chroma__default = /*#__PURE__*/_interopDefaultLegacy(chroma);
var Database__default = /*#__PURE__*/_interopDefaultLegacy(Database);
var chokidar__default = /*#__PURE__*/_interopDefaultLegacy(chokidar);
var matter__default = /*#__PURE__*/_interopDefaultLegacy(matter);
var removeMd__default = /*#__PURE__*/_interopDefaultLegacy(removeMd);
var sizeOf__default = /*#__PURE__*/_interopDefaultLegacy(sizeOf);

produce.enablePatches();

function isDirectoryAccessible(directory) {
  try {
    fsExtra.accessSync(directory, fs__default['default'].constants.W_OK);
    return true
  } catch (err) {
    return false
  }
}


const update = (state, action, window) =>
  produce__default['default'](state, (draft) => {

    // Set a few useful, commonly-used variables
    // const project = window?.projectId !== undefined ? draft.projects.byId[window.projectId] : undefined
    const project = draft.projects.byId[window?.projectId];

    switch (action.type) {


      // ------------------------ APP-WIDE ------------------------ //

      case 'START_COLD_START': {

        // Update appStatus 
        draft.appStatus = 'coldStarting';

        // Delete existing projects that 1) are missing their directory, or 2) have an inaccessible directory
        if (draft.projects.allIds.length) {
          draft.projects.allIds.forEach((id) => {

            const project = draft.projects.byId[id];
            const directoryIsMissing = !project.directory;
            const directoryIsInaccessible = !isDirectoryAccessible(project.directory);

            if (directoryIsMissing || directoryIsInaccessible) {
              delete draft.projects.byId[id];
            }
          });

          // Update `allIds` to match `byId`
          draft.projects.allIds = Object.keys(draft.projects.byId);
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.allIds.length) {
          const id = nonSecure.nanoid();
          draft.projects.byId[id] = { ...newProject };
          draft.projects.allIds.push(id);
        }

        // Close preferences
        draft.prefs.isOpen = false;

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

      // case 'CAN_SAFELY_QUIT': {
      //   draft.appStatus = 'canSafelyQuit'
      //   break
      // }

      // FOCUSED/UNFOCUSED WINDOW

      case 'FOCUSED_WINDOW': {
        draft.focusedWindowId = window.projectId;
        break
      }

      case 'NO_WINDOW_FOCUSED': {
        draft.focusedWindowId = "";
        break
      }

      // PREFERENCES

      case 'OPEN_PREFERENCES': {
        draft.prefs.isOpen = true;
        break
      }

      case 'CLOSE_PREFERENCES': {
        draft.prefs.isOpen = false;
        break
      }

      // APPEARANCE

      case 'SET_APP_THEME': {
        draft.theme.app = action.theme;
        break
      }

      case 'SAVE_CHROMIUM_VALUES': {
        draft.chromium = action.values;
        break
      }

      case 'SAVE_COLORS': {
        draft.colors = action.colors;
        break
      }




      // ------------------------ PROJECT-SPECIFIC ------------------------ //

      // CREATE, EDIT, REMOVE

      case 'CREATE_NEW_PROJECT': {
        const id = nonSecure.nanoid();
        draft.projects.byId[id] = { ...newProject };
        draft.projects.allIds.push(id);
        break
      }

      case 'REMOVE_PROJECT': {
        delete draft.projects.byId[window.projectId];
        draft.projects.allIds = Object.keys(draft.projects.byId);
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        // Do we have write permissions for the selected directory? If yes, proceed. 
        // Else, if current directory is valid, keep using it.
        // Else, set directory as blank.
        if (isDirectoryAccessible(action.directory)) {
          project.directory = action.directory;
        } else {
          if (isDirectoryAccessible(project.directory)) ; else {
            project.directory = "";
          }
        }

        // Reset panels
        project.focusedPanelIndex = 0;
        project.panels = [{ ...newPanel, id: nonSecure.nanoid() }];
        break
      }

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

      // PROJECT WINDOW

      case 'OPENED_PROJECT_WINDOW': {
        // Update window status
        project.window.status = 'open';
        break
      }

      case 'START_TO_CLOSE_PROJECT_WINDOW': {
        project.window.status = 'wantsToClose';
        break
      }

      case 'CAN_SAFELY_CLOSE_PROJECT_WINDOW': {

        project.window.status = 'safeToClose';

        // Every time a window marks itself 'safeToClose', check if the app is quitting. If true, check if all windows are 'safeToClose' yet. If true, we can safely quit the app.

        if (draft.appStatus == 'wantsToQuit') {

          const allWindowsAreSafeToClose = draft.projects.allIds.every((id) => {
            const windowStatus = draft.projects.byId[id].window.status;
            return windowStatus == 'safeToClose'
          });

          if (allWindowsAreSafeToClose) {
            draft.appStatus = 'canSafelyQuit';
          }
        }

        break
      }

      // Save window bounds to state, so we can restore later
      case 'SAVE_PROJECT_WINDOW_BOUNDS': {
        project.window.bounds = action.windowBounds;
        break
      }

      case 'PROJECT_WINDOW_DRAG_OVER': {
        project.window.isDraggedOver = true;
        break
      }

      case 'PROJECT_WINDOW_DRAG_LEAVE': {
        project.window.isDraggedOver = false;
        break
      }

      case 'SET_LAYOUT_FOCUS': {
        project.focusedSectionId = action.section;
        break
      }

      // case 'SET_DRAGGED_FILE': {
      //   project.draggedFileId = action.id
      //   break
      // }

      // SIDEBAR

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
        if (tab.sortBy) {
          tab.sortBy = action.sortBy;
        }
        if (tab.sortOrder) {
          tab.sortOrder = action.sortOrder;
        }
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

      case 'SIDEBAR_SET_SEARCH_OPTIONS': {
        const tab = project.sidebar.tabsById.search;
        tab.options = action.options;
        break
      }

      case 'SIDEBAR_TOGGLE_EXPANDABLE': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab[action.expandable].isOpen = !tab[action.expandable].isOpen;
        break
      }

      case 'TOGGLE_SIDEBAR_PREVIEW': {
        project.sidebar.isPreviewOpen = !project.sidebar.isPreviewOpen;
        break
      }

      // PANEL

      case 'OPEN_DOC_IN_PANEL': {
        const panel = project.panels[action.panelIndex];
        panel.docId = action.docId;
        panel.unsavedChanges = false;
        break
      }

      case 'OPEN_DOC_IN_FOCUSED_PANEL': {
        const focusedPanel = project.panels[project.focusedPanelIndex];
        focusedPanel.docId = action.docId;
        focusedPanel.unsavedChanges = false;
        break
      }

      case 'OPEN_NEW_PANEL': {

        // Insert new panel at specified index
        project.panels.splice(action.panelIndex, 0, {
          ...newPanel,
          id: nonSecure.nanoid(),
          docId: action.docId,
        });

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i);

        // Focus new panel
        project.focusedPanelIndex = action.panelIndex;

        // Set all panels equal width
        const panelWidth = (100 / project.panels.length).toFixed(1);
        project.panels.forEach((p) => p.width = panelWidth);

        break
      }

      case 'MOVE_PANEL': {

        // Delete the panel from it's current position.
        // Splice returns the moved panel's array item.
        const movedPanel = project.panels.splice(action.fromIndex, 1);

        // Move the item to its new position
        project.panels.splice(action.toIndex, 0, movedPanel[0]);

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i);

        // Focus the panel  
        project.focusedPanelIndex = action.toIndex;

        break
      }

      case 'CLOSE_PANEL': {
        project.panels.splice(action.panelIndex, 1);

        // Set all panels to equal percentage of total
        const panelWidth = (100 / project.panels.length).toFixed(1);
        project.panels.forEach((p) => p.width = panelWidth);

        // Update focusedPanel:
        // If there is only one panel left, focus it. Else...
        // * If it was to LEFT of the closed panel, the value is unchanged.
        // * If it WAS closed the closed panel, the value is unchanged (this will focus the adjacent panel).
        // * ...unless it was the panel furthest right, in which case we focus the new last panel.
        // * If it was to RIGHT of the closed panel, decrement the value by one.

        if (project.panels.length == 1) {
          project.focusedPanelIndex = 0;
        } else {
          const closedPanelWasLeftOfFocusedPanel = action.panelIndex < project.focusedPanelIndex;
          const closedPanelWasFocusedAndFurthestRight = action.panelIndex == project.focusedPanelIndex && action.panelIndex == project.panels.length;

          if (closedPanelWasLeftOfFocusedPanel) {
            project.focusedPanelIndex = project.focusedPanelIndex - 1;
          } else if (closedPanelWasFocusedAndFurthestRight) {
            project.focusedPanelIndex = project.panels.length - 1;
          }
        }

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i);

        break
      }

      // case 'SET_PANEL_WIDTH': {
      //   // Set width of the panel of `panelIndex`, and the one to it's right (if there is one)
      //   const panel = project.panels[action.panelIndex]
      //   const panelToRight = project.panels[action.panelIndex + 1]

      //   break
      // }

      case 'SET_PANEL_WIDTHS': {
        project.panels.forEach((panel, i) => panel.width = action.widths[i]);
        break
      }

      case 'FOCUS_PANEL': {
        project.focusedPanelIndex = action.panelIndex;
        break
      }

      // EDITING

      case 'SET_SOURCE_MODE': {
        draft.sourceMode = action.enabled;
        break
      }

      case 'SET_UNSAVED_CHANGES': {
        const panel = project.panels[action.panelIndex];
        panel.unsavedChanges = action.value;
        break
      }

      case 'SAVE_DOC_SUCCESS': {
        const panel = project.panels[action.panelIndex];
        panel.unsavedChanges = false;
        break
      }



    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches;
  }
  );

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

  async dispatch(action, window = undefined) {

    if (!electron.app.isPackaged) logTheAction(action);

    // Get next state. 
    // `update` function also updates `global.patches`.
    const nextState = update(store.store, action, window);

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

  theme: {
    app: 'match-system',
    editor: 'gambier'
  },

  chromium: {
    themeSource: 'system',
    isDarkMode: false,
    isHighContrast: false,
    isInverted: false,
    isReducedMotion: false,
  },

  sourceMode: false,

  focusedWindowId: 0,

  prefs: {
    isOpen: false
  },

  timing: {
    treeListFolder: 300,
  },

  // ----------- PROJECTS ----------- //

  projects: {
    allIds: [],
    byId: {}
  }

  // projects: []

};

const newPanel = {
  index: 0,
  id: '', // Generate with nanoid
  docId: '',
  width: '100', // Percentage
  unsavedChanges: false
};

const newProject = {

  // Used to associate windows with projects. Generated by nanoid.
  // id: '',
  
  window: {
    // Used to associate windows with projects
    id: 0,
    // Used when closing window (to check if it's safe to do so or not)
    status: 'new',
    isDraggedOver: false,
    bounds: { x: 0, y: 0, width: 1600, height: 1200 }
  },

  // User specified directory to folder containing their project files
  directory: '',

  // User specified path to CSL-JSON file containing their citatons
  citations: '',

  focusedSectionId: 'sidebar',
  
  // Index of focused panel
  focusedPanelIndex: 0,

  // draggedFileId: '',

  // A copy of the object of the document currently visible in the editor.
  // TODO: Is made obsolete by switch to panels. Remove.
  openDoc: {},

  // List of the open panels
  // See `newPanel` for template
  panels: [],

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
          isOpen: false,
          matchCase: false,
          matchExactPhrase: false,
          lookIn: '*',
          tags: []
        },
        replace: {
          isOpen: false,
        }
      }
    },
    tabsAll: ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'citations', 'search']
  }
};

/**
 * Get the diff between two arrays
 * For [1, 2, 3] and [1, 2], it will return [3]
 * From: https://stackoverflow.com/a/33034768
 */
function getArrayDiff(arr1, arr2) {
  return arr1.filter(x => !arr2.includes(x));
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

/**
 * Wrap setTimeout in a promise so we can use with async/await. 
 * Use like: `await wait(1000);`
 * @param {*} ms 
 */
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

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


// -------- COMPARE PATCHES -------- //

/**
 * Check if state property has changed by comparing Immer patches. And (optionally) if property now equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
function stateHasChanged(patches, props, toValue = '') {
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

/**
 * Check if an object property has changed to a specific value,
 * by comparing old and new versions of the object.
 * @param {*} keysAsString 
 * @param {*} value 
 * @param {*} objTo 
 * @param {*} objFrom 
 */
function propHasChangedTo(keysAsString, value, objTo, objFrom) {
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
 * Utility function for hasChanged. 
 * Convert propAddress string to array of keys.
 * Before: "projects[5].window"
 * After: ["projects", 5, "window"]
 * @param {*} keyAsString 
 */
function extractKeysFromString(keyAsString) {
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
 * Utility function for `hasChanged`. 
 * @param {*} nestedObj 
 * @param {*} pathArr 
 */
const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
};

function init() {

  // When nativeTheme changes for any reason, get updated colors.
  // 'updated' fires when something tells Chromium to update visual settings.
  // Can be triggered by app logic, or from the OS:
  // 1) By app: App manually sets `nativeTheme.themeSource` to 'dark'.
  // 2) By OS: Dark mode activates at 10pm. Chromium gets notification 
  //    from OS that OS appearance has changed, and `nativeTheme.themeSource` 
  //    is 'system', so Chromium accepts the change.
  electron.nativeTheme.on('updated', () => {
    saveChromiumValues();
    sendUpdatedColorsToRenderProcess();
  });

  // When `theme.app` changes, update Chrome nativeTheme.themeSource.
  global.store.onDidAnyChange((state, oldState) => {
    const appThemeChanged = stateHasChanged(global.patches, ["theme", "app"]);
    if (appThemeChanged) {
      setNativeTheme(false);
    }
  });

  // Set native UI to theme value in store
  setNativeTheme(true);
}

/**
 * Update `nativeTheme` electron property
 * Setting `nativeTheme.themeSource` has several effects, including: it tells Chrome how to render UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
 * Per: https://www.electronjs.org/docs/api/native-theme
 */
function setNativeTheme(isFirstRun) {
  const appTheme = global.state().theme.app;
  switch (appTheme) {
    case 'match-system':
      electron.nativeTheme.themeSource = 'system';
      break
    case 'light':
      electron.nativeTheme.themeSource = 'light';
      break
    case 'dark':
      electron.nativeTheme.themeSource = 'dark';
      break
  }

  if (!isFirstRun) {
    // If dev tools is open, reload (close then open) to force it to load the new theme. Unfortunately it doesn't do so automatically, in either Electron or Chrome.
    const win = electron.BrowserWindow.getFocusedWindow();
    const devToolsIsOpen = !electron.app.isPackaged && win?.webContents?.isDevToolsOpened();
    if (devToolsIsOpen) {
      win.webContents.closeDevTools();
      win.webContents.openDevTools();
    }
  }
}

/**
 * Save Chromium appearance-related values to store. Note: nativeTheme properties  will usually match the OS, because they're usually set by the OS. But in some cases, they will differ. If the user chooses `View > Appearance > Light` while the OS is in dark mode, for example. 
 */
function saveChromiumValues() {
  store.dispatch({
    type: 'SAVE_CHROMIUM_VALUES',
    values: {
      themeSource: electron.nativeTheme.themeSource,
      isDarkMode: electron.nativeTheme.shouldUseDarkColors,
      isHighContrast: electron.nativeTheme.shouldUseHighContrastColors,
      isInverted: electron.nativeTheme.shouldUseInvertedColorScheme,
      isReducedMotion: electron.systemPreferences.getAnimationSettings().prefersReducedMotion
    }
  });
}

/** 
 * When nativeTheme changes, we assume system colors have changed, 
 * get the new values, and send them to render process. Which then
 * applies them as css variables.
*/
function sendUpdatedColorsToRenderProcess() {
  electron.webContents.getAllWebContents().forEach((contents) => {
    contents.send('updatedSystemColors', getSystemColors());
  });
}











// -------- COLORS -------- //

function getSystemColors() {

  const isDarkMode = electron.nativeTheme.shouldUseDarkColors;

  if (isDarkMode) {
    return {
      // System colors
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
      // Accent-influenced dynamic colors
      ...getAccentColors(isDarkMode),
      // All other dynamic dystem colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      highlightColor: '#B4B4B4FF',
      labelColor: '#FFFFFFD8',
      linkColor: '#419CFFFF',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
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
    }
  } else {
    return {
      //System colors
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
      // Accent-influenced dynamic colors
      ...getAccentColors(isDarkMode),
      // All other dynamic dystem colors
      alternateSelectedControlTextColor: '#FFFFFFFF',
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      findHighlightColor: '#FFFF00FF',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      highlightColor: '#FFFFFFFF',
      labelColor: '#000000D8',
      linkColor: '#0068DAFF',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
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
    }
  }
}

/**
 * TEMPORARY: Electron returns incorrect values for controlAccentColor. So we have to hard-code the correct values. Filed issue here: https://github.com/electron/electron/issues/27048
 */
function getAccentColors(isDarkMode) {

  const allegedAccentColor = `#${electron.systemPreferences.getAccentColor().toUpperCase()}`;

  switch (allegedAccentColor) {

    // ------------ BLUE ------------ //
    case '#0A5FFFFF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#007AFFFF',
          darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
          keyboardFocusIndicatorColor: '#1AA9FF4C',
          selectedContentBackgroundColor: '#0058D0FF',
          selectedControlColor: '#3F638BFF',
          selectedTextBackgroundColor: '#3F638BFF',
        }
      } else {
        return {
          controlAccentColor: '#007AFFFF',
          darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
          keyboardFocusIndicatorColor: '#0067F43F',
          selectedContentBackgroundColor: '#0063E1FF',
          selectedControlColor: '#B3D7FFFF',
          selectedTextBackgroundColor: '#B3D7FFFF',
        }
      }

    // ------------ PURPLE ------------ //
    case '#923796FF': // Dark
      return {
        controlAccentColor: '#A550A7FF',
        darkerControlAccentColor: getDarkerAccentColor('#A550A7FF'),
        keyboardFocusIndicatorColor: '#DB78DE4C',
        selectedContentBackgroundColor: '#7F3280FF',
        selectedControlColor: '#705670FF',
        selectedTextBackgroundColor: '#705670FF',
      }
    case '#812684FF': // Light
      return {
        controlAccentColor: '#953D96FF',
        darkerControlAccentColor: getDarkerAccentColor('#953D96FF'),
        keyboardFocusIndicatorColor: '#8326843F',
        selectedContentBackgroundColor: '#7D2A7EFF',
        selectedControlColor: '#DFC5DFFF',
        selectedTextBackgroundColor: '#DFC5DFFF',
      }

    // ------------ PINK ------------ //
    case '#F2318DFF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#F74F9EFF',
          darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
          keyboardFocusIndicatorColor: '#FF76D34C',
          selectedContentBackgroundColor: '#C83179FF',
          selectedControlColor: '#88566EFF',
          selectedTextBackgroundColor: '#88566EFF',
        }
      } else {
        return {
          controlAccentColor: '#F74F9EFF',
          darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
          keyboardFocusIndicatorColor: '#EB398D3F',
          selectedContentBackgroundColor: '#D93B85FF',
          selectedControlColor: '#FCCAE2FF',
          selectedTextBackgroundColor: '#FCCAE2FF',
        }
      }

    // ------------ RED ------------ //
    case '#FC3845FF': // Dark
      return {
        controlAccentColor: '#FF5257FF',
        darkerControlAccentColor: getDarkerAccentColor('#FF5257FF'),
        keyboardFocusIndicatorColor: '#FF7A804C',
        selectedContentBackgroundColor: '#D03439FF',
        selectedControlColor: '#8B5758FF',
        selectedTextBackgroundColor: '#8B5758FF',
      }
    case '#D62130FF': // Light
      return {
        controlAccentColor: '#E0383EFF',
        darkerControlAccentColor: getDarkerAccentColor('#E0383EFF'),
        keyboardFocusIndicatorColor: '#D320273F',
        selectedContentBackgroundColor: '#C3252BFF',
        selectedControlColor: '#F5C3C5FF',
        selectedTextBackgroundColor: '#F5C3C5FF',
      }


    // ------------ ORANGE ------------ //
    case '#F36D16FF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#F7821BFF',
          darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
          keyboardFocusIndicatorColor: '#FFB2394C',
          selectedContentBackgroundColor: '#C86003FF',
          selectedControlColor: '#886547FF',
          selectedTextBackgroundColor: '#886547FF',
        }
      } else {
        return {
          controlAccentColor: '#F7821BFF',
          darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
          keyboardFocusIndicatorColor: '#EB6F023F',
          selectedContentBackgroundColor: '#D96B0AFF',
          selectedControlColor: '#FCD9BBFF',
          selectedTextBackgroundColor: '#FCD9BBFF',
        }
      }

    // ------------ YELLOW ------------ //
    case '#FEBC09FF': // Dark
      return {
        controlAccentColor: '#FFC600FF',
        darkerControlAccentColor: getDarkerAccentColor('#FFC600FF'),
        keyboardFocusIndicatorColor: '#FFFF1A4C',
        selectedContentBackgroundColor: '#D09C00FF',
        selectedControlColor: '#8B7A3FFF',
        selectedTextBackgroundColor: '#8B7A3FFF',
      }
    case '#FEBD1EFF': // Light
      return {
        controlAccentColor: '#FFC726FF',
        darkerControlAccentColor: getDarkerAccentColor('#FFC726FF'),
        keyboardFocusIndicatorColor: '#F4B80D3F',
        selectedContentBackgroundColor: '#E1AC14FF',
        selectedControlColor: '#FFEEBEFF',
        selectedTextBackgroundColor: '#FFEEBEFF',
      }

    // ------------ GREEN ------------ //
    case '#53B036FF':
      if (isDarkMode) {
        return {
          controlAccentColor: '#62BA46FF',
          darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
          keyboardFocusIndicatorColor: '#8DF46C4C',
          selectedContentBackgroundColor: '#42912AFF',
          selectedControlColor: '#5C7653FF',
          selectedTextBackgroundColor: '#5C7653FF',
        }
      } else {
        return {
          controlAccentColor: '#62BA46FF',
          darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
          keyboardFocusIndicatorColor: '#4DAB2F3F',
          selectedContentBackgroundColor: '#4DA032FF',
          selectedControlColor: '#D0EAC7FF',
          selectedTextBackgroundColor: '#D0EAC7FF',
        }
      }

    // ------------ GRAPHITE ------------ //
    case '#797979FF': // Dark
      return {
        controlAccentColor: '#8C8C8CFF',
        darkerControlAccentColor: getDarkerAccentColor('#8C8C8CFF'),
        keyboardFocusIndicatorColor: '#C3C3C37F',
        selectedContentBackgroundColor: '#686868FF',
        selectedControlColor: '#FFFFFF3F',
        selectedTextBackgroundColor: '#FFFFFF3F',
      }
    case '#868686FF': // Light
      return {
        controlAccentColor: '#989898FF',
        darkerControlAccentColor: getDarkerAccentColor('#989898FF'),
        controlAccentColor: '#989898FF',
        keyboardFocusIndicatorColor: '#99999EFF',
        selectedContentBackgroundColor: '#808080FF',
        selectedControlColor: '#E0E0E0FF',
        selectedTextBackgroundColor: '#E0E0E0FF',
      }
  }
}


function getDarkerAccentColor(accentColor) {
  return chroma__default['default'].blend(accentColor, '#EEEEEE', 'burn').desaturate(0).hex();
}

class DbManager {
  constructor() {

    // Create database
    // Pass ":memory:" as the first argument to create an in-memory db.
    this.db = new Database__default['default'](':memory:');
    // this.db = new Database(':memory:', { verbose: console.log })

    // Create table
    this.table = this.db.prepare(`
      CREATE VIRTUAL TABLE docs 
      USING FTS5(id, name, title, path, body)
    `).run();

    // Statement for inserting new docs

    // Using `INSERT OR REPLACE` means we replace the row, if it already exists. Else, we create (insert) it. 

    // The following says: "Does a row with the same id already exist? If yes, get it's rowid. And insert the new values at that same rowid, thereby replacing the original row. Else, insert a new row." `rowid` is a unique integer index value automatically assigned to each row on creation, in FTS tables (or any sqlite table where we don't specify a primary key).

    // This is all a bit convuluted. That's because we're using FTS tables. Normally we could jusy, say, set the `id` column as the primary key, and sqlite would automatically trigger the replace action if we tried to add a row with the same id. But FTS tables don't allow primary key declaration or constraints (the other tool we could use). So instead we have to insert at specific rowid's, ala working with arrays by indexes.
    this.insert_stmt = this.db.prepare(`
      INSERT OR REPLACE INTO docs (rowid, id, name, title, path, body) 
      VALUES ((SELECT rowid FROM docs WHERE id = @id LIMIT 1), @id, @name, @title, @path, @body)
    `);

    this.insert_many_stmt = this.db.transaction((docs) => {
      for (const doc of docs) {
        this.insert_stmt.run(doc);
      }    });

    this.delete_stmt = this.db.prepare(`
      DELETE FROM docs
      WHERE id = ?
      LIMIT 1
    `);

    // Statement for full text search
    this.fts_stmt = this.db.prepare(`
      SELECT id,
             title,
             highlight(docs, 4, '<span class="highlight">', '</span>') body
      FROM docs 
      WHERE docs MATCH ?
      ORDER BY rank
    `);

    // Setup listener to handle queries from renderer. Take the provided paramaters for query string (e.g. 'dogs'), matchExactPhrase (boolean), and path (e.g. '/User/Documents/ClimateResearch'), and create the string we'll pass into 

    // We use column filters to specify which columns to search. We only want params.path to search the `path` column, for example. And we never want to search `id` column. For example: `body: "Rex" *` says "Search body column for tokens that start with 'Rex'`. Per: https://www.sqlite.org/fts5.html#fts5_column_filters

    // If `matchExactPhrase` is false, we add a '*' after our query string, which tells sqlite to treat the string as a "prefix token", and match any tokens that start with the query. Per: https://www.sqlite.org/fts5.html#fts5_prefix_queries

    // For `path`, we're inserting `^` before the string, to tell sqlite to only match if the string starts at the first token in the column. Like ^ works in regex. Per: https://www.sqlite.org/fts5.html#fts5_initial_token_queries

    // We wrap our strings in double-quotation marks to escape characters such as - and /, which would otherwise trigger sql errors. Forward slashes will always appear in paths, and other characters may appear in the query string.

    // We use boolean operators to combine our phrases. Matches MUST be descendants of the specified `params.path` (folder path), AND have query matches in either `body`, `title`, or `name` columns.

    // Docs: https://www.sqlite.org/fts5.html#extending_fts5
    electron.ipcMain.handle('queryDb', (evt, params) => {

      // Create the query string
      const body = `body:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const title = `title:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const name = `name:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const path = `path:^ "${params.path}"${params.matchExactPhrase ? '' : ' *'}`;
      const query = `${path} AND (${body} OR ${title} OR ${name})`;

      // Run the full text search statement with the query string.
      let results = this.fts_stmt.all(query);

      // Return the results. Will be array of objects; one for each row.
      return results
    });
  }

  /**
   * Insert single row into database.
   */
  insert(doc = {
    id: '',
    name: '',
    title: '',
    path: '',
    body: ''
  }) {
    this.insert_stmt.run(doc);
  }

  /**
   * Insert multiple rows into the database.
   * @param {} docs - Array of docs
   */
  insertMany(docs) {
    this.insert_many_stmt(docs);
  }

  /**
   * Delete single row from database.
   */
  delete(id) {
    this.delete_stmt.run(id);
  }

  init() {

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

// 1/25: TODO: Can probably delete. Moved this into MenuBarManager
async function deleteFile(path) {
  try {
		await fsExtra.remove(path);
		return { type: 'DELETE_FILE_SUCCESS', path: path }
	} catch(err) {
		return { type: 'DELETE_FILE_FAIL', err: err }
	}
}

// 1/25: TODO: Can probably delete. Moved this into MenuBarManager

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

async function saveDoc (doc, data, panelIndex) {
	try {
		console.log(doc, panelIndex);
		await fsExtra.writeFile(doc.path, data, 'utf8');
		return {
			type: 'SAVE_DOC_SUCCESS',
			panelIndex: panelIndex,
		}
	} catch (err) {
		return {
			type: 'SAVE_DOC_FAIL',
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

function init$1() {

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

  // Commented this out Jan 14. Isn't being used at the moment.
  // Need to investigate how to safely close windows, tho. 
  // E.g. What happens when we click the red close button?
  // ipcMain.on('safelyCloseWindow', async (evt) => {
  //   const win = BrowserWindow.fromWebContents(evt.sender)
  //   if (!global.state().areQuiting) {
  //     await global.store.dispatch({
  //       type: 'REMOVE_PROJECT'
  //     }, win.id)
  //   }
  //   win.destroy()
  // })

  electron.ipcMain.on('replaceAll', (evt, query, replaceWith, filePaths, isMatchCase, isMatchExactPhrase, isMetaKeyPressed) => {

    // Define our regex for finding matches in the specified files.
    // Demo: https://jsfiddle.net/m17zhoyj/1/
    let queryRegex = undefined;
    if (isMatchExactPhrase) {
      // If `matchExactPhrase`, make sure there are no word characters immediately before or after the query phrase, using negative look behind and look ahead.
      // Demo: https://regex101.com/r/Toj4WF/1
      queryRegex = new RegExp(String.raw`(?<!\w)${query}(?!\w)`, isMatchCase ? 'g' : 'gi');
    } else {
      queryRegex = new RegExp(`${query}`, isMatchCase ? 'g' : 'gi');
    }

    // Ask user to confirm replacment, unless meta key was held down (provides a fast path).
    if (!isMetaKeyPressed) {
      const confirmReplacement = electron.dialog.showMessageBoxSync({
        type: 'warning',
        message: `Are you sure you want to replace "${query}" with "${replaceWith}" in ${filePaths.length} document${filePaths.length > 1 ? 's' : ''}?`,
        buttons: ['Cancel', 'Replace'],
        cancelId: 0
      });

      // If user does not press `Replace` (1), then `return` prematurely.
      if (confirmReplacement !== 1) return
    }

    // Open each file in `filePaths`, find all instances of `query`, replace, and write file.
    filePaths.forEach(async (filePath) => {
      let file = await fsExtra.readFile(filePath, 'utf8');
      file = file.replaceAll(queryRegex, replaceWith);
      await fsExtra.writeFile(filePath, file, 'utf8');
    });
  });


  electron.ipcMain.on('moveOrCopyIntoFolder', async (evt, filePath, folderPath, isCopy) => {
    // Get destination
    const fileName = path__default['default'].basename(filePath);
    let destinationPath = path__default['default'].format({
      dir: folderPath,
      base: fileName
    });

    // Does file already exist at destination?
    const fileAlreadyExists = fsExtra.existsSync(destinationPath);

    // If yes, prompt user to confirm overwrite. 
    // Else, just move/copy
    if (fileAlreadyExists) {
      const selectedButtonId = electron.dialog.showMessageBoxSync({
        type: 'question',
        message: `An item named ${fileName} already exists in this location. Do you want to replace it with the one you’re moving?`,
        buttons: ['Keep Both', 'Stop', 'Replace'],
        cancelId: 1
      });
      switch (selectedButtonId) {
        // Keep both
        case 0:
          destinationPath = getIncrementedFileName(destinationPath);
          fsExtra.copyFileSync(filePath, destinationPath);
          break
        // Stop (Do nothing)
        case 1:
          break
        // Replace
        case 2:
          if (isCopy) {
            fsExtra.copyFileSync(filePath, destinationPath);
          } else {
            fsExtra.renameSync(filePath, destinationPath);
          }
          break
      }
    } else {
      if (isCopy) {
        fsExtra.copyFileSync(filePath, destinationPath);
      } else {
        fsExtra.renameSync(filePath, destinationPath);
      }
    }
  });


  electron.ipcMain.on('dispatch', async (evt, action) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    switch (action.type) {
      case ('SELECT_CITATIONS_FILE_FROM_DIALOG'):
        store.dispatch(await selectCitationsFileFromDialog(), win);
        break
      case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
        store.dispatch(await selectProjectDirectoryFromDialog(), win);
        break
      case ('SAVE_DOC'):
        store.dispatch(await saveDoc(action.doc, action.data, action.panelIndex), win);
        break
      case ('DELETE_FILE'):
        store.dispatch(await deleteFile(action.path), win);
        break
      case ('DELETE_FILES'):
        store.dispatch(await deleteFiles(action.paths), win);
        break
      default:
        store.dispatch(action, win);
        break
    }
  });

  // -------- IPC: Invoke -------- //

  // NOTE: We handle this in DbManager.js
  // ipcMain.handle('queryDb', (evt, params) => {
  //   ...
  // })

  electron.ipcMain.handle('getState', (evt) => {
    return global.state()
  });

  electron.ipcMain.handle('getFiles', (evt) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    const watcher = global.watchers.find((watcher) => watcher.id == win.projectId);
    return watcher ? watcher.files : undefined
  });

  // Load file and return text
  electron.ipcMain.handle('getFileByPath', async (event, filePath, encoding = 'utf8') => {
    let file = await fsExtra.readFile(filePath, encoding);
    return file
  });

  // Get system colors and return
  electron.ipcMain.handle('getSystemColors', () => {
    return getSystemColors()
  });
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



// -------- IPC: Invoke -------- //




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


/**
 * Utility function that returns filename with incremented integer suffix. Used when moving files to avoid overwriting files of same name in destination directory, ala macOS. Looks to see if other files in same directory already have same name +_ integer suffix, and if so, increments.
 * Original:      /Users/Susan/Notes/ship.jpg
 * First copy:    /Users/Susan/Notes/ship 2.jpg
 * Second copy:   /Users/Susan/Notes/ship 3.jpg
 * @param {*} origName 
 */
function getIncrementedFileName(origPath) {

  const directory = path__default['default'].dirname(origPath); // /Users/Susan/Notes
  const extension = path__default['default'].extname(origPath); // .jpg
  const name = path__default['default'].basename(origPath, extension); // ship

  const allFilesInDirectory = fsExtra.readdirSync(directory);

  let increment = 2;

  // Basename in `path` is filename + extension. E.g. `ship.jpg`
  // https://nodejs.org/api/path.html#path_path_basename_path_ext
  let newBase = '';

  // Keep looping until we find incremented name that's not already used
  // Most of time this will be `ship 2.jpg`.
  while (true) {
    newBase = `${name} ${increment}${extension}`; // ship 2.jpg
    const alreadyExists = allFilesInDirectory.includes(newBase);
    if (alreadyExists) {
      increment++;
    } else {
      break
    }
  }

  // /Users/Susan/Notes/ship 2.jpg
  return path__default['default'].format({
    dir: directory,
    base: newBase
  })
}

/*
Main instantiates new MenuBarManager instance. 
Constructor creates variables, change listeners, and calls init().
*/

// I want to get values from Editor.svelte to editor
// Example I'll use: toggle source mode
// User selects `View > Source mode`
// Enabled == Is active project `panel.sourceMode` true?
// Dispatch command to reducer
// Reducer sets value to panel
// EditorPanel.svelte detects the change, and updates the `sourceMode` prop of Editor.svelte
// Editor.svelte, when value changes, tells editor.js

const isMac = process.platform === 'darwin';
let menu;
let menuItems = {};

/**
 * On startup, create initial menu bar, and create change listeners.
 */

function init$2() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // We need to rebuild the menu whenever any of the follow change,
  // because they drive one or more menu items' `enabled` states.

  global.store.onDidAnyChange((state, oldState) => {

    const hasChanged = [
      // Focused window
      stateHasChanged(global.patches, "focusedWindowId"),
      // Focused panel
      stateHasChanged(global.patches, ["projects", "byId", "focusedPanelIndex"]),
      // Source mode
      stateHasChanged(global.patches, "sourceMode"),
      // Appearance
      stateHasChanged(global.patches, "theme"),
      stateHasChanged(global.patches, "chromium"),
    ];

    const anyOfTheAboveHaveChanged = hasChanged.includes(true);

    if (anyOfTheAboveHaveChanged) {
      electron.Menu.setApplicationMenu(getMenu());
    }
  });

  // ------ DO INITIAL SETUP ------ //

  electron.Menu.setApplicationMenu(getMenu());
}



/**
 * Return a populated electron Menu instance.
 */
function getMenu() {

  // Create a new electron Menu instance
  menu = new electron.Menu();

  // Generate the menu iems
  menuItems = getMenuItems();

  // Append the menu items to the Menu
  menuItems.topLevel.forEach((item) => menu.append(item));

  return menu
}


function getFocusedProject() {
  const state = global.state();
  return state.projects.byId[state.focusedWindowId]
}

function getFocusedPanel() {
  const project = getFocusedProject();
  return project?.panels[project?.focusedPanelIndex]
}

/**
 * Return Menu Items. These are appended to a new Menu instance.
 */
function getMenuItems() {

  const state = global.state();
  const project = getFocusedProject();
  const panel = getFocusedPanel();

  const items = {
    topLevel: []
  };

  // Separator
  const _______________ = new electron.MenuItem({ type: 'separator' });


  // -------- App (Mac-only) -------- //

  if (isMac) {
    items.topLevel.push(new electron.MenuItem({
      label: electron.app.name,
      submenu: [
        { role: 'about' },
        _______________,
        new electron.MenuItem({
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          async click() {
            global.store.dispatch({ type: 'OPEN_PREFERENCES' });
          }
        }),
        _______________,
        { role: 'services', submenu: [] },
        _______________,
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        _______________,
        { role: 'quit' }
      ]
    }));
  }


  // -------- File (Mac-only) -------- //

  if (isMac) {

    items.closeEditor = new electron.MenuItem({
      label: 'Close Editor',
      accelerator: 'CmdOrCtrl+W',
      enabled: panel !== undefined,
      click(item, focusedWindow) {

        // In dev mode, we can get into state where there's no focused window, and/or no project. I think it may happen when dev tools is open in a panel. Check before proceeding, or we'll get errors.
        if (!focusedWindow || !project) return

        // If there are multiple panels open, close the focused one. Else, close the project window.
        if (project.panels.length > 1) {
          global.store.dispatch({
            type: 'CLOSE_PANEL',
            panelIndex: project.focusedPanelIndex
          }, focusedWindow);
        } else {
          focusedWindow.close();
        }
      }
    });

    items.closeWindow = new electron.MenuItem({
      label: 'Close Window',
      accelerator: 'CmdOrCtrl+Shift+W',
      enabled: panel !== undefined,
      click(item, focusedWindow) {
        focusedWindow.close();
      }
    });

    function isMoveToTrashEnabled() {
      const sideBarIsOpen = project?.sidebar.isOpen;
      const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId];
      const fileIsSelectedInSidebar = selectedTab?.selected.length;
      return sideBarIsOpen && fileIsSelectedInSidebar
    }

    items.moveToTrash = new electron.MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      enabled: isMoveToTrashEnabled(),
      async click(item, focusedWindow) {

        // Get selected file paths
        const watcher = global.watchers.find((w) => w.id == focusedWindow.projectId);
        const project = getFocusedProject();
        const activeSidebarTab = project.sidebar.tabsById[project.sidebar.activeTabId];
        let filePathsToDelete = [];
        activeSidebarTab.selected.forEach((id) => {
          const filepath = watcher.files.byId[id]?.path;
          filePathsToDelete.push(filepath);
        });
        
        // Delete
        await Promise.all(
          filePathsToDelete.map(async (filepath) => {
            await fsExtra.remove(filepath);
          })
        );

        // focusedWindow.webContents.send('mainRequestsDeleteFile')
      }
    });

    items.newDocument = new electron.MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        // TODO
        // global.store.dispatch(await newFile(state))
      }
    });

    items.newEditor = new electron.MenuItem({
      label: 'New Editor',
      accelerator: 'CmdOrCtrl+T',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        // Create new panel to right of the current focused panel
        global.store.dispatch({
          type: 'OPEN_NEW_PANEL',
          docId: '',
          panelIndex: project.focusedPanelIndex + 1
        }, focusedWindow);
      }
    });

    items.newWindow = new electron.MenuItem({
      label: 'New Window',
      accelerator: 'CmdOrCtrl+Shift+N',
      async click(item, focusedWindow) {
        global.store.dispatch({ type: 'CREATE_NEW_PROJECT' });
      }
    });

    items.openProject = new electron.MenuItem({
      label: 'Open Project...',
      accelerator: 'CmdOrCtrl+Shift+O',
      enabled: project !== undefined,
      async click(item, focusedWindow) {
        global.store.dispatch(await selectProjectDirectoryFromDialog(), focusedWindow);
      }
    });

    items.save = new electron.MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      enabled: project !== undefined,
      click(item, focusedWindow) {
        if (getFocusedPanel().unsavedChanges) {
          focusedWindow.webContents.send('mainRequestsSaveFocusedPanel');
        }
      }
    });

    items.saveAll = new electron.MenuItem({
      label: 'Save All',
      accelerator: 'CmdOrCtrl+Alt+S',
      enabled: panel !== undefined,
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveAll');
      }
    });

    items.topLevel.push(new electron.MenuItem({
      label: 'File',
      submenu: [
        items.newDocument,
        items.newEditor,
        items.newWindow,
        _______________,
        items.openProject,
        _______________,
        items.save,
        items.saveAll,
        items.moveToTrash,
        _______________,
        items.closeEditor,
        items.closeWindow
      ]
    }));
  }


  // -------- Edit -------- //


  // mI.startspeaking = new MenuItem({ role: 'startspeaking' })
  // mI.stopspeaking = new MenuItem({ role: 'stopspeaking' })

  items.findInFiles = new electron.MenuItem({
    label: 'Find in Files',
    accelerator: 'CmdOrCtrl+Shift+F',
    enabled: project !== undefined,
    click(item, focusedWindow) {
      // focusedWindow.webContents.send('findInFiles')
    }
  });

  items.replaceInFiles = new electron.MenuItem({
    label: 'Replace in Files',
    accelerator: 'CmdOrCtrl+Shift+H',
    enabled: project !== undefined,
    click(item, focusedWindow) {
      // focusedWindow.webContents.send('findInFiles')
    }
  });

  items.topLevel.push(new electron.MenuItem(
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        _______________,
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        _______________,
        items.findInFiles,
        items.replaceInFiles,
        // If macOS, add speech options to Edit menu
        ...isMac ? [
          _______________,
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : []
      ]
    }
  ));


  // -------- View -------- //

  items.themeDark = new electron.MenuItem({
    label: 'Dark',
    type: 'checkbox',
    checked: state.theme.app == 'dark',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'dark',
      });
    }
  });

  items.themeLight = new electron.MenuItem({
    label: 'Light',
    type: 'checkbox',
    checked: state.theme.app == 'light',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'light',
      });
    }
  });

  items.themeMatchSystem = new electron.MenuItem({
    label: 'Match System',
    type: 'checkbox',
    checked: state.theme.app == 'match-system',
    click() {
      store.dispatch({
        type: 'SET_APP_THEME',
        theme: 'match-system',
      });
    }
  });

  items.sourceMode = new electron.MenuItem({
    label: 'Source mode',
    type: 'checkbox',
    checked: state.sourceMode,
    accelerator: 'CmdOrCtrl+/',
    click(item, focusedWindow) {
      if (focusedWindow) {
        global.store.dispatch({
          type: 'SET_SOURCE_MODE',
          enabled: !global.state().sourceMode,
        }, focusedWindow);
      }
    }
  });

  items.toggleDevTools = new electron.MenuItem({
    label: 'Toggle Developer Tools',
    accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    role: 'toggleDevTools',
  });

  items.reload = new electron.MenuItem({
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    role: 'reload'
  });

  items.topLevel.push(new electron.MenuItem({
    label: 'View',
    submenu: [
      {
        label: 'Appearance',
        submenu: [
          items.themeMatchSystem,
          _______________,
          items.themeLight,
          items.themeDark
        ]
      },
      _______________,
      items.sourceMode,
      ...electron.app.isPackaged ? [] : [
        _______________,
        items.toggleDevTools, 
        items.reload
      ],
    ]
  }));

  return items
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
	doc.excerpt = removeMarkdown(gm.content, 350);

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
 * Return content stripped of markdown characters.
 * And (optionally) trimmed down to specific character length.
 * Per: https://github.com/jonschlinkert/gray-matter#optionsexcerpt
 * @param {*} content 
 * @param {*} trimToLength 
 */
function removeMarkdown(content, trimToLength = undefined) {

	// Remove h1, if it exists. Currently atx-style only.
	let text = content.replace(/^# (.*)\n/gm, '');
	
	// If `trimToLength` is defined, do initial trim.
	// We will then remove markdown characters, and trim to final size.
	// We do initial trim for performance purposes: to reduce amount of
	// text that regex replacements below have to process. We add buffer
	// of 100 characters, or else trimming markdown characters could put
	// use under the specified `trimToLength` length.
	if (trimToLength) {
		text = text.substring(0, trimToLength + 100);
	}

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	text = removeMd__default['default'](text)
		.replace(blockQuotes, '') 
		.replace(newLines, '')         // New lines at start of line (usually doc)
		.replace(unwantedWhiteSpace, ' ')
		.replace(bracketedSpans, ' ');
		// .replace(citations, '')

	// If `trimToLength` is defined, trim to final length.
	if (trimToLength) {
		text = text.substring(0, trimToLength);
	}

	return text
}

const blockQuotes = /^> /gm;
const bracketedSpans = /:::.*?:::/gm;

// New lines at start of doc
const newLines = /^\n/gm;

// Replace with space:
// - New lines in-line
// - Artifact left from list replacement
// - Extra spaces
const unwantedWhiteSpace = /\n|\t|\s{2,}/gm;

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

class Watcher {
  constructor(id, project, window) {
    
    this.id = id;
    this.directory = project.directory;
    this.window = window;
    
    // If directory is populated, create the watcher
    if (this.directory) {
      this.start();
    }
  }

  // ------ VARIABLES ------ //

  id = ''
  directory = ''
  window = undefined
  
  files = {}
  chokidarInstance = undefined
  pendingChanges = []
  changeTimer = undefined


  // ------ METHODS ------ //

  /**
   * Start the chokidar instance. Called once `this.directory` is first defined.
   */
  async start() {

    // Start watcher
    this.chokidarInstance = chokidar__default['default'].watch(this.directory, chokidarConfig);

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.batchChanges('change', filePath))
      .on('add', (filePath) => this.batchChanges('add', filePath))
      .on('unlink', (filePath) => this.batchChanges('unlink', filePath))
      .on('addDir', (filePath) => this.batchChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.batchChanges('unlinkDir', filePath));

    // Map project
    this.files = await mapProject(this.directory);

    // Send initial files to browser window
    this.window.webContents.send('initialFilesFromMain', this.files);

    // Index files into DB
    insertAllDocsIntoDb(this.files);
  }

  changeDirectories(newDirectory) {
    this.chokidarInstance.unwatch(this.directory);
    this.directory = newDirectory;
    this.start();
  }


  /**
   * Stop the chokidar instance. Called when project is closed.
   */
  stop() {
    // TODO: Stop watcher when project is closed
    this.chokidarInstance.close();
  }


  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them. We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  debounceFunc = debounce.debounce(() => {
    this.applyChanges(this.pendingChanges);
    this.pendingChanges = []; // Reset
  }, 400)

  batchChanges(event, filePath, stats) {
    const change = { event: event, path: filePath };

    if (stats) change.stats = stats;

    // Push into list of pending changes
    this.pendingChanges.push(change);

    // Wait a bit, then apply the pending changes. Make the debounce timer longer if `addDir` event comes through. If it's too quick, subsequent `add` events are not caught by the timer.
    // const debounceTimer = event == 'addDir' ? 500 : 100

    this.debounceFunc();
  }


  /**
   * Take batched changes and update `files`, then send patches to associated BrowserWindow. If a directory was added or removede, remap everything.
   * @param {*} changes 
   */
  async applyChanges(changes) {

    // console.log(changes)

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir');

    if (directoryWasAddedOrRemoved) {

      // Map project
      this.files = await mapProject(this.directory);

      // Send files to browser window
      this.window.webContents.send('initialFilesFromMain', this.files);

      // Index files into DB
      insertAllDocsIntoDb(this.files);

    } else {

      // Update `files` using Immer.
      this.files = await produce__default['default'](this.files, async (draft) => {
        for (const c of changes) {
          const ext = path__default['default'].extname(c.path);
          const parentPath = path__default['default'].dirname(c.path);
          const parentId = draft.allIds.find((id) => draft.byId[id].path == parentPath);
          const parentFolder = draft.byId[parentId];
          const parentTreeItem = findInTree(draft.tree, parentFolder.id, 'id');

          if (isDoc(ext) || isMedia(ext)) {

            switch (c.event) {

              case 'add': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                // Add to `byId`
                draft.byId[file.id] = file;
                // Add to `allIds`
                draft.allIds.push(file.id);
                // Add to `tree`
                parentTreeItem.children.push({
                  id: file.id,
                  parentId: file.parentId,
                  type: file.type
                });
                // Increment `numChildren` of parent folder
                parentFolder.numChildren++;
                // Recursively increment parent folder(s) `numDescendants`
                incrementNumDescendants(parentFolder);
                function incrementNumDescendants(folder) {
                  folder.numDescendants++;
                  if (folder.parentId !== '') {
                    incrementNumDescendants(draft.byId[folder.parentId]);
                  }
                }
                // Add to database (if it's a doc)
                if (isDoc(ext)) insertDocIntoDb(file);
                break
              }

              case 'change': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                draft.byId[file.id] = file;
                // If doc, update row in db
                if (isDoc) insertDocIntoDb(file);
                break
              }

              case 'unlink': {
                const id = draft.allIds.find((id) => draft.byId[id].path == c.path);
                // Remove from `byId`
                delete draft.byId[id];
                // Remove from `allIds`
                draft.allIds.splice(draft.allIds.indexOf(id), 1);
                // Remove from `tree`
                parentTreeItem.children.splice(parentTreeItem.children.findIndex((child) => child.id == id), 1);
                // Decrement `numChidren` of parent folder
                parentFolder.numChildren--;
                // Recursively decrement parent folder(s) `numDescendants`
                decrementNumDescendants(parentFolder);
                function decrementNumDescendants(folder) {
                  folder.numDescendants--;
                  if (folder.parentId !== '') {
                    decrementNumDescendants(draft.byId[folder.parentId]);
                  }
                }
                // Delete from database (if it's a doc)
                if (isDoc(ext)) global.db.delete(file.id);
                break
              }
            }
          }

        }
      }, (patches, inversePatches) => {
        this.window.webContents.send('filesPatchesFromMain', patches);
      });
    }
  }
}




// ------ UTILITY FUNCTIONS ------ //

/**
 * For each doc found in files, add it to the sqlite database. Most important is the document body, which we need for full text search. We get it as plain text by 1) loading the doc using gray-matter, which returns `content` for us, without front matter, and 2) removing markdown formatting.
 */
function insertAllDocsIntoDb(files) {
  const filesForDb = [];
  files.allIds.forEach((id) => {
    const file = files.byId[id];
    if (file.type == 'doc') {
      filesForDb.push(getDbReadyFile(file));
    }
  });
  // Insert the files into the db
  global.db.insertMany(filesForDb);
}

/** 
 * Insert specified file in the sqlite database. If a row with the same `file.id` already exists, it will be replaced.
 */
function insertDocIntoDb(file) {
  global.db.insert(getDbReadyFile(file));
}

/**
 * Utility function that returns an object with 1) the file's metadata, and 2) it's full text content, stripped of markdown characters, excess whitespace, etc. We'll insert this object as a row in the sql database, for later full text searching.
 * @param {*} file - Taken from `files.byId`. Has title, path, etc.
 */
function getDbReadyFile(file) {

  // Get doc text, minus any front matter
  let { content } = matter__default['default'].read(file.path);

  // Remove markdown formatting from text
  content = removeMarkdown(content);

  // Return object, ready for the db.
  return {
    id: file.id,
    name: file.name,
    title: file.title,
    path: file.path,
    body: content
  }
}

const browserWindowConfig = {
  show: false,
  width: 700,
  height: 500,
  // vibrancy: 'sidebar', // Turning off due to poor performance.
  // transparent: true,
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


async function createWindow(id, project) {

  const win = new electron.BrowserWindow(browserWindowConfig);
  win.projectId = id;

  // Set window background color. Remove last two characters because we don't need alpha. Before : '#323232FF' After: '#323232'
  // TODO: Setting backgroundColor is currently broken. Background always renders as black, regardless of the value. Issue filed at https://github.com/electron/electron/issues/26842
  const backgroundColor = getSystemColors().windowBackgroundColor.slice(0, -2);
  win.setBackgroundColor(backgroundColor);

  const isNewProject = project.directory == '';

  // Set size. If project directory is empty, it's a new project, and we manually set starting values. Else we restore the previous window size and position (stored in `bounds` property)/
  // Else, create a new window centered on screen.
  if (isNewProject) {
    const padding = 200;
    const displayWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const displayHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;
    let winWidth = displayWidth - (padding * 2);
    let winHeight = displayHeight - (padding * 2);
    winWidth = winWidth > 1600 ? 1600 : winWidth;
    winHeight = winHeight > 1200 ? 1200 : winHeight;
    const offset = win.id * 20;
    const centeredX = Math.round((displayWidth - winWidth) / 2 + offset);
    const centeredY = Math.round((displayHeight - winHeight) / 2 + offset);
    win.setBounds({
      x: centeredX,
      y: centeredY,
      width: winWidth,
      height: winHeight
    }, false);
  } else {
    win.setBounds(project.window.bounds, false);

  }

  // Have to manually set this to 1.0. That should be the default, but I've had problem where something was setting it to 0.91, resulting in the UI being slightly too-small.
  // win.webContents.zoomFactor = 1.0

  // Listen for 'close' action. Can be triggered by either 1) manually closing individual window, (e.g. click close button on window, or type Cmd-W), or 2) quitting the app. 

  // If closed manually, this event is triggered twice: the first time, we prevent the default, and tell webContents to save open documents. That process results in window.status being set to `safeToClose`. ProjectManager catches that state change, and tells this window to close again.
  win.on('close', async (evt) => {

    const userManuallyClosedWindow = global.state().appStatus !== 'canSafelyQuit';
    const winIsSafeToClose = global.state().projects.byId[id].window.status == 'safeToClose';

    // If window is closing because user manually closed it (e.g. typed Cmd-W), then check if it's safe to close yet. If not, begin that process. ProjectManager will call close again once the window is safe to close, and this time, 
    if (userManuallyClosedWindow && !winIsSafeToClose) {
      // Tell window to close
      evt.preventDefault();
      win.webContents.send('mainWantsToCloseWindow');
    }
  });

  // If app is NOT quiting, we remove the project from store after closing the window. Because if the user manually closes a window, they mean to close the project. But if they quit the app, they want to their open projects to reopen, next session.
  win.on('closed', async (evt) => {
    
    const appIsNotQuiting = global.state().appStatus == 'open';
    if (appIsNotQuiting) {
      await global.store.dispatch({ type: 'REMOVE_PROJECT' }, win);
    }
    
    // If there are no other windows open, clear `focusedWindowId`
    const otherWindowsAreOpen = electron.BrowserWindow.getAllWindows().length;
    if (!otherWindowsAreOpen) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  // On resize or move, save bounds to state (wait 1 second to avoid unnecessary spamming). Using `debounce` package: https://www.npmjs.com/package/debounce
  win.on('resize', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));
  win.on('move', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));

  // On focus, set `focusedWindowId` to win.id
  win.on('focus', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  /*
  On blur, wait a beat. If the user has clicked on another Gambier window it will fire `FOCUSED_WINDOW` and set itself as the `focusedWindowId`. In which case we don't want to do anything. But if the user has clicked outside the app, `focusedWindowId` will still equal this win.projectId after the beat. In which case, set `focusedWindowId` to zero, which we take to mean that the app is in the background.
  */
  win.on('blur', async () => {
    await wait(50);
    if (global.state().focusedWindowId == win.projectId) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  // Open DevTools
  if (!electron.app.isPackaged) win.webContents.openDevTools();

  // Load index.html
  await win.loadFile(path__default['default'].join(__dirname, 'index.html'), {
    query: {
      id: win.projectId
    },
  });

  // Save window bounds
  saveWindowBoundsToState(win);

  // Set project window status to 'open'
  global.store.dispatch({
    type: 'OPENED_PROJECT_WINDOW',
  }, win);

  return win
}

/**
 * Save window bounds to state, so we can restore after restart.
 */
function saveWindowBoundsToState(win) {
  global.store.dispatch({
    type: 'SAVE_PROJECT_WINDOW_BOUNDS',
    windowBounds: win.getBounds()
  }, win);
}

// let projects = {
//   allIds: [],
//   byId: {}
// }

function init$3() {

  // ------ SETUP CHANGE LISTENERS ------ //

  global.store.onDidAnyChange(async (state, oldState) => {

    const projectAdded = state.projects.allIds.length > oldState.projects.allIds.length;

    const projectRemoved = state.projects.allIds.length < oldState.projects.allIds.length;

    const aProjectDirectoryHasChanged = stateHasChanged(global.patches, ['projects', 'byId', 'directory']);

    const aWindowIsSafeToClose = stateHasChanged(global.patches, ['window', 'status'], 'safeToClose');

    const appIsQuitting = propHasChangedTo('appStatus', 'wantsToQuit', state, oldState);


    // If project added, create a Window and Watcher 
    // Determine new project by comparing new and old `allIds`.
    if (projectAdded) {
      const id = getArrayDiff(state.projects.allIds, oldState.projects.allIds)[0];
      createWindowAndWatcher(state, id);
    }

    // If project directory changed, update (or start) the Watcher
    if (aProjectDirectoryHasChanged) {
      const projectIds = getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState);
      projectIds.forEach((id) => {
        const project = state.projects.byId[id];
        const watcher = global.watchers.find((watcher) => watcher.id == id);
        const watcherIsRunning = watcher.directory !== '';
        if (!watcherIsRunning) {
          watcher.directory = project.directory;
          watcher.start();
        } else {
          watcher.changeDirectories(project.directory);
        }
      });
    }

    // If project removed, stop the watcher, then remove from `global.watchers`.
    // Determine removed project by comparing old and new `allIds`.
    if (projectRemoved) {
      const id = getArrayDiff(oldState.projects.allIds, state.projects.allIds)[0];
      const watcher = global.watchers.find((w) => w.id == id);
      const indexOfWatcher = global.watchers.findIndex((w) => w.id == id);
      watcher.stop();
      global.watchers.splice(indexOfWatcher, 1);
    }

    // Close any window whose `window.status` just changed to 'safeToClose'
    if (aWindowIsSafeToClose) {
      const windowsToClose = getWindowsThatAreSafeToClose(state, oldState);
      windowsToClose.forEach((window) => window.close());
    }

    // If app is quitting, initiate closing procedure for all windows
    if (appIsQuitting) {
      startToCloseAllWindows();
    }
  });


  // ------ DO INITIAL SETUP ------ //

  const state = global.state();

  // On startup, for each project, create a Window and Watcher
  state.projects.allIds.forEach((id) => {
    createWindowAndWatcher(state, id);
  });
}






/**
 * Create a window and watcher for a project
 * @param {*} id - Of the project
 */
async function createWindowAndWatcher(state, id) {
  const project = state.projects.byId[id];
  const window = await createWindow(id, project);
  const watcher = new Watcher(id, project, window);
  global.watchers.push(watcher);
}
 

/**
 * Get projects whose directories have changed
 */
function getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState) {
  let projects = [];
  state.projects.allIds.forEach((id) => {
    const directory = state.projects.byId[id].directory;
    const oldDirectory = oldState.projects.byId[id].directory;
    if (directory !== oldDirectory) {
      projects.push(id);
    }
  });
  return projects
}

/**
 * Get windows that are safe to close
 */
function getWindowsThatAreSafeToClose(state, oldState) {
  let windows = [];
  state.projects.allIds.forEach((id) => {
    const windowStatus = state.projects.byId[id].window.status;
    const oldWindowStatus = oldState.projects.byId[id]?.window.status;
    if (windowStatus == 'safeToClose' && oldWindowStatus !== 'safeToClose') {
      const window = electron.BrowserWindow.getAllWindows().find((win) => win.projectId == id);
      windows.push(window);
    }
  });
  return windows
}

/**
 * Called when appStatus changes to `wantsToQuit`.
 */
function startToCloseAllWindows() {
  const windows = electron.BrowserWindow.getAllWindows();
  if (windows.length) {
    windows.forEach((win) => win.webContents.send('mainWantsToCloseWindow'));
  }
}

const preferencesWindowConfig = {
  show: false,
  // width: 1060, // With dev tools open
  width: 700,
  height: 480,
  zoomFactor: 1.0,
  titleBarStyle: 'hidden',
  resizable: false,
  webPreferences: {
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

function init$4() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // Did `prefs: isOpen` change?
  global.store.onDidAnyChange((state, oldState) => {
    if (state.prefs.isOpen !== oldState.prefs.isOpen && state.prefs.isOpen) {
      open();
    }
  });
}

async function open() {

  const win = new electron.BrowserWindow(preferencesWindowConfig);

  win.once('ready-to-show', () => {
    win.show();
  });

  // 'projectId' is a bit of a misnomer for Preferences, but we use it for the sake of consistency.
  win.projectId = 'preferences';

  // On focus, set `focusedWindowId` to win.id
  win.on('focus', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  /*
  On blur, wait a beat. If the user has clicked on another Gambier window it will fire `FOCUSED_WINDOW` and set itself as the `focusedWindowId`. In which case we don't want to do anything. But if the user has clicked outside the app, `focusedWindowId` will still equal this win.projectId after the beat. In which case, set `focusedWindowId` to zero, which we take to mean that the app is in the background.
  */
  win.on('blur', async () => {
    await wait(50);
    if (global.state().focusedWindowId == win.projectId) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  win.on('close', () => {
    global.store.dispatch({ type: 'CLOSE_PREFERENCES' });
  });

  // if (!app.isPackaged) {
  //   win.webContents.openDevTools();
  //   win.setBounds({ width: 1060 })
  // }

  // Load index.html
  await win.loadFile(path__default['default'].join(__dirname, 'preferences.html'), {
    query: {
      id: win.projectId
    },
  });
}

// External dependencies


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;


// -------- Reload (Development-only) -------- //

electron.app.commandLine.appendSwitch('inspect=5858');
electron.app.commandLine.appendSwitch('enable-transparent-visuals');

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
    // hardResetMethod: 'exit',
    argv: ['--inspect=5858', '--enable-transparent-visuals'],
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

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

// Create store (and global variables for store and state)
global.store = new Store();
global.state = () => global.store.store;
global.patches = []; // Most recent patches from Immer
global.watchers = []; // Watchers. Are populdated by ProjectManager

// Create Sqlite databaase (happens in the constructor). 
// Class instance has useful functions for interacting w/ the db.
// E.g. Insert new row, update, etc.
global.db = new DbManager();

// Start app
electron.app.whenReady()
  .then(async () => {

    // Create IPC listeners/handlers
    init$1();

    // Setup preferences manager
    init$4();

    // Setup menu bar
    init$2();

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' });

    // Get initial system appearance values
    init();

    // Create windows and watchers for projects
    init$3();
    
    // App startup complete!
    await global.store.dispatch({ type: 'FINISH_COLD_START' });
  });


// -------- LISTENERS -------- //

// Start to quit app: Set appStatus to 'safeToQuit'. This triggers windows to close. Once all of them have safely closed (e.g. open docs are saved), appStatus is updated to 'safeToQuit', and we call `app.quit` again. This time it will go through.

electron.app.on('before-quit', async (evt) => {
  if (global.state().appStatus == 'open') {
    evt.preventDefault();
    await global.store.dispatch({
      type: 'START_TO_QUIT'
    });
  } else if (global.state().appStatus == 'wantsToQuit') {
    // Prevent quitting while quit is already in progress
    evt.preventDefault();
  }
});

/**
 * Quit app when appStatus changes to 'safeToQuit'
 */
global.store.onDidAnyChange(async (state, oldState) => {

  const canSafelyQuit = propHasChangedTo('appStatus', 'canSafelyQuit', state, oldState);

  if (canSafelyQuit) {
    electron.app.quit();
  }
  
  // if (state.appStatus == 'wantsToQuit') {
  //   const allWindowsAreSafeToClose = state.projects.allIds.every((id) => {
  //     const project = state.projects.byId[id]
  //     return project.status == 'safeToClose'
  //   })

  //   if (allWindowsAreSafeToClose) {
  //     // await global.store.dispatch({ type: 'CAN_SAFELY_QUIT' });
  //     electron.app.quit();
  //   }
  // }
});

// On all windows closed, do nothing. Leave app open.
electron.app.on('window-all-closed', () => {
  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});
//# sourceMappingURL=main.js.map
