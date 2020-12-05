import { app, BrowserWindow, clipboard, dialog, ipcMain, shell, systemPreferences, nativeTheme, webFrame } from 'electron'

import { saveFile, deleteFile, deleteFiles, selectProjectDirectoryFromDialog, selectCitationsFileFromDialog } from './actions/index.js'

export class IpcManager {
  constructor() {

    // -------- IPC: Renderer "receives" from Main -------- //

    // On change, send updated state to renderer (each BrowserWindow)
    // global.store.onDidAnyChange(async (state, oldState) => {
    //   const windows = BrowserWindow.getAllWindows()
    //   if (windows.length) {
    //     windows.forEach((win) => win.webContents.send(' ', state, oldState))
    //   }
    // })

    // -------- IPC: Renderer "sends" to Main -------- //

    ipcMain.on('showWindow', (evt) => {
      const win = BrowserWindow.fromWebContents(evt.sender)
      win.show()
    })

    ipcMain.on('safelyCloseWindow', async (evt) => {
      const win = BrowserWindow.fromWebContents(evt.sender)
      if (!global.state().areQuiting) {
        await global.store.dispatch({
          type: 'REMOVE_PROJECT'
        }, win.id)
      }
      win.destroy()
    })

    ipcMain.on('dispatch', async (evt, action) => {
      const win = BrowserWindow.fromWebContents(evt.sender)
      switch (action.type) {
        case ('SELECT_CITATIONS_FILE_FROM_DIALOG'):
          store.dispatch(await selectCitationsFileFromDialog(), win.id)
          break
        case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
          store.dispatch(await selectProjectDirectoryFromDialog(), win.id)
          break
        case ('SAVE_FILE'):
          store.dispatch(await saveFile(action.path, action.data), win.id)
          break
        case ('DELETE_FILE'):
          store.dispatch(await deleteFile(action.path), win.id)
          break
        case ('DELETE_FILES'):
          store.dispatch(await deleteFiles(action.paths), win.id)
          break
        default:
          store.dispatch(action, win.id)
          break
      }
    })

    // -------- IPC: Invoke -------- //

    // NOTE: We handle this in DbManager.js
    // ipcMain.handle('queryDb', (evt, params) => {
    //   ...
    // })

    ipcMain.handle('getState', (evt) => {
      return global.state()
    })

    ipcMain.handle('getFiles', (evt) => {
      const win = BrowserWindow.fromWebContents(evt.sender)
      const watcher = global.watchers.find((watcher) => watcher.id == win.id)
      return watcher ? watcher.files : undefined
    })
  }
}



// -------- IPC: Renderer "sends" to Main -------- //


// // ipcMain.on('saveProjectStateToDisk', (evt, state) => {
// //   const win = BrowserWindow.fromWebContents(evt.sender)
// //   const projects = store.store.projects.slice(0)
// //   const indexOfProjectToUpdate = projects.findIndex((p) => p.windowId == state.windowId)
// //   projects[indexOfProjectToUpdate] = state
// //   store.set('projects', projects)
// // })

// // ipcMain.on('saveFileThenCloseWindow', async (event, path, data) => {
// //   await writeFile(path, data, 'utf8')
// //   canCloseWindowSafely = true
// //   win.close()
// // })

// // ipcMain.on('saveFileThenQuitApp', async (event, path, data) => {
// //   await writeFile(path, data, 'utf8')
// //   canQuitAppSafely = true
// //   app.quit()
// // })

// // ipcMain.on('openUrlInDefaultBrowser', (event, url) => {
// //   shell.openExternal(url)
// // })



// // // -------- IPC: Invoke -------- //

// // ipcMain.handle('getSystemColors', () => {

// //   // Get accent color, chop off last two characters (always `ff`, for 100% alpha), and prepend `#`.
// //   // `0a5fffff` --> `#0a5fff`
// //   let controlAccentColor = `#${systemPreferences.getAccentColor().slice(0, -2)}`

// //   const systemColors = [

// //     // -------------- System Colors -------------- //
// //     // Note: Indigo and Teal exist in NSColor, but do not seem to be supported by Electron.

// //     { name: 'systemBlue', color: systemPreferences.getSystemColor('blue') },
// //     { name: 'systemBrown', color: systemPreferences.getSystemColor('brown') },
// //     { name: 'systemGray', color: systemPreferences.getSystemColor('gray') },
// //     { name: 'systemGreen', color: systemPreferences.getSystemColor('green') },
// //     // { name: 'systemIndigo', color: systemPreferences.getSystemColor('systemIndigo')},
// //     { name: 'systemOrange', color: systemPreferences.getSystemColor('orange') },
// //     { name: 'systemPink', color: systemPreferences.getSystemColor('pink') },
// //     { name: 'systemPurple', color: systemPreferences.getSystemColor('purple') },
// //     { name: 'systemRed', color: systemPreferences.getSystemColor('red') },
// //     // { name: 'systemTeal', color: systemPreferences.getSystemColor('teal')},
// //     { name: 'systemYellow', color: systemPreferences.getSystemColor('yellow') },

// //     // -------------- Label Colors -------------- //

// //     { name: 'labelColor', color: systemPreferences.getColor('label') },
// //     { name: 'secondaryLabelColor', color: systemPreferences.getColor('secondary-label') },
// //     { name: 'tertiaryLabelColor', color: systemPreferences.getColor('tertiary-label') },
// //     { name: 'quaternaryLabelColor', color: systemPreferences.getColor('quaternary-label') },

// //     // -------------- Text Colors -------------- //

// //     { name: 'textColor', color: systemPreferences.getColor('text') },
// //     { name: 'placeholderTextColor', color: systemPreferences.getColor('placeholder-text') },
// //     { name: 'selectedTextColor', color: systemPreferences.getColor('selected-text') },
// //     { name: 'textBackgroundColor', color: systemPreferences.getColor('text-background') },
// //     { name: 'selectedTextBackgroundColor', color: systemPreferences.getColor('selected-text-background') },
// //     { name: 'keyboardFocusIndicatorColor', color: systemPreferences.getColor('keyboard-focus-indicator') },
// //     { name: 'unemphasizedSelectedTextColor', color: systemPreferences.getColor('unemphasized-selected-text') },
// //     { name: 'unemphasizedSelectedTextBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-text-background') },

// //     // -------------- Content Colors -------------- //

// //     { name: 'linkColor', color: systemPreferences.getColor('link') },
// //     { name: 'separatorColor', color: systemPreferences.getColor('separator') },
// //     { name: 'selectedContentBackgroundColor', color: systemPreferences.getColor('selected-content-background') },
// //     { name: 'unemphasizedSelectedContentBackgroundColor', color: systemPreferences.getColor('unemphasized-selected-content-background') },

// //     // -------------- Menu Colors -------------- //

// //     { name: 'selectedMenuItemTextColor', color: systemPreferences.getColor('selected-menu-item-text') },

// //     // -------------- Table Colors -------------- //

// //     { name: 'gridColor', color: systemPreferences.getColor('grid') },
// //     { name: 'headerTextColor', color: systemPreferences.getColor('header-text') },

// //     // -------------- Control Colors -------------- //

// //     { name: 'controlAccentColor', color: controlAccentColor },
// //     { name: 'controlColor', color: systemPreferences.getColor('control') },
// //     { name: 'controlBackgroundColor', color: systemPreferences.getColor('control-background') },
// //     { name: 'controlTextColor', color: systemPreferences.getColor('control-text') },
// //     { name: 'disabledControlTextColor', color: systemPreferences.getColor('disabled-control-text') },
// //     { name: 'selectedControlColor', color: systemPreferences.getColor('selected-control') },
// //     { name: 'selectedControlTextColor', color: systemPreferences.getColor('selected-control-text') },
// //     { name: 'alternateSelectedControlTextColor', color: systemPreferences.getColor('alternate-selected-control-text') },

// //     // -------------- Window Colors -------------- //

// //     { name: 'windowBackgroundColor', color: systemPreferences.getColor('window-background') },
// //     { name: 'windowFrameTextColor', color: systemPreferences.getColor('window-frame-text') },

// //     // -------------- Highlight & Shadow Colors -------------- //

// //     { name: 'findHighlightColor', color: systemPreferences.getColor('find-highlight') },
// //     { name: 'highlightColor', color: systemPreferences.getColor('highlight') },
// //     { name: 'shadowColor', color: systemPreferences.getColor('shadow') },
// //   ]

// //   return systemColors
// // })


// // ipcMain.handle('getValidatedPathOrURL', async (event, docPath, pathToCheck) => {
// //   // return path.resolve(basePath, filepath)

// //   /*
// //   Element: Image, link, backlink, link reference definition
// //   File type: directory, html, png|jpg|gif, md|mmd|markdown
// //   */

// //   // console.log('- - - - - -')
// //   // console.log(pathToCheck.match(/.{0,2}\//))
// //   const directory = path.parse(docPath).dir
// //   const resolvedPath = path.resolve(directory, pathToCheck)

// //   const docPathExists = await pathExists(docPath)
// //   const pathToCheckExists = await pathExists(pathToCheck)
// //   const resolvedPathExists = await pathExists(resolvedPath)

// //   // console.log('docPath: ', docPath)
// //   // console.log('pathToCheck: ', pathToCheck)
// //   // console.log('resolvedPath: ', resolvedPath)
// //   // console.log(docPathExists, pathToCheckExists, resolvedPathExists)

// //   // if (pathToCheck.match(/.{0,2}\//)) {
// //   //   console.log()
// //   // }
// // })

// // ipcMain.handle('getResolvedPath', async (event, basePath, filepath) => {
// //   return path.resolve(basePath, filepath)
// // })

// // ipcMain.handle('getParsedPath', async (event, filepath) => {
// //   return path.parse(filepath)
// // })

// // ipcMain.handle('ifPathExists', async (event, filepath) => {
// //   const exists = await pathExists(filepath)
// //   return { path: filepath, exists: exists }
// // })



// // ipcMain.handle('getState', async (event) => {
// //   return store.store
// // })

// // ipcMain.handle('getCitations', (event) => {
// //   return projectCitations.getCitations()
// // })

// // ipcMain.handle('getFileByPath', async (event, filePath, encoding) => {

// //   // Load file and return
// //   let file = await readFile(filePath, encoding)
// //   return file
// // })

// // ipcMain.handle('getFileById', async (event, id, encoding) => {

// //   // Get path of file with matching id
// //   const filePath = store.store.contents.find((f) => f.id == id).path

// //   // Load file and return
// //   let file = await readFile(filePath, encoding)
// //   return file
// // })

// // ipcMain.handle('pathJoin', async (event, path1, path2) => {
// //   return path.join(path1, path2)
// // })

// // ipcMain.handle('getHTMLFromClipboard', (event) => {
// //   return clipboard.readHTML()
// // })

// // ipcMain.handle('getFormatOfClipboard', (event) => {
// //   return clipboard.availableFormats()
// // })