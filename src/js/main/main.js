// External dependencies
import { app, BrowserWindow, clipboard, dialog, shell, systemPreferences, nativeTheme, webFrame } from 'electron'
import path from 'path'
import { writeFile, readFile, pathExists } from 'fs-extra'

// Bundled dependencies
import { Store } from './Store'
import { AppearanceManager } from './AppearanceManager'
import { DiskManager } from './DiskManager'
import { IpcManager } from './IpcManager'
import { MenuBarManager } from './MenuBarManager'
import { WindowManager } from './WindowManager'
import { hasChanged, hasChangedTo } from '../shared/utils.js'


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

  console.log('// - - - - - - - - - - - - - - -')
  console.log(`Gambier. Electron ${process.versions.electron}. Chrome ${process.versions['chrome']}`)
}


// -------- SETUP -------- //

// Create store (and global variables for store and state)
global.store = new Store()
global.state = () => global.store.store
global.patches = [] // Most recent patches from Immer

// Create managers
const appearanceManager = new AppearanceManager()
const diskManager = new DiskManager()
const ipcManager = new IpcManager()
const menuBarManager = new MenuBarManager()
const windowManager = new WindowManager()

// One more global variable
global.watchers = diskManager.watchers

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

// Start app
app.whenReady()
  .then(async () => {
    // TODO
    // appearanceManager.setNativeTheme

    // Kickoff app cold start. Reducers prep state as necessary.
    // E.g. Prune projects with inaccessible directoris.
    await global.store.dispatch({ type: 'START_COLD_START' })
    // Create a window for each project
    await windowManager.startup()
    // Create a Watcher instance for each project
    await diskManager.startup()
    // App startup complete!
    await global.store.dispatch({ type: 'FINISH_COLD_START' })
  })


// -------- LISTENERS -------- //

// Quit app: Start by setting appStatus to 'safeToQuit', if it is not yet so. This triggers windows to close. Once all of them have closed, update appStatus to 'safeToQuit', and then trigger `app.quit` again. This time it will go through.

app.on('before-quit', async (evt) => {
  if (global.state().appStatus !== 'safeToQuit') {
    evt.preventDefault()
    await global.store.dispatch({
      type: 'START_TO_QUIT'
    })
  }
})

global.store.onDidAnyChange(async (state) => {
  if (state.appStatus == 'wantsToQuit') {
    const isAllWindowsSafelyClosed = state.projects.every((p) => p.window.status == 'safeToClose')
    if (isAllWindowsSafelyClosed) {
      await global.store.dispatch({ type: 'CAN_SAFELY_QUIT' })
      app.quit()
    }
  }
})

// All windows closed
app.on('window-all-closed', () => {
  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
