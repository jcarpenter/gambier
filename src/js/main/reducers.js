import diff from 'deep-diff'
import colors from 'colors'
import { xlink_attr } from 'svelte/internal'

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

function getFile(contents, id) {
  return contents.find((c) => c.type == 'file' && c.id == id)
}

function getRootFolder(contents) {
  return contents.find((c) => c.type == 'folder' && c.isRoot)
}

function getSideBarItem(sideBarItems, id) {
  return sideBarItems.find((i) => i.id == id)
}

function updateSideBarItems(newState) {

  const rootFolder = getRootFolder(newState.contents)

  // Update `filesFilter` type items: 
  // Specifically, their lookInFolder values, to point to correct `contents` id.
  // They always operate on the rootFolder
  newState.sideBar.items.forEach((i) => {
    if (i.type == 'filesFilter') {
      i.searchParams.lookInFolderId = rootFolder.id
    }
  })

  // Update `filesFolder` type items:
  // Update root folder item. This item holds the project file hierarchy, in the UI.
  const rootFolderItem = newState.sideBar.items.find((i) => i.type == 'filesFolder' && i.isRoot)
  rootFolderItem.label = rootFolder.name
  rootFolderItem.id = rootFolder.id
  rootFolderItem.searchParams.lookInFolderId = rootFolder.id

  // Remove existing child folder items.
  newState.sideBar.items = newState.sideBar.items.filter((i) => i.isRoot || i.type !== 'filesFolder')

  // Add child folder items.
  // For each, set parent item as root folder item, and push into items array.
  if (rootFolder.childFolderCount > 0) {
    createAndInsertChildFolderItems(rootFolder)
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

        }

        newState.sideBar.items.push(childFolderItem)

        // Recursive loop
        if (c.childFolderCount > 0) {
          createAndInsertChildFolderItems(c)
        }
      }
    })
  }
}

/**
 * Copy object of the selected file from `state.contents` into top-level `state.openFile`
 * @param {*} newState 
 * @param {*} id - Selected file `id`
 */
function updateOpenFile(newState, selectedSideBarItem) {
  
  const lastSelection = selectedSideBarItem.lastSelection
  if (lastSelection.length == 1) {
    newState.openFile = newState.contents.find((c) => c.type == 'file' && c.id == lastSelection[0].id)
  } else {
    newState.openFile = {}
  }

  console.log(newState.openFile)
}




/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  // newState.lastAction = action.type
  newState.changed = [] // Reset on every action 

  switch (action.type) {


    // -------- EDITOR -------- //

    case 'LOAD_PATH_IN_EDITOR': {
      newState.editingFileId = action.id
      newState.changed.push('editingFileId')
      break
    }

    case 'SET_PROJECTPATH_FAIL': {
      // DO NOTHING
      break
    }


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


    // -------- FILES -------- //

    case 'SAVE_FILE_SUCCESS': {
      // Apply changes to record in `contents`
      const lhs = newState.contents.find((c) => c.id == action.metadata.id)
      const rhs = action.metadata
      diff.observableDiff(lhs, rhs, (d) => {
        diff.applyChange(lhs, rhs, d)
      })
      break
    }

    case 'SAVE_FILE_FAIL': {
      console.log(`Reducers: SAVE_FILE_FAIL: ${action.path}`.red)
      break
    }

    // Delete _file_ (singular)

    case 'DELETE_FILE_SUCCESS': {

      console.log(`Reducers: DELETE_FILE_SUCCESS: ${action.path}`.green)

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
      console.log(`Reducers: DELETE_FILE_FAIL: ${action.err}`.red)
      break
    }

    // Delete _files_ (plural)

    case 'DELETE_FILES_SUCCESS': {
      console.log(`Reducers: DELETE_FILES_SUCCESS: ${action.paths}`.green)
      break
    }

    case 'DELETE_FILES_FAIL': {
      console.log(`Reducers: DELETE_FILES_FAIL: ${action.err}`.red)
      break
    }


    // -------- CONTENTS -------- //

    case 'HANDLE_ADD_FILE': {
      console.log('HANDLE_ADD_FILE')
      break
    }

    case 'HANDLE_CHANGE_FILE': {
      console.log('HANDLE_CHANGE_FILE')
      break
    }

    case 'HANDLE_UNLINK_FILE': {

      const index = newState.contents.findIndex((c) => c.type == 'file' && c.path == action.path)

      // If the file existed in `contents`, remove it.
      // Note: -1 from `findIndex` means it did NOT exist.
      if (index !== -1) {
        newState.contents.splice(index, 1)
      }

      newState.changed.push('contents')

      break
    }

    case 'HANDLE_ADD_DIR': {
      console.log('HANDLE_ADD_DIR')
      break
    }

    case 'HANDLE_UNLINK_DIR': {
      console.log('HANDLE_UNLINK_DIR')
      break
    }

    case 'MAP_CONTENTS': {

      // Set new contents
      newState.contents = action.contents
      newState.changed.push('contents')

      // Set `rootDirId`
      const rootFolder = getRootFolder(newState.contents)
      newState.rootFolderId = rootFolder.id

      updateSideBarItems(newState)
      newState.changed.push('sideBar')
      break
    }

    case 'RESET_HIERARCHY': {
      newState.contents = []
      newState.changed.push('contents')
      break
    }

    // Layout focus
    case 'SET_LAYOUT_FOCUS': {
      newState.focusedLayoutSection = action.section
      newState.changed.push('focusedLayoutSection')
      break
    }


    // -------- SIDEBAR -------- //

    case 'SELECT_SIDEBAR_ITEM': {

      if (newState.selectedSideBarItemId == action.id) break

      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id)

      // Update FileList visibility
      if (newState.showFilesList !== sideBarItem.showFilesList) {
        newState.showFilesList !== sideBarItem.showFilesList
        newState.changed.push('showFilesList')
      }

      // Update selected SideBar item
      newState.selectedSideBarItemId = action.id
      newState.changed.push('selectedSideBarItemId')

      // Update `openFile`
      console.log(sideBarItem)

      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem)
        newState.changed.push('openFile')
      }

      break
    }

    case 'TOGGLE_SIDEBAR_ITEM_EXPANDED': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.id)
      sideBarItem.expanded = !sideBarItem.expanded
      newState.changed.push('sideBar item expanded')
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_FILE_SELECTION': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.sideBarItemId)
      sideBarItem.lastSelection = action.lastSelection
      newState.changed.push('lastSelection')
      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem)
        newState.changed.push('openFile')
      }
      break
    }

    // This is set on the _outgoing_ item, when the user is switching SideBar items.
    case 'SAVE_SIDEBAR_SCROLL_POSITION': {
      const sideBarItem = getSideBarItem(newState.sideBar.items, action.sideBarItemId)
      sideBarItem.lastScrollPosition = action.lastScrollPosition
      newState.changed.push('sideBar lastScrollPosition')
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

export default reducers