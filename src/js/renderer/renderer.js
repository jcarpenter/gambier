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

    // Update appearance
    if (newState.changed.includes("appearance")) {
      setTheme(newState.appearance.theme)
      setSystemColors()
    }
  });

  // Set theme on initial load
  setTheme(initialState.appearance.theme)


  // Set system colors. 
  // NOTE: This is turned off for now because of problems with Electron: returned values do not match what we expect from macOS, based on developer documentation and tests with Xcode apps. In part (although not entirely) because Electron returns values without alphas.
  // setSystemColors()

  // Show the window once setup is done.
  window.api.send('showWindow')

}

function setTheme(themeName) {
  // console.log('setTheme!', themeName);
  const stylesheet = document.getElementById('theme-stylesheet')
  const href = `./styles/themes/${themeName}/${themeName}.css`
  // console.log(stylesheet)
  // console.log(href)
  stylesheet.setAttribute('href', href)
  // console.log(stylesheet)
}

/**
 * Get system colors from main, and write them to html element.
 */
async function setSystemColors() {
  
  const root = document.documentElement

  const systemColors = await window.api.invoke('getSystemColors')
  systemColors.forEach((c) => {
    const property = `--${c.name}`
    const value = `${c.color}`
    // console.log(property, value)
    // const rgb = hexToRgb(value)
    // root.style.setProperty(property, value)
  });
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

window.addEventListener('DOMContentLoaded', setup)

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)