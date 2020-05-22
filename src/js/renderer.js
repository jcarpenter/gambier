import * as config from '../config.js'
import csl from 'citeproc'

async function setup() {
  
  if (config.projectDirectory) {
    // const check = await ipcRenderer.invoke('checkIfFileExists', config.projectDirectory)
    console.log(config.projectDirectory)
  //   // Check if path exists
  //   // window.api.send("checkIfPathExists", config.projectDirectory)
  //   // window.api.send("readDirectory", config.projectDirectory)
  }

  // return
  


  // -------- IPC Examples: On (Receive) / Send -------- //


  async function test() {

    let ifPathExists = await window.api.invoke("ifPathExists", config.demoFile)

    console.log(ifPathExists)

    let file = await window.api.invoke('readFile', config.demoFile, 'utf8')

    console.log(file)
  }

  test()



  // window.api.receive("directoryContents", (data) => {
  //   data.children.map((d) => {
  //     console.log(d)
  //   })
  // })
}

window.addEventListener('DOMContentLoaded', setup)