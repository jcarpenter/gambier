// External dependencies
import { app, BrowserWindow, clipboard, dialog, protocol, shell, systemPreferences, webFrame } from 'electron'
import path from 'path'

// Bundled dependencies
import { Store } from './Store'
import * as AppearanceManager from './AppearanceManager'
import { DbManager } from './DbManager'
import * as IpcManager from './IpcManager'
import * as MenuBarManager from './MenuBarManager'
import * as ProjectManager from './ProjectManager'
import * as PreferencesManager from './PreferencesManager'
import { propHasChangedTo } from '../shared/utils'
import { userInfo } from 'os'


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true


// -------- Reload (Development-only) -------- //

app.commandLine.appendSwitch('inspect=5858')
app.commandLine.appendSwitch('enable-transparent-visuals')

if (!app.isPackaged) {

  const thingsToWatchForReload = [
    path.join(__dirname, '**/*.js'),
    // path.join(__dirname, '**/*.html'),
    path.join(__dirname, '**/*.css'),
    // path.join(__dirname, '**/*.xml')
    // 'main.js',
    // '**/*.js',
    // '**/*.html',
    // '**/*.css',
    // '**/*.xml',
    // '**/*.png',
    // '**/*.jpg',
  ]

  // We use `electron-reload` package to do a hard reset of electron
  // every time a file changes.
  require('electron-reload')(thingsToWatchForReload, {

    // awaitWriteFinish: {
    //   stabilityThreshold: 10,
    //   pollInterval: 50
    // },

    // We reset electron each time (starting a new electron process, and
    // not just restarting web contents, which the default) by specifying 
    // the path to the electron package.
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),

    // "If your app overrides some of the default quit or close actions 
    // (e.g. closing the last app window hides the window instead of 
    // quitting the app) then the default electron-reload hard restart 
    // could leave you with multiple instances of your app running. In 
    // these cases you can change the default hard restart action from 
    // app.quit() to app.exit() by specifying the hard reset method in 
    // the electron-reload options"
    // https://www.npmjs.com/package/electron-reload
    // hardResetMethod: 'exit',

    argv: ['--inspect=5858', '--enable-transparent-visuals'],
  })

  console.log('// - - - - - - - - - - - - - - - //')
  console.log(`Gambier... Electron ${process.versions.electron}. Chrome ${process.versions['chrome']}`)
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


    // Catch when user toggles macOS keyboard navigation by 
    // listening to system changes.
    systemPreferences.subscribeNotification('com.apple.KeyboardUIModeDidChange', async (evt, userInfo, object) => {
      await global.store.dispatch({
        type: 'SET_SYSTEM_VALUES',
        values: {
          ...global.state().system,
          keyboardNavEnabled: systemPreferences.getUserDefault('AppleKeyboardUIMode', 'boolean')
        }
      })
    })

    // Ensure app assets load reliably from both absolute and
    // relative urls by intercepting, determining if the request
    // is for an app asset (it doesn't start with `Users`, in
    // case of macOS), and if so, inserting app path at start.
    // Before we added this, absolute paths to app assets would
    // fail.
    // Before: `file:///img/arrow.svg`
    // After: `file:///Users/josh/Desktop/gambier/img/arrow.svg`
    protocol.interceptFileProtocol('file', (request, callback) => {

      // console.log(request)
      
      // If the request url starts with `file:///Users`, it's
      // not a request for an app asset, so we don't need to
      // append the app path. This happens when user loads an 
      // image from the project, for example. We just cleanup
      // the request url.
      const isRequestForAppAsset = !request.url.startsWith('file:///Users/')
      if (!isRequestForAppAsset) {
        
        // Clean up the request url by removing the file prefix
        // and replacing ascii spaces with real spaces:
        // Before: file:///Users/josh/Desktop/Notes/climate%20graph.jpg
        // After:  /Users/josh/Desktop/Notes/climate graph.jpg
        let url = request.url.substr('file://'.length)
        url = path.normalize(url)
        url = url.replaceAll('%20', ' ')
        // console.log(url)
        callback({ path: url })
        return
      }

      let url = request.url.substr('file'.length + 1)

      // Build complete path for node require function
      url = path.join(__dirname, url)

      const containsQuery = url.includes('?')
      if (containsQuery) {
        url = url.substring(0, url.lastIndexOf('?'))
      }

      // Replace backslashes by forward slashes (windows)
      url = path.normalize(url)
      
      // console.log(url)

      callback({ path: url })

    })

    // Create IPC listeners/handlers
    IpcManager.init()

    // Setup preferences manager
    PreferencesManager.init()

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' })

    // Setup menu bar
    MenuBarManager.init()

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
