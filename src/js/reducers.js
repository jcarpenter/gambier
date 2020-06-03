import * as Actions from './actions'

const initialState = {}

function reducers(state = initialState, action) {
  switch (action.type) {
    case 'SET_PROJECT_DIRECTORY':
      return Object.assign({}, state, {
        projectDirectory: action.path
      })
    case 'OPEN_FILE':
      return Object.assign({}, state, {
        lastOpenedFileId: action.id
      })
    case 'SET_STARTUP_TIME':
      return Object.assign({}, state, {
        appStartupTime: action.time
      })
    case 'MAP_HIERARCHY':
      return Object.assign({}, state, {
        contents: action.contents
        // hierarchy: action.contents
      })
    case 'RESET_HIERARCHY':
      return Object.assign({}, state, {
        contents: []
        // hierarchy: []
      })
    case 'SELECT_FOLDER':
      console.log(action.id)
      return Object.assign({}, state, {
        selectedFolderId: action.id
      })
    default:
      return state
  }
}

export default reducers