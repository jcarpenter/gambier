import csl from 'citeproc'
import Navigation from './Navigation.svelte';

async function setup() {

  const tempHardCodedProjectPath = '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src'

  const navigation = new Navigation({
    target: document.querySelector('nav'),
    // props: { name: 'world' }
  })

  window.api.receive('setInitialState', (initialState) => {
    // console.log(initialState)
  })

  window.api.receive('stateChanged', (newState) => {
    // console.log(newState)
    return
    console.log(newState.projectDirectory)
    if (newState.projectDirectory === 'undefined') {
      console.log('Renderer says: projectDirectory is undefined')
      // window.api.send('dispatch', { type: 'SET_PROJECT_DIRECTORY', path: tempHardCodedProjectPath })
    } else {
      console.log(`Renderer says: projectDirectory is ${newState.projectDirectory}`)
      if (newState.lastOpenedFile === 'undefined') {
        // Load first file
        // window.api.send('dispatch', { type: 'SET_PROJECT_DIRECTORY', path: 
      }
    }

    // if (store.hierarchy && store.hierarchy[0] !== root) {
    //   root = store.hierarchy[0]
    // }
  })

}

window.addEventListener('DOMContentLoaded', setup)