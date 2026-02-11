// src/components/TitleBar/TitleBar.jsx
import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import useStore from '../../store/useStore';

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { kmStatus, keys } = useStore();

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 drag-region">
      {/* Left: App icon and title */}
      <div className="flex items-center px-3 gap-2 no-drag">
        <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">Q</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QuMail</span>
      </div>

      {/* Center: Status indicators */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${kmStatus === 'connected' ? 'bg-green-500' : kmStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>{kmStatus === 'connected' ? 'KM Connected' : kmStatus === 'connecting' ? 'Connecting...' : 'KM Offline'}</span>
        </div>
        {kmStatus === 'connected' && (
          <div className="flex items-center gap-1.5">
            <span>Keys: {keys.stats.availableCount}</span>
          </div>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center no-drag">
        <button
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isMaximized ? (
            <Square className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors group"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;