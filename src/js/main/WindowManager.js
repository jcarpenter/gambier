import { debounce } from 'debounce'
import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import url from 'url'
import { wait } from '../shared/utils'

const browserWindowConfig = {
  show: false,
  width: 700,
  height: 500,
  // vibrancy: 'sidebar', // Turning off due to poor performance.
  // transparent: true,
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


export async function createWindow(id, project) {

  const win = new BrowserWindow(browserWindowConfig)
  win.projectId = id

  // Set window background color.
  // TODO: Setting backgroundColor is currently broken. 
  // Background always renders as black, regardless of the value. 
  // Bug: https://github.com/electron/electron/issues/26842
  const backgroundColor = global.state().systemColors.windowBackgroundColor
  if (backgroundColor) win.setBackgroundColor(backgroundColor)

  const isNewProject = project.directory == ''

  // Set size. If project directory is empty, it's a new project, and we manually set starting values. Else we restore the previous window size and position (stored in `bounds` property)/
  // Else, create a new window centered on screen.
  if (isNewProject) {
    const menuBarHeight = 24
    const padding = 200
    const displayWidth = screen.getPrimaryDisplay().workAreaSize.width
    const displayHeight = screen.getPrimaryDisplay().workAreaSize.height
    let winWidth = displayWidth - (padding * 2)
    let winHeight = displayHeight - (padding * 2)
    winWidth = winWidth > 1600 ? 1600 : winWidth
    winHeight = winHeight > 1200 ? 1200 : winHeight
    const offset = win.id * 20
    const centeredX = Math.round((displayWidth - winWidth) / 2 + offset)
    const centeredY = Math.round((displayHeight - winHeight) / 2 + offset)
    win.setBounds({
      x: centeredX,
      y: centeredY,
      width: winWidth,
      height: winHeight
    }, false)
  } else {
    win.setBounds(project.window.bounds, false)

  }

  // Have to manually set this to 1.0. That should be the default, but I've had problem where something was setting it to 0.91, resulting in the UI being slightly too-small.
  // win.webContents.zoomFactor = 1.0

  // Listen for 'close' action. Can be triggered by either 1) manually closing individual window, (e.g. click close button on window, or type Cmd-W), or 2) quitting the app. 

  // If closed manually, this event is triggered twice. The first time, we prevent the default and tell webContents to save open documents. That process results in window.status being set to `safeToClose`. ProjectManager catches that state change, and tells this window to close again.
  win.on('close', async (evt) => {

    const userManuallyClosedWindow = global.state().appStatus !== 'canSafelyQuit'
    const winStatus = global.state().projects.byId[id].window.status
    const winWantsToClose = winStatus == 'wantsToClose'
    const winIsSafeToClose = winStatus == 'safeToClose'

    // If window is closing because user manually closed it (e.g. typed Cmd-W), then check if it's safe to close yet. If not, begin that process. ProjectManager will call close again once the window is safe to close, and this time, we won't preventDefault, and the window will close.
    if (userManuallyClosedWindow && !winIsSafeToClose) {
      // Tell window to close
      evt.preventDefault()
      if (!winWantsToClose) {
        global.store.dispatch({ type: 'START_TO_CLOSE_PROJECT_WINDOW' }, win)
      }
    }
  })

  // If app is NOT quiting, we remove the project from store after closing the window. Because if the user manually closes a window, they mean to close the project. But if they quit the app, they want to their open projects to reopen, next session.
  win.on('closed', async (evt) => {
    
    const appIsNotQuiting = global.state().appStatus == 'open'
    if (appIsNotQuiting) {
      await global.store.dispatch({ type: 'REMOVE_PROJECT' }, win)
    }
    
    // If there are no other windows open, clear `focusedWindowId`
    // Unless app is quitting, in which case it's too late to modify state.
    // (Immer will throw a bug re: the object having been destroyed).
    const otherWindowsAreOpen = BrowserWindow.getAllWindows().length
    if (!otherWindowsAreOpen && appIsNotQuiting) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' })
    }
  })

  // On resize or move, save bounds to state (wait 1 second to avoid unnecessary spamming). Using `debounce` package: https://www.npmjs.com/package/debounce
  win.on('resize', debounce(() => { saveWindowBoundsToState(win) }, 1000))
  win.on('move', debounce(() => { saveWindowBoundsToState(win) }, 1000))

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

  // De-focus window when a sheet is open
  win.on('sheet-begin', () => {
    global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' })
  })

  // Focus window when a sheet closes
  win.on('sheet-end', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win)
  })

  // Open DevTools
  if (!app.isPackaged) win.webContents.openDevTools();
 
  // Load index.html (old way)
  // await win.loadFile(path.join(__dirname, 'index.html'), {
  
  // Load local index.html file
  // "Electron by default allows local resources to be accessed by render processes only when their html files are loaded from local sources with the file:// protocol for security reasons."

  await win.loadURL(url.format({
    pathname: 'index.html',
    protocol: 'file:',
    slashes: true,
    query: {
      id: win.projectId
    }
  }))


  // Save window bounds
  saveWindowBoundsToState(win)

  // Set project window status to 'open'
  global.store.dispatch({
    type: 'OPENED_PROJECT_WINDOW',
  }, win)

  return win
}

/**
 * Save window bounds to state, so we can restore after restart.
 */
function saveWindowBoundsToState(win) {
  global.store.dispatch({
    type: 'SAVE_PROJECT_WINDOW_BOUNDS',
    windowBounds: win.getBounds()
  }, win)
}
