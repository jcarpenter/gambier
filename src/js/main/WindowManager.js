import { debounce } from 'debounce'
import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import url from 'url'
import { hasChangedTo } from '../shared/utils'

export class WindowManager {

  constructor() {

    // Listen for state changes
    global.store.onDidAnyChange((state, oldState) => {
      if (state.appStatus !== 'open') return
      if (state.projects.length > oldState.projects.length) {
        const newProjectIndex = state.projects.length - 1
        const newProject = state.projects[newProjectIndex]
        this.createWindow(newProjectIndex, newProject)
      }
      // const isStartingUp = hasChangedTo('appStatus', 'coldStarting', state, oldState)
      // if (isStartingUp) {
      //   state.projects.forEach(async (p, index) => {
      //     this.createWindow(index, p.window.bounds)
      //   })
      // } else if (state.projects.length > oldState.projects.length) {
      //   this.createWindow(state.projects.length - 1)
      // }
    })
  }

  /**
   * On startup, create a BrowserWindow for each project.
   */
  async startup() {
    let index = 0
    for (const project of global.state().projects) {
      await this.createWindow(index, project)
      index++
    }
  }

  async createWindow(projectIndex, project) {

    const win = new BrowserWindow(browserWindowConfig)
    const isFirstRun = project.directory == ''

    // Set size. If project directory is empty, it's first run, and we set window centered, and filling most of the primary screen. Else we restore the previous window size and position (stored in `bounds` property)/
    // Else, create a new window centered on screen.
    if (isFirstRun) {
      const menuBarHeight = 24
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const padding = 200
      win.setBounds({
        x: padding,
        y: padding,
        width: width - padding * 2,
        height: height - padding * 2
      }, false)
    } else {
      win.setBounds(project.window.bounds, false)
    }

    // Load index.html
    await win.loadFile(path.join(__dirname, 'index.html'), {
      query: {
        id: win.id
      },
    })

    // Have to manually set this to 1.0. That should be the default, but I've had problem where something was setting it to 0.91, resulting in the UI being slightly too-small.
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

    // On resize or move, save bounds to state (wait 1 second to avoid unnecessary spamming)
    // Using `debounce` package: https://www.npmjs.com/package/debounce
    win.on('resize', debounce(() => { saveWindowBoundsToState(win) }, 1000))
    win.on('move', debounce(() => { saveWindowBoundsToState(win) }, 1000))

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

/**
 * Save window bounds to state, so we can restore after restart.
 */
function saveWindowBoundsToState(win) {
  global.store.dispatch({ type: 'SAVE_WINDOW_BOUNDS', windowBounds: win.getBounds() }, win.id)
}


const browserWindowConfig = {
  show: false,
  width: 200, 
  height: 200,
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