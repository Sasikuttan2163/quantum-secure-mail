// src/App.jsx
import React, { useEffect, useState } from 'react';
import { SplashScreen, LoginScreen, MainDashboard } from './screens';
import useStore from './store/useStore';

function App() {
  const [appState, setAppState] = useState('splash'); // splash, login, main
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
    // Initialize app and handle splash screen
    const init = async () => {
      await initializeApp();
      
      // Show splash for 2-3 seconds
      setTimeout(() => {
        setAppState(isAuthenticated ? 'main' : 'login');
      }, 2500);
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

  switch (appState) {
    case 'splash':
      return <SplashScreen />;
    case 'login':
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    case 'main':
      return <MainDashboard onLogout={handleLogout} />;
    default:
      return <SplashScreen />;
  }
}

export default App;