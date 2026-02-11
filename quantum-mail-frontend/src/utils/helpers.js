// src/utils/helpers.js
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const truncate = (str, length = 50) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getSecurityLevelInfo = (level) => {
  const levels = {
    1: {
      name: 'Quantum Secure (OTP)',
      description: 'Highest security using One-Time Pad encryption',
      color: 'green',
      icon: 'lock',
    },
    2: {
      name: 'Quantum-aided AES',
      description: 'Strong security with quantum key distribution',
      color: 'blue',
      icon: 'lock',
    },
    3: {
      name: 'PQC Hybrid',
      description: 'Post-quantum cryptography for future-proof security',
      color: 'purple',
      icon: 'shield',
    },
    4: {
      name: 'No Quantum Security',
      description: 'Standard encryption without quantum protection',
      color: 'gray',
      icon: 'unlock',
    },
  };
  
  return levels[level] || levels[4];
};