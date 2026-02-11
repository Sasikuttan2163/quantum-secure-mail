// src/components/Common/NotificationCenter.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, XCircle, Info, Lock } from 'lucide-react';
import useStore from '../../store/useStore';

const NotificationCenter = () => {
  const { notifications, removeNotification } = useStore();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${getBgColor(notification.type)}`}
          >
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.message}
              </p>
              {notification.keyId && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <Lock className="w-3 h-3" />
                  <code>{notification.keyId}</code>
                </div>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 hover:bg-black/10 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;