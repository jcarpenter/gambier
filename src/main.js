// External dependencies
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import * as fse from 'fs-extra'
import chokidar from 'chokidar'

// Bundled dependencies
import * as config from './config.js'
import * as mainMenu from './js/mainMenu.js'

// Not sure how this works with our packaged build...
// Probably want it for development, but skip for distribution.
// require('electron-reload')('**')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Set process variables
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true

function createWindow() {

  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
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
      preload: path.join(__dirname, 'js/preload.js')
    }

  })

  // Open the DevTools.
  win.webContents.openDevTools();

  // Load the index.html of the app
  win.loadFile(path.join(__dirname, 'index.html'))
 
  mainMenu.create()
}

app.whenReady().then(createWindow)


// Objects

function File(name, path, created, modified, type = 'file') {
  this.name = name
  this.path = path
  this.created = created
  this.modified = modified
  this.type = type
}

function Directory(name, path, type = 'directory', children = []) {
  this.name = name
  this.path = path
  this.type = type
  this.children = children
}

// Functions

async function getDirectory(directoryObject) {

  let directoryPath = directoryObject.path

  let contents = await fse.readdir(directoryPath, { withFileTypes: true })

  // Remove .DS_Store files
  contents = contents.filter((c) => c.name !== '.DS_Store')

  for (let c of contents) {
    if (c.isDirectory()) {
      const subPath = path.join(directoryPath, c.name)
      const subDir = new Directory(c.name, subPath, 'directory')
      const subDirContents = await getDirectory(subDir)
      const hasFilesWeCareAbout = subDirContents.children.find((s) => s.name.includes('.md')) == undefined ? false : true
      if (hasFilesWeCareAbout)
        directoryObject.children.push(subDirContents)
    } else if (c.name.includes('.md')) {
      const filePath = path.join(directoryPath, c.name)
      const stats = await fse.stat(filePath)
      const created = stats.birthtime.toISOString()
      const modified = stats.mtime.toISOString()
      let file = new File(c.name, filePath, created, modified, 'file')
      directoryObject.children.push(file)
    }
  }

  return directoryObject
}



// Main
ipcMain.handle('checkIfFileExists', async (event, filepath) => {
  return await fse.pathExists(filepath)
})


// Interprocess commands

ipcMain.on('loadFile', async (event, fileName, encoding) => {

  let file = await fse.readFile(path.join(__dirname, fileName), 'utf8')

  // Send result back to renderer process
  win.webContents.send('fileFromMain', file);
})

ipcMain.on('checkIfPathExists', async (event, filepath) => {

  const exists = await fse.pathExists(filepath)
  win.webContents.send('ifPathExists', { path: filepath, exists: exists });
})

ipcMain.on('readDirectory', async (event, directoryPath) => {

  let directoryName = directoryPath.substring(directoryPath.lastIndexOf('/') + 1)
  let topLevelDirectory = new Directory(directoryName, directoryPath, 'directory')
  let contents = await getDirectory(topLevelDirectory)

  win.webContents.send('directoryContents', contents);
})

ipcMain.on('watchProjectDirectory', async (event) => {
  const watcher = chokidar.watch('file, dir, glob, or array', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });
})
