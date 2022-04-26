import { contextBridge, ipcRenderer } from 'electron'

//------ Whitelist channels ------//

// Main sends to render processeses
let mainToRenderChannels = [
  'editorCommand',
  'filesPatchesFromMain',
  'findInFiles',
  'initialFilesFromMain',
  'mainRequestsCloseFocusedPanel',
  'mainRequestsCreateNewDocInFocusedPanel',
  'mainRequestsSaveAll',
  'mainRequestsSaveAsFocusedPanel',
  'mainRequestsSaveFocusedPanel',
  'replaceInFiles',
  'setFormat',
  'stateChanged',
  'statePatchesFromMain',
]

// Render processes send to Main
let renderToMainChannels = [
  'dispatch',
  'openUrlInDefaultBrowser',
  'replaceAll',
  'saveImageFromClipboard',
  'showWindow'
]

// Round trip: Render processes send request to 
// Main, and await returned response.
let renderMainRenderInvokeChannels = [
  'getBibliography',
  'getCsl',
  'getCursorWindowPosition',
  'getFileByPath',
  'getFiles',
  'getFormatOfClipboard',
  'getHTMLFromClipboard',
  'getLocale',
  'getState',
  'moveOrCopyFileIntoProject',
  'queryDb'
]


//------ Receive, Send, Invoke ------//

// "Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object." - Implementation per: https://stackoverflow.com/a/63894861

// "The api provided to exposeInMainWorld must be a Function, String, Number, Array, Boolean, or an object whose keys are strings and values are a Function, String, Number, Array, Boolean, or another nested object that meets the same conditions." - https://www.electronjs.org/docs/api/context-bridge#api

contextBridge.exposeInMainWorld('api', {

  // Main -> Renderer
  receive: (channel, callback) => {
    if (mainToRenderChannels.includes(channel)) {
      // Strip `event` as it includes sender.
      const subscription = (event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription);
      // Return a method that can be called to remove the listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      }
    }
  },

  // Renderer -> Main
  send: (channel, ...args) => {
    if (renderToMainChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  // Renderer -> Main -> Renderer
  invoke: (channel, ...args) => {
    if (renderMainRenderInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
  },
})
