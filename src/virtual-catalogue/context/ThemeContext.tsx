import React, { useContext } from 'react';
import { ThemeContext as MainThemeContext } from '../../context/ThemeContext';

export interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
  theme?: string;
  setTheme?: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Proxy ThemeProvider that leverages the unified main website ThemeContext.
 * Guarantees zero theme drift between Virtual Catalogue and the rest of the website.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(MainThemeContext);

  if (!context) {
    // Fallback if rendered outside main ThemeProvider in isolation
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      isDark,
      toggleDark: () => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark');
        }
      },
    };
  }

  return {
    isDark: context.resolvedTheme === 'dark',
    toggleDark: () => {
      context.setTheme(context.resolvedTheme === 'dark' ? 'light' : 'dark');
    },
    theme: context.theme,
    setTheme: context.setTheme,
  };
}
