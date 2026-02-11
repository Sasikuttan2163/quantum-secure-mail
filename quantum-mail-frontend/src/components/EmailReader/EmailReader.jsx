// src/components/EmailReader/EmailReader.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  X, Reply, ReplyAll, Forward, Trash2, Star, MoreHorizontal,
  Lock, Shield, Unlock, Paperclip, Download, Eye, ExternalLink,
  CheckCircle, Info, Copy, Loader2
} from 'lucide-react';
import useStore from '../../store/useStore';

// Helper function to safely format dates
const safeFormatDate = (dateString, formatString) => {
  try {
    if (!dateString) return 'Unknown';
    
    let date;
    try {
      date = parseISO(dateString);
    } catch {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Unknown';
  }
};

const SecurityBanner = ({ email }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  // Check if email is encrypted but not decrypted yet
  useEffect(() => {
    if (email.isEncrypted && !email.isDecrypted) {
      setIsDecrypting(true);
    } else {
      setIsDecrypting(false);
    }
  }, [email.isEncrypted, email.isDecrypted]);
  
  const securityInfo = {
    1: {
      icon: Lock,
      label: 'Quantum Secure Email (One-Time Pad)',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      iconColor: 'text-green-500',
    },
    2: {
      icon: Lock,
      label: 'Quantum-aided AES Encryption',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-500',
    },
    3: {
      icon: Shield,
      label: 'Post-Quantum Cryptography (Hybrid)',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      iconColor: 'text-purple-500',
    },
    4: {
      icon: Unlock,
      label: 'Standard Email (No Quantum Security)',
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      iconColor: 'text-gray-400',
    },
  };

  const info = securityInfo[email.securityLevel] || securityInfo[4];
  const Icon = info.icon;

  return (
    <div className={`rounded-lg border ${info.bg} ${info.border} p-4 mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${info.iconColor}`} />
          <div>
            <p className={`font-medium ${info.text}`}>{info.label}</p>
            {email.keyId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Key ID: {email.keyId}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {email.securityLevel !== 4 && !isDecrypting && email.isDecrypted && (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Decrypted</span>
            </div>
          )}
          {isDecrypting && (
            <div className="flex items-center gap-1 text-blue-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Decrypting...</span>
            </div>
          )}
          {email.securityLevel !== 4 && !email.isEncrypted && (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Verified</span>
            </div>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-white/50 dark:hover:bg-gray-700 rounded"
          >
            <Info className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-current/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Algorithm</p>
                <p className={info.text}>
                  {email.securityLevel === 1 ? 'One-Time Pad (XOR)' :
                   email.securityLevel === 2 ? 'AES-256-GCM' :
                   email.securityLevel === 3 ? 'Kyber + AES' : 'None'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Key Status</p>
                <p className={info.text}>
                  {email.securityLevel === 1 ? 'Consumed' : 
                   email.securityLevel !== 4 ? 'Active' : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Encryption Timestamp</p>
                <p className={info.text}>{safeFormatDate(email.date, 'PPpp')}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Integrity</p>
                <p className="text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Not Modified
                </p>
              </div>
            </div>
            {email.keyId && (
              <button
                onClick={() => navigator.clipboard.writeText(email.keyId)}
                className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Copy className="w-3 h-3" />
                Copy Key ID
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AttachmentItem = ({ attachment }) => {
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
        {attachment.encrypted && <Lock className="w-5 h-5 text-primary-500" />}
        {!attachment.encrypted && <Paperclip className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {attachment.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatSize(attachment.size)}
          {attachment.encrypted && ' • Encrypted'}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg" title="Download">
          <Download className="w-4 h-4 text-gray-500" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg" title="Open">
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

const EmailReader = () => {
  const { selectedEmail, setSelectedEmail, setShowCompose, deleteEmail, toggleStarred } = useStore();

  if (!selectedEmail) return null;
  
  // Helper to safely extract email sender info
  const getSenderInfo = () => {
    if (!selectedEmail.from) {
      return { name: 'Unknown', email: 'unknown@example.com', initial: '?' };
    }
    
    // If from is already an object with name/email
    if (typeof selectedEmail.from === 'object' && selectedEmail.from.name) {
      return {
        name: selectedEmail.from.name || 'Unknown',
        email: selectedEmail.from.email || 'unknown@example.com',
        initial: (selectedEmail.from.name || '?').charAt(0).toUpperCase()
      };
    }
    
    // If from is a string, parse it (fallback for old format)
    if (typeof selectedEmail.from === 'string') {
      const emailMatch = selectedEmail.from.match(/<(.+?)>/);
      const name = selectedEmail.from.replace(/<.+?>/, '').trim() || 
                   selectedEmail.from.split('@')[0];
      const email = emailMatch ? emailMatch[1] : selectedEmail.from;
      
      return {
        name,
        email,
        initial: name.charAt(0).toUpperCase()
      };
    }
    
    return { name: 'Unknown', email: 'unknown@example.com', initial: '?' };
  };
  
  const sender = getSenderInfo();

  const handleReply = () => {
    setShowCompose(true, { type: 'reply', originalEmail: selectedEmail });
  };

  const handleReplyAll = () => {
    setShowCompose(true, { type: 'replyAll', originalEmail: selectedEmail });
  };

  const handleForward = () => {
    setShowCompose(true, { type: 'forward', originalEmail: selectedEmail });
  };

  const handleDelete = () => {
    deleteEmail(selectedEmail.id);
    setSelectedEmail(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedEmail(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStarred(selectedEmail.id)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {selectedEmail.subject}
        </h1>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {sender.initial}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{sender.name}</p>
              <p className="text-gray-500 dark:text-gray-400">{sender.email}</p>
            </div>
          </div>
          <div className="ml-auto text-right text-gray-500 dark:text-gray-400">
            <p>{safeFormatDate(selectedEmail.date, 'MMMM d, yyyy')}</p>
            <p>{safeFormatDate(selectedEmail.date, 'h:mm a')}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <SecurityBanner email={selectedEmail} />

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
        />

        {/* Attachments */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-3">
              <Paperclip className="w-4 h-4" />
              Attachments ({selectedEmail.attachments.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedEmail.attachments.map((attachment, index) => (
                <AttachmentItem key={index} attachment={attachment} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <button onClick={handleReply} className="btn-secondary flex items-center gap-2">
          <Reply className="w-4 h-4" />
          Reply
        </button>
        <button onClick={handleReplyAll} className="btn-secondary flex items-center gap-2">
          <ReplyAll className="w-4 h-4" />
          Reply All
        </button>
        <button onClick={handleForward} className="btn-secondary flex items-center gap-2">
          <Forward className="w-4 h-4" />
          Forward
        </button>
        <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 ml-auto">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default EmailReader;