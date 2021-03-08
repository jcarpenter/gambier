import { app, BrowserWindow, clipboard, dialog, ipcMain, shell, systemPreferences, nativeTheme, webFrame } from 'electron'
import { readFile, writeFile, renameSync, copyFileSync, existsSync, readdirSync } from 'fs-extra'
import path from 'path'
import { saveDoc, saveDocAs, deleteFile, deleteFiles, selectProjectDirectoryFromDialog, selectCitationsFileFromDialog } from './actions/index.js'
import { getColors } from './AppearanceManager.js'

export function init() {

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

  ipcMain.on('openUrlInDefaultBrowser', (evt, url) => {
    shell.openExternal(url)
  })

  ipcMain.on('replaceAll', (evt, query, replaceWith, filePaths, isMatchCase, isMatchExactPhrase, isMetaKeyPressed) => {

    // Define our regex for finding matches in the specified files.
    // Demo: https://jsfiddle.net/m17zhoyj/1/
    let queryRegex = undefined
    if (isMatchExactPhrase) {
      // If `matchExactPhrase`, make sure there are no word characters immediately before or after the query phrase, using negative look behind and look ahead.
      // Demo: https://regex101.com/r/Toj4WF/1
      queryRegex = new RegExp(String.raw`(?<!\w)${query}(?!\w)`, isMatchCase ? 'g' : 'gi')
    } else {
      queryRegex = new RegExp(`${query}`, isMatchCase ? 'g' : 'gi')
    }

    // Ask user to confirm replacment, unless meta key was held down (provides a fast path).
    if (!isMetaKeyPressed) {
      const confirmReplacement = dialog.showMessageBoxSync({
        type: 'warning',
        message: `Are you sure you want to replace "${query}" with "${replaceWith}" in ${filePaths.length} document${filePaths.length > 1 ? 's' : ''}?`,
        buttons: ['Cancel', 'Replace'],
        cancelId: 0
      })

      // If user does not press `Replace` (1), then `return` prematurely.
      if (confirmReplacement !== 1) return
    }

    // Open each file in `filePaths`, find all instances of `query`, replace, and write file.
    filePaths.forEach(async (filePath) => {
      let file = await readFile(filePath, 'utf8')
      file = file.replaceAll(queryRegex, replaceWith)
      await writeFile(filePath, file, 'utf8')
    })
  })


  ipcMain.on('moveOrCopyIntoFolder', async (evt, filePath, folderPath, isCopy) => {
    // Get destination
    const fileName = path.basename(filePath)
    let destinationPath = path.format({
      dir: folderPath,
      base: fileName
    })

    // Does file already exist at destination?
    const fileAlreadyExists = existsSync(destinationPath)

    // If yes, prompt user to confirm overwrite. 
    // Else, just move/copy
    if (fileAlreadyExists) {
      const selectedButtonId = dialog.showMessageBoxSync({
        type: 'question',
        message: `An item named ${fileName} already exists in this location. Do you want to replace it with the one you’re moving?`,
        buttons: ['Keep Both', 'Stop', 'Replace'],
        cancelId: 1
      })
      switch (selectedButtonId) {
        // Keep both
        case 0:
          destinationPath = getIncrementedFileName(destinationPath)
          copyFileSync(filePath, destinationPath)
          break
        // Stop (Do nothing)
        case 1:
          break
        // Replace
        case 2:
          if (isCopy) {
            copyFileSync(filePath, destinationPath)
          } else {
            renameSync(filePath, destinationPath)
          }
          break
      }
    } else {
      if (isCopy) {
        copyFileSync(filePath, destinationPath)
      } else {
        renameSync(filePath, destinationPath)
      }
    }
  })


  ipcMain.on('dispatch', async (evt, action) => {

    const win = BrowserWindow.fromWebContents(evt.sender)

    switch (action.type) {

      case ('SELECT_CITATIONS_FILE_FROM_DIALOG'):
        store.dispatch(await selectCitationsFileFromDialog(), win)
        break

      case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
        store.dispatch(await selectProjectDirectoryFromDialog(), win)
        break

      case ('PROMPT_TO_SAVE_DOC'):
      case ('CLOSE_PANEL'):
      case ('OPEN_DOC_IN_PANEL'):
        promptToSaveChangesThenForwardAction(action)
        break

      case ('SAVE_DOC'):
        store.dispatch(await saveDoc(action.doc, action.data, action.panelIndex), win)
        break

      case ('SAVE_DOC_AS'):
        store.dispatch(await saveDocAs(action.doc, action.data, action.isNewDoc, action.panelIndex, win), win)
        break

      case ('DELETE_FILE'):
        store.dispatch(await deleteFile(action.path), win)
        break

      case ('DELETE_FILES'):
        store.dispatch(await deleteFiles(action.paths), win)
        break

      default:
        store.dispatch(action, win)
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
    const watcher = global.watchers.find((watcher) => watcher.id == win.projectId)
    return watcher ? watcher.files : undefined
  })

  // Load file and return text
  ipcMain.handle('getFileByPath', async (evt, filePath, encoding = 'utf8') => {
    let file = await readFile(filePath, encoding)
    return file
  })

  // Get system colors and return
  ipcMain.handle('getColors', (evt, observeThemeValues = true) => {
    return getColors(observeThemeValues)
  })

  ipcMain.handle('getHTMLFromClipboard', (evt) => {
    return clipboard.readHTML()
  })

  ipcMain.handle('getFormatOfClipboard', (evt) => {
    return clipboard.availableFormats()
  })
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



// -------- IPC: Invoke -------- //




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


/**
 * 
 * @param {*} action - With typee, and assorted optional properties. 
 */
function promptToSaveChangesThenForwardAction(action) {

  const project = global.state().projects.byId[win.projectId]
  const panel = project.panels[action.panelIndex]

  if (!panel.unsavedChanges) {

    // No unsaved changes: We just forward the action.

    store.dispatch({ ...action, saveOutcome: 'noUnsavedChanges' }, win)

  } else {

    // Unsaved changes: We prompt user to save...

    // Prompt's wording depends on whether doc is new...
    const outgoingDocIsNewDoc = action.outgoingDoc.id == 'newDoc'
    const message = outgoingDocIsNewDoc ?
      'Do you want to save the changes you made to the new document?' :
      `Do you want to save the changes you made to ${action.outgoingDoc.path.slice(action.outgoingDoc.path.lastIndexOf('/') + 1)}?`

    // Show prompt
    const { response } = await dialog.showMessageBox(win, {
      message,
      detail: "Your changes will be lost if you don't save them.",
      type: "warning",
      buttons: ["Save", "Don't Save", "Cancel"],
      defaultId: 0,
    })

    // What button did the user select?
    const userSelectedSave = response == 0
    const userSelectedDontSave = response == 1
    const userSelectedCancel = response == 2

    if (userSelectedSave) {

      // User selected "Save"...

      // If doc is new, show "Save As" flow
      // Else just save.
      if (outgoingDocIsNewDoc) {

        // "Save As" prompt

        const { filePath, canceled } = await dialog.showSaveDialog(window, {
          defaultPath: `${project.directory}/Untitled.md`
        })

        if (canceled) {

          // Forward original action, 
          // with 'cancelled' saveOutcome
          store.dispatch({ ...action, saveOutcome: "cancelled" }, win)

        } else {

          // Save file
          await writeFile(filePath, action.outgoingDocData, 'utf8')

          // Then forward the original action, 
          // along with save outcome
          store.dispatch({ ...action, saveOutcome: "saved" }, win)
        }

      } else {

        try {

          // Try to save the doc. 
          await writeFile(action.outgoingDoc.path, action.outgoingDocData, 'utf8')

          // If save is successful, forward the original action
          // along with save outcome.
          store.dispatch({ ...action, saveOutcome: "saved" }, win)

        } catch (err) {

          // If save is unsuccessful, forward the original action
          // along with save outcome.
          // This shouldn't happen, but we catch it just in case.
          store.dispatch({ ...action, saveOutcome: "failed" }, win)

        }
      }

    } else if (userSelectedDontSave) {

      // User selected "Save"...
      // Just forward the original action.

      store.dispatch(action, win)

    } else if (userSelectedCancel) {

      // If user selected "Cancel"...
      // Do nothing...

    }
  }
}


/**
 * Return filename with incremented integer suffix. Used when moving files to avoid overwriting files of same name in destination directory, ala macOS. Looks to see if other files in same directory already have same name +_ integer suffix, and if so, increments.
 * Original:      /Users/Susan/Notes/ship.jpg
 * First copy:    /Users/Susan/Notes/ship 2.jpg
 * Second copy:   /Users/Susan/Notes/ship 3.jpg
 * @param {*} origName 
 */
function getIncrementedFileName(origPath) {

  const directory = path.dirname(origPath) // /Users/Susan/Notes
  const extension = path.extname(origPath) // .jpg
  const name = path.basename(origPath, extension) // ship

  const allFilesInDirectory = readdirSync(directory)

  let increment = 2

  // Basename in `path` is filename + extension. E.g. `ship.jpg`
  // https://nodejs.org/api/path.html#path_path_basename_path_ext
  let newBase = ''

  // Keep looping until we find incremented name that's not already used
  // Most of time this will be `ship 2.jpg`.
  while (true) {
    newBase = `${name} ${increment}${extension}` // ship 2.jpg
    const alreadyExists = allFilesInDirectory.includes(newBase)
    if (alreadyExists) {
      increment++
    } else {
      break
    }
  }

  // /Users/Susan/Notes/ship 2.jpg
  return path.format({
    dir: directory,
    base: newBase
  })
}