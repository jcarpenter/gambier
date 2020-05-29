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
        lastOpened: action.fileName
      })
    case 'SET_STARTUP_TIME':
      return Object.assign({}, state, {
        appStartupTime: action.time
      })
    default:
      return state
  }
}

export default reducers