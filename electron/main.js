// Electron main process for Book Page Converter Desktop App
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow = null;
let serverProcess = null;

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Server configuration
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

/**
 * Start Express server in a child process
 */
function startServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '..', 'server', '_core', 'index.ts');
    
    // Use ts-node in development, compiled JS in production
    const command = isDev ? 'ts-node' : 'node';
    const args = isDev ? [serverScript] : [serverScript.replace('.ts', '.js')];
    
    console.log(`[Electron] Starting server: ${command} ${args.join(' ')}`);
    
    serverProcess = spawn(command, args, {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: isDev ? 'development' : 'production',
        PORT: SERVER_PORT.toString(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    serverProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`[Server] ${message}`);
      
      // Resolve when server is ready
      if (message.includes('Server running')) {
        resolve();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data.toString()}`);
    });
    
    serverProcess.on('error', (error) => {
      console.error('[Server] Failed to start:', error);
      reject(error);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`[Server] Process exited with code ${code}`);
      serverProcess = null;
    });
    
    // Timeout if server doesn't start within 30 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        resolve(); // Proceed anyway
      }
    }, 30000);
  });
}

/**
 * Stop Express server
 */
function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    console.log('[Electron] Stopping server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

/**
 * Create the main application window
 */
async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Book Page Converter',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready
  });
  
  // Load the app
  try {
    await mainWindow.loadURL(SERVER_URL);
  } catch (error) {
    console.error('[Electron] Failed to load URL:', error);
    dialog.showErrorBox(
      'Failed to Start',
      'Could not connect to the application server. Please try restarting the app.'
    );
    app.quit();
    return;
  }
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  
  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Create application menu
  createMenu();
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-project');
          },
        },
        { type: 'separator' },
        {
          label: 'Import Images',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'] },
              ],
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-import-images', result.filePaths);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Book Page Converter',
              message: 'Book Page Converter',
              detail: 'Desktop application for converting book page images to text using OCR.\n\nVersion: 2.0.0\nPowered by PaddleOCR',
            });
          },
        },
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/rstamps01/image-to-text-app');
          },
        },
      ],
    },
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC Handlers
 */

// Handle file selection from renderer
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'] },
    ],
  });
  
  return result.canceled ? [] : result.filePaths;
});

// Handle export file save location
ipcMain.handle('save-export', async (event, defaultFilename) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFilename,
    filters: [
      { name: 'PDF Document', extensions: ['pdf'] },
      { name: 'Word Document', extensions: ['docx'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text File', extensions: ['txt'] },
    ],
  });
  
  return result.canceled ? null : result.filePath;
});

// Handle showing message boxes
ipcMain.handle('show-message', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

/**
 * App lifecycle events
 */

// App ready - start server and create window
app.whenReady().then(async () => {
  try {
    console.log('[Electron] App ready, starting server...');
    await startServer();
    console.log('[Electron] Server started, creating window...');
    await createWindow();
  } catch (error) {
    console.error('[Electron] Startup failed:', error);
    dialog.showErrorBox(
      'Startup Failed',
      `Failed to start the application: ${error.message}`
    );
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

// Re-create window on macOS when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up on quit
app.on('before-quit', () => {
  stopServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
