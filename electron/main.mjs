import path from 'node:path'
import { app, BrowserWindow } from 'electron'

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 1000,
    minWidth: 960,
    minHeight: 720,
    backgroundColor: '#f4f0e7',
    title: 'Monster Hunter Randomizer',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
