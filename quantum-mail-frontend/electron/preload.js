// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,
  
  // Secure storage
  secureStore: (key, value) => ipcRenderer.invoke('secure-store', key, value),
  secureRetrieve: (key) => ipcRenderer.invoke('secure-retrieve', key),
  secureDelete: (key) => ipcRenderer.invoke('secure-delete', key),
  
  // Email operations
  sendEmail: (emailData) => ipcRenderer.invoke('send-email', emailData),
  fetchEmails: (folder) => ipcRenderer.invoke('fetch-emails', folder),
  decryptEmail: (emailId, folder) => ipcRenderer.invoke('decrypt-email', emailId, folder),
  deleteEmail: (emailId) => ipcRenderer.invoke('delete-email', emailId),
  moveEmail: (emailId, folder) => ipcRenderer.invoke('move-email', emailId, folder),
  
  // Key Manager operations
  connectToKM: (config) => ipcRenderer.invoke('km-connect', config),
  disconnectFromKM: () => ipcRenderer.invoke('km-disconnect'),
  getKeys: (params) => ipcRenderer.invoke('km-get-keys', params),
  requestNewKeys: (count) => ipcRenderer.invoke('km-request-keys', count),
  getKeyStatus: () => ipcRenderer.invoke('km-key-status'),
  
  // Encryption operations
  encrypt: (data, keyId, level) => ipcRenderer.invoke('encrypt-data', data, keyId, level),
  decrypt: (data, keyId) => ipcRenderer.invoke('decrypt-data', data, keyId),
  
  // Authentication
  authenticate: (credentials) => ipcRenderer.invoke('authenticate', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  
  // Event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('menu-action');
  },
  onNewEmail: (callback) => {
    ipcRenderer.on('new-email-received', (event, email) => callback(email));
    return () => ipcRenderer.removeAllListeners('new-email-received');
  },
  onKeyUpdate: (callback) => {
    ipcRenderer.on('key-update', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('key-update');
  },
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, status) => callback(status));
    return () => ipcRenderer.removeAllListeners('connection-status');
  },
});

// Prevent drag and drop from loading files
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());