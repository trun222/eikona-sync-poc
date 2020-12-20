'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog, ipcRenderer } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path';
import Rsync from 'rsync';
import { ACTIONS } from './util/ACTIONS.enum';
  
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

// Events that are being listened to on the back-end
ipcMain.on(ACTIONS.ACTION_RECEIVER, (event: any, data: any) => {
  let rsyncPID;

  switch (data.ACTION) {
    case ACTIONS.SYNC_START:
      rsyncPID = handleSyncStart(event, data);
      break;
    case ACTIONS.SYNC_KILL:
      handleSyncKill(rsyncPID);
      break;
    case ACTIONS.DIRECTORY_OPEN:
      handleDirectoryOpen(event, data.args.type);
      break;
  }
});

function handleDirectoryOpen(event: any, type: string) {
  dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory']
  }).then(result => {
    event.sender.send(ACTIONS.ACTION_RECEIVER,
      {
        ACTION: ACTIONS.DIRECTORY_SELECTED,
        result: {
          type,
          data: result.filePaths[0] + '/'
        }
      }
    );
  }).catch(err => {
    console.log(err)
  })
}

// TODO: Kind of dangerous. Probably best to set allowed paths/routes
function initializeRsync(args: any) {
  return new Rsync()
    .flags('avz')
    .progress()
    .source(args.syncPath)
    .destination(args.outputPath);
}

function executeRsync(rsync: any, event: any) {
  return rsync.execute(
    (error: any, code: any, cmd: any) => {
      event.sender.send(ACTIONS.ACTION_RECEIVER,
        {
          ACTION: ACTIONS.SYNC_COMPLETE,
        }
      );
    }, (data: any) => {
      event.sender.send(ACTIONS.ACTION_RECEIVER,
        {
          ACTION: ACTIONS.SYNC_INPROGRESS,
          result: {
            data: data.toString()
          }
        }
      );
    }, (data: any) => {
        // Handle Errors
    }
  );
}

function handleSyncStart(event: any, data: any) {
  const rsync = initializeRsync(data.args); 
  const rsyncPID = executeRsync(rsync, event);
  return rsyncPID;
}

const quitting = (rsyncPID: any) => {
  if (rsyncPID) {
    rsyncPID.kill();
  }
  process.exit();
}

function handleSyncKill(rsyncPID: any) {
  quitting(rsyncPID);
  // Other window events that require shutting down the connection
  process.on("SIGINT", quitting);
  process.on("SIGTERM", quitting);
  process.on("exit", quitting); 
}

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
