'use strict';

var electron = require('electron');

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



//------ Whitelist channels ------//

// Renderer "receives" from Main
let validReceiveChannels = ['formatCommand', 'mainRequestsSaveFocusedPanel', 'mainRequestsSaveAsFocusedPanel', 'mainRequestsSaveAll', 'mainRequestsCloseFocusedPanel', 'mainRequestsCreateNewDocInFocusedPanel', 'stateChanged', 'statePatchesFromMain', 'filesPatchesFromMain', 'initialFilesFromMain', 'setFormat', 'findInFiles', 'replaceInFiles'];

// Renderer "sends" to Main
let validSendChannels = ['safelyCloseWindow', 'saveWindowStateToDisk', 'openUrlInDefaultBrowser', 'hideWindow', 'showWindow', 'dispatch', 'replaceAll', 'saveImageFromClipboard'];

// Round trip: Renderer --> Main --> Renderer
let validInvokeChannels = ['getCursorWindowPosition', 'moveOrCopyFileIntoProject', 'getValidatedPathOrURL', 'getResolvedPath', 'getParsedPath', 'ifPathExists', 'getCitations', 'getFileByPath', 'getFileById', 'pathJoin', 'getHTMLFromClipboard', 'getFormatOfClipboard', 'getState', 'getFiles', 'queryDb'];


//------ Receive, Send, Invoke ------//

// "Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object." - Implementation per: https://stackoverflow.com/a/63894861

// "The api provided to exposeInMainWorld must be a Function, String, Number, Array, Boolean, or an object whose keys are strings and values are a Function, String, Number, Array, Boolean, or another nested object that meets the same conditions." - https://www.electronjs.org/docs/api/context-bridge#api

electron.contextBridge.exposeInMainWorld('api', {

  // Main -> Renderer
  receive: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Strip `event` as it includes sender.
      const subscription = (event, ...args) => callback(...args);
      electron.ipcRenderer.on(channel, subscription);
      // Return a method that can be called to remove the listener
      return () => {
        electron.ipcRenderer.removeListener(channel, subscription);
      }
    }
  },

  // Renderer -> Main
  send: (channel, ...args) => {
    if (validSendChannels.includes(channel)) {
      electron.ipcRenderer.send(channel, ...args);
    }
  },

  // Renderer -> Main -> Renderer
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return electron.ipcRenderer.invoke(channel, ...args)
    }
  },


});
