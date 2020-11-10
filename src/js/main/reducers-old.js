import { BrowserWindow } from 'electron'
import { mapSideBarItems } from './sideBar/mapSideBarItems'
import path from 'path'
import { getSideBarItemById } from './utils-main'
import moment from 'moment'
import { newProject } from './Store.js'


/**
 * Update top-level `state.openDoc`. It is a copy of the selected doc's object from `state.documents`. We only "open" a doc if _one_ doc is selected. If multiple are selected, we display nothing in the editor. 
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenDoc(newState, selectedSideBarItem) {

  const selectedFiles = selectedSideBarItem.files.filter((file) => file.selected)

  if (selectedFiles.length == 1) {
    const docToOpen = newState.documents.find((c) => c.id == selectedFiles[0].id)
    if (docToOpen !== undefined) {
      newState.openDoc = Object.assign({}, docToOpen)
    } else {
      newState.openDoc = {}
    }
  } else {
    newState.openDoc = {}
  }
}

/** 
 * Just a convenience function to keep things DRY, since we do these steps any time the prpject files change.
 */
function updateSideBarAndFiles(newState) {
  // Update SideBar
  newState.sideBar = mapSideBarItems(newState)
  newState.changed.push('sideBar')

  // Update the `files` of the selected SideBar item
  const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id)
  sideBarItem.files = getFiles(newState, sideBarItem)
}


/**
 * Return a list of displayed files for the selected SideBar item. 
 * These are files that match the SideBar item's `filter` criteria (e.g. folder, tags, etc).
 * @param {*} newState 
 */
function getFiles(newState, item) {

  let filter = item.filter

  // Determine folder to look in from `lookInFolderId`. If value is '*', that means "search all folders", so we get the root folder (the one without a parentId). Else, we use the folder value specified.
  const folder = filter.lookInFolderId == '*' ?
    newState.folders.find((f) => f.parentId == '') :
    newState.folders.find((f) => f.id == filter.lookInFolderId)

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
    let from = filter.dateModified.from
    let to = filter.dateModified.to

    // Convert `from` value to date
    if (from == 'NOW' || from == '') {
      from = moment().format()
    } else if (filter.dateModified.from.includes('DAYS-AGO')) {
      let numberOf = from.substring(0, from.indexOf('-'))
      from = moment().subtract(numberOf, 'days')
    } else {
      from = moment(from).format()
    }

    // Convert `to` value to date
    if (filter.dateModified.to.includes('DAYS-AGO')) {
      let numberOf = to.substring(0, to.indexOf('-'))
      to = moment().subtract(numberOf, 'days').format()
    } else {
      to = moment(to).format()
    }

    // console.log(from)
    // console.log(to)

    if (from > to) {
      files = files.filter((f) => {
        const modified = moment(f.modified).format()
        if (modified < from && modified > to) {
          return f
        }
      })
    }
  }

  // Sort the files
  files = sortFiles(files, item.sort)

  //  Set files' `selected` property
  // files = restoreFileSelections(files, item.files)

  // Make a new array with just the essentials for each file (`id`, `selected`).
  // This is what we'll return.
  let filesObjects = []
  files.forEach((f, index) => filesObjects.push({ id: f.id, selected: false }))

  // Select files:

  let oldFiles = item.files
  const atLeastOneFilesWasPreviouslySelected = oldFiles.some((file) => file.selected)

  // If there was a previous selection, try to restore it
  if (atLeastOneFilesWasPreviouslySelected) {

    // If the same file in the new `files` existed in old `files`, and it was selected, select it again.
    filesObjects.forEach((f) => {
      f.selected = oldFiles.some((file) => file.id == f.id && file.selected)
    })

    // If nothing is selected after doing the above (e.g. the selected files do NOT exist any more, probably due to a selected file being deleted), then try to select the "next" file. This will be the file at the same index number as the previously selected doc, or——if the previously-selected doc was last in the list——the new last doc.
    const atLeastOneFileIsSelected = filesObjects.some((f) => f.selected)
    if (!atLeastOneFileIsSelected) {

      // Get index of previous selection
      let indexOfPreviousSelection = 0
      oldFiles.forEach((file, index) => {
        if (file.selected) { indexOfPreviousSelection = index }
      })

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







function getUpdatedProjects(project, newState, windowId) {
  const projects = newState.projects.slice(0)
  const indexToReplace = projects.find((p) => p.windowId == windowId)
  projects[indexToReplace] = project
  return projects
}


/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
async function reducers(action, windowId = undefined) {

  // Create copy of existing state
  const newState = { ...global.state() }
  console.log(newState)

  // Set a few useful, commonly-used variables
  const win = windowId !== undefined ? BrowserWindow.fromId(windowId) : undefined
  const project = windowId !== undefined ? newState.projects.find((p) => p.window.id == windowId) : undefined

  // Reset `changed` every time
  newState.changed = []

  switch (action.type) {


    // -------- APP -------- //

    // Startup

    case 'START_COLD_START': {
      newState.appStatus = 'coldStarting'
      newState.changed.push('appStatus')
      break
    }

    case 'FINISH_COLD_START': {
      newState.appStatus = 'open'
      newState.changed.push('appStatus')
      break
    }

    // Quit

    case 'START_TO_QUIT': {
      newState.appStatus = 'wantsToQuit'
      newState.changed.push('appStatus')
      break
    }

    case 'CAN_SAFELY_QUIT': {
      newState.appStatus = 'safeToQuit'
      newState.changed.push('appStatus')
      break
    }


    // -------- PROJECT/WINDOW -------- //

    case 'CREATE_NEW_PROJECT': {
      // Each project needs to store the ID of the window it's associated with. The BrowserWindow hasn't been created yet for this project (that's handled by WindowManager), but we know what ID the window will be: BrowserWindow ids start at 1 and go up. And removed BrowserWindows do not release their IDs back into the available set. So the next BrowserWindow id is always +1 of the highest existing.
      function getNextWindowId () {
        const existingWindowIds = BrowserWindow.getAllWindows()
        .map((win) => win.id)
        const nextWindowId = Math.max(existingWindowIds) + 1
        return nextWindowId
      }
      const project = { ...newProject }
      project.window.id = getNextWindowId()
      newState.projects.push(project)
      newState.changed.push('projects')
      break
    }

    case 'START_TO_CLOSE_WINDOW': {
      project.window.status = 'wantsToClose'
      newState.changed.push('projects', 'window.status')
      break
    }

    case 'CAN_SAFELY_CLOSE_WINDOW': {
      project.window.status = 'safeToClose'
      newState.changed.push('projects', 'window.status')
      break
    }

    case 'REMOVE_PROJECT': {
      const projects = newState.projects.slice(0)
      const indexOfProjectToRemove = projects.findIndex((p) => p.window.id == windowId)
      projects.splice(indexOfProjectToRemove, 1)
      newState.projects = projects
      newState.changed.push('projects')
      break
    }

    // -------- APP -------- //


    // -------- PROJECT PATH -------- //

    case 'SET_PROJECTPATH_SUCCESS': {
      newState.projectPath = action.path
      newState.changed.push('projectPath')
      break
    }

    case 'SET_PROJECTPATH_FAIL': {
      // DO NOTHING
      break
    }


    // -------- UI -------- //

    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section
      newState.changed.push('focusedLayoutSection')
      break
    }

    case 'SET_APPEARANCE': {
      if (action.userPref) newState.appearance.userPref = action.userPref
      if (action.theme) newState.appearance.theme = action.theme
      newState.changed.push('appearance')
      break
    }


    // -------- EDITOR -------- //

    // case 'LOAD_PATH_IN_EDITOR': {
    //   newState.editingFileId = action.id
    //   newState.changed.push('editingFileId')
    //   break
    // }

    case 'SET_SOURCE_MODE': {
      newState.sourceMode = action.active
      newState.changed.push('sourceMode')
      break
    }


    // -------- CONTENTS -------- //

    case 'MAP_PROJECT_CONTENTS': {

      // Update `folders`, `documents`, `media`
      newState.folders = action.folders
      newState.documents = action.documents
      newState.media = action.media
      newState.changed.push('folders', 'documents', 'media')

      // Update `sideBar`. `mapSideBarItems` returns a `sideBar` object with child objects for each project folder, filter, etc.
      newState.sideBar = mapSideBarItems(newState)
      newState.changed.push('sideBar')

      // Check if selectedSideBarItem still exists. If no, select first sideBar item. This covers the scenario where a folder sideBar item was selected, then deleted from the disk.

      const allSideBarItems = newState.sideBar.folders.concat(newState.sideBar.documents, newState.sideBar.media)

      const selectedStillExists = allSideBarItems.some((sbi) => sbi.id == newState.selectedSideBarItem.id)

      if (!selectedStillExists) {
        newState.selectedSideBarItem.id = newState.sideBar.folders[0].id
        newState.changed.push('selectedSideBarItem')
      }

      // Update `files` for the selected SideBar item
      const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id)
      sideBarItem.files = getFiles(newState, sideBarItem)

      break
    }

    case 'ADD_DOCUMENTS': {
      newState.documents = newState.documents.concat(action.documents)
      newState.changed.push('documents')

      // Increment parent folders `directChildCount`
      action.documents.forEach((d) => {
        newState.folders.find((f) => f.path == path.dirname(d.path)).directChildCount++
      })

      // When we create a new document in-app (e.g. via File > New Document), we want to select it.
      // First, we use a heuristic to check the new documents found by watcher.js (action.documents.
      // Heuristic: only one file was added, and file name includes "Untitled".
      let isNewDoc = action.documents.length == 1 && action.documents[0].title.includes('Untitled')

      // If there's a single new doc...
      if (isNewDoc) {

        const newDoc = action.documents[0]

        // If the new doc is currently visible inside the selected SideBar item...
        // * Select it (and deselect other files)
        // * Else, switch to the 'All' Document filter, and select it.

        let sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id)
        sideBarItem.files = getFiles(newState, sideBarItem)
        const isNewDocDisplayed = sideBarItem.files.some((f) => f.id == newDoc.id)

        if (isNewDocDisplayed) {

          // Select the doc
          sideBarItem.files.forEach((f) => f.selected = f.id == newDoc.id)

        } else {

          // Switch to `All` Document filter
          newState.selectedSideBarItem.id = 'docs-all'

          // Update SideBar item and Files
          sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id)
          sideBarItem.files = getFiles(newState, sideBarItem)
        }

        newState.changed.push('newDoc')

        // Update `openDoc`
        updateOpenDoc(newState, sideBarItem)
        newState.changed.push('openDoc')

        // Focus the editor and place the cursor, so we're ready to start typing
        newState.focusedLayoutSection = 'editor'
        newState.changed.push('focusedLayoutSection')
      }

      // Update SideBar. This catches scenario where files are added to a previously empty folder.
      newState.sideBar = mapSideBarItems(newState)

      break
    }

    case 'ADD_MEDIA': {
      newState.media = newState.media.concat(action.media)
      newState.changed.push('media')

      // Increment parent folder `directChildCount`
      action.media.forEach((m) => {
        newState.folders.find((f) => f.path == path.dirname(m.path)).directChildCount++
      })

      updateSideBarAndFiles(newState)

      break
    }

    case 'UPDATE_DOCUMENTS': {
      for (let updatedVersion of action.documents) {
        // Get index of old version in `documents`
        const index = newState.documents.findIndex((oldVersion) => oldVersion.id == updatedVersion.id)
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.documents[index] = updatedVersion
        }
      }
      newState.changed.push('documents')

      updateSideBarAndFiles(newState)

      break
    }

    case 'UPDATE_MEDIA': {
      for (let updatedVersion of action.media) {
        // Get index of old version in `media`
        const index = newState.media.findIndex((oldVersion) => oldVersion.id == updatedVersion.id)
        // Confirm old version exists (index is not -1)
        // And replace it with new version
        if (index !== -1) {
          newState.media[index] = updatedVersion
        }
      }
      newState.changed.push('media')

      updateSideBarAndFiles(newState)


      break
    }

    // Remove `action.documentPaths` from `documents`
    case 'REMOVE_DOCUMENTS': {
      for (let p of action.documentPaths) {
        const index = newState.documents.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.documents.splice(index, 1)
        }
        // Decrement parent folder `directChildCount`
        newState.folders.find((f) => f.path == path.dirname(p)).directChildCount--
      }
      newState.changed.push('documents', 'folders')

      updateSideBarAndFiles(newState)

      // Update `openDoc`
      const sideBarItem = getSideBarItemById(newState, newState.selectedSideBarItem.id)
      updateOpenDoc(newState, sideBarItem)
      newState.changed.push('openDoc')

      break
    }

    case 'REMOVE_MEDIA': {
      for (let p of action.mediaPaths) {
        const index = newState.media.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.media.splice(index, 1)
        }
        // Decrement parent folder `directChildCount`
        newState.folders.find((f) => f.path == path.dirname(p)).directChildCount--
      }
      newState.changed.push('media', 'folders')

      updateSideBarAndFiles(newState)

      break
    }


    // -------- SIDEBAR 2 -------- //

    case 'EXPAND_SIDEBAR_ITEMS': {
      const tab = newState.sideBar2.tabs.find((i) => i.name == action.tabName)
      tab.expandedItems = action.expandedItems
      newState.changed.push(`sideBar.tabs.${action.tabName}`)
      break
    }

    case 'SELECT_SIDEBAR_ITEMS': {
      console.log(action)
      const tab = newState.sideBar2.tabs.find((i) => i.name == action.tabName)
      tab.lastSelectedItem = action.lastSelectedItem
      tab.selectedItems = action.selectedItems
      newState.changed.push(`sideBar.tabs.${action.tabName}`)
      newState.changed.push(`sideBar.activeTab`)
      break
    }

    case 'SELECT_SIDEBAR_TAB_BY_INDEX': {
      newState.sideBar2.activeTab.index = action.index
      newState.sideBar2.activeTab.name = newState.sideBar2.tabs[action.index].name
      newState.changed.push('sideBar.activeTab')
      break
    }
    case 'TOGGLE_SIDEBAR_PREVIEW': {
      newState.sideBar2.preview.isOpen = !newState.sideBar2.preview.isOpen
      newState.changed.push(`sideBar.preview`)
      break
    }


    // -------- SIDEBAR -------- //


    case 'SELECT_SIDEBAR_ITEM': {

      if (newState.selectedSideBarItem.id == action.item.id) break

      // Get reference to item inside the `newState.sideBar` array.
      // This is the object we need to update.
      const item = getSideBarItemById(newState, action.item.id)

      // Update the displayed files for the selected item
      // item.displayedFiles = getDisplayedFiles(newState, item)
      // newState.changed.push('displayedFiles')

      // Update `files` for the selected SideBar item
      item.files = getFiles(newState, item)

      // Update `selectedSideBarItem`
      newState.selectedSideBarItem.id = action.item.id
      newState.changed.push('selectedSideBarItem')

      // Update DocList visibility
      if (newState.showFilesList !== item.showFilesList) {
        newState.showFilesList = item.showFilesList
        newState.changed.push('showFilesList')
      }

      // Update `openDoc`
      updateOpenDoc(newState, item)
      newState.changed.push('openDoc')

      break
    }

    // This is called when the user selects files from DocList
    // * `sideBarItem`: should be `state.selectedSideBarItem`
    // * `selectedFiles`: an array of selected files as objects, with index and id: `{ index: 0, id: doc-50780411}`. `index` is their position in the DocList.
    case 'SELECT_FILES': {
      const item = getSideBarItemById(newState, action.sideBarItem.id)
      if (!item) break

      // Update `lastSelection`
      // item.lastSelection = action.selectedFiles
      // newState.changed.push('lastSelection')

      // Update `files`
      item.files.forEach((f) => f.selected = action.selectedFiles.some((sf) => sf.id == f.id))

      // Update `openDoc`
      updateOpenDoc(newState, item)
      newState.changed.push('openDoc')
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const item = getSideBarItemById(newState, action.item.id)
      if (!item) break
      item.lastScrollPosition = action.lastScrollPosition
      newState.changed.push('lastScrollPosition')
      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const item = getSideBarItemById(newState, action.item.id)
      if (!item) break
      item.expanded = !item.expanded
      newState.changed.push('item expanded')
      break
    }

    case 'SET_SORT': {
      const item = getSideBarItemById(newState, action.item.id)
      item.sort = action.sort

      // Update `files` for the selected SideBar item
      item.files = getFiles(newState, item)

      newState.changed.push('sort')
      break
    }

    // -------- FILE ACTIONS -------- //

    case 'NEW_FILE_SUCCESS': {
      console.log(`Reducers: NEW_FILE_SUCCESS: ${action.filePath}`.green)
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

export default reducers