// External dependencies
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { readdir, readFile, pathExists, stat } from 'fs-extra'
import chokidar from 'chokidar'

// Bundled dependencies
import { store } from './js/GambierStore'
import { projectDirectory } from './js/projectDirectory'
import * as mainMenu from './js/mainMenu'
// import * as config from './config.js'



// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win

// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

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
]

require('electron-reload')(watchAndHardReset, {
  // awaitWriteFinish: {
  //   stabilityThreshold: 10,
  //   pollInterval: 50
  // },
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  argv: ['--inspect=5858'],
})

// -------- Create window -------- //

function createWindow() {

  // Create the browser window.
  win = new BrowserWindow({
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

  })

  // Open DevTools
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'))

  // Populate OS menus
  mainMenu.create()

  // Setup project directory
  projectDirectory.setup(store)

  // Setup store
  // TEMP: For development testing purposes, at startup we clear (delete all items) and reset (to default values).
  // store.clear()
  // store.reset()
  // This triggers a change event, which subscribers then receive
  store.dispatch({ type: 'SET_STARTUP_TIME', time: new Date().toISOString() })

  // Send store to render process once dom is ready
  win.webContents.once('dom-ready', () => {
    win.webContents.send('storeChanged', store.getPreviousState())
  })
}

// Set this to shut up console warnings re: deprecated default 
// If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9.
// Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

app.whenReady().then(createWindow)


// -------- Store -------- //

store.onDidAnyChange((newValue, oldValue) => {
  win.webContents.send('storeChanged', newValue)
})


// -------- IPC: Send/Receive -------- //

ipcMain.on('dispatch', (event, action) => {
  store.dispatch(action)
})


// -------- IPC: Invoke -------- //

ipcMain.handle('readFile', async (event, fileName, encoding) => {
  let file = await readFile(path.join(__dirname, fileName), encoding)
  return file
})

ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await pathExists(filepath)
  return { path: filepath, exists: exists }
})

ipcMain.handle('getStore', async (event) => {
  return store.store
})