import { app, BrowserWindow } from 'electron'
import path from 'path'
import url from 'url'
import { hasChangedTo } from '../shared/utils'

export class WindowManager {

  constructor() {

    // Listen for state changes
    global.store.onDidAnyChange((state, oldState) => {
      const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState)
      if (isStartingUp) {
        state.projects.forEach(async (p, index) => {
          this.createWindow(index)
        })
      } else if (state.projects.length > oldState.projects.length) {
        this.createWindow(state.projects.length - 1)
      }
    })
  }

  createWindow(projectIndex) {

    const win = new BrowserWindow(browserWindowConfig)

    // Load index.html
    win.loadFile(path.join(__dirname, 'index.html'), {
      query: {
        id: win.id
      },
    })

    // Have to manually set this to 1.0. That should be the default, but somewhere it's being set to 0.91, resulting in the UI being slightly too-small.
    win.webContents.zoomFactor = 1.0

    // Listen for close action. Is triggered by pressing close button on window, or close menu item, or app quit. Prevent default, and update state.
    win.on('close', async (evt) => {
      const state = global.state()
      const project = state.projects.find((p) => p.window.id == win.id)

      switch (project.window.status) {
        case 'open':
          evt.preventDefault()
          await global.store.dispatch({ type: 'START_TO_CLOSE_WINDOW' }, win.id)
          break
        case 'safeToClose':
          // Remove project from `state.projects` if window closing was NOT triggered by app quiting. When quiting, the user expects the project to still be there when the app is re-opened. 
          const shouldRemoveProject = state.appStatus !== 'wantsToQuit'
          if (shouldRemoveProject) {
            global.store.dispatch({ type: 'REMOVE_PROJECT' }, win.id)
          }
          break
      }
    })

    // Listen for app quiting, and start to close window
    global.store.onDidAnyChange(async (state, oldState) => {
      const appWantsToQuit = hasChangedTo('appStatus', 'wantsToQuit', state, oldState)
      if (appWantsToQuit) {
        await global.store.dispatch({ type: 'START_TO_CLOSE_WINDOW' }, win.id)
      } else {
        const project = state.projects.find((p) => p.window.id == win.id)
        const oldProject = oldState.projects.find((p) => p.window.id == win.id)
        const isSafeToCloseThisWindow = hasChangedTo('window.status', 'safeToClose', project, oldProject)
        if (isSafeToCloseThisWindow) {
          win.close()
        }
      }
    })

    // Open DevTools
    if (!app.isPackaged) win.webContents.openDevTools();

    global.store.dispatch({
      type: 'OPENED_WINDOW',
      projectIndex: projectIndex,
    }, win.id)

    return win
  }
}


const browserWindowConfig = {
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
}