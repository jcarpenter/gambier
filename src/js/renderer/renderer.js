
import { hasChangedTo } from '../shared/utils';
import { StateManager } from './StateManager';

import Layout from './component/Layout.svelte'

window.api.receive("stateChanged", (state, oldState) => {

  // Close window: On close window, complete necessary actions (e.g. save changes to edited docs), then tell state that window is safe to close. This triggers the window actually closing.
  const mainWantsToCloseWindow = hasChangedTo('window.status', 'wantsToClose', window.project, window.oldProject)

  if (mainWantsToCloseWindow) {
    // DO STUFF...
    window.api.send('dispatch', {
      type: 'CAN_SAFELY_CLOSE_WINDOW',
    })
  }
});


// Setup renderer
async function setup() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState')
  const initialFiles = await window.api.invoke('getFiles')

  // Create managers
  const stateManager = new StateManager(initialState, initialFiles)

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  });
  
  // Finish setup by showing window
  window.api.send('showWindow')
}


window.addEventListener('DOMContentLoaded', setup)