// External dependencies
import { app, BrowserWindow, clipboard, dialog, shell, webFrame } from 'electron'
import path from 'path'

// Bundled dependencies
import { Store } from './Store'
import { AppearanceManager } from './AppearanceManager'
import { DbManager } from './DbManager'
import { DiskManager } from './DiskManager'
import { IpcManager } from './IpcManager'
import { MenuBarManager } from './MenuBarManager'
import { WindowManager } from './WindowManager'


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


// -------- IPC TESTING -------- //

// ipc.config.id = 'world';
// ipc.config.retry = 1500;

// ipc.serve(() => {

//     ipc.server.on('message', (data, socket) => {
//       ipc.log('got a message : '.debug, data)
//       ipc.server.emit(
//         socket,
//         'message',  // This can be anything you want so long as your client knows.
//         data + ' world!'
//       )
//     })

//     ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
//       ipc.log('client ' + destroyedSocketID + ' has disconnected!')
//     })
//   }
// )

// ipc.server.start()



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

// Create Sqlite databaase (happens in the constructor). 
// Class instance has useful functions for interacting w/ the db.
// E.g. Insert new row, update, etc.
global.db = new DbManager()

// One more global variable for watchers
global.watchers = diskManager.watchers

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

// Start app
app.whenReady()
  .then(async () => {

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' })
    // Get system appearance settings
    appearanceManager.startup()
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
