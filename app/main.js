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
var removeMd = _interopDefault(require('remove-markdown'));

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

  lastOpenedFileId: {
    description: 'id of the last opened file.',
    type: 'integer',
    default: 0
  },

  selectedFolderId: {
    type: 'integer',
    default: 0
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
        lastOpenedFileId: action.id
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
    case 'SELECT_FOLDER':
      console.log(action.id);
      return Object.assign({}, state, {
        selectedFolderId: action.id
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

class ProjectDirectory {

  constructor() {
    this.store;
    this.watcher;
    this.directory = '';
  }

  async setup(store) {

    // Save local 1) reference to store, and 2) value of directory
    this.store = store;
    this.directory = store.store.projectDirectory;

    // Setup change listener for store
    this.store.onDidAnyChange((newState, oldState) => {
      this.onStoreChange(newState, oldState);
    });

    // Check if path is valid. 
    // If yes, map directory, update store, and add watcher.
    if (await this.isWorkingPath(this.directory)) {
      let contents = await this.mapDirectoryRecursively(this.directory);
      contents = await this.getFilesDetails(contents);
      this.store.dispatch({ type: 'MAP_HIERARCHY', contents: contents });
      this.startWatching(this.directory);
    }
  }

  startWatching(directory) {
    this.watcher = chokidar.watch(directory, {
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
      if (oldDir !== 'undefined') {
        // this.watcher.unwatch(oldDir)
        await this.watcher.close();
      }

      // Check if path is valid. 
      // If yes, map directory, update store, and add watcher.
      if (await this.isWorkingPath(newDir)) {
        let contents = await this.mapDirectoryRecursively(newDir);
        contents = await this.getFilesDetails(contents);
        this.store.dispatch({ type: 'MAP_HIERARCHY', contents: contents });
        this.startWatching(newDir);
      } else {
        // Else, if it doesn't exist, tell store to `RESET_HIERARCHY` (clears to `[]`)
        this.store.dispatch({ type: 'RESET_HIERARCHY' });
      }
    }
  }

  /**
   * Populate this.contents with flat array of directory contents. One object for each directory and file found. Works recursively.
   * @param {*} directoryPath - Directory to look inside.
   * @param {*} parentObj - If passed in, we 1) get parent id, and 2) increment its directory counter (assuming the directory ). Is left undefined (default) for the top-level directory.
   */
  async mapDirectoryRecursively(directoryPath, parentId = undefined) {

    let arrayOfContents = [];

    let contents = await fsExtra.readdir(directoryPath, { withFileTypes: true });

    // Filter contents to (not-empty) directories, and markdown files.
    contents = contents.filter((c) => c.isDirectory() || c.name.includes('.md'));

    // If the directory has no children we care about (.md files or directories), 
    // we return an empty array.
    if (contents.length == 0) {
      return arrayOfContents
    }

    // Get stats for directory
    const stats = await fsExtra.stat(directoryPath);

    // Create object for directory
    const thisDir = {
      type: 'directory',
      id: stats.ino,
      name: directoryPath.substring(directoryPath.lastIndexOf('/') + 1),
      path: directoryPath,
      modified: stats.mtime.toISOString(),
      childFileCount: 0,
      childDirectoryCount: 0
    };

    // If parentId was passed, set `thisDir.parentId` to it
    if (parentId !== undefined) {
      thisDir.parentId = parentId;
    }

    for (let c of contents) {

      // Get path
      const cPath = path.join(directoryPath, c.name);

      if (c.isFile()) {
        // Increment file counter
        thisDir.childFileCount++;

        // Push new file object
        arrayOfContents.push({
          type: 'file',
          name: c.name,
          path: cPath,
          parentId: thisDir.id
        });
      } else if (c.isDirectory()) {

        // Get child directory contents
        // If not empty, increment counter and push to arrayOfContents
        const subDirContents = await this.mapDirectoryRecursively(cPath, thisDir.id);
        if (subDirContents.length !== 0) {
          thisDir.childDirectoryCount++;
          arrayOfContents = arrayOfContents.concat(subDirContents);
        }
      }
    }

    // Finally, if it is not empty, push thisDir to `arrayOfContents`
    if (arrayOfContents.length !== 0) {
      arrayOfContents.push(thisDir);
    }

    return arrayOfContents
  }

  /**
   * Go through each file in `this.contents` and add details loaded from stats (e.g. created) and gray-matter (e.g. excerpt, tags, title). We use Promise.all() to run this in parallel, so we're processing files in a batch, instead of sequentially one-by-one.
   */
  async getFilesDetails(contents) {

    await Promise.all(
      contents.map(async (f) => {

        // Ignore directories
        if (f.type == 'file') {

          // Return a promise ()
          return fsExtra.readFile(f.path, 'utf8').then(async str => {

            // Get stats
            const stats = await fsExtra.stat(f.path);

            // Get front matter
            const md = matter(str, { excerpt: extractExcerpt });

            // Set fields from stats
            f.id = stats.ino;
            f.modified = stats.mtime.toISOString();
            f.created = stats.birthtime.toISOString();
            f.excerpt = md.excerpt;

            // Set fields from front matter (if it exists)
            // gray-matter `isEmpty` property returns "true if front-matter is empty".
            if (!f.isEmpty) {

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
    // console.log(contents)
    return contents
  }
}

function extractExcerpt(file) {

  // gray-matter passes extract function the file.
  // file.contents give us the input string, with front matter stripped.

  // Remove h1, if it exists. Then trim to 200 characters.
  let excerpt = file.content
    .replace(/^# (.*)\n/gm, '')
    .substring(0, 400);

  // Remove markdown formatting. Start with remove-markdown rules.
  // Per: https://github.com/stiang/remove-markdown/blob/master/index.js
  // Then add whatever additional changes I want (e.g. new lines).
  excerpt = removeMd(excerpt)
    .replace(/^> /gm, '')         // Block quotes
    .replace(/^\n/gm, '')         // New lines at start of line (usually doc)
    .replace(/\n/gm, ' ')         // New lines in-line (replace with spaces)
    .replace(/\t/gm, ' ')         // Artifact left from list replacement
    .replace(/\[@.*?\]/gm, '')    // Citations
    .replace(/:::.*?:::/gm, ' ')  // Bracketed spans
    .replace(/\s{2,}/gm, ' ')     // Extra spaces
    .substring(0, 200);            // Trim to 200 characters

  file.excerpt = excerpt;
}

const projectDirectory = new ProjectDirectory();

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
const watchAndReload = [
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

require('electron-reload')(watchAndReload, {
  // awaitWriteFinish: {
  //   stabilityThreshold: 10,
  //   pollInterval: 50
  // },
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  // argv: ['--inspect=5858'],
});

// -------- Create window -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win;

console.log(`--------------- Startup ---------------`.bgYellow.black, `(Main.js)`.yellow);

function createWindow() {

  console.log(`Create window`.bgBrightBlue.black, `(Main.js)`.brightBlue);

  // Create the browser window.
  win = new electron.BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      scrollBounce: false,
      // Security
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
      // Preload
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
    // win.webContents.send('setInitialState', store.getCurrentState())
  });

  // -------- TEMP DEVELOPMENT STUFF -------- //
  // store.clear()
  // store.reset()
  // This triggers a change event, which subscribers then receive
  // store.dispatch({ type: 'SET_STARTUP_TIME', time: new Date().toISOString() })

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src/Empty'})
  // }, 1000)

  // setTimeout(() => {
  //   store.dispatch({type: 'SET_PROJECT_DIRECTORY', path: '/Users/josh/Documents/Climate\ research/GitHub/climate-research/src'})
  // }, 1000)

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

electron.ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await fsExtra.pathExists(filepath);
  return { path: filepath, exists: exists }
});

electron.ipcMain.handle('getState', async (event) => {
  return store.store
});

electron.ipcMain.handle('getFileById', async (event, id, encoding) => {
  
  // Get path of file with matching id
  const filePath = store.store.contents.find((f) => f.id == id).path;
  
  // Load file and return
  let file = await fsExtra.readFile(filePath, encoding);
  return file
});

electron.ipcMain.handle('pathJoin', async (event, path1, path2) => {
  return path.join(path1, path2)
});
//# sourceMappingURL=main.js.map
