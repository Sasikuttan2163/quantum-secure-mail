// src/components/KeyManager/KeyManagerPanel.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Key, RefreshCw, Download, Trash2, Clock,
  CheckCircle, AlertCircle, XCircle, Loader2,
  TrendingUp, Database, Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../../store/useStore';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xs text-gray-500">{subtext}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

const KeyManagerPanel = () => {
  const { setShowKeyManager, keys, fetchKeys, requestNewKeys, isSyncing } = useStore();
  const [selectedTab, setSelectedTab] = useState('available');
  const [isRequesting, setIsRequesting] = useState(false);

  // Sample chart data
  const chartData = [
    { name: 'Mon', used: 45, retrieved: 60 },
    { name: 'Tue', used: 52, retrieved: 55 },
    { name: 'Wed', used: 48, retrieved: 70 },
    { name: 'Thu', used: 61, retrieved: 65 },
    { name: 'Fri', used: 55, retrieved: 80 },
    { name: 'Sat', used: 32, retrieved: 40 },
    { name: 'Sun', used: 28, retrieved: 45 },
  ];

  const handleSync = async () => {
    await fetchKeys();
  };

  const handleRequestKeys = async () => {
    setIsRequesting(true);
    await requestNewKeys(50);
    setIsRequesting(false);
  };

  const tabs = [
    { id: 'available', label: 'Available', count: keys.stats.availableCount },
    { id: 'inUse', label: 'In Use', count: keys.stats.inUseCount },
    { id: 'used', label: 'Used', count: keys.stats.usedCount },
    { id: 'expired', label: 'Expired', count: keys.stats.expiredCount },
  ];

  const displayedKeys = keys[selectedTab] || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
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
        className="w-full max-w-5xl bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quantum Key Management</h2>
              <p className="text-sm text-gray-500">Manage your quantum-distributed keys</p>
            </div>
          </div>
          <button
            onClick={() => setShowKeyManager(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Database}
              label="Available"
              value={keys.stats.availableCount}
              color="text-green-500"
              subtext="Ready to use"
            />
            <StatCard
              icon={Clock}
              label="In Use"
              value={keys.stats.inUseCount}
              color="text-blue-500"
              subtext="Active"
            />
            <StatCard
              icon={CheckCircle}
              label="Used"
              value={keys.stats.usedCount}
              color="text-gray-500"
              subtext="Consumed"
            />
            <StatCard
              icon={XCircle}
              label="Expired"
              value={keys.stats.expiredCount}
              color="text-red-500"
              subtext="Need cleanup"
            />
          </div>

          {/* Sync info */}
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Last Sync: {keys.stats.lastSync ? formatDate(keys.stats.lastSync) : 'Never'}
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>

          {/* Usage Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Key Usage Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="retrieved"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                    name="Retrieved"
                  />
                  <Line
                    type="monotone"
                    dataKey="used"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                    name="Used"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keys Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Key ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Retrieved</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No keys in this category
                      </td>
                    </tr>
                  ) : (
                    displayedKeys.slice(0, 10).map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <code className="text-sm font-mono text-gray-900 dark:text-white">{key.id}</code>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatSize(key.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(key.retrievedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            key.status === 'available' ? 'badge-success' :
                            key.status === 'inUse' ? 'badge-primary' :
                            key.status === 'expired' ? 'badge-danger' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {key.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleRequestKeys}
            disabled={isRequesting}
            className="btn-primary flex items-center gap-2"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Request New Keys
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear Expired
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KeyManagerPanel;