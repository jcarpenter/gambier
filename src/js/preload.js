import { contextBridge, ipcRenderer } from 'electron'

// Whitelist channels

let validSendChannels = ['updateProjectDirectoryStore', 'dispatch']

let validReceiveChannels = ['stateChanged', 'setInitialState']

let validInvokeChannels = ['readFile', 'ifPathExists', 'getStore']

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld(
  'api',
  {
    send: (channel, ...args) => {
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },

    receive: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    },

    invoke: (channel, ...args) => {
      if (validInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
    }
  }
)