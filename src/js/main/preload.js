import { contextBridge, ipcRenderer } from 'electron'
// import { copySync } from 'fs-extra'
// import ipc from 'node-ipc'

// IPC testing

// ipc.config.id = 'hello';
// ipc.config.retry = 1500;

// ipc.connectTo('world', () => {

//   ipc.of.world.on('connect', () => {
//     ipc.log('## connected to world ##'.rainbow, ipc.config.delay)
//     ipc.of.world.emit(
//       'message',  //any event or message type your server listens for
//       'hello'
//     )
//   })

//   ipc.of.world.on('disconnect', () => {
//     ipc.log('disconnected from world'.notice)
//   })

//   // Any event or message type your server listens for
//   ipc.of.world.on('message',(data) => {
//       ipc.log('got a message from world : '.debug, data)
//     }
//   )
// })

// console.log("Hi there")

// Whitelist channels

// Renderer "receives" from Main
let validReceiveChannels = ['mainRequestsSaveFocusedPanel', 'mainRequestsSaveAsFocusedPanel', 'mainRequestsSaveAll', 'mainRequestsCloseFocusedPanel', 'mainRequestsCreateNewDocInFocusedPanel', 'stateChanged', 'statePatchesFromMain', 'filesPatchesFromMain', 'initialFilesFromMain']

// Renderer "sends" to Main
let validSendChannels = ['safelyCloseWindow', 'saveWindowStateToDisk', 'saveFileThenCloseWindow', 'saveFileThenQuitApp', 'openUrlInDefaultBrowser', 'hideWindow', 'showWindow', 'dispatch', 'moveOrCopyIntoFolder', 'replaceAll']

// Round trip: Renderer --> Main --> Renderer
let validInvokeChannels = ['getValidatedPathOrURL', 'getResolvedPath', 'getParsedPath', 'ifPathExists', 'getCitations', 'getFileByPath', 'getFileById', 'pathJoin', 'getHTMLFromClipboard', 'getFormatOfClipboard', 'getState', 'getFiles', 'queryDb', 'getColors']

// "Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object."
// Implementation per: https://stackoverflow.com/a/63894861
contextBridge.exposeInMainWorld('api', {

  // Main -> Renderer
  receive: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
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
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  // Renderer -> Main -> Renderer
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
  },


})