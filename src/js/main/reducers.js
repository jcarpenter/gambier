// import diff from 'deep-diff'
// import colors from 'colors'
// import { getFileMetadata, Folder } from './contents/index.js'
// import { readFile, stat } from 'fs-extra'

import { mapSideBarItems } from './sideBar/mapSideBarItems'


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

  const lastSelection = selectedSideBarItem.lastSelection
  if (lastSelection.length == 1) {
    console.log(lastSelection[0])
    newState.openDoc = newState.contents.find((c) => c.type == 'file' && c.id == lastSelection[0].id)
  } else {
    newState.openDoc = {}
  }
}




/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
async function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  // newState.lastAction = action.type
  newState.changed = [] // Reset on every action 

  switch (action.type) {


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


    // -------- EDITOR -------- //

    case 'LOAD_PATH_IN_EDITOR': {
      newState.editingFileId = action.id
      newState.changed.push('editingFileId')
      break
    }


    // -------- CONTENTS -------- //

    case 'MAP_PROJECT_CONTENTS': {
      newState.folders = action.folders
      newState.documents = action.documents
      newState.media = action.media
      newState.changed.push('folders', 'documents', 'media')
      newState.sideBar.items = mapSideBarItems(newState)
      newState.changed.push('sideBar')
      break
    }

    case 'ADD_DOCUMENTS': {
      newState.documents = newState.documents.concat(action.documents)
      newState.changed.push('documents')
      break
    }

    case 'ADD_MEDIA': {
      newState.media = newState.media.concat(action.media)
      newState.changed.push('media')
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
      break
    }

    case 'REMOVE_DOCUMENTS': {
      for (let p of action.documentPaths) {
        const index = newState.documents.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.documents.splice(index, 1)
        }
      }
      newState.changed.push('documents')
      break
    }

    case 'REMOVE_MEDIA': {
      for (let p of action.mediaPaths) {
        const index = newState.media.findIndex((d) => d.path == p)
        if (index !== -1) {
          newState.media.splice(index, 1)
        }
      }
      newState.changed.push('media')
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

      // Update `openDoc`
      if (sideBarItem.lastSelection.length > 0) {
        updateOpenFile(newState, sideBarItem)
        newState.changed.push('openDoc')
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
        newState.changed.push('openDoc')
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

export default reducers