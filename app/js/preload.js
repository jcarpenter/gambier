'use strict';

var electron = require('electron');

// Whitelist channels

let validSendChannels = ['updateProjectDirectoryStore', 'dispatch'];

let validReceiveChannels = ['storeChanged'];

let validInvokeChannels = ['readFile', 'ifPathExists', 'getStore'];

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object.
electron.contextBridge.exposeInMainWorld(
  'api',
  {
    send: (channel, ...args) => {
      if (validSendChannels.includes(channel)) {
        electron.ipcRenderer.send(channel, ...args);
      }
    },

    receive: (channel, func) => {
      if (validReceiveChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },

    invoke: (channel, ...args) => {
      if (validInvokeChannels.includes(channel)) {
        return electron.ipcRenderer.invoke(channel, ...args)
      }
    }
  }
);
//# sourceMappingURL=preload.js.map
