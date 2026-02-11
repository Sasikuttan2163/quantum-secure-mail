import { create } from 'zustand';
import { produce } from 'immer';

// Helper to use immer with zustand
const immer = (config) => (set, get, api) =>
  config(
    (partial, replace) => {
      const nextState =
        typeof partial === 'function'
          ? produce(partial)
          : partial;
      return set(nextState, replace);
    },
    get,
    api
  );

const useStore = create(
  immer((set, get) => ({
    // Auth state
    isAuthenticated: false,
    user: null,
    emailAccounts: [],
    
    // KM connection state
    kmConnection: null,
    kmStatus: 'disconnected', // disconnected, connecting, connected, error
    
    // Keys state
    keys: {
      available: [],
      inUse: [],
      used: [],
      expired: [],
      stats: {
        availableCount: 245,
        inUseCount: 12,
        usedCount: 1543,
        expiredCount: 87,
        lastSync: null,
      }
    },
    
    // Emails state
    emails: {
      inbox: [],
      sent: [],
      drafts: [],
      trash: [],
      starred: [],
    },
    selectedFolder: 'inbox',
    selectedEmail: null,
    searchQuery: '',
    securityFilter: 'all',
    
    // UI state
    theme: 'system', // light, dark, system
    sidebarCollapsed: false,
    showCompose: false,
    showSettings: false,
    showKeyManager: false,
    showSecurityDashboard: false,
    activeSettingsTab: 'general',
    composeData: null,
    
    // Loading states
    isLoading: false,
    isSyncing: false,
    isSending: false,
    
    // Notifications
    notifications: [],
    
    // Settings
    settings: {
      general: {
        startOnBoot: false,
        minimizeToTray: true,
        showNotifications: true,
        playSound: true,
        language: 'en',
        autoCheckMail: 5,
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
    },

    // Actions
    initializeApp: async () => {
      try {
        if (window.electronAPI) {
          const settings = await window.electronAPI.getSettings();
          if (settings) {
            set((state) => {
              state.settings = settings;
              state.theme = settings.appearance?.theme || 'system';
            });
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    },

    // Auth actions
    login: async (credentials) => {
      set((state) => { state.isLoading = true; });
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.authenticate(credentials);
          if (result.success) {
            set((state) => {
              state.isAuthenticated = true;
              state.user = result.user;
              state.isLoading = false;
            });
            return { success: true };
          }
          set((state) => { state.isLoading = false; });
          return { success: false, error: result.error };
        }
        
        // Fallback for development without Electron
        await new Promise(resolve => setTimeout(resolve, 1000));
        set((state) => {
          state.isAuthenticated = true;
          state.user = { email: credentials.email, name: 'User' };
          state.isLoading = false;
        });
        return { success: true };
      } catch (error) {
        set((state) => { state.isLoading = false; });
        return { success: false, error: error.message };
      }
    },

    logout: async () => {
      if (window.electronAPI) {
        await window.electronAPI.logout();
      }
      set((state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.kmConnection = null;
        state.kmStatus = 'disconnected';
        state.emails = { inbox: [], sent: [], drafts: [], trash: [], starred: [] };
        state.keys = {
          available: [],
          inUse: [],
          used: [],
          expired: [],
          stats: { availableCount: 0, inUseCount: 0, usedCount: 0, expiredCount: 0, lastSync: null }
        };
      });
    },

    // KM actions
    connectToKM: async (config) => {
      set((state) => { state.kmStatus = 'connecting'; });
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.connectToKM(config);
          if (result.success) {
            set((state) => {
              state.kmConnection = result.connection;
              state.kmStatus = 'connected';
              state.settings.quantum.primaryKm = config;
            });
            get().fetchKeys();
            return { success: true };
          }
        }
        
        // Fallback for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        set((state) => {
          state.kmConnection = { ...config, connected: true };
          state.kmStatus = 'connected';
        });
        return { success: true };
      } catch (error) {
        set((state) => { state.kmStatus = 'error'; });
        return { success: false, error: error.message };
      }
    },

    disconnectFromKM: async () => {
      if (window.electronAPI) {
        await window.electronAPI.disconnectFromKM();
      }
      set((state) => {
        state.kmConnection = null;
        state.kmStatus = 'disconnected';
      });
    },

    fetchKeys: async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getKeys({ count: 50 });
          const status = await window.electronAPI.getKeyStatus();
          
          if (result.success) {
            set((state) => {
              state.keys.available = result.keys.filter(k => k.status === 'available');
              state.keys.inUse = result.keys.filter(k => k.status === 'inUse');
              state.keys.stats = {
                availableCount: status.available,
                inUseCount: status.inUse,
                usedCount: status.used,
                expiredCount: status.expired,
                lastSync: new Date().toISOString(),
              };
            });
          }
        } else {
          // Mock data for development
          const mockKeys = generateMockKeys(20);
          set((state) => {
            state.keys.available = mockKeys.filter(k => k.status === 'available');
            state.keys.inUse = mockKeys.filter(k => k.status === 'inUse');
            state.keys.stats.lastSync = new Date().toISOString();
          });
        }
      } catch (error) {
        console.error('Failed to fetch keys:', error);
      }
    },

    requestNewKeys: async (count) => {
      set((state) => { state.isSyncing = true; });
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.requestNewKeys(count);
          if (result.success) {
            await get().fetchKeys();
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
          set((state) => {
            state.keys.stats.availableCount += count;
          });
        }
      } catch (error) {
        console.error('Failed to request keys:', error);
      } finally {
        set((state) => { state.isSyncing = false; });
      }
    },

    // Email actions
    fetchEmails: async (folder) => {
      set((state) => { state.isLoading = true; });
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.fetchEmails(folder);
          if (result.success) {
            set((state) => {
              state.emails[folder] = result.emails;
              state.isLoading = false;
            });
            return;
          }
        }
        
        // Fallback: generate mock data
        const mockEmails = generateMockEmails(folder);
        set((state) => {
          state.emails[folder] = mockEmails;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => { state.isLoading = false; });
        console.error('Failed to fetch emails:', error);
      }
    },

    sendEmail: async (emailData) => {
      set((state) => { state.isSending = true; });
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.sendEmail(emailData);
          if (result.success) {
            get().addNotification({
              type: 'success',
              title: 'Email Sent',
              message: `Your email to ${emailData.to} was sent securely.`,
              keyId: result.keyId,
            });
            set((state) => { state.isSending = false; });
            return { success: true };
          }
        }
        
        // Fallback for development
        await new Promise(resolve => setTimeout(resolve, 2000));
        get().addNotification({
          type: 'success',
          title: 'Email Sent',
          message: `Your email was sent securely.`,
        });
        set((state) => { state.isSending = false; });
        return { success: true };
      } catch (error) {
        set((state) => { state.isSending = false; });
        return { success: false, error: error.message };
      }
    },

    deleteEmail: async (emailId) => {
      const folder = get().selectedFolder;
      set((state) => {
        state.emails[folder] = state.emails[folder].filter(e => e.id !== emailId);
        if (state.selectedEmail?.id === emailId) {
          state.selectedEmail = null;
        }
      });
      
      if (window.electronAPI) {
        await window.electronAPI.deleteEmail(emailId);
      }
    },

    moveEmail: async (emailId, targetFolder) => {
      const sourceFolder = get().selectedFolder;
      const email = get().emails[sourceFolder].find(e => e.id === emailId);
      
      if (email) {
        set((state) => {
          state.emails[sourceFolder] = state.emails[sourceFolder].filter(e => e.id !== emailId);
          state.emails[targetFolder] = [email, ...state.emails[targetFolder]];
          if (state.selectedEmail?.id === emailId) {
            state.selectedEmail = null;
          }
        });
        
        if (window.electronAPI) {
          await window.electronAPI.moveEmail(emailId, targetFolder);
        }
      }
    },

    toggleStarred: (emailId) => {
      const folder = get().selectedFolder;
      set((state) => {
        const email = state.emails[folder].find(e => e.id === emailId);
        if (email) {
          email.starred = !email.starred;
        }
      });
    },

    markAsRead: (emailId) => {
      const folder = get().selectedFolder;
      set((state) => {
        const email = state.emails[folder].find(e => e.id === emailId);
        if (email) {
          email.read = true;
        }
      });
    },

    // UI actions
    setSelectedFolder: (folder) => {
      set((state) => {
        state.selectedFolder = folder;
        state.selectedEmail = null;
      });
      get().fetchEmails(folder);
    },

    setSelectedEmail: (email) => {
      set((state) => { state.selectedEmail = email; });
      if (email && !email.read) {
        get().markAsRead(email.id);
      }
    },

    setSearchQuery: (query) => {
      set((state) => { state.searchQuery = query; });
    },

    setSecurityFilter: (filter) => {
      set((state) => { state.securityFilter = filter; });
    },

    toggleSidebar: () => {
      set((state) => { state.sidebarCollapsed = !state.sidebarCollapsed; });
    },

    setShowCompose: (show, data = null) => {
      set((state) => {
        state.showCompose = show;
        state.composeData = data;
      });
    },

    setShowSettings: (show, tab = 'general') => {
      set((state) => {
        state.showSettings = show;
        state.activeSettingsTab = tab;
      });
    },

    setShowKeyManager: (show) => {
      set((state) => { state.showKeyManager = show; });
    },

    setShowSecurityDashboard: (show) => {
      set((state) => { state.showSecurityDashboard = show; });
    },

    setTheme: (theme) => {
      set((state) => {
        state.theme = theme;
        state.settings.appearance.theme = theme;
      });
    },

    // Settings actions
    updateSettings: async (section, values) => {
      set((state) => {
        state.settings[section] = { ...state.settings[section], ...values };
      });
      
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(get().settings);
      }
    },

    // Notification actions
    addNotification: (notification) => {
      const id = Date.now();
      set((state) => {
        state.notifications.push({ ...notification, id });
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        get().removeNotification(id);
      }, 5000);
    },

    removeNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      });
    },
  }))
);

// Mock data generators
function generateMockKeys(count) {
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

function generateMockEmails(folder) {
  const senders = [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Johnson', email: 'bob@company.org' },
    { name: 'Charlie Brown', email: 'charlie@mail.com' },
    { name: 'Diana Prince', email: 'diana@secure.net' },
    { name: 'Eve Wilson', email: 'eve@quantum.io' },
  ];
  
  const subjects = [
    'Re: Project Update - Q4 Planning Meeting',
    'Meeting Tomorrow at 3 PM',
    'Quarterly Report - Confidential',
    'Security Assessment Results',
    'New Feature Request for Dashboard',
    'Urgent: Action Required by EOD',
    'Weekly Newsletter - Tech Updates',
    'Conference Call Details for Friday',
  ];

  const bodies = [
    `<p>Hi there,</p>
<p>I wanted to follow up on our discussion from the last meeting. Here are the key points we need to address:</p>
<ul>
  <li>Budget allocation for Q4</li>
  <li>Team expansion plans</li>
  <li>New security protocols implementation</li>
</ul>
<p>Please let me know your thoughts.</p>
<p>Best regards,<br/>Alice</p>`,
    `<p>Hello,</p>
<p>Just a reminder about our meeting scheduled for tomorrow. We'll be discussing the new project timeline and resource allocation.</p>
<p>Please come prepared with your status updates.</p>
<p>Thanks,<br/>Bob</p>`,
  ];
  
  const emails = [];
  const count = folder === 'inbox' ? 25 : folder === 'sent' ? 15 : folder === 'drafts' ? 5 : 10;
  
  for (let i = 0; i < count; i++) {
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const securityLevel = [1, 1, 2, 2, 3, 4][Math.floor(Math.random() * 6)];
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    emails.push({
      id: `email-${folder}-${i}`,
      from: folder === 'sent' ? { name: 'Me', email: 'me@myemail.com' } : sender,
      to: folder === 'sent' ? sender : { name: 'Me', email: 'me@myemail.com' },
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
      body: bodies[Math.floor(Math.random() * bodies.length)],
      date: date.toISOString(),
      read: Math.random() > 0.3,
      starred: Math.random() > 0.85,
      securityLevel,
      keyId: securityLevel !== 4 ? `QK-${Date.now()}-${i}` : null,
      hasAttachments: Math.random() > 0.7,
      attachments: Math.random() > 0.7 ? [
        { name: 'document.pdf', size: 1024 * 1024 * 2, encrypted: securityLevel !== 4 },
        { name: 'data.xlsx', size: 1024 * 512, encrypted: securityLevel !== 4 },
      ].slice(0, Math.floor(Math.random() * 2) + 1) : [],
    });
  }
  
  return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default useStore;
