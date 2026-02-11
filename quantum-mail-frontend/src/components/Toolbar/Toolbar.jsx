// src/components/Toolbar/Toolbar.jsx
import React from 'react';
import {
  Edit, Reply, ReplyAll, Forward, Trash2, Archive,
  Star, MoreHorizontal, RefreshCw, Search, Filter
} from 'lucide-react';
import useStore from '../../store/useStore';

const Toolbar = () => {
  const {
    setShowCompose,
    selectedEmail,
    deleteEmail,
    toggleStarred,
    fetchEmails,
    selectedFolder,
    searchQuery,
    setSearchQuery,
    securityFilter,
    setSecurityFilter,
    isLoading,
  } = useStore();

  const handleCompose = () => {
    setShowCompose(true);
  };

  const handleReply = () => {
    if (selectedEmail) {
      setShowCompose(true, {
        type: 'reply',
        originalEmail: selectedEmail,
      });
    }
  };

  const handleReplyAll = () => {
    if (selectedEmail) {
      setShowCompose(true, {
        type: 'replyAll',
        originalEmail: selectedEmail,
      });
    }
  };

  const handleForward = () => {
    if (selectedEmail) {
      setShowCompose(true, {
        type: 'forward',
        originalEmail: selectedEmail,
      });
    }
  };

  const handleDelete = () => {
    if (selectedEmail) {
      deleteEmail(selectedEmail.id);
    }
  };

  const handleRefresh = () => {
    fetchEmails(selectedFolder);
  };

  return (
    <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Left: Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCompose}
          className="btn-primary flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          <span>Compose</span>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <button
          onClick={handleReply}
          disabled={!selectedEmail}
          className="btn-ghost p-2"
          title="Reply"
        >
          <Reply className="w-5 h-5" />
        </button>

        <button
          onClick={handleReplyAll}
          disabled={!selectedEmail}
          className="btn-ghost p-2"
          title="Reply All"
        >
          <ReplyAll className="w-5 h-5" />
        </button>

        <button
          onClick={handleForward}
          disabled={!selectedEmail}
          className="btn-ghost p-2"
          title="Forward"
        >
          <Forward className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <button
          onClick={handleDelete}
          disabled={!selectedEmail}
          className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => selectedEmail && toggleStarred(selectedEmail.id)}
          disabled={!selectedEmail}
          className="btn-ghost p-2"
          title="Star"
        >
          <Star className={`w-5 h-5 ${selectedEmail?.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </button>
      </div>

      {/* Right: Search and filter */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="input pl-10 pr-4 py-2 w-64"
          />
        </div>

        {/* Security filter */}
        <div className="relative">
          <select
            value={securityFilter}
            onChange={(e) => setSecurityFilter(e.target.value)}
            className="input pr-10 py-2 appearance-none cursor-pointer"
          >
            <option value="all">All Security Levels</option>
            <option value="1">🔒 Quantum OTP</option>
            <option value="2">🔐 Quantum-AES</option>
            <option value="3">🛡️ PQC Hybrid</option>
            <option value="4">🔓 No Quantum</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-ghost p-2"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;