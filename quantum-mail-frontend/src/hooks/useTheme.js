// src/hooks/useTheme.js
import { useEffect } from 'react';
import useStore from '../store/useStore';

const useTheme = () => {
  const { theme, setTheme } = useStore();

  useEffect(() => {
    const applyTheme = (themeName) => {
      if (themeName === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (themeName === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);

    // Listen for system preference changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return { theme, setTheme };
};

export default useTheme;