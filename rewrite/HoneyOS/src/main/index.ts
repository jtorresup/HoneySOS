import { app, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { exec } from 'child_process'

function openInGoogleChrome(url: string): void {
  const chromePaths: { [key: string]: string } = {
    win32: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
    darwin: '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome',
    linux: 'google-chrome' // or 'chromium-browser' depending on the system
  }

  const chromePath = chromePaths[process.platform]

  exec(`${chromePath} "${url}"`, (error) => {
    if (error) {
      console.error('Failed to launch Google Chrome:', error)
    }
  })
}

app.whenReady().then(() => {
  // Set app user model ID (needed for Windows notifications, taskbar grouping, etc.)
  electronApp.setAppUserModelId('com.electron')

  // Open your app in Google Chrome
  openInGoogleChrome('http://localhost:5174/')

  // Watch for developer shortcuts (like F12)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Example IPC listener
  ipcMain.on('ping', () => console.log('pong'))

  // macOS specific behavior
  app.on('activate', function () {
    // If no windows are open, do nothing (since we're not creating windows)
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
