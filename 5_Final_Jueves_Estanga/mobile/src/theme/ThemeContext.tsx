import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from './colors';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  champagne: string;
  primary: string;
  primaryText: string;
  text: string;
  subtext: string;
  sand: string;
  border: string;
  accent: string;
  accentLight: string;
  divider: string;
  cardHighlight: string;
  inputBg: string;
  inputBorder: string;
  isDark: boolean;
}

export const lightTheme: ThemeColors = {
  background: '#F2F8FC', // Atlantic daylight mist
  surface: '#FFFFFF',
  card: '#FFFFFF',
  champagne: '#D97706', // Warm amber gold
  primary: '#0284C7', // Vivid coastal blue
  primaryText: '#FFFFFF',
  text: '#0F172A', // Rich slate midnight, maximum contrast & readability
  subtext: '#475569', // Clear secondary slate
  sand: '#E2E8F0',
  border: 'rgba(2, 132, 199, 0.15)', // Crystalline sea-glass hairline
  accent: '#0891B2', // Lagoon teal
  accentLight: '#ECFEFF',
  divider: 'rgba(14, 165, 233, 0.12)',
  cardHighlight: '#F0F9FF',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#040914', // Abyssal midnight sapphire
  surface: '#0B182B',    // Smoked ocean glass panel
  card: '#0B182B',
  champagne: '#FBBF24',  // Warm Golden Hour amber
  primary: '#0EA5E9',    // Electric Pacific Ocean
  primaryText: '#FFFFFF',// Crisp pure white
  text: '#F8FAFC',       // Bright high-contrast white
  subtext: '#94A3B8',    // Slate secondary
  sand: '#CBD5E1',
  border: 'rgba(56, 189, 248, 0.18)', // Bioluminescent ice border
  accent: '#22D3EE',     // Bioluminescent cyan highlight
  accentLight: 'rgba(34, 211, 238, 0.14)',
  divider: 'rgba(56, 189, 248, 0.12)',
  cardHighlight: 'rgba(34, 211, 238, 0.08)',
  inputBg: '#071120',
  inputBorder: 'rgba(56, 189, 248, 0.20)',
  isDark: true,
};

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('SR_THEME_MODE');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('SR_THEME_MODE', newMode);
    }
  };

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const isDark = mode === 'dark';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, isDark, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
