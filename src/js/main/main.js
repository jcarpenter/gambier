// External dependencies
import { app, BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import path from 'path'
// import electronLocalshortcut from 'electron-localshortcut'
import { readFile, pathExists } from 'fs-extra'

// Bundled dependencies
import { Store } from './Store'
import * as menuBar from './menuBar'
import { saveFile, deleteFile, deleteFiles, setProjectPath } from './actions/index.js'
import { watcher, mapProject } from './contents/index.js'

// Dev only
// import colors from 'colors'

// -------- Variables -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win = undefined
let store = undefined

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

console.log('- - - - - - - - - - - - - - -')
console.log(`Setup`, `(Main.js)`)



// -------- Setup -------- //

// Create store
store = new Store()

// Setup store change listeners
store.onDidAnyChange((newState, oldState) => {
  if (win !== undefined) {
    win.webContents.send('stateChanged', newState, oldState)
  }
})

// TEMP
store.set('projectPath', '/Users/josh/Desktop/Test notes')

// Do initial project map, if projectPath has been set)
if (store.store.projectPath !== '') {
  mapProject(store.store.projectPath, store)
}

// Create watcher
watcher.setup(store)


// -------- Create window -------- //

function createWindow() {

  win = new BrowserWindow({
    show: true,
    width: 1600,
    height: 900,
    vibrancy: 'sidebar',
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

  // Setup menu bar
  menuBar.setup(store)

  // Send state to render process once dom is ready
  // win.once('ready-to-show', () => {
  // })
}


// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

app.whenReady().then(createWindow)



// -------- IPC: Send/Receive -------- //

ipcMain.on('showWindow', (event) => {
  win.show()
})

ipcMain.on('dispatch', async (event, action) => {
  switch (action.type) {
    case ('SET_SORT'):
      store.dispatch(action)
      break
    case ('LOAD_PATH_IN_EDITOR'):
      store.dispatch(action)
      break
    case ('SET_PROJECT_PATH'):
      store.dispatch(await setProjectPath())
      break
    case ('SAVE_FILE'):
      store.dispatch(await saveFile(action.path, action.data))
      break
    case ('DELETE_FILE'):
      store.dispatch(await deleteFile(action.path))
      break
    case ('DELETE_FILES'):
      store.dispatch(await deleteFiles(action.paths))
      break
    case ('SELECT_SIDEBAR_ITEM'):
      store.dispatch(action)
      break
    case ('TOGGLE_SIDEBAR_ITEM_EXPANDED'):
      store.dispatch(action)
      break
    case ('SET_LAYOUT_FOCUS'):
      store.dispatch(action)
      break
    case ('SELECT_FILES'):
      store.dispatch(action)
      break
    case ('SAVE_SIDEBAR_SCROLL_POSITION'):
      store.dispatch(action)
      break
  }
})


// -------- IPC: Invoke -------- //

ipcMain.handle('ifPathExists', async (event, filepath) => {
  const exists = await pathExists(filepath)
  return { path: filepath, exists: exists }
})

ipcMain.handle('getState', async (event) => {
  return store.store
})

ipcMain.handle('getCitations', (event) => {
  return projectCitations.getCitations()
})

ipcMain.handle('getFileByPath', async (event, filePath, encoding) => {

  // Load file and return
  let file = await readFile(filePath, encoding)
  return file
})

ipcMain.handle('getFileById', async (event, id, encoding) => {

  // Get path of file with matching id
  const filePath = store.store.contents.find((f) => f.id == id).path

  // Load file and return
  let file = await readFile(filePath, encoding)
  return file
})

ipcMain.handle('pathJoin', async (event, path1, path2) => {
  return path.join(path1, path2)
})

ipcMain.handle('getHTMLFromClipboard', (event) => {
  return clipboard.readHTML()
})

ipcMain.handle('getFormatOfClipboard', (event) => {
  return clipboard.availableFormats()
})