import { contextBridge, ipcRenderer } from 'electron'

// Whitelist channels

let validSendChannels = ['saveFile', 'hideWindow', 'showWindow', 'selectProjectPath', 'dispatch']

let validReceiveChannels = ['keyboardShortcut', 'stateChanged', 'setInitialState']

let validInvokeChannels = ['ifPathExists', 'getState', 'getCitations', 'getFileById', 'pathJoin', 'getHTMLFromClipboard', 'getFormatOfClipboard']

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