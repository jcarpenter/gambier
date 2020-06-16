function getRootDir(contents) {
  return contents.find((d) => d.type == 'directory' && d.isRoot)
}

function getDirectoryById(contents, id){
  return contents.find((d) => d.type == 'directory' && d.id == id)
}

function getFirstFileInDirectory(contents, directoryId) {
  const files = contents.filter((f) => f.type == 'file' && f.parentId == directoryId)
  return files[0]
}

/**
 * Check if contents contains item by type and id
 */
function hasContentById(contents, type, id) {
  return contents.some((d) => d.type == type && d.id == id)
}

/**
 * `state = {}` gives us a default, for possible first run 'undefined'.
 */
function reducers(state = {}, action) {

  const newState = Object.assign({}, state)

  newState.lastAction = action.type
  newState.changed = [] // Reset on every action 

  switch (action.type) {

    case 'SET_PROJECT_DIRECTORY': {
      newState.projectDirectory = action.path
      newState.changed.push('projectDirectory')
      break
    }

    case 'MAP_HIERARCHY': {
      newState.contents = action.contents

      // Handle first run and error conditions:
      // If a folder has not been selected yet, or if the previously-selected 
      // folder does not exist in updated contents, select root directory.
      if (
        newState.selectedFolderId == 0 ||
        !hasContentById(newState.contents, 'directory', newState.selectedFolderId)
      ) {
        
        // Set `selectedFolderId`
        const rootDir = getRootDir(newState.contents)
        newState.selectedFolderId = rootDir.id

        // If rootDir has child files, set `selectedFileId` to first one.
        // Else, set `selectedFileId` to zero (effectively means 'undefined')
        if (rootDir.childFileCount > 0) {
          const firstFile = getFirstFileInDirectory(newState.contents, newState.selectedFolderId)
          newState.selectedFileId = firstFile.id
        } else {
          newState.selectedFileId = 0
        }
        
        newState.changed.push('selectedFolderId')
        newState.changed.push('selectedFileId')
      }

      newState.changed.push('contents')
      break
    }

    case 'OPEN_FOLDER': {

      // Set `state.selectedFolderId`
      newState.selectedFolderId = action.id

      const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.id)

      // Set `state.selectedFileId` to folder's selected file
      newState.selectedFileId = selectedFolder.selectedFileId

      newState.changed.push('selectedFolderId')
      newState.changed.push('selectedFileId')

      break
    }

    case 'OPEN_FILE': {
      newState.selectedFileId = action.fileId

      // Find directory that contains selected file, 
      // and set its `selectedFileId` property.
      const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.parentId)
      selectedFolder.selectedFileId = action.fileId

      newState.changed.push('selectedFileId')
      newState.changed.push('selectedFolder.selectedFileId')

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