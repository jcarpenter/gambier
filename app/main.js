'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var electron__default = _interopDefault(electron);
var path = _interopDefault(require('path'));
var fsExtra = require('fs-extra');
var Store = _interopDefault(require('electron-store'));
require('colors');
var deepEql = _interopDefault(require('deep-eql'));
require('deep-object-diff');
var chokidar = _interopDefault(require('chokidar'));
var matter = _interopDefault(require('gray-matter'));

const StoreSchema = {

  appStartupTime: {
    type: 'string',
    default: 'undefined'
  },
  
  projectDirectory: {
    descrition: 'User specified directory that contains their project files',
    type: 'string',
    default: 'undefined'
  },

  lastOpenedFile: {
    description: 'id of the last opened file.',
    type: 'string',
    default: 'undefined'
  },

  contents: { type: 'array', default: [] },

  // hierarchy: {
  //   description: 'Snapshot of hierarchy of project directory: files and directories. This is a recursive setup: directories can contain directories. Per: https://json-schema.org/understanding-json-schema/structuring.html#id1. Note: `id` can be anything, but it must be present, or our $refs will not work.',
  //   $schema: "http://json-schema.org/draft-07/schema#",
  //   $id: "anything-could-go-here",
  //   definitions: {
  //     'fileOrDirectory': {
  //       type: 'object',
  //       required: ['typeOf', 'name', 'path'],
  //       properties: {
  //         typeOf: { type: 'string', enum: ['File', 'Directory'] },
  //         name: { type: 'string' },
  //         path: { type: 'string' },
  //         created: { type: 'string', format: 'date-time' },
  //         modified: { type: 'string', format: 'date-time' },
  //         children: {
  //           type: 'array',
  //           items: { $ref: '#/definitions/fileOrDirectory' }
  //         }
  //       }
  //     }
  //   },
  //   type: 'array',
  //   items: { $ref: '#/definitions/fileOrDirectory' },
  //   default: []
  // }
};

const initialState = {};

function reducers(state = initialState, action) {
  switch (action.type) {
    case 'SET_PROJECT_DIRECTORY':
      return Object.assign({}, state, {
        projectDirectory: action.path
      })
    case 'OPEN_FILE':
      return Object.assign({}, state, {
        lastOpened: action.fileName
      })
    case 'SET_STARTUP_TIME':
      return Object.assign({}, state, {
        appStartupTime: action.time
      })
    case 'MAP_HIERARCHY':
      return Object.assign({}, state, {
        contents: action.contents
        // hierarchy: action.contents
      })
    case 'RESET_HIERARCHY':
      return Object.assign({}, state, {
        contents: []
        // hierarchy: []
      })
    default:
      return state
  }
}

class GambierStore extends Store {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      schema: StoreSchema
    });
  }

  getCurrentState() {
    return this.store
  }

  dispatch(action) {

    // Get next state
    const nextState = reducers(this.getCurrentState(), action);

    // Optional: Log the changes (useful for debug)
    this.logTheAction(action);
    this.logTheDiff(this.getCurrentState(), nextState);

    // Set the next state
    this.set(nextState);
  }

  logTheAction(action) {
    console.log(
      `Action:`.bgBrightGreen.black,
      `${action.type}`.bgBrightGreen.black.bold,
      `(GambierStore.js)`.green
    );
  }

  logTheDiff(current, next) {
    const hasChanged = !deepEql(current, next);
    if (hasChanged) {
      // const diff = detailedDiff(current, next)
      // console.log(diff)
      console.log('Has changed'.yellow);
    } else {
      console.log('No changes');
    }
  }
}

const store = new GambierStore();

// import directoryTree from 'directory-tree'
// import { createFlatHierarchy } from 'hierarchy-js'

class ProjectDirectory {

  constructor() {
    this.store;
    this.directory = '';
    this.contents = [];

    this.watcher = chokidar.watch('', {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 400,
        pollInterval: 200
      }
    });

    this.watcher.on('all', (event, path) => {
      console.log('- - - - - - - -');
      console.log(event);
      console.log(path);
      // this.mapProjectHierarchy(this.directory)
    });
  }

  async setup(store) {

    this.store = store;
    this.directory = store.store.projectDirectory;

    // Check if path is valid. 
    // If yes, map directory, update store, and add watcher.
    if (await this.isWorkingPath(this.directory)) {
      await this.mapProjectContentsAsFlatArray(this.directory);
      this.store.dispatch({ type: 'MAP_HIERARCHY', contents: this.contents });
      this.watcher.add(this.directory);
    }

    // Setup change listener for store
    this.store.onDidAnyChange((newState, oldState) => {
      this.onStoreChange(newState, oldState);
    });
  }

  async isWorkingPath(directory) {

    if (directory == 'undefined') {
      return false
    } else {
      if (await fsExtra.pathExists(directory)) {
        return true
      } else {
        return false
      }
    }
  }

  async onStoreChange(newState, oldState) {

    let newDir = newState.projectDirectory;
    let oldDir = oldState.projectDirectory;
    
    // We update the local saved directory value
    this.directory = newDir;

    // If the directory has changed...
    if (newDir !== oldDir) {

      // We unwatch the old directory (if it wasn't undefined)
      if (oldDir !== 'undefined') this.watcher.unwatch(oldDir);

      // Check if path is valid. 
      // If yes, map directory, update store, and add watcher.
      if (await this.isWorkingPath(newDir)) {
        await this.mapProjectContentsAsFlatArray(newDir);
        this.store.dispatch({ type: 'MAP_HIERARCHY', contents: this.contents });
        this.watcher.add(newDir);
      } else {
        // Else, if it doesn't exist, tell store to `RESET_HIERARCHY` (clears to `[]`)
        this.store.dispatch({ type: 'RESET_HIERARCHY' });
      }
    }
  }

  async mapProjectContentsAsFlatArray(directoryPath) {

    // const obj = { contents: [] }
    this.contents = [];
    await this.mapDirectoryRecursively(directoryPath);
    await this.getFilesDetails();
  }

  /**
   * Populate this.contents with flat array of directory contents. One object for each directory and file found. Works recursively.
   * @param {*} directoryPath - Directory to look inside.
   * @param {*} parentId - Left undefined (default) for top-level directory.
   */
  async mapDirectoryRecursively(directoryPath, parentId = undefined) {

    let contents = await fsExtra.readdir(directoryPath, { withFileTypes: true });

    // Filter contents to (not-empty) directories, and markdown files.
    contents = contents.filter((c) => c.isDirectory() || c.name.includes('.md'));
    if (contents.length == 0) return

    // Get stats for directory
    const stats = await fsExtra.stat(directoryPath);

    // Create object for directory
    const thisDir = {
      type: 'directory',
      id: stats.ino,
      name: directoryPath.substring(directoryPath.lastIndexOf('/') + 1),
      path: directoryPath,
      modified: stats.mtime.toISOString(),
      children: 0
    };

    // If parentId argument was set, apply it to thisDir
    if (parentId !== undefined) thisDir.parentId = parentId;

    for (let c of contents) {

      // Increment children counter
      thisDir.children++;

      // Get path
      const cPath = path.join(directoryPath, c.name);

      if (c.isFile()) {
        
        // Push new file object
        this.contents.push({
          type: 'file',
          name: c.name,
          path: cPath,
          parentId: thisDir.id
        });
      } else if (c.isDirectory()) {

        // Map child directory
        await this.mapDirectoryRecursively(cPath, thisDir.id);
      }

    }

    // Finally, push this directory to `this.contents`
    this.contents.push(thisDir);
  }

  /**
   * Go through each file in `this.contents` and add details loaded from stats (e.g. created) and gray-matter (e.g. excerpt, tags, title). We use Promise.all() to run this in parallel, so we're processing files in a batch, instead of sequentially one-by-one.
   */
  async getFilesDetails() {

    await Promise.all(
      this.contents.map(async (f) => {
        
        // Ignore directories
        if (f.type == 'file') {

          // Return a promise ()
          return fsExtra.readFile(f.path, 'utf8').then(async str => {
            
            // Get stats
            const stats = await fsExtra.stat(f.path);
            
            // Get front matter
            const md = matter(str, { excerpt: true });
            const hasFrontMatter = md.hasOwnProperty('data');
            
            // Set fields from stats
            f.id = stats.ino;
            f.modified = stats.mtime.toISOString();
            f.created = stats.birthtime.toISOString();

            // Set fields from front matter (if it exists)
            if (hasFrontMatter) {

              // If `tags` exists in front matter, use it. Else, set as empty `[]`.
              f.tags = md.data.hasOwnProperty('tags') ? md.data.tags : [];

              // If title exists in front matter, use it. Else, use name, minus extension.
              if (md.data.hasOwnProperty('title')) {
                f.title = md.data.title;
              } else {
                f.title = f.name.slice(0, f.name.lastIndexOf('.'));
              }
            }
          })
        }
      })
    );
  }
}

const projectDirectory = new ProjectDirectory();


















// // -------- Project directory -------- //

// function Directory(name, path, children = []) {
//   this.typeOf = 'Directory'
//   this.name = name
//   this.path = path
//   this.children = children
// }

// function File(title, excerpt, path, created, modified) {
//   this.typeOf = 'File'
//   this.title = title
//   this.excerpt = excerpt
//   this.path = path
//   this.created = created
//   this.modified = modified
// }

// async function getDirectoryContents(directoryObject) {

//   let directoryPath = directoryObject.path

//   let contents = await readdir(directoryPath, { withFileTypes: true })

//   // Remove .DS_Store files
//   contents = contents.filter((c) => c.name !== '.DS_Store')

//   for (let c of contents) {
//     if (c.isDirectory()) {
//       // console.log("--------------")
//       // console.log(c.name)
//       const subPath = path.join(directoryPath, c.name)
//       const subDir = new Directory(c.name, subPath)
//       const subDirContents = await getDirectoryContents(subDir)
//       const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true
//       if (hasFilesWeCareAbout)
//         directoryObject.children.push(subDirContents)
//     } else if (c.name.includes('.md')) {

//       // console.log(`> ${c.name}`)
//       const filePath = path.join(directoryPath, c.name)

//       // Get title (and other front matter), contents and excerpt
//       const md = matter.read(filePath, { excerpt: true })

//       const hasFrontMatter = md.hasOwnProperty("data")
//       console.log(hasFrontMatter)

//       // Get created and modified times
//       const stats = await stat(filePath)
//       const created = stats.birthtime.toISOString()
//       const modified = stats.mtime.toISOString()

//       let file = new File(c.name, "Excerpt", filePath, created, modified)
//       directoryObject.children.push(file)
//     }
//   }
//   return directoryObject
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
  const name = app.name;
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

// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// -------- Reload -------- //

// Not sure how this works with our packaged build. Want it for dev, but not distribution.
const watchAndHardReset = [
  path.join(__dirname, '**/*.js'),
  path.join(__dirname, '**/*.html'),
  path.join(__dirname, '**/*.css'),
  path.join(__dirname, '**/*.xml')
  // 'main.js',
  // '**/*.js',
  // '**/*.html',
  // '**/*.css',
  // '**/*.xml',
  // '**/*.png',
  // '**/*.jpg',
];

require('electron-reload')(watchAndHardReset, {
  // awaitWriteFinish: {
  //   stabilityThreshold: 10,
  //   pollInterval: 50
  // },
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  argv: ['--inspect=5858'],
});

// -------- Create window -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {

  console.log(`Create window`.bgBrightBlue.black, `(Main.js)`.brightBlue);

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

  // Open DevTools
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'));

  // Populate OS menus
  create();

  // Setup project directory
  projectDirectory.setup(store);

  // Send state to render process once dom is ready
  win.webContents.once('dom-ready', () => {
    console.log(`dom-ready`.bgBrightBlue.black, `(Main.js)`.brightBlue);
    win.webContents.send('setInitialState', store.getCurrentState());
  });

  // -------- TEMP DEVELOPMENT STUFF -------- //
  // store.clear()
  // store.reset()
  // This triggers a change event, which subscribers then receive
  // store.dispatch({ type: 'SET_STARTUP_TIME', time: new Date().toISOString() })

  
  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src/Empty'})
  // }, 1000)

  setTimeout(() => {
    store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src'});
  }, 1000);

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/arasd'})
  // }, 4000)

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src/Notes'})
  // }, 6000)
}


// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default 
// If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9.
// Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

electron.app.whenReady().then(createWindow);


// -------- Store -------- //

store.onDidAnyChange((newState, oldState) => {
  win.webContents.send('stateChanged', newState, oldState);
});


// -------- IPC: Send/Receive -------- //

electron.ipcMain.on('dispatch', (event, action) => {
  store.dispatch(action);
});


// -------- IPC: Invoke -------- //

electron.ipcMain.handle('readFile', async (event, fileName, encoding) => {
  let file = await fsExtra.readFile(path.join(__dirname, fileName), encoding);
  return file
});

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await fsExtra.pathExists(filepath);
  return { path: filepath, exists: exists }
});

electron.ipcMain.handle('getStore', async (event) => {
  return store.store
});
//# sourceMappingURL=main.js.map
