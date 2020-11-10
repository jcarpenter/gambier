'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var path = _interopDefault(require('path'));
var fsExtra = require('fs-extra');
var ElectronStore = _interopDefault(require('electron-store'));
var immer = require('immer');
require('colors');
require('deep-eql');
require('deep-object-diff');
var chokidar = _interopDefault(require('chokidar'));
var matter = _interopDefault(require('gray-matter'));
var removeMd = _interopDefault(require('remove-markdown'));
require('deep-diff');
require('child_process');
require('url');

immer.enablePatches();

const update = (state, action, windowId) =>
  immer.produceWithPatches(state, (draft) => {

    // Set a few useful, commonly-used variables
    const win = windowId !== undefined ? electron.BrowserWindow.fromId(windowId) : undefined;
    const project = windowId !== undefined ? draft.projects.find((p) => p.window.id == windowId) : undefined;

    switch (action.type) {

      // -------- APP -------- //

      case 'START_COLD_START': {
        // Update appStatus
        draft.appStatus = 'coldStarting';
        // Create new project, if there are none existing
        const noExistingProjects = state.projects.length == 0;
        if (noExistingProjects) {
          createNewProject(draft);
        } else {
          // Check if directory still exists. Perhaps they've been deleted since the app was last opened. If it does not exist, or is empty '', remove the project.
          state.projects.forEach((p, index) => {
            const directoryExists = fsExtra.existsSync(p.directory);
            if (!directoryExists) {
              draft.projects.splice(index, 1);
            }
          });
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


      // -------- PROJECT/WINDOW: CREATE AND CLOSE -------- //

      case 'CREATE_NEW_PROJECT': {
        createNewProject(draft);
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        project.directory = action.directory;
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


      // Directory

      case 'SET_PROJECTPATH_SUCCESS': {
        project.directory = action.path;
        break
      }

      case 'SET_PROJECTPATH_FAIL': {
        // DO NOTHING
        break
      }

      // UI

      case 'SET_LAYOUT_FOCUS': {
        project.focusedLayoutSection = action.section;
        break
      }

      case 'SELECT_SIDEBAR_TAB_BY_NAME': {
        project.sidebar.tabs.forEach((t) => t.active = t.name == action.name);
        break
      }

    }
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
function createNewProject(draft) {
  const project = { ...newProject$1 };
  project.window.id = getNextWindowId();
  draft.projects.push(project);
}

class Store extends ElectronStore {
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

    if (!electron.app.isPackaged) this.logTheAction(action);

    // Get next state
    // const nextState = await reducers(action, windowId)

    const [nextState, patches, inversePatches] = update(store.store, action, windowId);

    // if (!app.isPackaged) this.logTheDiff(global.state(), nextState)

    // Apply nextState to Store
    this.set(nextState);

    // Send patches to render proces
    const windows = electron.BrowserWindow.getAllWindows();
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', patches));
    }
  }

  logTheAction(action) {
    console.log(
      // `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      // `(Store.js)`.green
    );
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

};

const newProject$1 = {

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
};

class AppearanceManager {
  constructor() {

  }
}

// // -------- Theme -------- //

// /**
//  * When OS appearance changes, update app theme to match (dark or light):
//  * NOTE: Is also called on startup.
//  * Listen for changes to nativeTheme. These are triggered when the OS appearance changes (e.g. when the user modifies "Appearance" in System Preferences > General, on Mac). If the user has selected the "Match System" appearance option in the app, we need to match the new OS appearance. Check the `nativeTheme.shouldUseDarkColors` value, and set the theme accordingly (dark or light).
//  * nativeTheme.on('updated'): "Emitted when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."
//  */
// nativeTheme.on('updated', () => {

//   // console.log("nativeTheme updated:")
//   // console.log(nativeTheme.themeSource)
//   // console.log(nativeTheme.shouldUseDarkColors)
//   // console.log(nativeTheme.shouldUseHighContrastColors)
//   // console.log(nativeTheme.shouldUseInvertedColorScheme)
//   // console.log('selected-text-background = ', systemPreferences.getColor('selected-text-background'))

//   const userPref = store.store.appearance.userPref
//   console.log("main.js: nativeTheme updated")
//   if (userPref == 'match-system') {
//     store.dispatch({
//       type: 'SET_APPEARANCE',
//       theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
//     })
//   }
// })

// /**
//  * When user modifies "Appearance" setting (e.g in `View` menu), update `nativeTheme`
//  */
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

const Document = {
  type: 'doc',
  title: '',
  name: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
  excerpt: '',
  tags: [],
  nestDepth: 0,
};

const Folder = {
  type: 'folder',
  name: '',
  path: '',
  // id: '',
  parentId: '',
  modified: '',
  // directChildCount: 0,
  // recursiveChildCount: 0,
  nestDepth: 0
};

const Media = {
  type: 'media',
  name: '',
  filetype: '',
  disksize: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
  nestDepth: 0,
};

const imageFormats = [
  '.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
];

const avFormats = [
  '.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'
];

/**
 * For specified path, return document details
 */
async function mapDocument (filePath, stats = undefined, parentId = '', nestDepth) {

	const doc = Object.assign({}, Document);

	if (stats == undefined) {
		stats = await fsExtra.stat(filePath);
	}

	doc.path = filePath;
	doc.id = `doc-${stats.ino}`;
	doc.parentId = parentId;
	doc.modified = stats.mtime.toISOString();
	doc.created = stats.birthtime.toISOString();
	doc.nestDepth = nestDepth;

	// Get front matter
	const gm = matter.read(filePath);

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

	// Set title. E.g. "Sea Level Rise"
	doc.title = getTitle(gm, path.basename(filePath));
	doc.name = doc.title;

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
 * 3. From filename, minus extension
 */
function getTitle(graymatter, filename) {

	let titleFromH1 = graymatter.content.match(/^# (.*)$/m);
	if (titleFromH1) {
		return titleFromH1[1]
	} else if (graymatter.data.hasOwnProperty('title')) {
		return graymatter.data.title
	} else {
		return filename.slice(0, filename.lastIndexOf('.'))
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
		.substring(0, 400);

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	excerpt = removeMd(excerpt)
		.replace(/^> /gm, '')         // Block quotes
		.replace(/^\n/gm, '')         // New lines at start of line (usually doc)
		.replace(/\n/gm, ' ')         // New lines in-line (replace with spaces)
		.replace(/\t/gm, ' ')         // Artifact left from list replacement
		.replace(/\[@.*?\]/gm, '')    // Citations
		.replace(/:::.*?:::/gm, ' ')  // Bracketed spans
		.replace(/\s{2,}/gm, ' ')     // Extra spaces
		.substring(0, 200);            // Trim to 200 characters

	return excerpt
}

/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} recursive - Optional. If true, map descendant directories also.
 */
async function mapFolder (files, folderPath, stats = undefined, parentId = '', recursive = false, nestDepth = 0) {

  // -------- New Folder -------- //

  if (!stats) stats = await fsExtra.stat(folderPath);

  const folder = { ...Folder };
  // folder.id = `folder-${stats.ino}`
  folder.name = folderPath.substring(folderPath.lastIndexOf('/') + 1);
  folder.path = folderPath;
  folder.parentId = parentId;
  folder.modified = stats.mtime.toISOString();
  folder.children = [];
  folder.nestDepth = nestDepth;

  const id = `folder-${stats.ino}`;
  files.folders.byId[id] = folder;
  files.folders.allIds.push(id);


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of `fs.Dirent` objects.
  // https://nodejs.org/api/fs.html#fs_class_fs_dirent
  const everything = await fsExtra.readdir(folderPath, { withFileTypes: true });

  // if (!everything.length > 0) return contents
  // console.log(folder.name, "---")

  // everything.forEach(async (e) => {

  //   if (e.isFile()) {

  //     const ePath = path.join(folder.path, e.name)
  //     const ext = path.extname(e.name)
  //     const stats = await stat(ePath)

  //     if (ext == '.md' || ext == '.markdown') {
  //       folder.children.push(`doc-${stats.ino}`)
  //     }
  //   }
  // })

  await Promise.all(
    everything.map(async (e) => {

      // Get path by combining folderPath with file name.
      const ePath = path.join(folderPath, e.name);

      // Get extension
      const ext = path.extname(e.name);

      // Get stats
      const stats = await fsExtra.stat(ePath);

      if (e.isDirectory() && recursive) {

        const { folders, docs, media } = await mapFolder(files, ePath, stats, id, true, nestDepth + 1);

        // folder.directChildCount++
        // folder.recursiveChildCount++

        // for (const fldr in folders.byId) {
        //   folder.recursiveChildCount += folders.byId[fldr].directChildCount
        // }

        // folders.byId.forEach((f) => {
        //   folder.recursiveChildCount += f.directChildCount
        // })

      } else if (ext == '.md' || ext == '.markdown') {
        const doc = await mapDocument(ePath, stats, folder.id, nestDepth + 1);
        files.docs.byId[doc.id] = folder;
        files.docs.allIds.push(doc.id);
        // folder.directChildCount++
        // folder.recursiveChildCount++

        // OLDER
        // contents.documents.push(doc)
        // folder.children.push(doc.id)

      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {

        const media = await mapMedia(ePath, stats, folder.id, ext, nestDepth + 1);
        files.media.byId[media.id] = folder;
        files.media.allIds.push(media.id);
        // folder.directChildCount++
        // folder.recursiveChildCount++

        // OLDER
        // contents.media.push(media)
        // folder.children.push(media.id)
      }
    })
  );

  return files
}

/**
 * For specified path, return document details
 */
async function mapMedia (filePath, stats = undefined, parentId = '', extension = undefined, nestDepth) {

	const media = { ...Media };

	if (stats == undefined) stats = await fsExtra.stat(filePath);	

	media.name = path.basename(filePath);
	media.filetype = extension == undefined ? path.extname(filePath) : extension;
	media.path = filePath;
	media.id = `media-${stats.ino}`;
	media.parentId = parentId;
	media.modified = stats.mtime.toISOString();
	media.created = stats.birthtime.toISOString();
	media.nestDepth = nestDepth;

	return media
}

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
async function mapProject(projectPath) {

  // await isWorkingPath(directory)
  // if (!isWorkingPath) {
  //   console.error('directory is not valid')
  // }
  
  try {

    const files = {
      folders: {
        byId: {},
        allIds: []
      },
      docs: {
        byId: {},
        allIds: []
      },
      media: {
        byId: {},
        allIds: []
      }
    };

    // Map project path, recursively
    return await mapFolder(files, projectPath, undefined, '', true, 0)
    // console.log(JSON.stringify(files, null, 2))
    
    // Dispatch results to store
    // store.dispatch({
    //   type: 'MAP_PROJECT_CONTENTS',
    //   folders: folders,
    //   documents: documents,
    //   media: media,
    // })

  } catch (err) {
    console.log(err);
  }
}

immer.enablePatches();

class Watcher {
  constructor(project) {
    this.id = project.window.id;
    this.directory = project.directory;
    this.files = { ...newFiles };

    // If directory is not empty (e.g. when restarting the app with a project already set up), start the watcher. 
    // Else, start listening for directory value changes. Once user selects a project directory (e.g. in the first run experience), catch it 

    const directoryIsDefined = this.directory !== '';
    if (directoryIsDefined) {
      this.start();
    } else {
      // Create listener for directory changes
      global.store.onDidAnyChange((state, oldState) => {
        const directory = state.projects.find((p) => p.window.id == this.id).directory;
        const directoryIsDefined = directory !== '';
        if (directoryIsDefined) {
          this.directory = directory;
          this.start();
        }
      });
    }
  }

  chokidarInstance = undefined
  changes = []
  changeTimer = undefined
  directory = ''
  files = {}
  id = 0

  async start() {
    // TODO: This is a potential dead end. The watcher will not start, because the directory is invalid (e.g. perhaps it was deleted since last cold start)
    const directoryExists = await fsExtra.pathExists(this.directory);
    if (!directoryExists) return

    this.files = await mapProject(this.directory);
    // console.log(this.files)

    // Start watcher
    this.chokidarInstance = chokidar.watch(this.directory, chokidarConfig);

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.trackChanges('change', filePath))
      .on('add', (filePath) => this.trackChanges('add', filePath))
      .on('unlink', (filePath) => this.trackChanges('unlink', filePath))
      .on('addDir', (filePath) => this.trackChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.trackChanges('unlinkDir', filePath));
  }

  applyUpdates() {
    const [nextFiles, patches, inversePatches] = immer.produceWithPatches(files, draftFiles => {
      const newProj = { ...newProject, windowId: project.window.id };
      draftFiles.push(newProj);
    });
  }

  sendPatchesToRenderProcess(patches) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', patches));
    }
  }

  stop() {
    // await watcher.close()

  }

  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them.We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  trackChanges(event, filePath, stats) {
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

  async applyChanges(changes) {

    console.log(
      this.files.folders.allIds.length,
      this.files.docs.allIds.length,
      this.files.media.allIds.length
    );

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir');

    if (directoryWasAddedOrRemoved) {
      this.files = await mapProject(this.directory);
    } else {

      const [nextFiles, patches, inversePatches] = immer.produceWithPatches(this.files, draft => {
        changes.forEach(async (c) => {

          const ext = path.extname(c.path);
          const type = getFileType(ext);
          const parentPath = path.dirname(c.path);
          const parentFolder = getFileByPath(this.files.folders, parentPath);

          // TODO: Fix use of `await` inside `produceWithPatches`... Is throwing error in `add` and `change`.

          switch (c.event) {
            case 'add':
              if (type == 'doc') {
                const doc = await mapDocument(c.path, c.stats, parentFolder.id);
                draft.docs.byId[doc.id] = doc;
                draft.docs.allIds.push(doc.id);
              } else if (type == 'media') {
                const media = await mapMedia(c.path, c.stats, parentFolder.id, ext);
                draft.media.byId[media.id] = media;
                draft.media.allIds.push(media.id);
              }
              break
            case 'change':
              if (type == 'doc') {
                const doc = await mapDocument(c.path, c.stats, parentFolder.id);
                draft.docs.byId[doc.id] = doc;
              } else if (type == 'media') {
                const media = await mapMedia(c.path, c.stats, parentFolder.id, ext);
                draft.media.byId[media.id] = media;
              }
              break
            case 'unlink':
              if (type == 'doc') {
                const doc = getFileByPath(this.files.docs, c.path);
                delete draft.docs.byId[doc.id];
                draft.docs.allIds.splice(doc.index, 1);
              } else if (type == 'media') {
                const media = getFileByPath(this.files.media, c.path);
                delete draft.media.byId[media.id];
                draft.media.allIds.splice(media.index, 1);
              }
              break
          }
        });
      });

      this.files = nextFiles;
      console.log(
        this.files.folders.allIds.length,
        this.files.docs.allIds.length,
        this.files.media.allIds.length
      );
    }
  }
}

/** Utility function for determining file type. */
function getFileType(ext) {
  if (ext == '.md' || ext == '.markdown') {
    return 'doc'
  } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
    return 'media'
  } else {
    return 'unknown'
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
        file: lookIn.byId[id],
        index: index,
      };
      return true
    }
  });
  return file
}

// Do initial project map, if projectPath has been set)
// if (store.store.projectPath !== '') {
//   mapProject(store.store.projectPath, store)
// }

const newFiles = {
  folders: {
    byId: [],
    allIds: []
  },
  docs: {
    byId: [],
    allIds: []
  },
  media: {
    byId: [],
    allIds: []
  }
};

/**
 * Chokida rdocs: https://www.npmjs.com/package/chokidar
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
		global.store.onDidAnyChange((state, oldState) => {

			const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState);
			const projectAdded = state.projects.length > oldState.projects.length;
			const projectRemoved = state.projects.length < oldState.projects.length;

			if (isStartingUp) {
				state.projects.forEach((p, index) => {
					// Create Watcher and add to `watchers` array
					const watcher = new Watcher(p);
					this.watchers.push(watcher);
				});
			} else if (projectAdded) {
				// Get new project. Then create Watcher and add to `watchers` array
				const project = state.projects[state.projects.length - 1];
				const watcher = new Watcher(project);
				this.watchers.push(watcher);
			}
		});
	}

	// Array of Watcher instances.
	watchers = []
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

async function setProjectPath () {

  const win = electron.BrowserWindow.getFocusedWindow();

  const selection = await electron.dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (!selection.canceled) {
    return { type: 'SET_PROJECT_DIRECTORY', directory: selection.filePaths[0] }
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
        case ('SELECT_PROJECT_DIRECTORY'):
          store.dispatch(await setProjectPath(), win.id);
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

    electron.ipcMain.handle('getState', (evt) => {
      return global.state()
    });

    electron.ipcMain.handle('getFiles', (evt) => {
      const win = electron.BrowserWindow.fromWebContents(evt.sender);
      const watcher = global.watchers.find((watcher) => watcher.id == win.id);
      return watcher.files
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
      const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState);
      if (isStartingUp) {
        state.projects.forEach(async (p, index) => {
          this.createWindow(index);
        });
      } else if (state.projects.length > oldState.projects.length) {
        this.createWindow(state.projects.length - 1);
      }
    });
  }

  createWindow(projectIndex) {

    const win = new electron.BrowserWindow(browserWindowConfig);

    // Load index.html
    win.loadFile(path.join(__dirname, 'index.html'), {
      query: {
        id: win.id
      },
    });

    // Have to manually set this to 1.0. That should be the default, but somewhere it's being set to 0.91, resulting in the UI being slightly too-small.
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


const browserWindowConfig = {
  show: false,
  width: 1600,
  height: 900,
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
    preload: path.join(__dirname, 'js/preload.js')
  }
};

// External dependencies


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;


// -------- Reload (Development-only) -------- //

if (!electron.app.isPackaged) {

  const watchAndReload = [
    path.join(__dirname, '**/*.js'),
    path.join(__dirname, '**/*.html'),
    path.join(__dirname, '**/*.css'),
    path.join(__dirname, '**/*.xml')
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
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
    // argv: ['--inspect=5858'],
  });

  console.log('// - - - - - - - - - - - - - - -');
  console.log(`Gambier. Electron ${process.versions.electron}. Chrome ${process.versions['chrome']}`);
}


// -------- SETUP -------- //

// Create store (and global variables for store and state)
global.store = new Store();
global.state = () => global.store.store;

// Create managers
const appearanceManager = new AppearanceManager();
const diskManager = new DiskManager();
const ipcManager = new IpcManager();
const menuBarManager = new MenuBarManager();
const windowManager = new WindowManager();

// One more global variable
global.watchers = diskManager.watchers;

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

// Start app
electron.app.whenReady()
  .then(appearanceManager.setNativeTheme)
  .then(async () => {
    await global.store.dispatch({ type: 'START_COLD_START' });
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
