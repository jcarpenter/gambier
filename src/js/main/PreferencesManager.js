import { app, BrowserWindow } from 'electron'
import path from 'path'
import { wait } from '../shared/utils'

const preferencesWindowConfig = {
  show: false,
  // width: 1060, // With dev tools open
  width: 700,
  height: 480,
  zoomFactor: 1.0,
  titleBarStyle: 'hidden',
  resizable: false,
  webPreferences: {
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
}

export function init() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // Did `prefs: isOpen` change?
  global.store.onDidAnyChange((state, oldState) => {
    if (state.prefs.isOpen !== oldState.prefs.isOpen && state.prefs.isOpen) {
      open()
    }
  })
}

async function open() {

  const win = new BrowserWindow(preferencesWindowConfig)

  win.once('ready-to-show', () => {
    win.show()
  })

  // 'projectId' is a bit of a misnomer for Preferences, but we use it for the sake of consistency.
  win.projectId = 'preferences'

  // On focus, set `focusedWindowId` to win.id
  win.on('focus', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win)
  })

  /*
  On blur, wait a beat. If the user has clicked on another Gambier window it will fire `FOCUSED_WINDOW` and set itself as the `focusedWindowId`. In which case we don't want to do anything. But if the user has clicked outside the app, `focusedWindowId` will still equal this win.projectId after the beat. In which case, set `focusedWindowId` to zero, which we take to mean that the app is in the background.
  */
  win.on('blur', async () => {
    await wait(50)
    if (global.state().focusedWindowId == win.projectId) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' })
    }
  })

  win.on('close', () => {
    global.store.dispatch({ type: 'CLOSE_PREFERENCES' })
  })

  // if (!app.isPackaged) {
  //   win.webContents.openDevTools();
  //   win.setBounds({ width: 1060 })
  // }

  // Load index.html
  await win.loadFile(path.join(__dirname, 'preferences.html'), {
    query: {
      id: win.projectId
    },
  })
}

