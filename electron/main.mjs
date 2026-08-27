import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import serve from 'electron-serve'

const loadApp = serve({ directory: 'dist' })

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 1000,
    minWidth: 960,
    minHeight: 720,
    backgroundColor: '#f4f0e7',
    title: 'Monster Wheel',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  loadApp(window)
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
