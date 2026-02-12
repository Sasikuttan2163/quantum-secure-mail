// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox, Send, FileEdit, Trash2, Star, Key,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, Clock, AlertCircle
} from 'lucide-react';
import useStore from '../../store/useStore';

const Sidebar = ({ onLogout }) => {
  const {
    selectedFolder,
    setSelectedFolder,
    emails,
    sidebarCollapsed,
    toggleSidebar,
    setShowKeyManager,
    setShowSecurityDashboard,
    setShowSettings,
    keys,
  } = useStore();

  const mainFolders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.inbox.filter(e => !e.read).length },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'drafts', label: 'Drafts', icon: FileEdit, count: emails.drafts.length },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'starred', label: 'Starred', icon: Star },
  ];

  // const quantumItems = [
  //   { id: 'available', label: 'Available', count: keys.stats.availableCount, color: 'text-green-500' },
  //   { id: 'used', label: 'Used', count: keys.stats.usedCount, color: 'text-gray-500' },
  //   { id: 'expired', label: 'Expired', count: keys.stats.expiredCount, color: 'text-red-500' },
  // ];

  return (
    <motion.div
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Main folders */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {mainFolders.map((folder) => {
            const Icon = folder.icon;
            const isActive = selectedFolder === folder.id;
            
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full sidebar-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? folder.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{folder.label}</span>
                    {folder.count > 0 && (
                      <span className="badge-primary">{folder.count}</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
        <button
          onClick={() => setShowSettings(true)}
          className="w-full sidebar-item"
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 text-left">Settings</span>}
        </button>
        
        <button
          onClick={onLogout}
          className="w-full sidebar-item text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;