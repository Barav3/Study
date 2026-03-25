const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Language Atlas',
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true,
      webSecurity: false
    }
  })
  
  const appPath = app.getAppPath()
  const indexPath = path.join(appPath, 'dist', 'index.html')
  win.loadFile(indexPath)
 // win.webContents.openDevTools()
  win.setMenuBarVisibility(false)
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
