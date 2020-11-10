import { app, BrowserWindow } from 'electron'
import path from 'path'
import url from 'url'

export const browserWindowConfig = {
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

export function createWindow() {

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
  win.on('close', (evt) => {
    evt.preventDefault()
    global.store.dispatch({ type: 'START_TO_CLOSE_WINDOW' }, win.id)

    // if (!safeToClose) {
    //   evt.preventDefault()
    //   win.webContents.send('mainWantsToCloseWindow')
    // } else {
    //   if (!areQuiting) {
    //     global.store.dispatch({ type: 'REMOVE_PROJECT' }, win.id)
    //     // const projects = global.state.projects.slice(0)
    //     // const indexOfProjectToRemove = projects.findIndex((p) => p.windowId == id)
    //     // projects.splice(indexOfProjectToRemove, 1)
    //     // store.set('projects', projects)
    //   }
    // }
  })

  // Close window on `safeToClose`
  global.store.onDidAnyChange((state) => {

    if (state.changed.includes('window.status')) {
      const project = state.projects.find((p) => p.window.id = win.id)
      const safeToClose = project.window.status == 'safeToClose'
      if (safeToClose) {

        // Remove project from `state.projects` if window closing was NOT triggered by app quiting. When quiting, the user expects the project to still be there when the app is re-opened.
        const shouldRemoveProject = state.appStatus !== 'wantsToQuit'
        if (shouldRemoveProject) {
          global.store.dispatch({ type: 'REMOVE_PROJECT' }, win.id)
        }
        
        // Close window with `destroy` method. This skips triggering `close` event.
        win.destroy()
      }
    }

  })

  // Open DevTools
  if (!app.isPackaged) win.webContents.openDevTools();

  return win
}

/**
 * Create new BrowserWindow, and a new project in state to go with it. 
 * We associate the two by setting project `windowId` to BrowswerWindow `id`.
 */
export function createNewWindow(store) {
  const win = createWindow(store)
  store.dispatch({
    type: 'CREATE_NEW_PROJECT',
    windowId: win.id,
  })
}


export function restoreActiveProjectWindows(store) {

  // Restore each window
  store.store.projects.forEach((p, index) => {
    // store.set('windows', index) // TODO
    const win = createWindow(store)
    const projects = store.store.projects.slice(0)
    projects[index].windowId = win.id
    store.set('projects', projects)
  })
}
