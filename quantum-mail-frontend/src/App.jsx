// src/App.jsx
import React, { useEffect, useState } from 'react';
import { LoginScreen, MainDashboard } from './screens';
import useStore from './store/useStore';

function App() {
  const [appState, setAppState] = useState('login'); // login, main
  const { isAuthenticated, theme, initializeApp } = useStore();

  useEffect(() => {
    // Apply theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Initialize app
    const init = async () => {
      await initializeApp();
      setAppState(isAuthenticated ? 'main' : 'login');
    };

    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated && appState === 'login') {
      setAppState('main');
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setAppState('main');
  };

  const handleLogout = () => {
    setAppState('login');
  };

  if (appState === 'main') {
    return <MainDashboard onLogout={handleLogout} />;
  }
  
  return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}

export default App;