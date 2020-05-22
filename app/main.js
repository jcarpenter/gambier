'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var electron__default = _interopDefault(electron);
var path = _interopDefault(require('path'));
var fse = require('fs-extra');
var chokidar = _interopDefault(require('chokidar'));

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
// require('electron-reload')('**')

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win;

// Set process variables
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

function createWindow() {

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



// -------- Get Directory -------- //

function File(name, path, created, modified, type = 'file') {
  this.name = name;
  this.path = path;
  this.created = created;
  this.modified = modified;
  this.type = type;
}

function Directory(name, path, type = 'directory', children = []) {
  this.name = name;
  this.path = path;
  this.type = type;
  this.children = children;
}

async function getDirectory(directoryObject) {

  let directoryPath = directoryObject.path;

  let contents = await fse.readdir(directoryPath, { withFileTypes: true });

  // Remove .DS_Store files
  contents = contents.filter((c) => c.name !== '.DS_Store');

  for (let c of contents) {
    if (c.isDirectory()) {
      const subPath = path.join(directoryPath, c.name);
      const subDir = new Directory(c.name, subPath, 'directory');
      const subDirContents = await getDirectory(subDir);
      const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true;
      if (hasFilesWeCareAbout)
        directoryObject.children.push(subDirContents);
    } else if (c.name.includes('.md')) {
      const filePath = path.join(directoryPath, c.name);
      const stats = await fse.stat(filePath);
      const created = stats.birthtime.toISOString();
      const modified = stats.mtime.toISOString();
      let file = new File(c.name, filePath, created, modified, 'file');
      directoryObject.children.push(file);
    }
  }
  return directoryObject
}



// -------- IPC Examples: Invoke/Handle -------- //

electron.ipcMain.handle('checkIfFileExists', async (event, filepath) => {
  return await fse.pathExists(filepath)
});



// -------- IPC Examples: On/Send -------- //


electron.ipcMain.handle('readFile', async (event, fileName, encoding) => {

  let file = await fse.readFile(path.join(__dirname, fileName), encoding);

  // Send result back to renderer process
  return file
});

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {

  const exists = await fse.pathExists(filepath);
  return { path: filepath, exists: exists }
});

electron.ipcMain.handle('getCharacterState', (event, characterName) => {
  return `${characterName} is probably dead.`
});

electron.ipcMain.on('readDirectory', async (event, directoryPath) => {

  let directoryName = directoryPath.substring(directoryPath.lastIndexOf('/') + 1);
  let topLevelDirectory = new Directory(directoryName, directoryPath, 'directory');
  let contents = await getDirectory(topLevelDirectory);

  win.webContents.send('directoryContents', contents);
});

electron.ipcMain.on('watchProjectDirectory', async (event) => {
  const watcher = chokidar.watch('file, dir, glob, or array', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });
});
//# sourceMappingURL=main.js.map
