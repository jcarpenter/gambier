'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var path = _interopDefault(require('path'));
require('electron-localshortcut');
var fsExtra = require('fs-extra');
var Store = _interopDefault(require('electron-store'));
require('svelte/internal');
var diff = _interopDefault(require('deep-diff'));
require('colors');
var deepEql = _interopDefault(require('deep-eql'));
require('deep-object-diff');
var chokidar = _interopDefault(require('chokidar'));
var matter = _interopDefault(require('gray-matter'));
var removeMd = _interopDefault(require('remove-markdown'));

const StoreSchema = {

  changed: { type: 'array', default: [] },

  focusedLayoutSection: {
    type: 'string',
    default: 'navigation',
  },

  openFile: {
    type: 'object',
    default: {}
  },

  selectedSideBarItemId: {
    type: 'string',
    default: '',
  },

  showFilesList: {
    type: 'boolean',
    default: true
  },

  rootFolderId: {
    type: 'string',
    default: ''
  },

  projectPath: {
    descrition: 'User specified path to folder containing their project files',
    type: 'string',
    default: ''
  },

  projectCitations: {
    descrition: 'User specified path to CSL-JSON file containing their citatons',
    type: 'string',
    default: ''
  },

  sideBar: {
    type: 'object',
    properties: {
      show: { type: 'boolean', default: true },
      items: {
        type: 'array', default: [
          {
            label: 'Files',
            id: 'files-group',
            type: 'group'
          },
          {
            label: 'All',
            id: 'all',
            parentId: 'files-group',
            type: 'filesFilter',
            icon: 'images/sidebar-default-icon.svg',
            showFilesList: true,
            searchParams: {
              lookInFolderId: 'root',
              includeChildren: true,
            },
            selectedFileId: '',
            lastScrollPosition: 0,
            lastSelection: [],
          },
          {
            label: 'Favorites',
            id: 'favorites',
            parentId: 'files-group',
            type: 'filesFilter',
            icon: 'images/sidebar-default-icon.svg',
            showFilesList: true,
            searchParams: {
              lookInFolderId: 'root',
              includeChildren: true,
              tags: ['favorite']
            },
            selectedFileId: '',
            lastScrollPosition: 0,
            lastSelection: [],
          },
          {
            label: 'Most Recent',
            id: 'most-recent',
            parentId: 'files-group',
            type: 'filesFilter',
            icon: 'images/sidebar-default-icon.svg',
            showFilesList: true,
            searchParams: {
              lookInFolderId: 'root',
              includeChildren: true,
              filterDateModified: true,
              fromDateModified: 'today',
              toDateModified: '7-days-ago'
            },
            selectedFileId: '',
            lastScrollPosition: 0,
            lastSelection: [],
          },
          {
            label: '',
            id: '',
            isRoot: true,
            parentId: 'files-group',
            type: 'filesFolder',
            icon: 'images/folder.svg',
            showFilesList: true,
            searchParams: {
              lookInFolderId: 'root',
              includeChildren: false,
              filterDateModified: false,
            },
            selectedFileId: '',
            lastScrollPosition: 0,
            lastSelection: [],
            expanded: true
          },
          {
            label: 'Citations',
            id: 'citations-group',
            type: 'group'
          },
          {
            label: 'Citations',
            id: 'citations',
            parentId: 'citations-group',
            type: 'other',
            icon: 'images/sidebar-default-icon.svg',
            showFilesList: false,
            lastScrollPosition: 0,
            lastSelection: [],
          }
        ]
      },
    },
    default: {}
  },

  // fileList: {
  //   type: 'object',
  //   properties: {
  //     items: { type: 'array', default: [] }
  //   },
  //   default: {}
  // },

  contents: { 
    type: 'array', 
    default: [] 
  },

  // TODO: For `searchInElement`, add enum of possible elements, matching CodeMirror mode assignments.
  // filesSearchCriteria: {
  //   type: 'object',
  //   properties: {
  //     lookInFolderId: { type: 'string', default: '' },
  //     includeChildren: { type: 'boolean', default: false },
  //     searchFor: { type: 'string', default: '*' },
  //     searchInElement: { type: 'string', default: '*' },
  //     matchWholeWord: { type: 'boolean', default: false },
  //     matchCase: { type: 'boolean', default: false },
  //     filterDateModified: { type: 'boolean', default: false },
  //     fromDateModified: { type: 'string', format: 'date-time' },
  //     toDateModified: { type: 'string', format: 'date-time' },
  //     filterDateCreated: { type: 'boolean', default: false },
  //     fromDateCreated: { type: 'string', format: 'date-time' },
  //     toDateCreated: { type: 'string', format: 'date-time' },
  //     tags: { type: 'array', default: [] }
  //   },
  //   default: {
  //     lookInFolderId: '',
  //     includeChildren: false,
  //     searchFor: '',
  //     searchInElement: '*',
  //     matchWholeWord: false,
  //     matchCase: false,
  //     filterDateModified: false,
  //     filterDateCreated: false,
  //     tags: []
  //   }
  // },

  // appStartupTime: {
  //   type: 'string',
  //   default: 'undefined'
  // },

  // hierarchy: {
  //   description: 'Snapshot of hierarchy of project directory: files and directories. This is a recursive setup: directories can contain directories. Per: https://json-schema.org/understanding-json-schema/structuring.html#id1. Note: `id` can be anything, but it must be present, or our $refs will not work.',
  //   $schema: 'http://json-schema.org/draft-07/schema#',
  //   $id: 'anything-could-go-here',
  //   definitions: {
  //     'fileOrDirectory': {
  //       type: 'object',
  //       required: ['typeOf', 'name', 'path'],
  //       properties: {
  //         typeOf: { type: 'string', enum: ['File', 'Directory'] },
  //         name: { type: 'string' },
  //         path: { type: 'string' },
  //         created: { type: 'string', format: 'date-time' },
  //         modified: { type: 'string', format: 'date-time' },
  //         children: {
  //           type: 'array',
  //           items: { $ref: '#/definitions/fileOrDirectory' }
  //         }
  //       }
  //     }
  //   },
  //   type: 'array',
  //   items: { $ref: '#/definitions/fileOrDirectory' },
  //   default: []
  // }
};

function getRootFolder(contents) {
  return contents.find((c) => c.type == 'folder' && c.isRoot)
}

function getSideBarItem(sideBarItems, id) {
  return sideBarItems.find((i) => i.id == id)
}

function updateSideBarItems(newState) {

  const rootFolder = getRootFolder(newState.contents);

  // Update `filesFilter` type items: 
  // Specifically, their lookInFolder values, to point to correct `contents` id.
  // They always operate on the rootFolder
  newState.sideBar.items.forEach((i) => {
    if (i.type == 'filesFilter') {
      i.searchParams.lookInFolderId = rootFolder.id;
    }
  });

  // Update `filesFolder` type items:
  // Update root folder item. This item holds the project file hierarchy, in the UI.
  const rootFolderItem = newState.sideBar.items.find((i) => i.type == 'filesFolder' && i.isRoot);
  rootFolderItem.label = rootFolder.name;
  rootFolderItem.id = rootFolder.id;
  rootFolderItem.searchParams.lookInFolderId = rootFolder.id;

  // Remove existing child folder items.
  newState.sideBar.items = newState.sideBar.items.filter((i) => i.isRoot || i.type !== 'filesFolder');

  // Add child folder items.
  // For each, set parent item as root folder item, and push into items array.
  if (rootFolder.childFolderCount > 0) {
    createAndInsertChildFolderItems(rootFolder);
  }

  function createAndInsertChildFolderItems(folder) {

    // For the given folder in contents, find it's children,
    // create a new sideBar item for each, and recursively do 
    // the same for their children, in turn

    newState.contents.map((c) => {
      if (c.type == 'folder' && c.parentId == folder.id) {

        const childFolderItem = {
          label: c.name,
          id: c.id,
          parentId: folder.id,
          type: 'filesFolder',
          isRoot: false,
          icon: 'images/folder.svg',
          showFilesList: true,
          searchParams: {
            lookInFolderId: c.id,
            includeChildren: false
          },
          selectedFileId: '',
          lastScrollPosition: 0,
          lastSelection: [],

        };

        newState.sideBar.items.push(childFolderItem);

        // Recursive loop
        if (c.childFolderCount > 0) {
          createAndInsertChildFolderItems(c);
        }
      }
    });
  }
}

/**
 * Copy object of the selected file from `state.contents` into top-level `state.openFile`
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenFile(newState, selectedSideBarItem) {
  
  const lastSelection = selectedSideBarItem.lastSelection;
  if (lastSelection.length == 1) {
    newState.openFile = newState.contents.find((c) => c.type == 'file' && c.id == lastSelection[0].id);
  } else {
    newState.openFile = {};
  }

  console.log(newState.openFile);
}




/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
function reducers(state = {}, action) {

  const newState = Object.assign({}, state);

  // newState.lastAction = action.type
  newState.changed = []; // Reset on every action 

  switch (action.type) {


    // -------- EDITOR -------- //

    case 'LOAD_PATH_IN_EDITOR': {
      newState.editingFileId = action.id;
      newState.changed.push('editingFileId');
      break
    }

    case 'SET_PROJECTPATH_FAIL': {
      // DO NOTHING
      break
    }


    // -------- PROJECT PATH -------- //

    case 'SET_PROJECTPATH_SUCCESS': {
      newState.projectPath = action.path;
      newState.changed.push('projectPath');
      break
    }

    case 'SET_PROJECTPATH_FAIL': {
      // DO NOTHING
      break
    }


    // -------- FILES -------- //

    case 'SAVE_FILE_SUCCESS': {
      // Apply changes to record in `contents`
      const lhs = newState.contents.find((c) => c.id == action.metadata.id);
      const rhs = action.metadata;
      diff.observableDiff(lhs, rhs, (d) => {
        diff.applyChange(lhs, rhs, d);
      });
      break
    }

    case 'SAVE_FILE_FAIL': {
      console.log(`Reducers: SAVE_FILE_FAIL: ${action.path}`.red);
      break
    }

    // Delete _file_ (singular)

    case 'DELETE_FILE_SUCCESS': {

      console.log(`Reducers: DELETE_FILE_SUCCESS: ${action.path}`.green);

      // let contentIndex

      // const contentObj = newState.contents.find((c, index) => {
      //   if (c.type == 'file' && c.path == action.path) {
      //     contentIndex = index
      //     return true
      //   }
      // })

      // // Delete from `contents` array
      // if (contentIndex !== -1) {
      //   newState.contents.splice(contentIndex, 1)
      // }

      // newState.changed.push('contents')

      // TODO: Update newState.sideBar.items 
      // if ()
      // sideBar.items.map((i) => {
      //   if (i.selectedFileId == contentObj.id) {

      //   }
      // })

      break
    }

    case 'DELETE_FILE_FAIL': {
      console.log(`Reducers: DELETE_FILE_FAIL: ${action.err}`.red);
      break
    }

    // Delete _files_ (plural)

    case 'DELETE_FILES_SUCCESS': {
      console.log(`Reducers: DELETE_FILES_SUCCESS: ${action.paths}`.green);
      break
    }

    case 'DELETE_FILES_FAIL': {
      console.log(`Reducers: DELETE_FILES_FAIL: ${action.err}`.red);
      break
    }


    // -------- CONTENTS -------- //

    case 'HANDLE_ADD_FILE': {
      console.log('HANDLE_ADD_FILE');
      break
    }

    case 'HANDLE_CHANGE_FILE': {
      console.log('HANDLE_CHANGE_FILE');
      break
    }

    case 'HANDLE_UNLINK_FILE': {

      const index = newState.contents.findIndex((c) => c.type == 'file' && c.path == action.path);

      // If the file existed in `contents`, remove it.
      // Note: -1 from `findIndex` means it did NOT exist.
      if (index !== -1) {
        newState.contents.splice(index, 1);
      }

      newState.changed.push('contents');

      break
    }

    case 'HANDLE_ADD_DIR': {
      console.log('HANDLE_ADD_DIR');
      break
    }

    case 'HANDLE_UNLINK_DIR': {
      console.log('HANDLE_UNLINK_DIR');
      break
    }

    case 'MAP_CONTENTS': {

      // Set new contents
      newState.contents = action.contents;
      newState.changed.push('contents');

      // Set `rootDirId`
      const rootFolder = getRootFolder(newState.contents);
      newState.rootFolderId = rootFolder.id;

      updateSideBarItems(newState);
      newState.changed.push('sideBar');
      break
    }

    case 'RESET_HIERARCHY': {
      newState.contents = [];
      newState.changed.push('contents');
      break
    }

    // Layout focus
    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section;
      newState.changed.push('focusedLayoutSection');
      break
    }


    // -------- SIDEBAR -------- //

    case 'SELECT_SIDEBAR_ITEM': {

      if (newState.selectedSideBarItemId == action.id) break

      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id);

      // Update FileList visibility
      if (newState.showFilesList !== sideBarItem.showFilesList) {
        newState.showFilesList !== sideBarItem.showFilesList;
        newState.changed.push('showFilesList');
      }

      // Update selected SideBar item
      newState.selectedSideBarItemId = action.id;
      newState.changed.push('selectedSideBarItemId');

      // Update `openFile`
      console.log(sideBarItem);

      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem);
        newState.changed.push('openFile');
      }

      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id);
      sideBarItem.expanded = !sideBarItem.expanded;
      newState.changed.push('sideBar item expanded');
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_FILE_SELECTION': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.sideBarItemId);
      sideBarItem.lastSelection = action.lastSelection;
      newState.changed.push('lastSelection');
      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem);
        newState.changed.push('openFile');
      }
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.sideBarItemId);
      sideBarItem.lastScrollPosition = action.lastScrollPosition;
      newState.changed.push('sideBar lastScrollPosition');
      break
    }



    // case 'SET_STARTUP_TIME': {
    //   newState.appStartupTime = action.time
    //   newState.changed.push('appStartupTime')
    //   break
    // }

  }

  return newState
}

class GambierStore extends Store {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      schema: StoreSchema
    });
  }

  getCurrentState() {
    return this.store
  }

  dispatch(action) {

    // Optional: Log the changes (useful for debug)
    this.logTheAction(action);
    
    // Get next state
    const nextState = reducers(this.getCurrentState(), action);

    // Optional: Log the diff (useful for debug)
    this.logTheDiff(this.getCurrentState(), nextState);

    // Set the next state
    this.set(nextState);
  }

  logTheAction(action) {
    console.log(
      `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      `(GambierStore.js)`.green
    );
  }

  logTheDiff(currentState, nextState) {
    const hasChanged = !deepEql(currentState, nextState);
    if (hasChanged) {
      // const diff = detailedDiff(currentState, nextState)
      // console.log(diff)
      console.log(`Changed: ${nextState.changed}`.yellow);
    } else {
      console.log('No changes'.yellow);
    }
  }
}

async function isWorkingPath(pth) {

  if (pth == '') {
    return false
  } else {
    if (await fsExtra.pathExists(pth)) {
      return true
    } else {
      return false
    }
  }
}

/**
 * Map projectPath and save as a flattened hierarchy `contents` property of store (array).
 */
class GambierContents {

  constructor(store) {
    this.store = store;
    this.projectPath = store.store.projectPath;
    this.watcher = undefined;

    // Setup change listener for store
    this.store.onDidAnyChange((newState, oldState) => {
      // console.log(newState)
      if (newState.changed.includes('projectPath')) {
        this.projectPath = newState.projectPath;
        this.mapProjectPath();
        this.startWatching();
      }
    });

    // Map project path and start watching
    this.mapProjectPath();
    this.startWatching();
  }


  async startWatching() {
    if (this.projectPath == '') return

    // Close existing watcher.
    // This will only be called if projectPath has changed.
    if (this.watcher !== undefined) {
      await this.watcher.close();
    }

    this.watcher = chokidar.watch(this.projectPath, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 400,
        pollInterval: 200
      }
    });

    const log = console.log.bind(console);

    this.watcher
      // .on('add', (path) => this.store.dispatch({ type: 'HANDLE_ADD_FILE', path: path }))
      .on('add', (path) => this.store.dispatch({ type: 'HANDLE_ADD_FILE', path: path }))
      .on('change', (path) => this.store.dispatch({ type: 'HANDLE_CHANGE_FILE', path: path }))
      .on('unlink', (path) => this.store.dispatch({ type: 'HANDLE_UNLINK_FILE', path: path }))
      .on('addDir', (path) => this.store.dispatch({ type: 'HANDLE_ADD_DIR', path: path }))
      .on('unlinkDir', (path) => this.store.dispatch({ type: 'HANDLE_UNLINK_DIR', path: path }));
      // .on('ready', () => this.store.dispatch({ type: 'HANDLE_CHANGE_FILE', path: path }))
      // .on('error', error => log(`error: Watcher error: ${error}`))


    // this.watcher.on('all', (event, path) => {
    //   console.log(event)
    //   console.log(path)
    //   this.mapProjectPath()
    // })


  }

  /**
   * Check if path is valid. 
   * If true, map folder, update store, and add watcher.
   * Else, tell store to `RESET_HIERARCHY` (clears to `[]`)
   */
  async mapProjectPath() {
    if (this.projectPath == '') return

    if (await isWorkingPath(this.projectPath)) {
      let contents = await this.mapFolderRecursively(this.projectPath);
      contents = await this.getFilesDetails(contents);
      contents = this.applyDiffs(this.store.store.contents, contents);
      this.store.dispatch({ type: 'MAP_CONTENTS', contents: contents });
    } else {
      this.store.dispatch({ type: 'RESET_HIERARCHY' });
    }
  }

  applyDiffs(oldContents, newContents) {

    diff.observableDiff(oldContents, newContents, (d) => {
      // Apply all changes except to the name property...
      if (d.path !== undefined) {
        if (d.path[d.path.length - 1] !== 'selectedFileId') {
          diff.applyChange(oldContents, newContents, d);
        }
      } else {
        diff.applyChange(oldContents, newContents, d);
      }
    });

    return oldContents
  }

  /**
   * Populate this.contents with flat array of folder contents. One object for each folder and file found. Works recursively.
   * @param {*} folderPath - folder to look inside.
   * @param {*} parentObj - If passed in, we 1) get parent id, and 2) increment its folder counter. Is left undefined (default) for the top-level folder.
   */
  async mapFolderRecursively(folderPath, parentId = undefined) {

    let arrayOfContents = [];

    let contents = await fsExtra.readdir(folderPath, { withFileTypes: true });

    // Filter contents to (not-empty) directories, and markdown files.
    contents = contents.filter((c) => c.isDirectory() || c.name.includes('.md'));

    // If the folder has no children we care about (.md files or directories), 
    // we return an empty array.
    if (contents.length == 0) {
      return arrayOfContents
    }

    // Get stats for folder
    const stats = await fsExtra.stat(folderPath);

    // Create object for folder
    const thisDir = {
      type: 'folder',
      id: `folder-${stats.ino}`,
      name: folderPath.substring(folderPath.lastIndexOf('/') + 1),
      path: folderPath,
      modified: stats.mtime.toISOString(),
      childFileCount: 0,
      childFolderCount: 0,
      selectedFileId: 0,
      isRoot: false,
    };

    // If parentId was passed, set `thisDir.parentId` to it
    // Else this folder is the root, so set `isRoot: true`
    if (parentId !== undefined) {
      thisDir.parentId = parentId;
    } else {
      thisDir.isRoot = true;
    }

    for (let c of contents) {

      // Get path
      const cPath = path.join(folderPath, c.name);

      if (c.isFile()) {
        // Increment file counter
        thisDir.childFileCount++;

        // Push new file object
        arrayOfContents.push({
          type: 'file',
          name: c.name,
          path: cPath,
          parentId: thisDir.id
        });
      } else if (c.isDirectory()) {

        // Get child folder contents
        // If not empty, increment counter and push to arrayOfContents
        const childFolderContents = await this.mapFolderRecursively(cPath, thisDir.id);
        if (childFolderContents.length !== 0) {
          thisDir.childFolderCount++;
          arrayOfContents = arrayOfContents.concat(childFolderContents);
        }
      }
    }

    // Finally, if it is not empty, push thisDir to `arrayOfContents`
    if (arrayOfContents.length !== 0) {
      arrayOfContents.push(thisDir);
    }

    return arrayOfContents
  }

  /**
   * Go through each file in `this.contents` and add details loaded from stats (e.g. created) and gray-matter (e.g. excerpt, tags, title). We use Promise.all() to run this in parallel, so we're processing files in a batch, instead of sequentially one-by-one.
   */
  async getFilesDetails(contents) {

    await Promise.all(
      contents.map(async (f) => {

        // Ignore directories
        if (f.type == 'file') {

          // Return a promise ()
          return fsExtra.readFile(f.path, 'utf8').then(async str => {

            // Get stats
            const stats = await fsExtra.stat(f.path);

            // Get front matter
            const md = matter(str, { excerpt: extractExcerpt });

            // Set fields from stats
            f.id = `file-${stats.ino}`,
              f.modified = stats.mtime.toISOString();
            f.created = stats.birthtime.toISOString();
            f.excerpt = md.excerpt;

            // Set fields from front matter (if it exists)
            // gray-matter `isEmpty` property returns "true if front-matter is empty".
            if (!f.isEmpty) {

              // If `tags` exists in front matter, use it. Else, set as empty `[]`.
              f.tags = md.data.hasOwnProperty('tags') ? md.data.tags : [];

              // If title exists in front matter, use it. Else, use name, minus extension.
              if (md.data.hasOwnProperty('title')) {
                f.title = md.data.title;
              } else {
                f.title = f.name.slice(0, f.name.lastIndexOf('.'));
              }
            }
          })
        }
      })
    );
    // console.log(contents)
    return contents
  }
}

function extractExcerpt(file) {

  // gray-matter passes extract function the file.
  // file.contents give us the input string, with front matter stripped.

  // Remove h1, if it exists. Then trim to 200 characters.
  let excerpt = file.content
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

  file.excerpt = excerpt;
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

async function getFileMetadata (path, data) {

  const file = {};
  
  // Set path
  file.path = path;

	// Get stats
	const stats = await fsExtra.stat(path);

	// Set fields from stats
	file.id = `file-${stats.ino}`;
	file.modified = stats.mtime.toISOString();
	file.created = stats.birthtime.toISOString();

	// Get front matter
	const gm = matter(data);

	// Set excerpt
	// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
	file.excerpt = getExcerpt(gm.content);

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	if (!gm.isEmpty) {
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		file.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : [];
	}

	// Set name (includes extension). E.g. "sealevel.md"
	file.name = path.substring(path.lastIndexOf('/') + 1);

	// Set title. E.g. "Sea Level Rise"
	file.title = getTitle(gm, file.name);

	return file
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

async function saveFile(path, data) {
  try {
		await fsExtra.writeFile(path, data, 'utf8');
		const metadata = await getFileMetadata(path, data);
		return { 
			type: 'SAVE_FILE_SUCCESS', 
			path: path, 
			metadata: metadata 
		}
	} catch(err) {
		return { 
			type: 'SAVE_FILE_FAIL', 
			err: err 
		}
	}
}

async function setProjectPath () {

  // console.log(BrowserWindow.getFocusedWindow())

  const win = electron.BrowserWindow.getFocusedWindow();

  const selection = await electron.dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (!selection.canceled) {
    return { type: 'SET_PROJECTPATH_SUCCESS', path: selection.filePaths[0] }
  } else {
    return { type: 'SET_PROJECTPATH_FAIL' }
  }
}

let store = {};
let state = {};

/**
 * Note: App and File menus are macOS only. 
 */
function setup(gambierStore) {
  
  store = gambierStore;
  state = gambierStore.store;

  const menu = new electron.Menu();

  // -------- App -------- //
  if (process.platform === 'darwin') {
    const appMenu = new electron.MenuItem(
      {
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
      }
    );

    menu.append(appMenu);
  }


  // -------- File -------- //
  if (process.platform === 'darwin') {

    var save = new electron.MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      async click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveFile');
      }
    });

    var moveToTrash = new electron.MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      async click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsDeleteFile');
        // const path = state.contents.find((c) => c.id == state.selectedFileId).path
        // store.dispatch(await deleteFile(path))
      }
    });

    const file = new electron.MenuItem({
      label: 'File',
      submenu: [
        save,
        moveToTrash
      ]
    });

    menu.append(file);
  }


  // -------- Edit -------- //

  const edit = new electron.MenuItem(
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    }
  );

  // If macOS, add speech options to Edit menu
  if (process.platform === 'darwin') {
    edit.submenu.append(
      new electron.MenuItem(
        { type: 'separator' }
      ),
      new electron.MenuItem(
        {
          label: 'Speech',
          submenu: [
            { role: 'startspeaking' },
            { role: 'stopspeaking' }
          ]
        }
      ),
    );
  }

  menu.append(edit);


  // -------- View -------- //

  const view = new electron.MenuItem(
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  );

  menu.append(view);


  // -------- Window -------- //

  // Different menus for macOS vs others
  if (process.platform === 'darwin') {

    const window = new electron.MenuItem(
      {
        role: 'window',
        submenu: [
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          },
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          { label: 'Zoom', role: 'zoom' },
          { type: 'separator' },
          { label: 'Bring All to Front', role: 'front' }
        ]
      }
    );

    menu.append(window);

  } else {

    const window = new electron.MenuItem(
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    );

    menu.append(window);
  }


  // -------- Set initial values -------- //

  moveToTrash.enabled = store.store.focusedLayoutSection == 'navigation';


  // -------- Change listeners -------- //

  store.onDidAnyChange((newState, oldState) => {
    state = newState;
  });

  store.onDidChange('focusedLayoutSection', () => {
    if (store.store.focusedLayoutSection == 'navigation') {
      moveToTrash.enabled = true;
    } else {
      moveToTrash.enabled = false;
    }
  });


  // -------- Create menu -------- //

  electron.Menu.setApplicationMenu(menu);
}

// External dependencies

// -------- Variables -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win = undefined;
let store$1 = undefined;
let contents = undefined;

// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// -------- Reload -------- //

// Not sure how this works with our packaged build. Want it for dev, but not distribution.
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
  // argv: ['--inspect=5858'],
});

// -------- Setup -------- //

console.log(`Setup`.bgYellow.black, `(Main.js)`.yellow);

store$1 = new GambierStore();
contents = new GambierContents(store$1);
// projectCitations.setup(store)

// -------- Create window -------- //

function createWindow() {

  console.log(`Create window`.bgBrightBlue.black, `(Main.js)`.brightBlue);

  win = new electron.BrowserWindow({
    show: true,
    width: 1600,
    height: 900,
    vibrancy: 'sidebar',
    webPreferences: {
      scrollBounce: false,
      // Security
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
  });

  // Open DevTools
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'));

  // OS menus
  setup(store$1);

  // Keyboard shortcuts
  // electronLocalshortcut.register(win, 'Cmd+S', () => {
  //   win.webContents.send('keyboardShortcut', 'Cmd+S')
  // });

  // Send state to render process once dom is ready
  win.once('ready-to-show', () => {
    console.log(`ready-to-show`.bgBrightBlue.black, `(Main.js)`.brightBlue);
  });

  // -------- TEMP DEVELOPMENT STUFF -------- //
  // store.clear()
  // store.reset()
  // This triggers a change event, which subscribers then receive
  // store.dispatch({ type: 'SET_STARTUP_TIME', time: new Date().toISOString() })

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_PATH', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src/Empty'})
  // }, 1000)

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_PATH', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src'})
  // }, 1000)

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_PATH', path: '/Users/arasd'})
  // }, 4000)

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_PATH', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src/Notes'})
  // }, 6000)
}


// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default 
// If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9.
// Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

electron.app.whenReady().then(createWindow);


// -------- Store -------- //

store$1.onDidAnyChange((newState, oldState) => {
  win.webContents.send('stateChanged', newState, oldState);
});


// -------- IPC: Send/Receive -------- //

electron.ipcMain.on('showWindow', (event) => {
  win.show();
});

electron.ipcMain.on('dispatch', async (event, action) => {
  switch (action.type) {
    case ('LOAD_PATH_IN_EDITOR'):
      store$1.dispatch(action);
    case ('SET_PROJECT_PATH'):
      store$1.dispatch(await setProjectPath());
      break
    case ('SAVE_FILE'):
      store$1.dispatch(await saveFile(action.path, action.data));
      break
    case ('DELETE_FILE'):
      store$1.dispatch(await deleteFile(action.path));
      break
    case ('DELETE_FILES'):
      store$1.dispatch(await deleteFiles(action.paths));
      break
    case ('SELECT_SIDEBAR_ITEM'):
      store$1.dispatch(action);
      break
    case ('TOGGLE_SIDEBAR_ITEM_EXPANDED'):
      store$1.dispatch(action);
      break
    case ('SET_LAYOUT_FOCUS'):
      store$1.dispatch(action);
      break
    case ('SAVE_SIDEBAR_FILE_SELECTION'):
      store$1.dispatch(action);
      break
    case ('SAVE_SIDEBAR_SCROLL_POSITION'):
      store$1.dispatch(action);
      break
  }
});


// -------- IPC: Invoke -------- //

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await fsExtra.pathExists(filepath);
  return { path: filepath, exists: exists }
});

electron.ipcMain.handle('getState', async (event) => {
  return store$1.store
});

electron.ipcMain.handle('getCitations', (event) => {
  return projectCitations.getCitations()
});

electron.ipcMain.handle('getFileByPath', async (event, filePath, encoding) => {

  // Load file and return
  let file = await fsExtra.readFile(filePath, encoding);
  return file
});

electron.ipcMain.handle('getFileById', async (event, id, encoding) => {

  // Get path of file with matching id
  const filePath = store$1.store.contents.find((f) => f.id == id).path;

  // Load file and return
  let file = await fsExtra.readFile(filePath, encoding);
  return file
});

electron.ipcMain.handle('pathJoin', async (event, path1, path2) => {
  return path.join(path1, path2)
});

electron.ipcMain.handle('getHTMLFromClipboard', (event) => {
  return electron.clipboard.readHTML()
});

electron.ipcMain.handle('getFormatOfClipboard', (event) => {
  return electron.clipboard.availableFormats()
});
//# sourceMappingURL=main.js.map
