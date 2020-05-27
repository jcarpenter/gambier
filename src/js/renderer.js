import * as config from '../config.js'
import csl from 'citeproc'
import Navigation from './Navigation.svelte';

async function setup() {

  if (config.projectDirectory) {
    // const check = await ipcRenderer.invoke('checkIfFileExists', config.projectDirectory)
    //   // Check if path exists
    //   // window.api.send("checkIfPathExists", config.projectDirectory)
    //   // window.api.send("readDirectory", config.projectDirectory)
  }

  // return

  // window.api.receive('projectDirectoryStoreUpdated', (newValue) => {
  //   console.log(newValue)
  // })


  const navigation = new Navigation({
    target: document.querySelector('nav'),
    // props: {
    //   name: 'world'
    // }
  })

  // -------- IPC Examples: On (Receive) / Send -------- //


  async function test() {
    
    window.api.send("updateProjectDirectoryStore", config.projectDirectory)
    return

    let ifPathExists = await window.api.invoke("ifPathExists", config.demoFile)
    // console.log(ifPathExists)

    let file = await window.api.invoke('readFile', config.demoFile, 'utf8')
    // console.log(file)

    let directoryContents = await window.api.invoke('getDirectoryContents', config.projectDirectory)
  }

  
  test()
}

window.addEventListener('DOMContentLoaded', setup)