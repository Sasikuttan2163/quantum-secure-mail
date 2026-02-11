// electron/main.js
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, safeStorage } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipc-handlers');

let mainWindow;
let tray;

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#1f2937',
    show: false,
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
  
  // Create system tray
  createTray();
  
  // Setup IPC handlers
  setupIpcHandlers(ipcMain, mainWindow);
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Email', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new-email') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('menu-action', 'settings') },
        { type: 'separator' },
        { role: 'quit' }
      ]
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
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Key Manager', accelerator: 'CmdOrCtrl+K', click: () => mainWindow.webContents.send('menu-action', 'key-manager') },
        { label: 'Security Dashboard', click: () => mainWindow.webContents.send('menu-action', 'security-dashboard') },
        { type: 'separator' },
        { label: 'Sync Keys', accelerator: 'F5', click: () => mainWindow.webContents.send('menu-action', 'sync-keys') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About QuMail', click: () => mainWindow.webContents.send('menu-action', 'about') },
        { label: 'Documentation', click: () => mainWindow.webContents.send('menu-action', 'docs') },
        { type: 'separator' },
        { label: 'Check for Updates...', click: () => mainWindow.webContents.send('menu-action', 'updates') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  // Create tray icon (you would need to provide actual icon)
  const iconPath = path.join(__dirname, '../public/tray-icon.png');
  
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    
    const contextMenu = Menu.buildFromTemplate([
      { label: 'QuMail', enabled: false },
      { type: 'separator' },
      { label: 'Open QuMail', click: () => mainWindow.show() },
      { label: 'Compose New Email', click: () => {
        mainWindow.show();
        mainWindow.webContents.send('menu-action', 'new-email');
      }},
      { type: 'separator' },
      { label: 'Sync Keys', click: () => mainWindow.webContents.send('menu-action', 'sync-keys') },
      { label: 'Status: Connected', enabled: false },
      { type: 'separator' },
      { label: 'Settings', click: () => {
        mainWindow.show();
        mainWindow.webContents.send('menu-action', 'settings');
      }},
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setToolTip('QuMail - Quantum Secure Email');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
  } catch (error) {
    console.log('Tray creation skipped:', error.message);
  }
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});