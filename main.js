// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('node:path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const questVideoPath = '/storage/emulated/0/Movies';
  


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 300,
    minWidth: 300,
    //maxWidth: 300,
    height: 550,
    minHeight: 550,
    //maxHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      //webSecurity: false, // Keep this for Electron Fiddle
      nodeIntegration: true,  // Enable Node.js integration
      contextIsolation: true ,
    },
    alwaysOnTop: true,
    darkTheme: true
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.setOpacity(0.95);
  nativeTheme.themeSource = 'dark';
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
    
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Handle IPC for getting the font path
ipcMain.handle('get-font-path', () => {
  return path.join(__dirname, 'static', 'font.ttf');
});

// Function to resolve adb path
function getAdbPath() {
  return require('@adb-installer/adb').path;
}
// Handle the isDeviceConnected event from the renderer process
ipcMain.handle('is-device-connected', async () => {
  return new Promise((resolve, reject) => {
      const adbPath = getAdbPath();
      console.log(`Using adb path: ${adbPath}`); // Debug output

      const adbProcess = spawn(adbPath, ['devices']);

      if (!adbProcess.stdout || !adbProcess.stderr) {
          return reject(new Error('Failed to spawn adb process.'));
      }

      let output = '';
      adbProcess.stdout.on('data', (data) => {
          console.log(`Received data: ${data}`); // Debug output
          output += data.toString();
      });

      adbProcess.stderr.on('data', (data) => {
          console.error(`Received error data: ${data}`); // Debug output
      });

      adbProcess.on('error', (err) => {
          console.error(`Failed to start adb process: ${err.message}`);
          reject(err);
      });

      adbProcess.on('close', (code) => {
          console.log(`adb process exited with code: ${code}`); // Debug output

          if (code !== 0) {
              return reject(new Error(`adb process exited with code ${code}`));
          }

          const deviceCount = output.split('\n').filter(line => line.trim() !== '' && !line.startsWith('List')).length;
          resolve(deviceCount === 1);
      });
  });
});

// Handle the transferFile event from the renderer process
ipcMain.handle('transfer-file', async (event, filePath) => {
  return new Promise((resolve, reject) => {
      const adbPath = getAdbPath();

      console.log(`Transferring file: ${filePath}`); // Debug output

      const adbProcess = spawn(adbPath, ['push', filePath, questVideoPath]);

      adbProcess.stdout.on('data', (data) => {
          console.log(`Received data: ${data}`); // Debug output
      });

      adbProcess.stderr.on('data', (data) => {
          console.error(`Received error data: ${data}`); // Debug output
      });

      adbProcess.on('error', (err) => {
          console.error(`Failed to start adb process: ${err.message}`);
          reject(err);
      });

      adbProcess.on('close', (code) => {
          console.log(`adb process exited with code: ${code}`); // Debug output

          if (code !== 0) {
              return reject(new Error(`adb process exited with code ${code}`));
          }

          resolve();
      });
  });
});
