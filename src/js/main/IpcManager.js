import { app, BrowserWindow, clipboard, dialog, ipcMain, screen, shell, systemPreferences, nativeTheme, webFrame } from 'electron'
import { readFile, writeFile, renameSync, copyFileSync, existsSync, readdirSync } from 'fs-extra'
import path from 'path'
import { deleteFile, deleteFiles, selectProjectDirectoryFromDialog } from './actions/index.js'
import matter from 'gray-matter'
import { isValidHttpUrl } from '../shared/utils.js'
import getCitation from './getCitation.js'

export function init() {


  // -------- IPC: Renderer "sends" to Main -------- //

  ipcMain.on('saveImageFromClipboard', async (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    const project = global.state().projects.byId[win.projectId]
    const img = clipboard.readImage()
    const png = img.toPNG()
    await writeFile(`${project.directory}/test.png`, png)
  })

  ipcMain.on('showWindow', (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    win.show()
  })

  ipcMain.on('openUrlInDefaultBrowser', (evt, url) => {
    // Check if URL is valid.
    // Per https://stackoverflow.com/a/43467144
    // If no, try appending protocol and check again.
    // This handles cases like `apple.com`, where user
    // leaves off protocol for sake of brevity.
    // 
    let isValid = isValidHttpUrl(url)
    if (!isValid) {
      url = `http://${url}`
      isValid = isValidHttpUrl(url)
    }
    try {
      shell.openExternal(url)
    } catch (err) {
      console.log('Bar URL')
    }
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


  ipcMain.on('dispatch', async (evt, action) => {

    const win = BrowserWindow.fromWebContents(evt.sender)

    switch (action.type) {

      case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
        store.dispatch(await selectProjectDirectoryFromDialog(), win)
        break

      // The following actions all 
      case ('SAVE_PANEL_CHANGES_SO_WE_CAN_CLOSE_WINDOW'):
      case ('CLOSE_PANEL'):
      case ('OPEN_NEW_DOC_IN_PANEL'):
      case ('OPEN_DOC_IN_PANEL'): {

        const project = global.state().projects.byId[win.projectId]
        const panel = project.panels[action.panelIndex]

        if (panel.unsavedChanges) {
          promptToSaveChangesThenForwardAction(action, win)
        } else {
          // No unsaved changes. Forward the action.
          store.dispatch({ ...action, saveOutcome: 'noUnsavedChanges' }, win)
        }

        break
      }

      case ('SAVE_DOC'):
        saveDoc(action, win)
        break

      case ('SAVE_DOC_AS'):
        saveDocAs(action, win)
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

  ipcMain.handle('getBibliography', async (evt, bibliographyPath) => {
    const bibliography = await readFile(bibliographyPath, 'utf8')
    return bibliography
  })

  ipcMain.handle('getCitation', async (evt, bibliographyPath, citekey) => {
    return await getCitation(bibliographyPath, citekey)
  })

  // Return x/y coordinates of cursor inside sender window
  // Return null if cursor is outside the window bounds.
  ipcMain.handle('getCursorWindowPosition', (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    const point = screen.getCursorScreenPoint()
    const bounds = win.getBounds()
    const pos = {
      x: point.x - bounds.x,
      y: point.y - bounds.y
    }

    const cursorIsOutsideBounds = 
      pos.x < 0 || // left of window
      pos.y < 0 || // above window
      pos.x > bounds.width || // right of window
      pos.y > bounds.height // below window
    
    return cursorIsOutsideBounds ? null : pos
  })
  
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

  ipcMain.handle('getHTMLFromClipboard', (evt) => {
    return clipboard.readHTML()
  })

  ipcMain.handle('getFormatOfClipboard', (evt) => {
    return clipboard.availableFormats()
  })

  ipcMain.handle('moveOrCopyFileIntoProject', async (evt, filePath, folderPath, isCopy) => {

    let wasSuccess = false

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
          wasSuccess = true

        // Stop (Do nothing)
        case 1:
          wasSuccess = false

        // Replace
        case 2:
          if (isCopy) {
            copyFileSync(filePath, destinationPath)
          } else {
            renameSync(filePath, destinationPath)
          }
          wasSuccess = true
      }
    } else {
      if (isCopy) {
        copyFileSync(filePath, destinationPath)
      } else {
        renameSync(filePath, destinationPath)
      }
      wasSuccess = true
    }

    return {
      wasSuccess,
      destinationPath
    }
  })




}





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
 * Save the selected doc
 */
async function saveDoc(action, win) {
  try {

    // Try to write file
    await writeFile(action.doc.path, action.data, 'utf8')

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


function getTitleFromDoc(data) {
  const { data: frontMatter, content, isEmpty } = matter(data)

  // Get first header in content
  // https://regex101.com/r/oR5sec/1

  // Try to get title from front matter
  if (!isEmpty && frontMatter.title) return frontMatter.title

  // Try to get title from first header in content
  const firstHeaderInContent = content.match(/^#{1,6}[ |\t]*(.*)$/m)
  if (firstHeaderInContent) return firstHeaderInContent[1]

  // Try to get title from first 1-3 words of the doc
  // Demo: https://regex101.com/r/QmWS6c/1
  let firstWords = content.match(/^(\w+\s?){1,3}/)[0]
  if (firstWords) {
    // If last character is whitespace, trim it
    firstWords = firstWords.replace(/\s$/, '')
    return firstWords
  }

  // Else, return 'Untitled'
  return 'Untitled'

}


/**
 * Show 'Save As' dialog
 */
async function saveDocAs(action, win) {

  const project = global.state().projects.byId[win.projectId]

  // Suggested path varies depending on whether doc is new.
  const defaultPath = action.isNewDoc ?
    `${project.directory}/${getTitleFromDoc(action.data)}.md` :
    action.doc.path

  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    defaultPath
  })

  if (canceled) {

    // Forward original action, 
    // with 'cancelled' saveOutcome
    store.dispatch({ ...action, saveOutcome: "cancelled" }, win)

  } else {

    try {

      // Try to write file
      await writeFile(filePath, action.data, 'utf8')

      // If save is successful, forward the original action
      // along with save outcome, and chosen save path.
      store.dispatch({
        ...action,
        saveOutcome: "saved",
        saveToPath: filePath
      }, win)

    } catch (err) {

      // If save is unsuccessful, forward the original action
      // along with save outcome.
      // This shouldn't happen, but we catch it just in case.
      store.dispatch({ ...action, saveOutcome: "failed" }, win)

    }
  }
}


/**
 * 
 * @param {*} action - With type, and assorted optional properties. 
 */
async function promptToSaveChangesThenForwardAction(action, win) {

  const project = global.state().projects.byId[win.projectId]

  // Prompt's wording depends on whether doc is new...
  const message = action.isNewDoc ?
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
    if (action.isNewDoc) {

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

    // User selected "Don't Save"...
    // Forward the original action,
    // along with save outcome.

    store.dispatch({ ...action, saveOutcome: "dontSave" }, win)

  } else if (userSelectedCancel) {

    // User selected "Cancel"...
    // Forward the original action,
    // along with save outcome.

    store.dispatch({ ...action, saveOutcome: "cancelled" }, win)

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