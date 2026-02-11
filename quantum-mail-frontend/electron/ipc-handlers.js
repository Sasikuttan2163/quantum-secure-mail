// electron/ipc-handlers.js
const { safeStorage, dialog, Notification, app } = require('electron');
const path = require('path');
const fs = require('fs');

// Simulated data storage (in real app, use proper database)
let storedData = new Map();
let kmConnection = null;
let emailAccounts = [];

function setupIpcHandlers(ipcMain, mainWindow) {
  // Window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  
  ipcMain.on('window-close', () => {
    mainWindow.close();
  });
  
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow.isMaximized();
  });
  
  // App info
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
  
  // Secure storage
  ipcMain.handle('secure-store', async (event, key, value) => {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(JSON.stringify(value));
        storedData.set(key, encrypted);
        return { success: true };
      }
      // Fallback for development
      storedData.set(key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('secure-retrieve', async (event, key) => {
    try {
      const data = storedData.get(key);
      if (!data) return null;
      
      if (safeStorage.isEncryptionAvailable() && Buffer.isBuffer(data)) {
        return JSON.parse(safeStorage.decryptString(data));
      }
      return data;
    } catch (error) {
      return null;
    }
  });
  
  ipcMain.handle('secure-delete', async (event, key) => {
    storedData.delete(key);
    return { success: true };
  });
  
  // Authentication
  ipcMain.handle('authenticate', async (event, credentials) => {
    // Simulate authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          resolve({
            success: true,
            user: {
              email: credentials.email,
              name: 'User',
            }
          });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 1000);
    });
  });
  
  ipcMain.handle('logout', async () => {
    kmConnection = null;
    return { success: true };
  });
  
  // Key Manager operations
  ipcMain.handle('km-connect', async (event, config) => {
    // Simulate KM connection
    return new Promise((resolve) => {
      setTimeout(() => {
        kmConnection = {
          endpoint: config.endpoint,
          saeId: config.saeId,
          connected: true,
          connectedAt: new Date().toISOString()
        };
        resolve({ success: true, connection: kmConnection });
      }, 1500);
    });
  });
  
  ipcMain.handle('km-disconnect', async () => {
    kmConnection = null;
    return { success: true };
  });
  
  ipcMain.handle('km-get-keys', async (event, params) => {
    // Return simulated quantum keys
    const keys = generateSimulatedKeys(params?.count || 10);
    return { success: true, keys };
  });
  
  ipcMain.handle('km-request-keys', async (event, count) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keys = generateSimulatedKeys(count);
        resolve({ success: true, keys });
      }, 2000);
    });
  });
  
  ipcMain.handle('km-key-status', async () => {
    return {
      available: 245,
      inUse: 12,
      used: 1543,
      expired: 87,
      lastSync: new Date().toISOString()
    };
  });
  
  // Email operations
  ipcMain.handle('fetch-emails', async (event, folder) => {
    // Return simulated emails
    const emails = generateSimulatedEmails(folder);
    return { success: true, emails };
  });
  
  ipcMain.handle('send-email', async (event, emailData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: `MSG-${Date.now()}`,
          keyId: emailData.securityLevel !== 4 ? `QK-${Date.now()}` : null
        });
      }, 2000);
    });
  });
  
  ipcMain.handle('delete-email', async (event, emailId) => {
    return { success: true };
  });
  
  ipcMain.handle('move-email', async (event, emailId, folder) => {
    return { success: true };
  });
  
  // Encryption
  ipcMain.handle('encrypt-data', async (event, data, keyId, level) => {
    // Simulate encryption
    return {
      success: true,
      encryptedData: Buffer.from(data).toString('base64'),
      keyId: keyId || `QK-${Date.now()}`
    };
  });
  
  ipcMain.handle('decrypt-data', async (event, data, keyId) => {
    // Simulate decryption
    return {
      success: true,
      decryptedData: Buffer.from(data, 'base64').toString('utf-8')
    };
  });
  
  // Settings
  ipcMain.handle('get-settings', async () => {
    return storedData.get('settings') || getDefaultSettings();
  });
  
  ipcMain.handle('save-settings', async (event, settings) => {
    storedData.set('settings', settings);
    return { success: true };
  });
  
  // File operations
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      return result.filePaths.map(filePath => ({
        path: filePath,
        name: path.basename(filePath),
        size: fs.statSync(filePath).size
      }));
    }
    return [];
  });
  
  ipcMain.handle('save-file', async (event, data, filename) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename
    });
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data);
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });
  
  // Notifications
  ipcMain.on('show-notification', (event, title, body) => {
    new Notification({ title, body }).show();
  });
}

// Helper functions
function generateSimulatedKeys(count) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push({
      id: `QK-${Date.now()}-${i.toString().padStart(3, '0')}`,
      size: [128, 256, 512, 1024][Math.floor(Math.random() * 4)] * 1024,
      retrievedAt: new Date().toISOString(),
      status: ['available', 'available', 'available', 'inUse'][Math.floor(Math.random() * 4)],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return keys;
}

function generateSimulatedEmails(folder) {
  const senders = [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Johnson', email: 'bob@company.org' },
    { name: 'Charlie Brown', email: 'charlie@mail.com' },
    { name: 'Diana Prince', email: 'diana@secure.net' },
    { name: 'Eve Wilson', email: 'eve@quantum.io' },
  ];
  
  const subjects = [
    'Re: Project Update',
    'Meeting Tomorrow',
    'Quarterly Report',
    'Security Assessment',
    'New Feature Request',
    'Urgent: Action Required',
    'Weekly Newsletter',
    'Conference Call Details',
  ];
  
  const emails = [];
  const count = folder === 'inbox' ? 25 : folder === 'sent' ? 15 : folder === 'drafts' ? 5 : 10;
  
  for (let i = 0; i < count; i++) {
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const securityLevel = [1, 2, 2, 3, 4][Math.floor(Math.random() * 5)];
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    emails.push({
      id: `email-${folder}-${i}`,
      from: folder === 'sent' ? { name: 'Me', email: 'me@myemail.com' } : sender,
      to: folder === 'sent' ? sender : { name: 'Me', email: 'me@myemail.com' },
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
      body: `<p>Hi there,</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
        <p>Best regards,<br>${sender.name}</p>`,
      date: date.toISOString(),
      read: Math.random() > 0.3,
      starred: Math.random() > 0.8,
      securityLevel,
      keyId: securityLevel !== 4 ? `QK-${Date.now()}-${i}` : null,
      hasAttachments: Math.random() > 0.7,
      attachments: Math.random() > 0.7 ? [
        { name: 'document.pdf', size: 1024 * 1024 * 2, encrypted: securityLevel !== 4 },
        { name: 'data.xlsx', size: 1024 * 512, encrypted: securityLevel !== 4 },
      ] : [],
    });
  }
  
  return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getDefaultSettings() {
  return {
    general: {
      startOnBoot: false,
      minimizeToTray: true,
      showNotifications: true,
      playSound: true,
      language: 'en',
    },
    security: {
      defaultSecurityLevel: 2,
      enforceQuantum: false,
      warnNonQuantum: true,
      blockNonQuantum: false,
      autoDeleteUsedKeys: true,
      warnLowKeys: true,
      lowKeyThreshold: 10,
      keyRefreshInterval: 30,
      maxKeyCache: 1000,
      encryptAttachments: true,
      scanAttachments: true,
      maxAttachmentSize: 25,
    },
    appearance: {
      theme: 'system',
      colorScheme: 'blue',
      uiFont: 'Inter',
      emailFont: 'Arial',
      fontSize: 'medium',
    },
    quantum: {
      primaryKm: {
        endpoint: '',
        saeId: '',
        apiKey: '',
      },
      backupKm: {
        enabled: false,
        endpoint: '',
        saeId: '',
      },
      connectionTimeout: 30,
      retryAttempts: 3,
      useTls13: true,
      verifySsl: true,
    },
  };
}

module.exports = { setupIpcHandlers };