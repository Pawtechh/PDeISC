import React, { createContext, useContext, useState, useEffect } from 'react';
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
  background: '#F8FAFC', // Crisp coastal daylight
  surface: '#FFFFFF',
  card: '#FFFFFF',
  champagne: '#B39129', // Deep refined champagne gold for light mode
  primary: '#0A66D4', // Deep vivid ocean blue
  primaryText: '#FFFFFF',
  text: '#0F172A', // Rich slate midnight, maximum contrast & readability
  subtext: '#475569', // Clear secondary slate
  sand: '#E2E8F0',
  border: '#E2E8F0', // Clean subtle border
  accent: '#0A66D4',
  accentLight: '#EFF6FF',
  divider: '#E2E8F0',
  cardHighlight: '#F0F9FF',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#090C10', // Deep maritime obsidian
  surface: '#121824',
  card: '#121824',
  champagne: '#D4AF37', // Champagne gold
  primary: '#00E5FF',   // Ocean neon cyan
  primaryText: '#090C10',
  text: '#F1F5F9',
  subtext: '#94A3B8',
  sand: '#E5DFD5',
  border: 'rgba(212, 175, 55, 0.22)', // Golden champagne glow
  accent: '#D4AF37',
  accentLight: 'rgba(212, 175, 55, 0.12)',
  divider: 'rgba(212, 175, 55, 0.18)',
  cardHighlight: 'rgba(0, 229, 255, 0.08)',
  inputBg: '#0D131D',
  inputBorder: 'rgba(212, 175, 55, 0.25)',
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

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, theme, isDark: mode === 'dark', toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
