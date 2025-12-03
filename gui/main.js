const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Optional icon
    show: false // Don't show until ready
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for communication with renderer process
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-installer', async (event, options) => {
  try {
    // Import the FilePacker - resolve path relative to app root
    const appRoot = path.join(__dirname, '..');
    const FilePacker = require(path.join(appRoot, 'scripts', 'pack-files.js'));
    
    // Resolve output directory - convert relative paths to absolute
    let outputDir = options.outputDir || './dist';
    if (!path.isAbsolute(outputDir)) {
      outputDir = path.resolve(appRoot, outputDir);
    }
    
    const packer = new FilePacker({
      outputDir: outputDir,
      appName: options.appName || 'MyPackage',
      version: options.version || '1.0.0',
      includeVersion: options.includeVersion !== false,
      silentMode: options.silentMode || false,
      defaultExtractPath: options.extractPath || null
    });

    // Send progress updates
    const sendProgress = (message, percentage) => {
      event.sender.send('packaging-progress', { message, percentage });
    };

    sendProgress('Creating archive...', 20);

    await packer.packFiles({
      files: options.files || [],
      folders: options.folders || [],
      outputName: options.outputName
    });

    sendProgress('Packaging executable...', 80);
    sendProgress('Complete!', 100);

    // Get output file path
    const outputFileName = options.outputName || packer.generateOutputName();
    const exeFileName = outputFileName.endsWith('.exe') ? outputFileName : outputFileName + '.exe';
    const outputPath = path.join(outputDir, exeFileName);

    return {
      success: true,
      outputPath: outputPath,
      message: 'Installer created successfully!'
    };
  } catch (error) {
    console.error('Error creating installer:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create installer'
    };
  }
});

