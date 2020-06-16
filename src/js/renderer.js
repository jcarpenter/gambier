// Bundled imports
import NavFolders from './component/NavFolders.svelte'
import NavFiles from './component/NavFiles.svelte'
import * as Editor from './editor/editor'
import * as FirstRun from './firstRun'
import { mountReplace } from './utils'
// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup() {
  
  const initialState = await window.api.invoke('getState', 'utf8');
  
  FirstRun.setup(initialState)

  mountReplace(NavFolders, {
    target: document.querySelector('#folders'),
    // props: { name: 'world' }
  })
  
  mountReplace(NavFiles, {
    target: document.querySelector('#files'),
    // props: { name: 'world' }
  })
  
  Editor.setup(initialState)
  
  window.api.send('showWindow') 

}
window.addEventListener('DOMContentLoaded', setup)

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)