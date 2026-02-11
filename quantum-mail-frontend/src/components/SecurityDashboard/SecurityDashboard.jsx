// src/components/SecurityDashboard/SecurityDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  X, Shield, TrendingUp, AlertTriangle, CheckCircle,
  Lock, Key, Clock, Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import useStore from '../../store/useStore';

const SecurityDashboard = () => {
  const { setShowSecurityDashboard, keys, kmStatus } = useStore();

  // Security distribution data
  const securityDistribution = [
    { name: 'Quantum OTP', value: 45, color: '#10B981' },
    { name: 'Quantum-AES', value: 35, color: '#3B82F6' },
    { name: 'PQC Hybrid', value: 15, color: '#8B5CF6' },
    { name: 'No Quantum', value: 5, color: '#6B7280' },
  ];

  // Weekly email data
  const weeklyData = [
    { day: 'Mon', secure: 24, standard: 3 },
    { day: 'Tue', secure: 31, standard: 5 },
    { day: 'Wed', secure: 28, standard: 2 },
    { day: 'Thu', secure: 35, standard: 4 },
    { day: 'Fri', secure: 42, standard: 6 },
    { day: 'Sat', secure: 15, standard: 2 },
    { day: 'Sun', secure: 12, standard: 1 },
  ];

  // Security events
  const securityEvents = [
    { type: 'success', message: 'All systems operational', time: 'Now' },
    { type: 'warning', message: '3 keys expiring in next 24 hours', time: '2h ago' },
    { type: 'success', message: 'KM connection stable', time: '3h ago' },
    { type: 'success', message: 'No decryption failures', time: 'Today' },
    { type: 'info', message: '50 new keys retrieved', time: '5h ago' },
  ];

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
        className="w-full max-w-6xl bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Analytics</h2>
              <p className="text-sm text-gray-500">Overview of your quantum security status</p>
            </div>
          </div>
          <button
            onClick={() => setShowSecurityDashboard(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                  <p className="text-sm text-gray-500">Secure emails this week</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from last week</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">98.5%</p>
                  <p className="text-sm text-gray-500">Encryption success rate</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Excellent</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{keys.stats.availableCount}</p>
                  <p className="text-sm text-gray-500">Available quantum keys</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-purple-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Last sync: 2 min ago</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0.3s</p>
                  <p className="text-sm text-gray-500">Avg key retrieval time</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Emails by Security Level (Last 30 Days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {securityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Weekly Email Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="secure" name="Quantum Secure" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="standard" name="Standard" fill="#6B7280" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Security Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security Events
            </h3>
            <div className="space-y-3">
              {securityEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  {event.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {event.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                  {event.type === 'info' && <Shield className="w-5 h-5 text-blue-500" />}
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{event.message}</span>
                  <span className="text-sm text-gray-500">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button className="btn-secondary">Export Report (PDF)</button>
          <button className="btn-secondary">Export Data (JSON)</button>
          <button
            onClick={() => setShowSecurityDashboard(false)}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityDashboard;