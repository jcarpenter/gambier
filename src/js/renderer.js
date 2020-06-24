import { mountReplace } from './utils'
// import * as Editor from './editor/editor'
// import * as FirstRun from './firstRun'
import Layout from './component/Layout.svelte'
// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup() {

  const initialState = await window.api.invoke('getState');

  const layout = new Layout({
    target: document.querySelector('#layout'),
    props: { 
      state: initialState,
      oldState: initialState,
    }
  });

  window.api.receive("stateChanged", (newState, oldState) => {
    // console.log("State changed")
    // console.log(layout.state)
    // console.log("----")
    layout.state = newState
    layout.oldState = oldState
  });

  window.api.send('showWindow')


  // Editor.setup(initialState)

  // // Set variable colors
  // let test = getComputedStyle(document.documentElement)
  //   .getPropertyValue('--clr-blue'); // #999999
  //   console.log(test)

}
window.addEventListener('DOMContentLoaded', setup)

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)