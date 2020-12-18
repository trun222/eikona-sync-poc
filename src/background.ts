'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog, ipcRenderer } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path';
import Rsync from 'rsync';
  
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

ipcMain.on('open-file-dialog', (event: any, arg: string) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory']
  }).then(result => {
    event.sender.send('selected-directory', {
      caller: arg,
      result: result.filePaths[0] + '/'
    });
  }).catch(err => {
    console.log(err)
  })
});

// Handle R-synce functionality
ipcMain.on('start-sync', (event: any, arg: string) => {
  var rsync = new Rsync()
      .flags('avz')
      .progress()
      .source('/Users/trun222/Nextcloud/')
      .destination('/Users/trun222/Eikona-Output');

  var rsyncPid = rsync.execute(
      function (error: any, code: any, cmd: any) {
      // Emit that the sync is completed
      event.sender.send('sync-complete');
          // we're done`
      }, function(data: any){
        // do things like parse progress
        console.log(data.toString());
        event.sender.send('sync-inprogress', data.toString());
      }, function(data: any) {
          // do things like parse error output
      }
  );

  var quitting = function() {
    if (rsyncPid) {
      rsyncPid.kill();
    }
    process.exit();
  }

  ipcMain.on('kill-sync', (event: any, arg: string) => {
    quitting();
  });

  process.on("SIGINT", quitting); // run signal handler on CTRL-C
  process.on("SIGTERM", quitting); // run signal handler on SIGTERM
  process.on("exit", quitting); 
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  // Make a rendered process for receiving background tasks from.
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
