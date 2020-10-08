// External dependencies
import { app, BrowserWindow, BrowserView, clipboard, dialog, ipcMain, shell } from 'electron'
import path from 'path'
// import electronLocalshortcut from 'electron-localshortcut'
import { writeFile, readFile, pathExists } from 'fs-extra'

// Bundled dependencies
import { Store } from './Store'
import * as menuBar from './menuBar'
import { saveFile, deleteFile, deleteFiles, setProjectPath } from './actions/index.js'
import { watcher, mapProject } from './contents/index.js'

// Dev only
// import colors from 'colors'

// -------- Variables -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win = null
let store = null
let canQuitAppSafely = false
let canCloseWindowSafely = false

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
  hardResetMethod: 'exit'
  // argv: ['--inspect=5858'],
})

console.log('- - - - - - - - - - - - - - -')
console.log(`Setup`, `(Main.js)`)



// -------- Setup -------- //

// Create store
store = new Store()

// Setup store change listeners
store.onDidAnyChange((newState, oldState) => {
  if (win !== undefined && BrowserWindow.getAllWindows().length) {
    win.webContents.send('stateChanged', newState, oldState)
  }
})

// TODO: Temporarily setting projectPath here, manually, in code.
store.set('projectPath', '/Users/josh/Desktop/Test notes')

// Do initial project map, if projectPath has been set)
if (store.store.projectPath !== '') {
  mapProject(store.store.projectPath, store)
}

// Create watcher
watcher.setup(store)

// Send `appQuit` to renderer on quit
app.on('before-quit', (evt) => {
  // If `canQuitAppSafely` is false, prevent window closing and prompt renderer to save file.
  if (!canQuitAppSafely && win !== undefined) {
    evt.preventDefault()
    win.webContents.send('mainWantsToQuitApp')
  } else {
    // Reset and close
    canQuitAppSafely = false
  }
})

// All windows closed
app.on('window-all-closed', () => {
  console.log('window-all-closed')
  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// MacOS-only: "Emitted when the application is activated. Various actions can trigger this event, such as launching the application for the first time, attempting to re-launch the application when it's already running, or clicking on the application's dock or taskbar icon." — https://github.com/electron/electron/blob/master/docs/api/app.md#event-activate-macos
app.on('activate', (evt, hasVisibleWindows) => {
  console.log('activate')
  // "On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open." — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (!hasVisibleWindows) {
    createWindow()
  }
  // if (BrowserWindow.getAllWindows().length === 0) {
  //   createWindow()
  // }
})

// -------- Create window -------- //

function createWindow() {

  win = new BrowserWindow({
    show: false,
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

  win.on('close', (evt) => {
    // If `canCloseWindowSafely` is false, 
    if (!canCloseWindowSafely) {
      evt.preventDefault()
      win.webContents.send('mainWantsToCloseWindow')
    } else {
      // Reset and close
      canCloseWindowSafely = false
    }
  })

  // Open DevTools
  win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'))
  
  // Setup menu bar
  menuBar.setup(store)
  
  // NOTE: We're not using this. Instead, we're calling `win.show()` from renderer, via IPC call.
  // Send state to render process once dom is ready
  // win.once('ready-to-show', () => {
  //   win.show()
  // })
}



// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

app.whenReady().then(createWindow)


// -------- IPC: Renderer "sends" to Main -------- //

ipcMain.on('saveFileThenCloseWindow', async (event, path, data) => {
  await writeFile(path, data, 'utf8')
  canCloseWindowSafely = true
  win.close()
})

ipcMain.on('saveFileThenQuitApp', async (event, path, data) => {
  await writeFile(path, data, 'utf8')
  canQuitAppSafely = true
  app.quit()
})

ipcMain.on('openUrlInDefaultBrowser', (event, url) => {
  shell.openExternal(url)
})

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

ipcMain.handle('getValidatedPathOrURL', async (event, docPath, pathToCheck) => {
  // return path.resolve(basePath, filepath)

  /*
  Element: Image, link, backlink, link reference definition
  File type: directory, html, png|jpg|gif, md|mmd|markdown
  */

  console.log('- - - - - -')
  // console.log(pathToCheck.match(/.{0,2}\//))
  const directory = path.parse(docPath).dir
  const resolvedPath = path.resolve(directory, pathToCheck)

  const docPathExists = await pathExists(docPath)
  const pathToCheckExists = await pathExists(pathToCheck)
  const resolvedPathExists = await pathExists(resolvedPath)

  console.log('docPath: ', docPath)
  console.log('pathToCheck: ', pathToCheck)
  console.log('resolvedPath: ', resolvedPath)
  console.log(docPathExists, pathToCheckExists, resolvedPathExists)

  // if (pathToCheck.match(/.{0,2}\//)) {
  //   console.log()
  // }
})

ipcMain.handle('getResolvedPath', async (event, basePath, filepath) => {
  return path.resolve(basePath, filepath)
})

ipcMain.handle('getParsedPath', async (event, filepath) => {
  return path.parse(filepath)
})

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