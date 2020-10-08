import Layout from './component/Layout.svelte'
// import { mountReplace } from './utils'
// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup() {

  const initialState = await window.api.invoke('getState');

  // Apply `Layout` svelte component
  const layout = new Layout({
    target: document.querySelector('#layout'),
    props: { 
      state: initialState,
      oldState: initialState,
    }
  });

  window.api.receive("stateChanged", (newState, oldState) => {
    
    // Update Layout component `state` assignments. This then ripples throughout the rest of the app, as each component passes the update state on to it's children, successively.
    layout.state = newState
    layout.oldState = oldState

    // Update theme
    if (newState.changed.includes("theme")) {
      setTheme(newState.theme)
    }
  });

  // Set theme on initial load
  setTheme(initialState.theme)

  // Show the window once setup is done.
  window.api.send('showWindow')

}

function setTheme(themeName) {
  const stylesheet = document.getElementById('theme-stylesheet')
  const href = `./styles/themes/${themeName}/${themeName}.css`
  stylesheet.setAttribute('href', href)
}

window.addEventListener('DOMContentLoaded', setup)

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)