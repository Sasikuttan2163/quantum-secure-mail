// src/screens/MainDashboard.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import TitleBar from '../components/TitleBar/TitleBar';
import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import EmailList from '../components/EmailList/EmailList';
import EmailReader from '../components/EmailReader/EmailReader';
import ComposeModal from '../components/Compose/ComposeModal';
import KeyManagerPanel from '../components/KeyManager/KeyManagerPanel';
import SecurityDashboard from '../components/SecurityDashboard/SecurityDashboard';
import SettingsPanel from '../components/Settings/SettingsPanel';
import NotificationCenter from '../components/Common/NotificationCenter';

const MainDashboard = ({ onLogout }) => {
  const {
    selectedEmail,
    showCompose,
    showSettings,
    showKeyManager,
    showSecurityDashboard,
    sidebarCollapsed,
    fetchEmails,
    fetchKeys,
    selectedFolder,
  } = useStore();

  useEffect(() => {
    // Initial data fetch
    fetchEmails('inbox');
    fetchKeys();

    // Set up menu action listeners
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'new-email':
            useStore.getState().setShowCompose(true);
            break;
          case 'settings':
            useStore.getState().setShowSettings(true);
            break;
          case 'key-manager':
            useStore.getState().setShowKeyManager(true);
            break;
          case 'security-dashboard':
            useStore.getState().setShowSecurityDashboard(true);
            break;
          case 'sync-keys':
            useStore.getState().fetchKeys();
            break;
          default:
            break;
        }
      });

      return cleanup;
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onLogout={onLogout} />

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <Toolbar />

          {/* Email Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Email List */}
            <div className={`${selectedEmail ? 'w-2/5' : 'w-full'} border-r border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300`}>
              <EmailList />
            </div>

            {/* Email Reader */}
            <AnimatePresence>
              {selectedEmail && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-hidden"
                >
                  <EmailReader />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCompose && <ComposeModal />}
        {showSettings && <SettingsPanel />}
        {showKeyManager && <KeyManagerPanel />}
        {showSecurityDashboard && <SecurityDashboard />}
      </AnimatePresence>

      {/* Notifications */}
      <NotificationCenter />
    </div>
  );
};

export default MainDashboard;