import { contextBridge, ipcRenderer } from 'electron'

// Whitelist channels

// Renderer "receives" from Main
let validReceiveChannels = ['mainWantsToCloseWindow', 'mainWantsToQuitApp', 'mainRequestsSaveFile', 'mainRequestsDeleteFile', 'stateChanged']

// Renderer "sends" to Main
let validSendChannels = ['saveFileThenCloseWindow', 'saveFileThenQuitApp', 'openUrlInDefaultBrowser', 'hideWindow', 'showWindow', 'dispatch']

// Round trip: Renderer --> Main --> Renderer
let validInvokeChannels = ['getValidatedPathOrURL', 'getResolvedPath', 'getParsedPath', 'ifPathExists', 'getState', 'getCitations', 'getFileByPath', 'getFileById', 'pathJoin', 'getHTMLFromClipboard', 'getFormatOfClipboard']

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld(
  'api',
  {
    receive: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    },

    send: (channel, ...args) => {
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },

    invoke: (channel, ...args) => {
      if (validInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
    }
  }
)