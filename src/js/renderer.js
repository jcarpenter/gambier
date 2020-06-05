import csl, { citeEnd } from 'citeproc'
import NavFolders from './component/NavFolders.svelte'
import NavFiles from './component/NavFiles.svelte'
import * as Editor from './editor/editor'
import { mountReplace } from './utils'

mountReplace(NavFolders, {
  target: document.querySelector('#folders'),
  // props: { name: 'world' }
})

mountReplace(NavFiles, {
  target: document.querySelector('#files'),
  // props: { name: 'world' }
})

Editor.setup()


// async function setup() {

//   window.api.receive('stateChanged', (newState) => {
//   })
// }

// window.addEventListener('DOMContentLoaded', setup)