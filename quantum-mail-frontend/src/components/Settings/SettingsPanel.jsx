// src/components/Settings/SettingsPanel.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Settings, Mail, Shield, Key, Palette,
  Monitor, Moon, Sun, Save, RotateCcw, Check,
  Eye, EyeOff, Server, AlertCircle, Loader2
} from 'lucide-react';
import useStore from '../../store/useStore';

const SettingsPanel = () => {
  const {
    setShowSettings,
    activeSettingsTab,
    settings,
    updateSettings,
    theme,
    setTheme,
    connectToKM,
    kmStatus,
  } = useStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'quantum', label: 'Quantum', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const [activeTab, setActiveTab] = useState(activeSettingsTab);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings('general', localSettings.general);
    await updateSettings('security', localSettings.security);
    await updateSettings('appearance', localSettings.appearance);
    await updateSettings('quantum', localSettings.quantum);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleTestKMConnection = async () => {
    setIsTesting(true);
    await connectToKM(localSettings.quantum.primaryKm);
    setIsTesting(false);
  };

  const updateLocalSetting = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Application Preferences
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Start QuMail on system startup</span>
            <input
              type="checkbox"
              checked={localSettings.general.startOnBoot}
              onChange={(e) => updateLocalSetting('general', 'startOnBoot', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Minimize to system tray</span>
            <input
              type="checkbox"
              checked={localSettings.general.minimizeToTray}
              onChange={(e) => updateLocalSetting('general', 'minimizeToTray', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Show desktop notifications</span>
            <input
              type="checkbox"
              checked={localSettings.general.showNotifications}
              onChange={(e) => updateLocalSetting('general', 'showNotifications', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Play sound on new email</span>
            <input
              type="checkbox"
              checked={localSettings.general.playSound}
              onChange={(e) => updateLocalSetting('general', 'playSound', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Default Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Auto-check mail interval
            </label>
            <select
              value={localSettings.general.autoCheckMail}
              onChange={(e) => updateLocalSetting('general', 'autoCheckMail', parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>Every minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={10}>Every 10 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={0}>Manual only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Language
            </label>
            <select
              value={localSettings.general.language}
              onChange={(e) => updateLocalSetting('general', 'language', e.target.value)}
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Encryption Policies
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Default Security Level
            </label>
            <select
              value={localSettings.security.defaultSecurityLevel}
              onChange={(e) => updateLocalSetting('security', 'defaultSecurityLevel', parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>Quantum Secure (OTP)</option>
              <option value={2}>Quantum-aided AES</option>
              <option value={3}>PQC Hybrid</option>
              <option value={4}>No Quantum Security</option>
            </select>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Enforce quantum encryption for all emails</span>
            <input
              type="checkbox"
              checked={localSettings.security.enforceQuantum}
              onChange={(e) => updateLocalSetting('security', 'enforceQuantum', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Warn when sending to non-quantum recipients</span>
            <input
              type="checkbox"
              checked={localSettings.security.warnNonQuantum}
              onChange={(e) => updateLocalSetting('security', 'warnNonQuantum', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Block emails to non-quantum recipients</span>
            <input
              type="checkbox"
              checked={localSettings.security.blockNonQuantum}
              onChange={(e) => updateLocalSetting('security', 'blockNonQuantum', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Management
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Auto-delete used OTP keys</span>
            <input
              type="checkbox"
              checked={localSettings.security.autoDeleteUsedKeys}
              onChange={(e) => updateLocalSetting('security', 'autoDeleteUsedKeys', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Warn when available keys below threshold</span>
            <input
              type="checkbox"
              checked={localSettings.security.warnLowKeys}
              onChange={(e) => updateLocalSetting('security', 'warnLowKeys', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Low key warning threshold
            </label>
            <input
              type="number"
              value={localSettings.security.lowKeyThreshold}
              onChange={(e) => updateLocalSetting('security', 'lowKeyThreshold', parseInt(e.target.value))}
              className="input w-32"
              min={1}
              max={100}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Key refresh interval (minutes)
            </label>
            <select
              value={localSettings.security.keyRefreshInterval}
              onChange={(e) => updateLocalSetting('security', 'keyRefreshInterval', parseInt(e.target.value))}
              className="input"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Attachment Security
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Encrypt all attachments</span>
            <input
              type="checkbox"
              checked={localSettings.security.encryptAttachments}
              onChange={(e) => updateLocalSetting('security', 'encryptAttachments', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Maximum attachment size (MB)
            </label>
            <select
              value={localSettings.security.maxAttachmentSize}
              onChange={(e) => updateLocalSetting('security', 'maxAttachmentSize', parseInt(e.target.value))}
              className="input"
            >
              <option value={10}>10 MB</option>
              <option value={25}>25 MB</option>
              <option value={50}>50 MB</option>
              <option value={100}>100 MB</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuantumTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Primary Key Manager
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Endpoint URL
            </label>
            <input
              type="text"
              value={localSettings.quantum.primaryKm.endpoint}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                quantum: {
                  ...prev.quantum,
                  primaryKm: { ...prev.quantum.primaryKm, endpoint: e.target.value }
                }
              }))}
              className="input"
              placeholder="https://km.example.com/api/v1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              SAE ID
            </label>
            <input
              type="text"
              value={localSettings.quantum.primaryKm.saeId}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                quantum: {
                  ...prev.quantum,
                  primaryKm: { ...prev.quantum.primaryKm, saeId: e.target.value }
                }
              }))}
              className="input"
              placeholder="SAE_12345"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localSettings.quantum.primaryKm.apiKey}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  quantum: {
                    ...prev.quantum,
                    primaryKm: { ...prev.quantum.primaryKm, apiKey: e.target.value }
                  }
                }))}
                className="input pr-20"
                placeholder="••••••••••••••••"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              kmStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
              kmStatus === 'connecting' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                kmStatus === 'connected' ? 'bg-green-500' :
                kmStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="text-sm">
                {kmStatus === 'connected' ? 'Connected' :
                 kmStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleTestKMConnection}
              disabled={isTesting}
              className="btn-secondary flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Server className="w-4 h-4" />
              )}
              Test Connection
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Options
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Connection timeout (seconds)
            </label>
            <select
              value={localSettings.quantum.connectionTimeout}
              onChange={(e) => updateLocalSetting('quantum', 'connectionTimeout', parseInt(e.target.value))}
              className="input"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Retry attempts
            </label>
            <select
              value={localSettings.quantum.retryAttempts}
              onChange={(e) => updateLocalSetting('quantum', 'retryAttempts', parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Use TLS 1.3</span>
            <input
              type="checkbox"
              checked={localSettings.quantum.useTls13}
              onChange={(e) => updateLocalSetting('quantum', 'useTls13', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Verify SSL certificates</span>
            <input
              type="checkbox"
              checked={localSettings.quantum.verifySsl}
              onChange={(e) => updateLocalSetting('quantum', 'verifySsl', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <Sun className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
            {theme === 'light' && <Check className="w-5 h-5 text-primary-500" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
              <Moon className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
            {theme === 'dark' && <Check className="w-5 h-5 text-primary-500" />}
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-800 border border-gray-300 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
            {theme === 'system' && <Check className="w-5 h-5 text-primary-500" />}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Color Scheme
        </h3>
        <div className="flex gap-3">
          {['blue', 'purple', 'green', 'red', 'orange'].map((color) => (
            <button
              key={color}
              className={`w-10 h-10 rounded-full ${
                color === 'blue' ? 'bg-blue-500' :
                color === 'purple' ? 'bg-purple-500' :
                color === 'green' ? 'bg-green-500' :
                color === 'red' ? 'bg-red-500' :
                'bg-orange-500'
              } ${localSettings.appearance.colorScheme === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
              onClick={() => updateLocalSetting('appearance', 'colorScheme', color)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Font Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              UI Font
            </label>
            <select
              value={localSettings.appearance.uiFont}
              onChange={(e) => updateLocalSetting('appearance', 'uiFont', e.target.value)}
              className="input"
            >
              <option value="Inter">Inter</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Roboto">Roboto</option>
              <option value="system-ui">System Default</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Email Font
            </label>
            <select
              value={localSettings.appearance.emailFont}
              onChange={(e) => updateLocalSetting('appearance', 'emailFont', e.target.value)}
              className="input"
            >
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Font Size
            </label>
            <select
              value={localSettings.appearance.fontSize}
              onChange={(e) => updateLocalSetting('appearance', 'fontSize', e.target.value)}
              className="input"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p style={{ fontFamily: localSettings.appearance.emailFont }} className="text-gray-700 dark:text-gray-300">
            Sample email text with current settings. This is how your emails will appear.
          </p>
        </div>
      </div>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connected Accounts
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Gmail</p>
                <p className="text-sm text-gray-500">user@gmail.com</p>
              </div>
              <span className="badge-success">Default</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm">Edit</button>
              <button className="btn-ghost text-sm text-red-500">Remove</button>
            </div>
          </div>
        </div>
        <button className="mt-4 btn-secondary w-full">
          + Add Email Account
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'email':
        return renderEmailTab();
      case 'security':
        return renderSecurityTab();
      case 'quantum':
        return renderQuantumTab();
      case 'appearance':
        return renderAppearanceTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs */}
          <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button className="btn-ghost flex items-center gap-2 text-gray-500">
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPanel;