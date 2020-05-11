const { app, BrowserWindow } = require('electron')

function createWindow() {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Load the index.html of the app
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)