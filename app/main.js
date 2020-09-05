'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var path = _interopDefault(require('path'));
var fsExtra = require('fs-extra');
var ElectronStore = _interopDefault(require('electron-store'));
require('deep-diff');
var moment = _interopDefault(require('moment'));
require('colors');
var deepEql = _interopDefault(require('deep-eql'));
var chokidar = _interopDefault(require('chokidar'));
require('util');
var matter = _interopDefault(require('gray-matter'));
var removeMd = _interopDefault(require('remove-markdown'));

function makeSideBarItem(type, label, id, parentId, icon, showFilesList, filter, sort) {
  
  const item = {
    type: type ? type : '',
    label: label ? label : '',
    id: id ? id : '',
    parentId: parentId ? parentId : '',
    icon: icon ? icon : 'images/sidebar-default-icon.svg',
    showFilesList: showFilesList ? showFilesList : false,
    filter: filter ? filter : {
      lookInFolderId: '*',
      includeChildren: true,
      filetypes: ['*'],
      tags: [],
      dateModified: { use: false, from: '', to: '' },
      dateCreated: { use: false, from: '', to: '' },
    },
    sort: sort ? sort : { by: 'title', order: 'ascending' },
    files: [],    
    lastScrollPosition: 0,
    expanded: true,
    children: [],
  };

  return item
}

const storeDefault = {

  focusedLayoutSection: 'navigation',

  // A copy of the object of the document currently visible in the editor.
  openDoc: {},

  // A copy of the object of the selected `sideBar` item. We use a copy for the sake of convenience. It saves us having to continually find the original `sideBar` item, which would be tricky, as `sideBar` items don't have unique IDs (we instead use a heuristic based on id names).
  selectedSideBarItem: {},

  showFilesList: true,

  // Editor theme
  editorTheme: 'gambier-light',

  // User specified path to folder containing their project files
  projectPath: '',

  // User specified path to CSL-JSON file containing their citatons
  projectCitations: '',

  // Contents
  folders: [],
  documents: [],
  media: [],
  contents: [],

  // SideBar
  sideBar: {
    show: true,
    folders: [],
    documents: [
      makeSideBarItem('filter', 'All', 'docs-all', '', 'images/sidebar-default-icon.svg', true, 
      {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: [],
        dateModified: { use: false, from: '',to: '' },
        dateCreated: { use: false, from: '', to: '' },
      },
      { by: 'title', order: 'ascending' }),
      makeSideBarItem('filter', 'Favorites', 'docs-favs', '', 'images/sidebar-default-icon.svg', true, 
      {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: ['favorite'],
        dateModified: { use: false, from: '',to: '' },
        dateCreated: { use: false, from: '', to: '' },
      },
      { by: 'title', order: 'ascending' }),
      makeSideBarItem('filter', 'Most Recent', 'docs-mostRecent', '', 'images/sidebar-default-icon.svg', true, 
      {
        lookInFolderId: '*',
        includeChildren: true,
        filetypes: ['.md', '.markdown'],
        tags: [],
        dateModified: { use: true, from: 'NOW', to: '7-DAYS-AGO' },
        dateCreated: { use: false, from: '', to: '' },
      },
      { by: 'date-modified', order: 'ascending' })
    ],
    media: [
      makeSideBarItem('filter', 'All', 'media-all', '', 'images/sidebar-default-icon.svg', true)
    ],
    citations: [],
  }

};

/**
 * For each folder in the project, create a corresponding SideBar item.
 * This is run each time 
 */
function mapFolders(sideBar, newState) {

  // Save existing folders, then clear
  const oldFolders = sideBar.folders;
  sideBar.folders = [];
  
  // Make new array of existing folders.
  newState.folders.forEach((f) => {
    
    // Get old version (if it exists)
    const oldFolder = oldFolders.find((oldF) => oldF.id == f.id);

    // Determine icon
    const icon = f.childFileCount > 0 ? 'images/folder.svg' : 'images/folder-outline.svg';

    // Make new version
    const newFolder = makeSideBarItem(
      'folder', 
      f.name, 
      f.id, 
      f.parentId, 
      icon, 
      true, 
      {
        lookInFolderId: f.id,
        includeChildren: false,
        filetypes: ['*'],
        tags: [],
        dateModified: { use: false, from: '', to: '' },
        dateCreated: { use: false, from: '', to: '' },
      }
    );
    
    // Copy values from old version (if one existed)
    if (oldFolder) {
      newFolder.sort = oldFolder.sort,
      newFolder.files = oldFolder.files,
      newFolder.lastScrollPosition = oldFolder.lastScrollPosition,
      newFolder.expanded = oldFolder.expanded,
      newFolder.children = [];
    }

    // Sort alphabetically by label
    sideBar.folders.sort((a, b) => a.label.localeCompare(b.label));

    sideBar.folders.push(newFolder);
  });

  return sideBar
}



/**
 * Return `sideBar` with updated `folders`
 * TODO: Also update `documents`, `media`, and `citations` here?
 */
function mapSideBarItems(newState) {

  // Copy the sideBar object (so we don't effect the original)
  let sideBar = Object.assign({}, newState.sideBar);

  // Get root folder from `folders`. It's the one without a parentId
  // const rootFolder = newState.folders.find((f) => f.parentId == '')

  // Update `sideBar.folders`
  sideBar = mapFolders(sideBar, newState);

  return sideBar
}

/**
 * Get a SideBar item object, based on id. 
 * NOTE: This is a copy of the same function in renderer/utils. If one changes, the other should also.
 */
function getSideBarItemById(state, id) {
  if (id.includes('folder')) {
    return state.sideBar.folders.find((f) => f.id == id)
  } else if (id.includes('docs')) {
    return state.sideBar.documents.find((d) => d.id == id)
  } else if (id.includes('media')) {
    return state.sideBar.media.find((m) => m.id == id)
  }
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

/**
 * Update top-level `state.openDoc`. It is a copy of the selected doc's object from `state.documents`. We only "open" a doc if _one_ doc is selected. If multiple are selected, we display nothing in the editor. 
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenDoc(newState, selectedSideBarItem) {

  const selectedFiles = selectedSideBarItem.files.filter((file) => file.selected);

  if (selectedFiles.length == 1) {
    const docToOpen = newState.documents.find((c) => c.id == selectedFiles[0].id);
    if (docToOpen !== undefined) {
      newState.openDoc = Object.assign({}, docToOpen);
    } else {
      newState.openDoc = {};
    }
  } else {
    newState.openDoc = {};
  }
}

/** 
 * Just a convenience function to keep things DRY, since we do these steps any time the prpject files change.
 */
function updateSideBarAndFiles(newState) {
  // Update SideBar
  newState.sideBar = mapSideBarItems(newState);
  newState.changed.push('sideBar');

  // Update the `files` of the selected SideBar item
  const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id);
  sideBarItem.files = getFiles(newState, sideBarItem);
}


/**
 * Return a list of displayed files for the selected SideBar item. 
 * These are files that match the SideBar item's `filter` criteria (e.g. folder, tags, etc).
 * @param {*} newState 
 */
function getFiles(newState, item) {

  let filter = item.filter;

  // Determine folder to look in from `lookInFolderId`. If value is '*', that means "search all folders", so we get the root folder (the one without a parentId). Else, we use the folder value specified.
  const folder = filter.lookInFolderId == '*' ?
    newState.folders.find((f) => f.parentId == '') :
    newState.folders.find((f) => f.id == filter.lookInFolderId);

  // Copy selected files (objects, with path, title, etc) into a new `files` array.
  let files = newState.documents.filter((d) => d.parentId == folder.id);

  // If `includeChildren`, also get files for all descendant folders
  if (filter.includeChildren) {
    // Get ids of child folders
    let childFolderIds = getChildFolderIds(folder);

    // Add files in child folders
    newState.documents.forEach((c) => {
      if (childFolderIds.includes(c.parentId)) {
        files.push(c);
      }
    });
  }

  /**
   * Get all the child folder ids of specified folder, recursively.
   * @param {*} parentFolder 
   */
  function getChildFolderIds(parentFolder) {

    let ids = [];

    newState.folders.forEach((f) => {
      if (f.parentId == parentFolder.id) {
        // Push id of child folder
        ids.push(f.id);

        // Find and add ids of the child's children (recursive)
        ids.concat(getChildFolderIds(f));
      }
    });
    return ids;
  }

  // Filter by tags
  if (filter.tags.length > 0) {
    files = files.filter((f) => {
      return filter.tags.some((t) => {
        if (f.tags.includes(t)) {
          return true;
        }
      });
    });
  }

  // If we should use dateModified, we need to validate the dates.
  // E.g. `from` must be before `to`. 
  // If the dates are not valid, we do not apply the filter.
  if (filter.dateModified.use) {

    // Start by copying the input from and to values
    let from = filter.dateModified.from;
    let to = filter.dateModified.to;

    // Convert `from` value to date
    if (from == 'NOW' || from == '') {
      from = moment().format();
    } else if (filter.dateModified.from.includes('DAYS-AGO')) {
      let numberOf = from.substring(0, from.indexOf('-'));
      from = moment().subtract(numberOf, 'days');
    } else {
      from = moment(from).format();
    }

    // Convert `to` value to date
    if (filter.dateModified.to.includes('DAYS-AGO')) {
      let numberOf = to.substring(0, to.indexOf('-'));
      to = moment().subtract(numberOf, 'days').format();
    } else {
      to = moment(to).format();
    }

    // console.log(from)
    // console.log(to)

    if (from > to) {
      files = files.filter((f) => {
        const modified = moment(f.modified).format();
        if (modified < from && modified > to) {
          return f
        }
      });
    }
  }

  // Sort the files
  files = sortFiles(files, item.sort);

  //  Set files' `selected` property
  // files = restoreFileSelections(files, item.files)

  // Make a new array with just the essentials for each file (`id`, `selected`).
  // This is what we'll return.
  let filesObjects = [];
  files.forEach((f, index) => filesObjects.push({ id: f.id, selected: false }));

  // Select files:

  let oldFiles = item.files;
  const atLeastOneFilesWasPreviouslySelected = oldFiles.some((file) => file.selected);

  // If there was a previous selection, try to restore it
  if (atLeastOneFilesWasPreviouslySelected) {

    // If the same file in the new `files` existed in old `files`, and it was selected, select it again.
    filesObjects.forEach((f) => {
      f.selected = oldFiles.some((file) => file.id == f.id && file.selected);
    });

    // If nothing is selected after doing the above (e.g. the selected files do NOT exist any more, probably due to a selected file being deleted), then try to select the "next" file. This will be the file at the same index number as the previously selected doc, or——if the previously-selected doc was last in the list——the new last doc.
    const atLeastOneFileIsSelected = filesObjects.some((f) => f.selected);
    if (!atLeastOneFileIsSelected) {

      // Get index of previous selection
      let indexOfPreviousSelection = 0;
      oldFiles.forEach((file, index) => {
        if (file.selected) { indexOfPreviousSelection = index; }
      });

      // 
      if (indexOfPreviousSelection <= filesObjects.length - 1) {
        filesObjects[indexOfPreviousSelection].selected = true;
      } else {
        // Select last file
        filesObjects[filesObjects.length - 1].selected = true;
      }
    }

  } else {

    // If nothing is selected after the above, default to selecting the first file.
    filesObjects[0].selected = true;
  }

  return filesObjects
}


/**
 * Sort the displayed files in the current SideBar item, according the sort criteria.
 */
function sortFiles(filesBefore, sort) {
  let docs = filesBefore;

  switch (sort.by) {
    case "title":
      docs.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "date-modified":
      docs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      break;
    case "date-created":
      docs.sort((a, b) => new Date(b.created) - new Date(a.created));
      break;
  }

  if (sort.order == "descending") docs.reverse();

  return docs;
}










/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
async function reducers(state = {}, action) {

  const newState = Object.assign({}, state);

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

    case 'SELECT_EDITOR_THEME': {
      newState.editorTheme = action.theme;
      newState.changed.push('editorTheme');
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

      // Update `folders`, `documents`, `media`
      newState.folders = action.folders;
      newState.documents = action.documents;
      newState.media = action.media;
      newState.changed.push('folders', 'documents', 'media');

      // Update `sideBar`. `mapSideBarItems` returns a `sideBar` object with child objects for each project folder, filter, etc.
      newState.sideBar = mapSideBarItems(newState);
      newState.changed.push('sideBar');

      // Check if selectedSideBarItem still exists. If no, select first sideBar item. This covers the scenario where a folder sideBar item was selected, then deleted from the disk.

      const allSideBarItems = newState.sideBar.folders.concat(newState.sideBar.documents, newState.sideBar.media);

      const selectedStillExists = allSideBarItems.some((sbi) => sbi.id == newState.selectedSideBarItem.id);

      if (!selectedStillExists) {
        newState.selectedSideBarItem.id = newState.sideBar.folders[0].id;
        newState.changed.push('selectedSideBarItem');
      }

      // Update `files` for the selected SideBar item
      const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id);
      sideBarItem.files = getFiles(newState, sideBarItem);

      break
    }

    case 'ADD_DOCUMENTS': {
      newState.documents = newState.documents.concat(action.documents);
      newState.changed.push('documents');

      // Increment parent folders `childFileCount`
      action.documents.forEach((d) => {
        newState.folders.find((f) => f.path == path.dirname(d.path)).childFileCount++;
      });

      // When we create a new document in-app (e.g. via File > New Document), we want to select it.
      // First, we use a heuristic to check the new documents found by watcher.js (action.documents.
      // Heuristic: only one file was added, and file name includes "Untitled".
      let isNewDoc = action.documents.length == 1 && action.documents[0].title.includes('Untitled');

      // If there's a single new doc...
      if (isNewDoc) {

        const newDoc = action.documents[0];

        // If the new doc is currently visible inside the selected SideBar item...
        // * Select it (and deselect other files)
        // * Else, switch to the 'All' Document filter, and select it.

        let sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id);
        sideBarItem.files = getFiles(newState, sideBarItem);
        const isNewDocDisplayed = sideBarItem.files.some((f) => f.id == newDoc.id);

        if (isNewDocDisplayed) {

          // Select the doc
          sideBarItem.files.forEach((f) => f.selected = f.id == newDoc.id);

        } else {

          // Switch to `All` Document filter
          newState.selectedSideBarItem.id = 'docs-all';

          // Update SideBar item and Files
          sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id);
          sideBarItem.files = getFiles(newState, sideBarItem);
        }

        newState.changed.push('newDoc');

        // Update `openDoc`
        updateOpenDoc(newState, sideBarItem);
        newState.changed.push('openDoc');
  
        // Focus the editor and place the cursor, so we're ready to start typing
        newState.focusedLayoutSection = 'editor';
        newState.changed.push('focusedLayoutSection');
      }

      // Update SideBar. This catches scenario where files are added to a previously empty folder.
      newState.sideBar = mapSideBarItems(newState);

      break
    }

    case 'ADD_MEDIA': {
      newState.media = newState.media.concat(action.media);
      newState.changed.push('media');

      // Increment parent folder `childFileCount`
      action.media.forEach((m) => {
        newState.folders.find((f) => f.path == path.dirname(m.path)).childFileCount++;
      });

      updateSideBarAndFiles(newState);

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

      updateSideBarAndFiles(newState);

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

      updateSideBarAndFiles(newState);


      break
    }

    // Remove `action.documentPaths` from `documents`
    case 'REMOVE_DOCUMENTS': {
      for (let p of action.documentPaths) {
        const index = newState.documents.findIndex((d) => d.path == p);
        if (index !== -1) {
          newState.documents.splice(index, 1);
        }
        // Decrement parent folder `childFileCount`
        newState.folders.find((f) => f.path == path.dirname(p)).childFileCount--;
      }
      newState.changed.push('documents', 'folders');

      updateSideBarAndFiles(newState);

      // Update `openDoc`
      const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id);
      updateOpenDoc(newState, sideBarItem);
      newState.changed.push('openDoc');

      break
    }

    case 'REMOVE_MEDIA': {
      for (let p of action.mediaPaths) {
        const index = newState.media.findIndex((d) => d.path == p);
        if (index !== -1) {
          newState.media.splice(index, 1);
        }
        // Decrement parent folder `childFileCount`
        newState.folders.find((f) => f.path == path.dirname(p)).childFileCount--;
      }
      newState.changed.push('media', 'folders');

      updateSideBarAndFiles(newState);

      break
    }


    // -------- SIDEBAR -------- //

    case 'SELECT_SIDEBAR_ITEM': {

      if (newState.selectedSideBarItem.id == action.item.id) break

      // Get reference to item inside the `newState.sideBar` array.
      // This is the object we need to update.
      const item = getSideBarItemById(newState, action.item.id);

      // Update the displayed files for the selected item
      // item.displayedFiles = getDisplayedFiles(newState, item)
      // newState.changed.push('displayedFiles')

      // Update `files` for the selected SideBar item
      item.files = getFiles(newState, item);

      // Update `selectedSideBarItem`
      newState.selectedSideBarItem.id = action.item.id;
      newState.changed.push('selectedSideBarItem');

      // Update DocList visibility
      if (newState.showFilesList !== item.showFilesList) {
        newState.showFilesList = item.showFilesList;
        newState.changed.push('showFilesList');
      }

      // Update `openDoc`
      updateOpenDoc(newState, item);
      newState.changed.push('openDoc');

      break
    }

    // This is called when the user selects files from DocList
    // * `sideBarItem`: should be `state.selectedSideBarItem`
    // * `selectedFiles`: an array of selected files as objects, with index and id: `{ index: 0, id: doc-50780411}`. `index` is their position in the DocList.
    case 'SELECT_FILES': {
      const item = getSideBarItemById(newState, action.sideBarItem.id);
      if (!item) break

      // Update `lastSelection`
      // item.lastSelection = action.selectedFiles
      // newState.changed.push('lastSelection')

      // Update `files`
      item.files.forEach((f) => f.selected = action.selectedFiles.some((sf) => sf.id == f.id));

      // Update `openDoc`
      updateOpenDoc(newState, item);
      newState.changed.push('openDoc');
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const item = getSideBarItemById(newState, action.item.id);
      if (!item) break
      item.lastScrollPosition = action.lastScrollPosition;
      newState.changed.push('lastScrollPosition');
      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const item = getSideBarItemById(newState, action.item.id);
      if (!item) break
      item.expanded = !item.expanded;
      newState.changed.push('item expanded');
      break
    }

    case 'SET_SORT': {
      const item = getSideBarItemById(newState, action.item.id);
      item.sort = action.sort;

      // Update `files` for the selected SideBar item
      item.files = getFiles(newState, item);

      newState.changed.push('sort');
      break
    }

    // -------- FILE ACTIONS -------- //

    case 'NEW_FILE_SUCCESS': {
      console.log(`Reducers: NEW_FILE_SUCCESS: ${action.filePath}`.green);
      break
    }

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

  }

  return newState
}

// import { updatedDiff, detailedDiff } from 'deep-object-diff'

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
      `(Store.js)`.green
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

async function newFile (state) {

  let id, folder;

  let sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id);

  if(sideBarItem.type == 'folder') {
    id = sideBarItem.id;
    folder = state.folders.find((i) => i.id == id);
  }

  // The file name of our new file 
  let fileName = 'Untitled-';
  let fileNameIncrement = 1;

  // Get all documents in the selected folder with `fileName` in their name
  // E.g. 'Untitled-1', 'Untitled-222', 'Untitled-3', etc.
  let docs = state.documents.filter((d) => d.parentId == folder.id && d.title.includes(fileName));

  // Does `docs` already contain a file with the exact same file name?
  function fileAlreadyExists() {
    // We use `path.parse(d.path).base` to get the file name from the file path
    // Docs: https://nodejs.org/api/path.html#path_path_parse_path 
    return docs.some((d) => path.parse(d.path).base == `${fileName}${fileNameIncrement}.md`)
  }

  // While the file already exists, increment `fileNameIncrement` until it doesn't. 
  while (fileAlreadyExists()) {
    fileNameIncrement++;
  }

  let filePath = `${folder.path}/${fileName}${fileNameIncrement}.md`;

  // console.log(state)
  // return

  try {
  	await fsExtra.writeFile(filePath, 'Testing', 'utf8');
  	return {
  		type: ' NEW_FILE_SUCCESS',
  		filePath: filePath,
  	}
  } catch (err) {
  	return {
  		type: 'NEW_FILE_FAIL',
  		err: err
  	}
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

    var saveNewFile = new electron.MenuItem({
      label: 'New Document',
      accelerator: 'CmdOrCtrl+N',
      async click(item, focusedWindow) {

        store.dispatch(await newFile(state));
      }
    });


    var save = new electron.MenuItem({
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsSaveFile');
      }
    });

    var moveToTrash = new electron.MenuItem({
      label: 'Move to Trash',
      accelerator: 'CmdOrCtrl+Backspace',
      click(item, focusedWindow) {
        focusedWindow.webContents.send('mainRequestsDeleteFile');
      }
    });

    const file = new electron.MenuItem({
      label: 'File',
      submenu: [
        saveNewFile,
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

  var select_editor_theme_dark = new electron.MenuItem({
    label: 'Dark',
    type: 'checkbox',
    checked: state.editorTheme == 'gambier-dark',
    click(item, focusedWindow) {
      store.dispatch({
        type: 'SELECT_EDITOR_THEME',
        theme: 'gambier-dark',
      });
    }
  });

  var select_editor_theme_light = new electron.MenuItem({
    label: 'Light',
    type: 'checkbox',
    checked: state.editorTheme == 'gambier-light',
    click() {
      store.dispatch({
        type: 'SELECT_EDITOR_THEME',
        theme: 'gambier-light',
      });
    }
  });


  const view = new electron.MenuItem(
    {
      label: 'View',
      submenu: [
        {
          label: 'Source mode',
          type: 'checkbox',
          checked: false,
          accelerator: 'CmdOrCtrl+/',
          click(item, focusedWindow) {
            console.log(state.editorTheme);
            if (focusedWindow) {
              focusedWindow.webContents.send('mainRequestsToggleSource', item.checked);
            }
          }
        },
        {
          label: 'Theme',
          submenu: [
            select_editor_theme_dark,
            select_editor_theme_light
          ]
        },
        // { type: 'separator' },
        // {
        //   label: 'Reload',
        //   accelerator: 'CmdOrCtrl+R',
        //   click(item, focusedWindow) {
        //     if (focusedWindow) focusedWindow.reload()
        //   }
        // },
        // {
        //   label: 'Toggle Developer Tools',
        //   accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        //   click(item, focusedWindow) {
        //     if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        //   }
        // },
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

  store.onDidChange('editorTheme', () => {
    select_editor_theme_dark.checked = state.editorTheme == 'gambier-dark';
    select_editor_theme_light.checked = state.editorTheme == 'gambier-light';
  });


  // -------- Create menu -------- //

  electron.Menu.setApplicationMenu(menu);
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
      } else if (ext == '.md' || ext == '.markdown') {
        contents.documents.push(await mapDocument(ePath, stats, folder.id));
        folder.childFileCount++;
      } else if (imageFormats.includes(ext) || avFormats.includes(ext)) {
        contents.media.push(await mapMedia(ePath, stats, folder.id, ext));
        folder.childFileCount++;
      }
    })
  );

  return contents
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

      if (ext == '.md' || ext == '.markdown') {
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

      if (ext == '.md' || ext == '.markdown') {
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

      if (ext == '.md' || ext == '.markdown') {
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
store$2 = new Store();

// Setup store change listeners
store$2.onDidAnyChange((newState, oldState) => {
  if (win !== undefined) {
    win.webContents.send('stateChanged', newState, oldState);
  }
});

// TEMP
store$2.set('projectPath', '/Users/josh/Desktop/Test notes');

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
    case ('SET_SORT'):
      store$2.dispatch(action);
      break
    case ('LOAD_PATH_IN_EDITOR'):
      store$2.dispatch(action);
      break
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
    case ('SELECT_FILES'):
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
