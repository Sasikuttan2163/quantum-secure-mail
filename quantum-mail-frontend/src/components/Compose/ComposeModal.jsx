// src/components/Compose/ComposeModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Minus, Square, Send, Save, Trash2, Paperclip, Smile,
  Link, Bold, Italic, Underline, AlignLeft, Lock, Shield,
  Unlock, ChevronDown, Check, AlertCircle, Loader2
} from 'lucide-react';
import useStore from '../../store/useStore';

const SecurityLevelSelector = ({ value, onChange, recipientStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  const levels = [
    { value: 1, label: 'Quantum Secure (OTP)', icon: Lock, color: 'text-green-500', desc: 'Highest security, one-time use', recommended: true },
    { value: 2, label: 'Quantum-aided AES', icon: Lock, color: 'text-blue-500', desc: 'Strong security, reusable keys' },
    { value: 3, label: 'Post-Quantum Crypto (Hybrid)', icon: Shield, color: 'text-purple-500', desc: 'Future-proof encryption' },
    { value: 4, label: 'No Quantum Security', icon: Unlock, color: 'text-gray-400', desc: 'Standard encryption only' },
  ];

  const selected = levels.find(l => l.value === value) || levels[0];
  const Icon = selected.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${selected.color}`} />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">{selected.label}</p>
            <p className="text-xs text-gray-500">{selected.desc}</p>
          </div>
          {selected.recommended && (
            <span className="badge-success">Recommended</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {levels.map((level) => {
            const LevelIcon = level.icon;
            return (
              <button
                key={level.value}
                onClick={() => {
                  onChange(level.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${value === level.value ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                <LevelIcon className={`w-5 h-5 ${level.color}`} />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{level.label}</p>
                  <p className="text-xs text-gray-500">{level.desc}</p>
                </div>
                {level.recommended && (
                  <span className="badge-success text-xs">Recommended</span>
                )}
                {value === level.value && (
                  <Check className="w-5 h-5 text-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ComposeModal = () => {
  const { setShowCompose, composeData, sendEmail, isSending, keys, kmStatus } = useStore();
  
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [securityLevel, setSecurityLevel] = useState(2);
  const [attachments, setAttachments] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState(null); // 'quantum', 'maybe', 'no'

  useEffect(() => {
    if (composeData) {
      const { type, originalEmail } = composeData;
      
      if (type === 'reply' || type === 'replyAll') {
        setTo(originalEmail.from.email);
        setSubject(`Re: ${originalEmail.subject}`);
        setBody(`\n\n--- Original Message ---\n${originalEmail.body.replace(/<[^>]*>/g, '')}`);
      } else if (type === 'forward') {
        setSubject(`Fwd: ${originalEmail.subject}`);
        setBody(`\n\n--- Forwarded Message ---\n${originalEmail.body.replace(/<[^>]*>/g, '')}`);
      }
    }
  }, [composeData]);

  // Simulate recipient validation
  useEffect(() => {
    if (to && to.includes('@')) {
      setTimeout(() => {
        const status = Math.random() > 0.3 ? 'quantum' : Math.random() > 0.5 ? 'maybe' : 'no';
        setRecipientStatus(status);
      }, 500);
    } else {
      setRecipientStatus(null);
    }
  }, [to]);

  const handleAttach = async () => {
    if (window.electronAPI) {
      const files = await window.electronAPI.selectFile();
      if (files.length > 0) {
        setAttachments([...attachments, ...files]);
      }
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to || !subject) return;

    const emailData = {
      to,
      cc: showCc ? cc : '',
      bcc: showBcc ? bcc : '',
      subject,
      body,
      securityLevel,
      attachments,
    };

    const result = await sendEmail(emailData);
    if (result.success) {
      setShowCompose(false);
    }
  };

  const handleSaveDraft = () => {
    // Save as draft logic
    setShowCompose(false);
  };

  const handleDiscard = () => {
    setShowCompose(false);
  };

  const estimatedKeySize = Math.ceil((body.length + subject.length) / 100) * 1.5;

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
        className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h2 className="font-semibold text-gray-900 dark:text-white">New Message</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <Minus className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <Square className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={handleDiscard}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* To field */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 w-12">To:</label>
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input pr-10"
                  placeholder="recipient@example.com"
                />
                {recipientStatus && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {recipientStatus === 'quantum' && (
                      <Check className="w-5 h-5 text-green-500" title="Quantum-capable recipient" />
                    )}
                    {recipientStatus === 'maybe' && (
                      <AlertCircle className="w-5 h-5 text-yellow-500" title="May not have QuMail" />
                    )}
                    {recipientStatus === 'no' && (
                      <X className="w-5 h-5 text-red-500" title="Cannot establish quantum connection" />
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCc(!showCc)}
                className={`text-sm ${showCc ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Cc
              </button>
              <button
                onClick={() => setShowBcc(!showBcc)}
                className={`text-sm ${showBcc ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Bcc
              </button>
            </div>

            {/* Cc field */}
            {showCc && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 w-12">Cc:</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="input flex-1"
                  placeholder="cc@example.com"
                />
              </div>
            )}

            {/* Bcc field */}
            {showBcc && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 w-12">Bcc:</label>
                <input
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="input flex-1"
                  placeholder="bcc@example.com"
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 w-12">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input flex-1"
                placeholder="Email subject"
              />
            </div>

            {/* Security Level */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-primary-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Security Level</h3>
              </div>
              
              <SecurityLevelSelector
                value={securityLevel}
                onChange={setSecurityLevel}
                recipientStatus={recipientStatus}
              />

              <div className="mt-3 space-y-1 text-sm">
                {recipientStatus === 'quantum' && (
                  <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Recipient quantum-capable
                  </p>
                )}
                {kmStatus === 'connected' && keys.stats.availableCount > 0 && (
                  <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Quantum keys available
                  </p>
                )}
                {securityLevel !== 4 && (
                  <p className="text-gray-500 flex items-center gap-1">
                    Key Size Required: ~{estimatedKeySize.toFixed(1)} KB (estimated)
                  </p>
                )}
              </div>
            </div>

            {/* Editor toolbar */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Bold className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Italic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Underline className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <AlignLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Link className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleAttach}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-64 p-4 resize-none focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Compose your message here..."
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments ({attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAttach}
              className="btn-ghost flex items-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Attach Files
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
            <button
              onClick={handleSaveDraft}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !to || !subject}
              className="btn-primary flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ComposeModal;