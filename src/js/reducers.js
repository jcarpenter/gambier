function getRootFolder(contents) {
  return contents.find((d) => d.type == 'directory' && d.isRoot)
}

function getDirectoryById(contents, id) {
  return contents.find((d) => d.type == 'directory' && d.id == id)
}

function getFirstFileInDirectory(contents, directoryId) {
  const files = contents.filter((f) => f.type == 'file' && f.parentId == directoryId)
  return files[0]
}

/**
 * Check if contents contains item by type and id
 */
function contentContainsItemById(contents, type, id) {
  return contents.some((d) => d.type == type && d.id == id)
}

/**
 * `state = {}` gives us a default, for possible first run empty '' value.
 */
function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  // newState.lastAction = action.type
  newState.changed = [] // Reset on every action 

  switch (action.type) {

    case 'SET_PROJECT_DIRECTORY': {
      newState.projectPath = action.path

      // Handle first run and error conditions:
      // If SideBar item has not been selected yet, select All 
      // if (state.sideBar.selectedItemId == '') {
      //   console.log("SET IT UPPPPP")
      //   state.sideBar.selectedItemId = 'all'
      //   newState.showFilesList = true
      //   newState.filesSearchCriteria.lookInFolderId = newState.rootFolderId
      //   newState.filesSearchCriteria.includeChildren = true
      //   newState.changed.push('sideBar')
      // }

      newState.changed.push('projectPath')
      break
    }

    case 'MAP_HIERARCHY': {
      newState.contents = action.contents

      // Set `rootDirId`
      const rootFolder = getRootFolder(newState.contents)
      newState.rootFolderId = rootFolder.id

      // Handle case of previously-selected folder no longer existing, since remap.
      // Check if selected item is folder, and if it no longer exists in content.
      // If conditions met, 
      // if (
      //   state.sideBar.selectedItemId.includes('folder') &&
      //   !contentContainsItemById(newState.contents, 'directory', state.sideBar.selectedItemId)
      // ) {
      //   state.sideBar.selectedItemId = 'all'
      //   newState.showFilesList = true
      //   newState.filesSearchCriteria = {
      //     lookInFolderId: newState.rootFolderId,
      //     includeChildren: true,
      //   }
      //   // newState.selectedFileId = newState.contents.find((c) => c.type == 'file')
      //   newState.changed.push('sideBar', 'selectedFileId')
      // }



      // Handle first run and error conditions:
      // If a folder has not been selected yet, or if the previously-selected 
      // folder does not exist in updated contents, select root directory.
      // if (
      //   state.sideBar.selectedItemId == '' ||
      //   !hasContentById(newState.contents, 'directory', state.sideBar.selectedItemId)
      // ) {

      //   // Set sideBar selected item
      //   state.sideBar.selectedItemId = newState.rootFolderId

      //   // If `rootDir` has child files, set `selectedFileId` to first one. Else, set `selectedFileId` to '' (empty)
      //   if (rootFolder.childFileCount > 0) {
      //     const firstFile = getFirstFileInDirectory(newState.contents, newState.selectedFolderId)
      //     newState.selectedFileId = firstFile.id
      //   } else {
      //     newState.selectedFileId = ''
      //   }

      //   newState.changed.push('selectedFolderId', 'selectedFileId', 'rootFolderId')
      // }

      newState.changed.push('contents')
      break
    }

    case 'SELECT_SIDEBAR_ITEM': {
      // if (action.filesSearchCriteria) {
      //   newState.filesSearchCriteria = action.filesSearchCriteria
      //   newState.changed.push('filesSearchCriteria')
      // }
      // newState.showFilesList = action.showFilesList
      state.sideBar.selectedItemId = action.id
      newState.changed.push('sideBar')
      break
    }

    // case 'OPEN_FOLDER': {

    //   // Set `state.selectedFolderId`
    //   newState.selectedFolderId = action.id

    //   const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.id)

    //   // Set `state.selectedFileId` to folder's selected file
    //   newState.selectedFileId = selectedFolder.selectedFileId

    //   newState.changed.push('selectedFolderId', 'selectedFileId')

    //   break
    // }

    case 'OPEN_FILE': {
      newState.selectedFileId = action.fileId

      // Find directory that contains selected file, 
      // and set its `selectedFileId` property.
      const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.parentId)
      selectedFolder.selectedFileId = action.fileId

      newState.changed.push('selectedFileId', 'selectedFolder.selectedFileId')

      break
    }

    case 'SET_STARTUP_TIME': {
      newState.appStartupTime = action.time
      newState.changed.push('appStartupTime')
      break
    }

    case 'RESET_HIERARCHY': {
      newState.contents = []
      newState.changed.push('contents')
      break
    }
  }

  return newState
}

export default reducers