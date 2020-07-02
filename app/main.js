'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var path = _interopDefault(require('path'));
var fsExtra = require('fs-extra');
var Store = _interopDefault(require('electron-store'));
require('colors');
var deepEql = _interopDefault(require('deep-eql'));
var chokidar = _interopDefault(require('chokidar'));
require('deep-diff');
require('util');
var matter = _interopDefault(require('gray-matter'));
var removeMd = _interopDefault(require('remove-markdown'));

const StoreSchema = {

  changed: { type: 'array', default: [] },

  focusedLayoutSection: {
    type: 'string',
    default: 'navigation',
  },

  openDoc: {
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
        type: 'array', 
        default: [
          
          // -------- Folders -------- //
          {
            label: 'Folders',
            id: 'folders-group',
            type: 'group'
          },
          {
            label: '',
            id: '',
            isRoot: true,
            parentId: 'folders-group',
            type: 'folder',
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

          // -------- Documents -------- //
          {
            label: 'Documents',
            id: 'docs-group',
            type: 'group'
          },
          {
            label: 'All',
            id: 'all',
            parentId: 'docs-group',
            type: 'filter',
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
            parentId: 'docs-group',
            type: 'filter',
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
            parentId: 'docs-group',
            type: 'filter',
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

          // -------- Media -------- //
          {
            label: 'Media',
            id: 'media-group',
            type: 'group'
          },
          {
            label: 'Media',
            id: 'media-all',
            parentId: 'media-group',
            type: 'other',
            icon: 'images/sidebar-default-icon.svg',
            showFilesList: false,
            lastScrollPosition: 0,
            lastSelection: [],
          },

          // -------- Citations -------- //
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

  folders: { 
    type: 'array', 
    default: [] 
  },

  documents: { 
    type: 'array', 
    default: [] 
  },

  media: { 
    type: 'array', 
    default: [] 
  },

  // contents: { 
  //   type: 'array', 
  //   default: [] 
  // },

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

let newItems = {};

/**
 * Filter items always operate on the top-level (root) folder.
 * Update their `lookInFolder` properties to point to root folder id.
 * @param {*} newItems 
 */
function updateFilters(newItems, rootFolderId) {
  
  return newItems.map((i) => {
    if (i.type == 'filter') {
      i.searchParams.lookInFolderId = rootFolderId;
    }
    return i
  })
}

function mapSideBarItems(newState) {

  // Copy existing items
  newItems = newState.sideBar.items;

  // Get root folder from `folders`. It's the one without a parentId
  const rootFolder = newState.folders.find((f) => f.parentId == '');

  // Update `filter` and `folder` items
  newItems = updateFilters(newItems, rootFolder.id);
  // updateFolders(newItems)

  return newItems
}

// import diff from 'deep-diff'


/**
 * Check if contents contains item by type and id
 */
// function contentContainsItemById(contents, type, id) {
//   return contents.some((d) => d.type == type && d.id == id)
// }

// function getDirectoryById(contents, id) {
//   return contents.find((d) => d.type == 'directory' && d.id == id)
// }

// function getFirstFileInDirectory(contents, directoryId) {
//   const files = contents.filter((f) => f.type == 'file' && f.parentId == directoryId)
//   return files[0]
// }

// function getFile(contents, id) {
//   return contents.find((c) => c.type == 'file' && c.id == id)
// }

// function getRootFolder(newState) {
//   return newState.folders.find((f) => f.parentId == '')
// }



function getSideBarItem(sideBarItems, id) {
  return sideBarItems.find((i) => i.id == id)
}

/**
 * Copy object of the selected file from `state.contents` into top-level `state.openDoc`
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenFile(newState, selectedSideBarItem) {

  const lastSelection = selectedSideBarItem.lastSelection;
  if (lastSelection.length == 1) {
    console.log(lastSelection[0]);
    newState.openDoc = newState.contents.find((c) => c.type == 'file' && c.id == lastSelection[0].id);
  } else {
    newState.openDoc = {};
  }
}




/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
async function reducers(state = {}, action) {

  const newState = Object.assign({}, state);

  // newState.lastAction = action.type
  newState.changed = []; // Reset on every action 

  switch (action.type) {


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


    // -------- UI -------- //

    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section;
      newState.changed.push('focusedLayoutSection');
      break
    }


    // -------- EDITOR -------- //

    case 'LOAD_PATH_IN_EDITOR': {
      newState.editingFileId = action.id;
      newState.changed.push('editingFileId');
      break
    }


    // -------- CONTENTS -------- //

    case 'MAP_PROJECT_CONTENTS': {
      newState.folders = action.folders;
      newState.documents = action.documents;
      newState.media = action.media;
      newState.changed.push('folders', 'documents', 'media');
      newState.sideBar.items = mapSideBarItems(newState);
      newState.changed.push('sideBar');
      break
    }

    case 'ADD_DOCUMENTS': {
      newState.documents = newState.documents.concat(action.documents);
      newState.changed.push('documents');
      break
    }

    case 'ADD_MEDIA': {
      newState.media = newState.media.concat(action.media);
      newState.changed.push('media');
      break
    }

    case 'UPDATE_DOCUMENTS': {
      for (let updatedVersion of action.documents) {
        // Get index of old version in `documents`
        const index = newState.documents.findIndex((oldVersion) => oldVersion.id == updatedVersion.id);
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.documents[index] = updatedVersion;
        }
      }
      newState.changed.push('documents');
      break
    }

    case 'UPDATE_MEDIA': {
      for (let updatedVersion of action.media) {
        // Get index of old version in `media`
        const index = newState.media.findIndex((oldVersion) => oldVersion.id == updatedVersion.id);
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.media[index] = updatedVersion;
        }
      }
      newState.changed.push('media');
      break
    }

    case 'REMOVE_DOCUMENTS': {
      for (let p of action.documentPaths) {
        const index = newState.documents.findIndex((d) => d.path == p);
        if (index !== -1) {
          newState.documents.splice(index, 1);
        }
      }
      newState.changed.push('documents');
      break
    }

    case 'REMOVE_MEDIA': {
      for (let p of action.mediaPaths) {
        const index = newState.media.findIndex((d) => d.path == p);
        if (index !== -1) {
          newState.media.splice(index, 1);
        }
      }
      newState.changed.push('media');
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

      // Update `openDoc`
      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem);
        newState.changed.push('openDoc');
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
        newState.changed.push('openDoc');
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


    // -------- FILE ACTIONS -------- //

    // case 'SAVE_FILE_SUCCESS': {
    //   console.log(`Reducers: SAVE_FILE_SUCCESS: ${action.path}`.green)
    //   break
    // }

    // case 'SAVE_FILE_FAIL': {
    //   console.log(`Reducers: SAVE_FILE_FAIL: ${action.path}`.red)
    //   break
    // }

    // // Delete

    // case 'DELETE_FILE_SUCCESS': {
    //   console.log(`Reducers: DELETE_FILE_SUCCESS: ${action.path}`.green)
    //   break
    // }

    // case 'DELETE_FILE_FAIL': {
    //   console.log(`Reducers: DELETE_FILE_FAIL: ${action.err}`.red)
    //   break
    // }

    // case 'DELETE_FILES_SUCCESS': {
    //   console.log(`Reducers: DELETE_FILES_SUCCESS: ${action.paths}`.green)
    //   break
    // }

    // case 'DELETE_FILES_FAIL': {
    //   console.log(`Reducers: DELETE_FILES_FAIL: ${action.err}`.red)
    //   break
    // }












    // ================ PRE-REFACTOR ================ //

    // -------- CONTENTS -------- //

    // case 'CONTENTS_CHANGED': {
    //   newState.contents = action.contents
    //   newState.changed.push('contents')
    //   break
    // }

    // case 'HANDLE_CHANGE_FILE': {

    //   // Load file and get metadata
    //   const data = await readFile(action.path, 'utf8')
    //   const metadata = await getFileMetadata(action.path, data)

    //   // Apply changes to record in `contents`
    //   const lhs = newState.contents.find((c) => c.id == metadata.id)
    //   const rhs = metadata
    //   diff.observableDiff(lhs, rhs, (d) => {
    //     if (d.kind !== 'D') {
    //       diff.applyChange(lhs, rhs, d)
    //     }
    //   })
    //   newState.changed.push('contents')
    //   break
    // }

    // case 'HANDLE_UNLINK_FILE': {

    //   const index = newState.contents.findIndex((c) => c.type == 'file' && c.path == action.path)

    //   // If the file existed in `contents`, remove it.
    //   // Note: -1 from `findIndex` means it did NOT exist.
    //   if (index !== -1) {
    //     newState.contents.splice(index, 1)
    //   }
    //   newState.changed.push('contents')
    //   break
    // }

    // case 'HANDLE_ADD_FILE': {

    //   const data = await readFile(action.path, 'utf8')
    //   const metadata = await getFileMetadata(action.path, data)


    //   newState.changed.push('contents')
    //   break
    // }

    // case 'HANDLE_ADD_DIR': {

    //   const stats = await stat(action.path)

    //   // Create new Folder and add to `contents`
    //   const folder = new Folder()
    //   folder.id = `folder-${stats.ino}`
    //   folder.path = action.path
    //   folder.name = action.path.substring(action.path.lastIndexOf('/') + 1)
    //   folder.modified = stats.mtime.toISOString()
    //   newState.contents.push(folder)
    //   console.log(folder)

    //   newState.changed.push('contents')
    //   break
    // }

    // case 'HANDLE_UNLINK_DIR': {
    //   console.log('HANDLE_UNLINK_DIR')
    //   break
    // }


    // case 'MAP_CONTENTS': {

    //   // Set new contents
    //   newState.contents = action.contents
    //   newState.changed.push('contents')

    //   updateSideBarItems(newState)
    //   newState.changed.push('sideBar')
    //   break
    // }

    // case 'RESET_HIERARCHY': {
    //   newState.contents = []
    //   newState.changed.push('contents')
    //   break
    // }


  }

  return newState
}

// import { updatedDiff, detailedDiff } from 'deep-object-diff'

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

  async dispatch(action) {

    // Optional: Log the changes (useful for debug)
    this.logTheAction(action);
    
    // Get next state
    const nextState = await reducers(this.getCurrentState(), action);

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

/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} recursive - Optional. If true, map descendant directories also.
 */
async function mapFolder (folderPath, stats = undefined, parentId = '', recursive = false) {

  // Stub out return object
  let contents = {
    folders: [],
    documents: [],
    media: [],
  };

  // -------- Folder -------- //

  const folder = Object.assign({}, Folder);

  if (stats == undefined) {
    stats = await fsExtra.stat(folderPath);
  }

  folder.name = folderPath.substring(folderPath.lastIndexOf('/') + 1);
  folder.path = folderPath;
  folder.id = `folder-${stats.ino}`;
  folder.parentId = parentId;
  folder.modified = stats.mtime.toISOString();

  contents.folders.push(folder);


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of file name and file type pairs. If empty, return.
  const everything = await fsExtra.readdir(folderPath, { withFileTypes: true });
  // if (!everything.length > 0) return contents

  await Promise.all(
   everything.map(async (e) => {

      // Get path by combining folderPath with file name.
      const ePath = path.join(folderPath, e.name);
      const ext = path.extname(e.name);
      const stats = await fsExtra.stat(ePath);
    
      if (e.isDirectory() && recursive) {
        const { folders, documents, media } = await mapFolder(ePath, stats, folder.id, true);
        // Concat findings into respective `contents` arrays
        contents.folders = contents.folders.concat(folders);
        contents.documents = contents.documents.concat(documents);
        contents.media = contents.media.concat(media);
      } else if (ext == '.md') {
        contents.documents.push(await mapDocument(ePath, stats, folder.id));
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        contents.media.push(await mapMedia(ePath, stats, folder.id, ext));
      }
    })
  );

  return contents
}

async function isWorkingPath(path) {

  if (path == '') {
    return false
  } else {
    if (await fsExtra.pathExists(path)) {
      return true
    } else {
      return false
    }
  }
}

// import diff from 'deep-diff'


let store$1 = undefined;
let state$1 = {};
let watcher = undefined;
let changeTimer = undefined;
let changes = [];

/**
 * Chokidar config
 * Docs: https://www.npmjs.com/package/chokidar
 */
const config = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 400,
    pollInterval: 200
  }
};


/**
 * Setup watcher module
 * @param {*} projectPath - Path to watch
 */
async function setup$1(storeRef) {

  // Check if undefined
  if (storeRef == undefined) console.error("Store not defined");

  // Set `store` and `state`
  store$1 = storeRef;
  state$1 = store$1.store;

  // Listen for state changes. When `projectPath` changes, watch it.
  store$1.onDidAnyChange(async (newState, oldState) => {

    state$1 = newState;

    if (newState.changed.includes('projectPath')) {

      // If watcher was already active on another directory, close it.
      if (watcher !== undefined) {
        await watcher.close();
      }

      // Watch new path
      startWatcher(newState.projectPath);
    }
  });

  // Start initial watcher
  startWatcher(state$1.projectPath);
}


/**
 * Start watcher
 */
async function startWatcher(projectPath) {

  // If new projectPath is not valid, return
  if (!await fsExtra.pathExists(projectPath)) return

  // Start watcher
  watcher = chokidar.watch(projectPath, config);

  // On any event, track changes. Some events include `stats`.
  watcher
    .on('change', (filePath) => trackChanges('change', filePath))
    .on('add', (filePath) => trackChanges('add', filePath))
    .on('unlink', (filePath) => trackChanges('unlink', filePath))
    .on('addDir', (filePath) => trackChanges('addDir', filePath))
    .on('unlinkDir', (filePath) => trackChanges('unlinkDir', filePath));
}


/**
 * Create a tally of changes as they occur, and once things settle down, evaluate them.We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
 */
function trackChanges(event, filePath, stats) {
  const change = { event: event, path: filePath };

  if (stats) change.stats = stats;
  // console.log(event)

  // Make the timer longer if `addDir` event comes through. 
  // If it's too quick, subsequent `add` events are not caught by the timer.
  const timerDuration = event == 'addDir' ? 500 : 100;

  // Either start a new timer, or if one is already active, refresh it.
  if (
    changeTimer == undefined ||
    !changeTimer.hasRef()
  ) {
    changes = [change];
    changeTimer = setTimeout(onChangesFinished, timerDuration, changes);
  } else {
    changes.push(change);
    changeTimer.refresh();
  }
}

/**
 * When changes are finished, discern what happened, and dispatch the appropriate actions.
 * @param {*} changes - Array of objects: `{ event: 'add', path: './Notes/mynote.md' }`
 */
async function onChangesFinished(changes) {

  // If change events include directories added or removed, remap everything.
  // Else, sort changes by event (changed, added, removed), and call appro
  if (
    changes.some((c) => c.event == 'addDir') ||
    changes.some((c) => c.event == 'unlinkDir')
  ) {
    // A directory was added or removed
    mapProject(state$1.projectPath, store$1);
  } else {
    // Files were changed (saved or over-written, added, or removed)
    // Most commonly, this will be a single file saved.
    // But in other cases, it may be a mix of events.
    // Sort the events into arrays then pass them to right handlers.
    let filesChanged = [];
    let filesAdded = [];
    let filesUnlinked = [];
    for (var c of changes) {
      switch (c.event) {
        case 'change':
          filesChanged.push(c);
          break
        case 'add':
          filesAdded.push(c);
          break
        case 'unlink':
          filesUnlinked.push(c);
          break
      }
    }
    if (filesChanged.length > 0) onFilesChanged(filesChanged);
    if (filesAdded.length > 0) onFilesAdded(filesAdded);
    if (filesUnlinked.length > 0) onFilesUnlinked(filesUnlinked);
  }
}

async function onFilesChanged(filesChanged) {

  let documents = [];
  let media = [];

  await Promise.all(
    filesChanged.map(async (f) => {

      const ext = path.extname(f.path);
      const parentPath = path.dirname(f.path);
      const parentId = state$1.folders.find((folder) => folder.path == parentPath).id;

      if (ext == '.md') {
        documents.push(await mapDocument(f.path, f.stats, parentId));
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        media.push(await mapMedia(f.path, f.stats, parentId, ext));
      }

    })
  );

  // Dispatch results to store
  if (documents.length > 0) {
    store$1.dispatch({ type: 'UPDATE_DOCUMENTS', documents: documents });
  }

  if (media.length > 0) {
    store$1.dispatch({ type: 'UPDATE_MEDIA', media: media });
  }
}

async function onFilesAdded(filesAdded) {

  let documents = [];
  let media = [];

  await Promise.all(
    filesAdded.map(async (f) => {

      const ext = path.extname(f.path);
      const parentPath = path.dirname(f.path);
      const parentId = state$1.folders.find((folder) => folder.path == parentPath).id;

      if (ext == '.md') {
        documents.push(await mapDocument(f.path, f.stats, parentId));
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        media.push(await mapMedia(f.path, f.stats, parentId, ext));
      }

    })
  );

  // Dispatch results to store
  if (documents.length > 0) {
    store$1.dispatch({ type: 'ADD_DOCUMENTS', documents: documents });
  }

  if (media.length > 0) {
    store$1.dispatch({ type: 'ADD_MEDIA', media: media });
  }
}

async function onFilesUnlinked(filesUnlinked) {
  let documentPaths = [];
  let mediaPaths = [];

  await Promise.all(
    filesUnlinked.map(async (f) => {

      const ext = path.extname(f.path);

      if (ext == '.md') {
        documentPaths.push(f.path);
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        mediaPaths.push(f.path);
      }
    })
  );

  // Dispatch results to store
  if (documentPaths.length > 0) {
    store$1.dispatch({ type: 'REMOVE_DOCUMENTS', documentPaths: documentPaths });
  }

  if (mediaPaths.length > 0) {
    store$1.dispatch({ type: 'REMOVE_MEDIA', mediaPaths: mediaPaths });
  }
}

const Document = {
  title: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
  excerpt: '',
  tags: [],
};

const Folder = {
  name: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  childFileCount: 0,
  childFolderCount: 0,
};

const Media = {
  filetype: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
};

/**
 * For specified path, return document details
 */
async function mapDocument (filePath, stats = undefined, parentId = '') {

	const doc = Object.assign({}, Document);

	if (stats == undefined) {
		stats = await fsExtra.stat(filePath);
	}

	doc.path = filePath;
	doc.id = `doc-${stats.ino}`;
	doc.parentId = parentId;
	doc.modified = stats.mtime.toISOString();
	doc.created = stats.birthtime.toISOString();

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
 * For specified path, return document details
 */
async function mapMedia (filePath, stats = undefined, parentId = '', extension = undefined) {

	const media = Object.assign({}, Media);

	if (stats == undefined) {
		stats = await fsExtra.stat(filePath);
	}

  media.filetype = extension == undefined ? path.extname(filePath) : extension;
	media.path = filePath;
	media.id = `media-${stats.ino}`;
	media.parentId = parentId;
	media.modified = stats.mtime.toISOString();
	media.created = stats.birthtime.toISOString();

	return media
}

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
async function mapProject(projectPath, store) {

  if (projectPath == undefined || store == undefined) {
    console.error('projectPath or store is undefined');
  }

  await isWorkingPath(projectPath);
  if (!isWorkingPath) {
    console.error('projectPath is not valid');
  }
  
  try {

    // Map project path, recursively
    const { folders, documents, media } = await mapFolder(projectPath, undefined, '', true);
    
    // Dispatch results to store
    store.dispatch({
      type: 'MAP_PROJECT_CONTENTS',
      folders: folders,
      documents: documents,
      media: media,
    });

  } catch (err) {
    console.log(err);
  }
}

const imageFormats = [
  '.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
];

const avFormats = [
  '.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'
];

async function getFileMetadata (path, data, stats) {

  const file = {};
  
  // Set path
  file.path = path;

	// Get stats
	if (stats == undefined) {
    stats = await fsExtra.stat(path);
  }
  
	// Set fields from stats
	file.id = `file-${stats.ino}`;
	file.modified = stats.mtime.toISOString();
	file.created = stats.birthtime.toISOString();

	// Get front matter
	const gm = matter(data);

	// Set excerpt
	// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
	file.excerpt = getExcerpt$1(gm.content);

	// Set fields from front matter (if it exists)
	// gray-matter `isEmpty` property returns "true if front-matter is empty".
	if (!gm.isEmpty) {
		// If `tags` exists in front matter, use it. Else, set as empty `[]`.
		file.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : [];
	}

	// Set name (includes extension). E.g. "sealevel.md"
	file.name = path.substring(path.lastIndexOf('/') + 1);

	// Set title. E.g. "Sea Level Rise"
	file.title = getTitle$1(gm, file.name);

	return file
}

/**
 * Set title, in following order of preference:
 * 1. From first h1 in content
 * 2. From `title` field of front matter
 * 3. From filename, minus extension
 */
function getTitle$1(graymatter, filename) {

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
function getExcerpt$1(content) {

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

async function saveFile (path, data) {
	try {
		await fsExtra.writeFile(path, data, 'utf8');
		const metadata = await getFileMetadata(path, data);
		return {
			type: 'SAVE_FILE_SUCCESS',
			path: path,
			metadata: metadata
		}
	} catch (err) {
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

// External dependencies

// Dev only
// import colors from 'colors'

// -------- Variables -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win = undefined;
let store$2 = undefined;

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

console.log('- - - - - - - - - - - - - - -');
console.log(`Setup`, `(Main.js)`);



// -------- Setup -------- //

// Create store
store$2 = new GambierStore();

// Setup store change listeners
store$2.onDidAnyChange((newState, oldState) => {
  if (win !== undefined) {
    win.webContents.send('stateChanged', newState, oldState);
  }
});

// TEMP
store$2.set('projectPath', '/Users/josh/Documents/Climate research/GitHub/climate-research/src/Notes/Abicus/Arsenal/Whisper');

// Do initial project map, if projectPath has been set)
if (store$2.store.projectPath !== '') {
  mapProject(store$2.store.projectPath, store$2);
}

// Create watcher
setup$1(store$2);


// -------- Create window -------- //

function createWindow() {

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

  // Setup menu bar
  setup(store$2);

  // Send state to render process once dom is ready
  // win.once('ready-to-show', () => {
  // })
}


// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

electron.app.whenReady().then(createWindow);



// -------- IPC: Send/Receive -------- //

electron.ipcMain.on('showWindow', (event) => {
  win.show();
});

electron.ipcMain.on('dispatch', async (event, action) => {
  switch (action.type) {
    case ('LOAD_PATH_IN_EDITOR'):
      store$2.dispatch(action);
    case ('SET_PROJECT_PATH'):
      store$2.dispatch(await setProjectPath());
      break
    case ('SAVE_FILE'):
      store$2.dispatch(await saveFile(action.path, action.data));
      break
    case ('DELETE_FILE'):
      store$2.dispatch(await deleteFile(action.path));
      break
    case ('DELETE_FILES'):
      store$2.dispatch(await deleteFiles(action.paths));
      break
    case ('SELECT_SIDEBAR_ITEM'):
      store$2.dispatch(action);
      break
    case ('TOGGLE_SIDEBAR_ITEM_EXPANDED'):
      store$2.dispatch(action);
      break
    case ('SET_LAYOUT_FOCUS'):
      store$2.dispatch(action);
      break
    case ('SAVE_SIDEBAR_FILE_SELECTION'):
      store$2.dispatch(action);
      break
    case ('SAVE_SIDEBAR_SCROLL_POSITION'):
      store$2.dispatch(action);
      break
  }
});


// -------- IPC: Invoke -------- //

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await fsExtra.pathExists(filepath);
  return { path: filepath, exists: exists }
});

electron.ipcMain.handle('getState', async (event) => {
  return store$2.store
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
  const filePath = store$2.store.contents.find((f) => f.id == id).path;

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
