// External dependencies
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell, systemPreferences, nativeTheme, webFrame } from 'electron'
import path from 'path'
// import electronLocalshortcut from 'electron-localshortcut'
import { writeFile, readFile, pathExists } from 'fs-extra'

// Bundled dependencies
import { Store } from './Store'
import * as menuBar from './menuBar'
import { saveFile, deleteFile, deleteFiles, setProjectPath } from './actions/index.js'
import { watcher, mapProject } from './contents/index.js'

// -------- Variables -------- //

// Keep a global reference of the window object, if you don't, the window will be closed automatically when the JavaScript object is garbage collected.
let win = null
let store = null
let canQuitAppSafely = false
let canCloseWindowSafely = false

// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

// -------- Reload (Development-only) -------- //

if (!app.isPackaged) {

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
}




// -------- Setup -------- //

console.log(process.versions['chrome'])

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

// Setup watcher
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

// Mac-only: "Emitted when the application is activated. Various actions can trigger this event, such as launching the application for the first time, attempting to re-launch the application when it's already running, or clicking on the application's dock or taskbar icon." — https://github.com/electron/electron/blob/master/docs/api/app.md#event-activate-macos
app.on('activate', (evt, hasVisibleWindows) => {

  // "On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open." — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (!hasVisibleWindows) {
    createWindow()
  }
  // if (BrowserWindow.getAllWindows().length === 0) {
  //   createWindow()
  // }
})


// -------- Set theme -------- //

/**
 * When OS appearance changes, update app theme to match (dark or light):
 * Listen for changes to nativeTheme. These are triggered when the OS appearance changes (e.g. when the user modifies "Appearance" in System Preferences > General, on Mac). If the user has selected the "Match System" appearance option in the app, we need to match the new OS appearance. Check the `nativeTheme.shouldUseDarkColors` value, and set the theme accordingly (dark or light).
 * nativeTheme.on('updated'): "Emitted when something in the underlying NativeTheme has changed. This normally means that either the value of shouldUseDarkColors, shouldUseHighContrastColors or shouldUseInvertedColorScheme has changed. You will have to check them to determine which one has changed."
 */
nativeTheme.on('updated', () => {

  // console.log("nativeTheme updated:")
  // console.log(nativeTheme.themeSource)
  // console.log(nativeTheme.shouldUseDarkColors)
  // console.log(nativeTheme.shouldUseHighContrastColors)
  // console.log(nativeTheme.shouldUseInvertedColorScheme)
  // console.log('selected-text-background = ', systemPreferences.getColor('selected-text-background'))

  const userPref = store.store.appearance.userPref
  if (userPref == 'match-system') {
    store.dispatch({
      type: 'SET_APPEARANCE',
      theme: nativeTheme.shouldUseDarkColors ? 'gambier-dark' : 'gambier-light'
    })
  }
})

/**
 * When user modifies "Appearance" setting (e.g in `View` menu), update `nativeTheme`
 */
store.onDidChange('appearance', () => {
  setNativeTheme()
})

/**
 * Update `nativeTheme` electron property
 * Setting `nativeTheme.themeSource` has several effects. E.g. it tells Chrome how to UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
 * Per: https://www.electronjs.org/docs/api/native-theme
 */
function setNativeTheme() {
  const userPref = store.store.appearance.userPref
  switch (userPref) {
    case 'match-system':
      nativeTheme.themeSource = 'system'
      break
    case 'light':
      nativeTheme.themeSource = 'light'
      break
    case 'dark':
      nativeTheme.themeSource = 'dark'
      break
  }

  // console.log('setNativeTheme(). nativeTheme.themeSource = ', nativeTheme.themeSource)
  // console.log('setNativeTheme(). userPref = ', userPref)
  // console.log('setNativeTheme(). systemPreferences.getAccent   Color() = ', systemPreferences.getAccentColor())
  // console.log('setNativeTheme(). window-background = ', systemPreferences.getColor('window-background'))
  // 

  // Reload (close then open) DevTools to force it to load the new theme. Unfortunately DevTools does not respond to `nativeTheme.themeSource` changes automatically. In Electron, or in Chrome.
  if (!app.isPackaged && win && win.webContents && win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools()
    win.webContents.openDevTools()
  }
}


// -------- Create window -------- //

function createWindow() {

  win = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    zoomFactor: 1.0,
    vibrancy: 'sidebar',
    transparent: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      scrollBounce: false,
      // Security:
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
  // if (!app.isPackaged) win.webContents.openDevTools();

  // Load index.html
  win.loadFile(path.join(__dirname, 'index.html'))

  // Setup menu bar
  menuBar.setup(store)

  // NOTE: We're not using this. Instead, we're calling `win.show()` from renderer, via IPC call.
  // Send state to render process once dom is ready
  // win.once('ready-to-show', () => {
  //   win.show()
  // })

  // console.log("Hi ------ ")
  // console.log(systemPreferences.isDarkMode())
  // console.log(systemPreferences.getUserDefault('AppleInterfaceStyle', 'string'))
  // console.log(systemPreferences.getUserDefault('AppleAquaColorVariant', 'integer'))
  // console.log(systemPreferences.getUserDefault('AppleHighlightColor', 'string'))
  // console.log(systemPreferences.getUserDefault('AppleShowScrollBars', 'string'))
  // console.log(systemPreferences.getAccentColor())
  // console.log(systemPreferences.getSystemColor('blue'))
  // console.log(systemPreferences.effectiveAppearance)
}



// -------- Kickoff -------- //

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

app.whenReady()
  .then(setNativeTheme)
  .then(createWindow)


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

  // Have to manually set this to 1.0. That should be the default, but somewhere it's being set to 0.91, resulting in the UI being slightly too-small.
  win.webContents.zoomFactor = 1.0

})

ipcMain.on('dispatch', async (event, action) => {
  switch (action.type) {
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
    case ('SET_SORT'):
    case ('LOAD_PATH_IN_EDITOR'):
    // SideBar 2
    case ('EXPAND_SIDEBAR_ITEMS'):
    case ('SELECT_SIDEBAR_ITEMS'):
    case ('SELECT_SIDEBAR_TAB_BY_INDEX'):
    case ('TOGGLE_SIDEBAR_PREVIEW'):
    // SideBar (old)
    case ('SELECT_SIDEBAR_ITEM'):
    case ('TOGGLE_SIDEBAR_ITEM_EXPANDED'):
    case ('SET_LAYOUT_FOCUS'):
    case ('SELECT_FILES'):
    case ('SAVE_SIDEBAR_SCROLL_POSITION'):
      store.dispatch(action)
      break
  }
})


// -------- IPC: Invoke -------- //

ipcMain.handle('getSystemColors', () => {

  // Get accent color, chop off last two characters (always `ff`, for 100% alpha), and prepend `#`.
  // `0a5fffff` --> `#0a5fff`
  let controlAccentColor = `#${systemPreferences.getAccentColor().slice(0, -2)}`

  const systemColors = [

    // -------------- System Colors -------------- //
    // Note: Indigo and Teal exist in NSColor, but do not seem to be supported by Electron.

    { name: 'systemBlue', color: systemPreferences.getSystemColor('blue') },
    { name: 'systemBrown', color: systemPreferences.getSystemColor('brown') },
    { name: 'systemGray', color: systemPreferences.getSystemColor('gray') },
    { name: 'systemGreen', color: systemPreferences.getSystemColor('green') },
    // { name: 'systemIndigo', color: systemPreferences.getSystemColor('systemIndigo')},
    { name: 'systemOrange', color: systemPreferences.getSystemColor('orange') },
    { name: 'systemPink', color: systemPreferences.getSystemColor('pink') },
    { name: 'systemPurple', color: systemPreferences.getSystemColor('purple') },
    { name: 'systemRed', color: systemPreferences.getSystemColor('red') },
    // { name: 'systemTeal', color: systemPreferences.getSystemColor('teal')},
    { name: 'systemYellow', color: systemPreferences.getSystemColor('yellow') },

    // -------------- Label Colors -------------- //

    { name: 'labelColor', color: systemPreferences.getColor('label') },
    { name: 'secondaryLabelColor', color: systemPreferences.getColor('secondary-label') },
    { name: 'tertiaryLabelColor', color: systemPreferences.getColor('tertiary-label') },
    { name: 'quaternaryLabelColor', color: systemPreferences.getColor('quaternary-label') },

    // -------------- Text Colors -------------- //

    { name: 'textColor', color: systemPreferences.getColor('text') },
    { name: 'placeholderTextColor', color: systemPreferences.getColor('placeholder-text') },
    { name: 'selectedTextColor', color: systemPreferences.getColor('selected-text') },
    { name: 'textBackgroundColor', color: systemPreferences.getColor('text-background') },
    { name: 'selectedTextBackgroundColor', color: systemPreferences.getColor('selected-text-background') },
    { name: 'keyboardFocusIndicatorColor', color: systemPreferences.getColor('keyboard-focus-indicator') },
    { name: 'unemphasizedSelectedTextColor', color: systemPreferences.getColor('unemphasized-selected-text') },
    { name: 'unemphasizedSelectedTextBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-text-background') },

    // -------------- Content Colors -------------- //

    { name: 'linkColor', color: systemPreferences.getColor('link') },
    { name: 'separatorColor', color: systemPreferences.getColor('separator') },
    { name: 'selectedContentBackgroundColor', color: systemPreferences.getColor('selected-content-background') },
    { name: 'unemphasizedSelectedContentBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-content-background') },

    // -------------- Menu Colors -------------- //

    { name: 'selectedMenuItemTextColor', color: systemPreferences.getColor('selected-menu-item-text') },

    // -------------- Table Colors -------------- //

    { name: 'gridColor', color: systemPreferences.getColor('grid') },
    { name: 'headerTextColor', color: systemPreferences.getColor('header-text') },

    // -------------- Control Colors -------------- //

    { name: 'controlAccentColor', color: controlAccentColor },
    { name: 'controlColor', color: systemPreferences.getColor('control') },
    { name: 'controlBackgroundColor', color: systemPreferences.getColor('control-background') },
    { name: 'controlTextColor', color: systemPreferences.getColor('control-text') },
    { name: 'disabledControlTextColor', color: systemPreferences.getColor('disabled-control-text') },
    { name: 'selectedControlColor', color: systemPreferences.getColor('selected-control') },
    { name: 'selectedControlTextColor', color: systemPreferences.getColor('selected-control-text') },
    { name: 'alternateSelectedControlTextColor', color: systemPreferences.getColor('alternate-selected-control-text') },

    // -------------- Window Colors -------------- //

    { name: 'windowBackgroundColor', color: systemPreferences.getColor('window-background') },
    { name: 'windowFrameTextColor', color: systemPreferences.getColor('window-frame-text') },

    // -------------- Highlight & Shadow Colors -------------- //

    { name: 'findHighlightColor', color: systemPreferences.getColor('find-highlight') },
    { name: 'highlightColor', color: systemPreferences.getColor('highlight') },
    { name: 'shadowColor', color: systemPreferences.getColor('shadow') },
  ]

  return systemColors
})


ipcMain.handle('getValidatedPathOrURL', async (event, docPath, pathToCheck) => {
  // return path.resolve(basePath, filepath)

  /*
  Element: Image, link, backlink, link reference definition
  File type: directory, html, png|jpg|gif, md|mmd|markdown
  */

  // console.log('- - - - - -')
  // console.log(pathToCheck.match(/.{0,2}\//))
  const directory = path.parse(docPath).dir
  const resolvedPath = path.resolve(directory, pathToCheck)

  const docPathExists = await pathExists(docPath)
  const pathToCheckExists = await pathExists(pathToCheck)
  const resolvedPathExists = await pathExists(resolvedPath)

  // console.log('docPath: ', docPath)
  // console.log('pathToCheck: ', pathToCheck)
  // console.log('resolvedPath: ', resolvedPath)
  // console.log(docPathExists, pathToCheckExists, resolvedPathExists)

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