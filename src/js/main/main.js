// External dependencies
import { app, BrowserWindow, clipboard, dialog, shell, webFrame } from 'electron'
import path from 'path'

// Bundled dependencies
import { Store } from './Store'
import * as AppearanceManager from './AppearanceManager'
import { DbManager } from './DbManager'
import * as IpcManager from './IpcManager'
import * as MenuBarManager from './MenuBarManager2'
import * as ProjectManager from './ProjectManager'
import * as PreferencesManager from './PreferencesManager'
import { propHasChangedTo } from '../shared/utils'


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true


// -------- Reload (Development-only) -------- //

app.commandLine.appendSwitch('inspect=5858')
app.commandLine.appendSwitch('enable-transparent-visuals')

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
    // hardResetMethod: 'exit',
    argv: ['--inspect=5858', '--enable-transparent-visuals'],
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

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

// Create store (and global variables for store and state)
global.store = new Store()
global.state = () => global.store.store
global.patches = [] // Most recent patches from Immer
global.watchers = [] // Watchers. Are populdated by ProjectManager

// Create Sqlite databaase (happens in the constructor). 
// Class instance has useful functions for interacting w/ the db.
// E.g. Insert new row, update, etc.
global.db = new DbManager()

// Start app
app.whenReady()
  .then(async () => {

    // Create IPC listeners/handlers
    IpcManager.init()

    // Setup preferences manager
    PreferencesManager.init()

    // Setup menu bar
    MenuBarManager.init()

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' })
    
    // const appThemeIsNotDefined = !global.state().theme.id
    // if (appThemeIsNotDefined) {
    //   await global.store.dispatch({ 
    //     type: 'SET_APP_THEME', 
    //     id: AppearanceManager.themes.defaultId
    //   })
    // }

    // Get initial system appearance values
    AppearanceManager.init()

    // Create windows and watchers for projects
    ProjectManager.init()

    // App startup complete!
    await global.store.dispatch({ type: 'FINISH_COLD_START' })
  })


// -------- LISTENERS -------- //

// Start to quit app: Set appStatus to 'safeToQuit'. This triggers windows to close. Once all of them have safely closed (e.g. open docs are saved), appStatus is updated to 'safeToQuit', and we call `app.quit` again. This time it will go through.

app.on('before-quit', async (evt) => {
  const appStatus = global.state().appStatus
  switch (appStatus) {

    // If app is open, preventDefault, and update appStatus state
    // via reducer. 
    case 'open': {
      evt.preventDefault()
      await global.store.dispatch({
        type: 'START_TO_QUIT'
      })
      break
    }

    // If quit has already started, preventDefault.
    case 'wantsToQuit': {
      evt.preventDefault()
      break
    }

    // If app is safe to quit, do nothing; allow it to quit.
    case 'safeToQuit': {
      console.log("Quitting app!")
      // Do nothing
      break
    }
  }
})

/**
 * Quit app when appStatus changes to 'safeToQuit'
 */
global.store.onDidAnyChange(async (state, oldState) => {

  const canSafelyQuit = propHasChangedTo('appStatus', 'safeToQuit', state, oldState)

  if (canSafelyQuit) {
    app.quit()
  }
})

// On all windows closed, if app is quitting, set `safeToQuit` on appStatus
// via 'CAN_SAFELY_QUIT' reducer. Else, do nothing.
app.on('window-all-closed', async () => {

  const appWantsToQuit = global.state().appStatus == 'wantsToQuit'
  const isNotMacApp = process.platform !== 'darwin'
  
  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (appWantsToQuit || isNotMacApp) {
    await global.store.dispatch({
      type: 'CAN_SAFELY_QUIT'
    })
  }
})
