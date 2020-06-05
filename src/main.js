// External dependencies
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { readdir, readFile, pathExists, stat } from 'fs-extra'

// Bundled dependencies
import { store } from './js/GambierStore'
import { projectDirectory } from './js/projectDirectory'
import * as mainMenu from './js/mainMenu'

// Dev only
import colors from 'colors'

// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

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
]

require('electron-reload')(watchAndReload, {
  // awaitWriteFinish: {
  //   stabilityThreshold: 10,
  //   pollInterval: 50
  // },
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  // argv: ['--inspect=5858'],
})

// -------- Create window -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win

console.log(`--------------- Startup ---------------`.bgYellow.black, `(Main.js)`.yellow)

function createWindow() {

  console.log(`Create window`.bgBrightBlue.black, `(Main.js)`.brightBlue)

  // Create the browser window.
  win = new BrowserWindow({
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
  })

  // Open DevTools
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'))

  // Populate OS menus
  mainMenu.create()

  // Setup project directory
  projectDirectory.setup(store)

  // Send state to render process once dom is ready
  win.webContents.once('dom-ready', () => {
    console.log(`dom-ready`.bgBrightBlue.black, `(Main.js)`.brightBlue)
    // win.webContents.send('setInitialState', store.getCurrentState())
  })

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
app.allowRendererProcessReuse = true

app.whenReady().then(createWindow)


// -------- Store -------- //

store.onDidAnyChange((newState, oldState) => {
  win.webContents.send('stateChanged', newState, oldState)
})


// -------- IPC: Send/Receive -------- //

ipcMain.on('dispatch', (event, action) => {
  store.dispatch(action)
})


// -------- IPC: Invoke -------- //

ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await pathExists(filepath)
  return { path: filepath, exists: exists }
})

ipcMain.handle('getState', async (event) => {
  return store.store
})

ipcMain.handle('getFileById', async (event, id, encoding) => {
  
  // Get path of file with matching id
  const filePath = store.store.contents.find((f) => f.id == id).path
  
  // Load file and return
  let file = await readFile(filePath, encoding)
  return file
})
