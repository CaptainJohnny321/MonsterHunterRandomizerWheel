import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'

const serverPort = 3210

function startLocalServer() {
  const distPath = path.join(app.getAppPath(), 'dist')
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  }

  const server = http.createServer(async (request, response) => {
    try {
      const requestPath = decodeURIComponent(new URL(request.url ?? '/', `http://127.0.0.1:${serverPort}`).pathname)
      const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1)
      const filePath = path.resolve(distPath, relativePath)

      if (!filePath.startsWith(`${distPath}${path.sep}`)) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      const fileInfo = await stat(filePath)
      if (!fileInfo.isFile()) throw new Error('Not a file')
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream' })
      createReadStream(filePath).pipe(response)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(serverPort, '127.0.0.1', () => resolve(server))
  })
}

async function createWindow() {
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

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('?overlay=1')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          alwaysOnTop: true,
          minimizable: false,
          autoHideMenuBar: true,
          title: 'Monster Hunter Randomizer - Streamer Overlay',
        },
      }
    }
    return { action: 'deny' }
  })

  await window.loadURL(`http://127.0.0.1:${serverPort}/`)
}

app.whenReady().then(async () => {
  await startLocalServer()
  await createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
