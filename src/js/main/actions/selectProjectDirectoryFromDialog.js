import { BrowserWindow, dialog } from 'electron'

export default async function () {

  const win = BrowserWindow.getFocusedWindow()

  const selection = await dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  })

  if (!selection.canceled) {
    return { 
      type: 'SET_PROJECT_DIRECTORY', 
      directory: selection.filePaths[0] 
    }
  }
}