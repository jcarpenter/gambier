'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var electron__default = _interopDefault(electron);
var path = _interopDefault(require('path'));
var fse = require('fs-extra');
var Store = _interopDefault(require('electron-store'));

// This is a recursive setup: directories can contain directories.
// See: https://json-schema.org/understanding-json-schema/structuring.html#id1
// `id` can be anything, but it must be present, or our $refs will not work.
const StoreSchema = {
  hierarchy: {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "anything-could-go-here",
    definitions: {
      'fileOrDirectory': {
        type: 'object',
        required: ['typeOf', 'name', 'path'],
        properties: {
          typeOf: { type: 'string', enum: ['File', 'Directory'] },
          name: { type: 'string' },
          path: { type: 'string' },
          created: { type: 'string', format: 'date-time' },
          modified: { type: 'string', format: 'date-time' },
          children: {
            type: 'array',
            items: { $ref: '#/definitions/fileOrDirectory' }
          }
        }
      }
    },
    type: 'array',
    items: { $ref: '#/definitions/fileOrDirectory' }
  }
};

// export const StoreSchema = {
//   foo: {
//     type: 'string',
//     default: 'Bruce Lee'
//   },
//   bar: {
// 		type: 'string',
//     format: 'uri',
//     default: 'http://www.google.com'
// 	}
// }

const app = electron__default.app;

// const { Menu } = require('electron')
// const electron = require('electron')
// const app = electron.app

const template = [
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin'
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() { require('electron').shell.openExternal('http://electron.atom.io'); }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  });
  // Edit menu.
  template[1].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Speech',
      submenu: [
        {
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    }
  );
  // Window menu.
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ];
}

function create() {
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}

// External dependencies

// Not sure how this works with our packaged build...
// Probably want it for development, but skip for distribution.
require('electron-reload')('**');

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win;

// Create Store
const store = new Store({
  name: "store",
  schema: StoreSchema
});

// Set process variables
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

function createWindow() {

//   const test3 = {
//     typeOf: 'File',
//     name: 'Juniper',
//     path: 'src/wobbles/',
//     created: new Date('05 January 2011 14:48 UTC').toISOString(),
//     modified: new Date('05 September 2014 14:48 UTC').toISOString()
// }

//   const test2 = [
//     {
//       typeOf: 'Directory',
//       name: 'Hi there',
//       path: 'src/',
//       children: [test3]
//     },
//     {
//       typeOf: 'File',
//       name: 'Borderlands.md',
//       path: 'src/borderlands.md',
//       created: new Date('Mon, 10 Oct 2011 23:24:11 GMT').toISOString(),
//       modified: new Date('03 January 2020 17:18 UTC').toISOString()
//     }
//   ]

  // projectDirectoryStore.set('contents', test2)

  // Create the browser window.
  win = new electron.BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      allowRunningInsecureContent: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nativeWindowOpen: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      safeDialogs: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      preload: path.join(__dirname, 'js/preload.js')
    }

  });

  // Open DevTools.
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'));

  // Populate OS menus
  create();

}

electron.app.whenReady().then(createWindow);


// async function updateTest() {
//   projectDirectoryStore.store = updateProjectDirectoryStore()
// } 



// -------- Get Directory -------- //

function Directory(name, path, children = []) {
  this.typeOf = 'Directory';
  this.name = name;
  this.path = path;
  this.children = children;
}

function File(name, path, created, modified) {
  this.typeOf = 'File';
  this.name = name;
  this.path = path;
  this.created = created;
  this.modified = modified;
}

async function getDirectoryContents(directoryObject) {

  let directoryPath = directoryObject.path;

  let contents = await fse.readdir(directoryPath, { withFileTypes: true });

  // Remove .DS_Store files
  contents = contents.filter((c) => c.name !== '.DS_Store');

  for (let c of contents) {
    if (c.isDirectory()) {
      const subPath = path.join(directoryPath, c.name);
      const subDir = new Directory(c.name, subPath);
      const subDirContents = await getDirectoryContents(subDir);
      const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true;
      if (hasFilesWeCareAbout)
        directoryObject.children.push(subDirContents);
    } else if (c.name.includes('.md')) {
      const filePath = path.join(directoryPath, c.name);
      const stats = await fse.stat(filePath);
      const created = stats.birthtime.toISOString();
      const modified = stats.mtime.toISOString();
      let file = new File(c.name, filePath, created, modified);
      directoryObject.children.push(file);
    }
  }
  return directoryObject
}



// -------- IPC: Send/Receive -------- //

electron.ipcMain.on("updateProjectDirectoryStore", async (event, directoryPath) => {
  
  store.clear();

  let directoryName = directoryPath.substring(directoryPath.lastIndexOf('/') + 1);
  let topLevelDirectory = new Directory(directoryName, directoryPath);
  let contents = await getDirectoryContents(topLevelDirectory);
  
  store.set('hierarchy', [contents]);
});

store.onDidAnyChange((newValue, oldValue) => {
  win.webContents.send('projectDirectoryStoreUpdated', newValue);
});


// -------- IPC: Invoke -------- //

electron.ipcMain.handle('readFile', async (event, fileName, encoding) => {
  let file = await fse.readFile(path.join(__dirname, fileName), encoding);
  return file
});

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await fse.pathExists(filepath);
  return { path: filepath, exists: exists }
});

// ipcMain.handle('getDirectoryContents', async (event, directoryPath) => {
//   let directoryName = directoryPath.substring(directoryPath.lastIndexOf('/') + 1)
//   let topLevelDirectory = new Directory(directoryName, directoryPath, 'directory')
//   let contents = await getDirectory(topLevelDirectory)
//   return contents;
// })

// ipcMain.on('watchProjectDirectory', async (event) => {
//   const watcher = chokidar.watch('file, dir, glob, or array', {
//     ignored: /(^|[\/\\])\../, // ignore dotfiles
//     persistent: true
//   });
// })
//# sourceMappingURL=main.js.map
