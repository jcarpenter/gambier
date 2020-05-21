'use strict';

var electron = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron.contextBridge.exposeInMainWorld(
  'api', {
      send: (channel, data) => {
          // whitelist channels
          let validChannels = ['loadFile', 'checkIfPathExists', 'readDirectory', 'watchProjectDirectory'];
          if (validChannels.includes(channel)) {
              electron.ipcRenderer.send(channel, data);
          }
      },
      receive: (channel, func) => {
          let validChannels = ['fileFromMain', 'ifPathExists', 'directoryContents'];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
              electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      }
  }
);
//# sourceMappingURL=preload.js.map
