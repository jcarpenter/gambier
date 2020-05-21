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

  return
  


  if (config.demoFile) {
    window.api.send("loadFile", config.demoFile, 'utf8')
  }
  
  window.api.receive("fileFromMain", (data) => {
    // console.log(`Received ${data} from main process`)
  })

  // Receive
  window.api.receive("ifPathExists", (result) => {
    console.log(result)
  })

  window.api.receive("directoryContents", (data) => {
    data.children.map((d) => {
      console.log(d)
    })
  })
}

window.addEventListener('DOMContentLoaded', setup)