import { BrowserWindow, dialog } from 'electron'

export default async function () {

  const win = BrowserWindow.getFocusedWindow()

  const selection = await dialog.showOpenDialog(win, {
    title: 'Select Citations File',
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ]
  })

  if (!selection.canceled) {
    return { 
      type: 'SET_PROJECT_CITATIONS_FILE', 
      path: selection.filePaths[0] 
    }
  }
}