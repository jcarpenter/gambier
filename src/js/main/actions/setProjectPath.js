import { BrowserWindow, dialog } from 'electron'

export default async function () {

  // console.log(BrowserWindow.getFocusedWindow())

  const win = BrowserWindow.getFocusedWindow()

  const selection = await dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  })

  if (!selection.canceled) {
    return { type: 'SET_PROJECTPATH_SUCCESS', path: selection.filePaths[0] }
  } else {
    return { type: 'SET_PROJECTPATH_FAIL' }
  }
}