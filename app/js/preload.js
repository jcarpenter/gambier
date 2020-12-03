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

// console.log("Hi there")

// Whitelist channels

// Renderer "receives" from Main
let validReceiveChannels = ['mainWantsToCloseWindow', 'mainWantsToQuitApp', 'mainRequestsSaveFile', 'mainRequestsDeleteFile', 'stateChanged', 'statePatchesFromMain', 'filesPatchesFromMain', 'initialFilesFromMain'];

// Renderer "sends" to Main
let validSendChannels = ['safelyCloseWindow', 'saveWindowStateToDisk', 'saveFileThenCloseWindow', 'saveFileThenQuitApp', 'openUrlInDefaultBrowser', 'hideWindow', 'showWindow', 'dispatch',];

// Round trip: Renderer --> Main --> Renderer
let validInvokeChannels = ['getSystemColors', 'getValidatedPathOrURL', 'getResolvedPath', 'getParsedPath', 'ifPathExists', 'getCitations', 'getFileByPath', 'getFileById', 'pathJoin', 'getHTMLFromClipboard', 'getFormatOfClipboard', 'getState', 'getFiles', 'queryDb'];

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object.
electron.contextBridge.exposeInMainWorld(
  'api',
  {
    receive: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        // console.log(`Main --> ${channel} --> Renderer`)
        // Deliberately strip event as it includes `sender` 
        electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },

    send: (channel, ...args) => {
      // console.log(`Renderer --> ${channel} --> Main`)
      if (validSendChannels.includes(channel)) {
        electron.ipcRenderer.send(channel, ...args);
      }
    },

    invoke: (channel, ...args) => {
      // console.log(`Renderer --> ${channel} --> Main --> (Response) --> Renderer`)
      if (validInvokeChannels.includes(channel)) {
        return electron.ipcRenderer.invoke(channel, ...args)
      }
    }
  }
);
