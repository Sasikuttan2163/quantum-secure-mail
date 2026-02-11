// src/components/EmailList/EmailList.jsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Star, Paperclip, Lock, Shield, Unlock } from 'lucide-react';
import useStore from '../../store/useStore';

const SecurityIcon = ({ level }) => {
  switch (level) {
    case 1:
      return <Lock className="w-4 h-4 text-green-500" title="Quantum Secure (OTP)" />;
    case 2:
      return <Lock className="w-4 h-4 text-blue-500" title="Quantum-aided AES" />;
    case 3:
      return <Shield className="w-4 h-4 text-purple-500" title="PQC Hybrid" />;
    case 4:
    default:
      return <Unlock className="w-4 h-4 text-gray-400" title="No Quantum Security" />;
  }
};

const SecurityLabel = ({ level }) => {
  const labels = {
    1: { text: 'Quantum Secure (OTP)', color: 'text-green-600 dark:text-green-400' },
    2: { text: 'Quantum-AES', color: 'text-blue-600 dark:text-blue-400' },
    3: { text: 'PQC Hybrid', color: 'text-purple-600 dark:text-purple-400' },
    4: { text: 'No Encryption', color: 'text-gray-500' },
  };
  const { text, color } = labels[level] || labels[4];
  return <span className={`text-xs ${color}`}>{text}</span>;
};

// Helper to safely extract sender name from email
const getSenderName = (from) => {
  if (!from) return 'Unknown';
  if (typeof from === 'object' && from.name) return from.name;
  if (typeof from === 'string') {
    // Parse "Name <email>" format
    const name = from.replace(/<.+?>/, '').trim();
    return name || from.split('@')[0] || 'Unknown';
  }
  return 'Unknown';
};

// Helper to safely extract sender email from email
const getSenderEmail = (from) => {
  if (!from) return '';
  if (typeof from === 'object' && from.email) return from.email;
  if (typeof from === 'string') {
    const match = from.match(/<(.+?)>/);
    return match ? match[1] : from;
  }
  return '';
};

const formatEmailDate = (dateString) => {
  try {
    if (!dateString) {
      return 'Unknown';
    }
    
    // Try to parse as ISO format first
    let date;
    try {
      date = parseISO(dateString);
    } catch {
      // If ISO parsing fails, try creating date directly
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Unknown';
  }
};

const EmailListItem = ({ email, isSelected, onClick }) => {
  const { toggleStarred } = useStore();

  const handleStarClick = (e) => {
    e.stopPropagation();
    toggleStarred(email.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={`
        px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer
        transition-colors duration-150
        ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
        ${!email.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox and security icon */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            onClick={(e) => e.stopPropagation()}
          />
          <SecurityIcon level={email.securityLevel} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-sm truncate ${!email.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {getSenderName(email.from)}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {email.hasAttachments && (
                <Paperclip className="w-4 h-4 text-gray-400" />
              )}
              <button
                onClick={handleStarClick}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <Star className={`w-4 h-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
              </button>
            </div>
          </div>
          
          <div className={`text-sm truncate mb-1 ${!email.read ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
            {email.subject}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <SecurityLabel level={email.securityLevel} />
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatEmailDate(email.date)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmailList = () => {
  const {
    emails,
    selectedFolder,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    securityFilter,
    isLoading,
  } = useStore();

  const folderEmails = emails[selectedFolder] || [];

  const filteredEmails = useMemo(() => {
    let result = [...folderEmails];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(email => {
        const senderName = getSenderName(email.from).toLowerCase();
        const senderEmail = getSenderEmail(email.from).toLowerCase();
        return (
          email.subject.toLowerCase().includes(query) ||
          senderName.includes(query) ||
          senderEmail.includes(query) ||
          (email.preview && email.preview.toLowerCase().includes(query))
        );
      });
    }

    // Filter by security level
    if (securityFilter !== 'all') {
      result = result.filter(email => email.securityLevel === parseInt(securityFilter));
    }

    return result;
  }, [folderEmails, searchQuery, securityFilter]);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-1">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📭</div>
          <p>No emails found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence>
        {filteredEmails.map((email) => (
          <EmailListItem
            key={email.id}
            email={email}
            isSelected={selectedEmail?.id === email.id}
            onClick={() => setSelectedEmail(email)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default EmailList;