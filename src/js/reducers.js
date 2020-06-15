const initialState = {}

function reducers(state = initialState, action) {
  switch (action.type) {

    case 'SET_PROJECT_DIRECTORY': {
      return Object.assign({}, state, {
        projectDirectory: action.path
      })
    }

    case 'OPEN_FOLDER': {
      const newState = Object.assign({}, state, {
        selectedFolderId: action.id
      })
      const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.id)
      newState.lastOpenedFileId = selectedFolder.selectedFileId
      console.log(newState.lastOpenedFileId)
      return newState
    }

    case 'OPEN_FILE': {
      const newState = Object.assign({}, state, {
        lastOpenedFileId: action.fileId
      })
      const selectedFolder = newState.contents.find((d) => d.type == 'directory' && d.id == action.parentId)
      selectedFolder.selectedFileId = action.fileId
      return newState
    }

    case 'SET_STARTUP_TIME': {
      return Object.assign({}, state, {
        appStartupTime: action.time
      })
    }

    case 'MAP_HIERARCHY': {
      return Object.assign({}, state, {
        contents: action.contents
      })
    }

    case 'RESET_HIERARCHY': {
      return Object.assign({}, state, {
        contents: []
      })
    }
    
    default:
      return state
  }
}

export default reducers