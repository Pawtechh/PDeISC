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
  background: '#F8FAFC', // Crisp coastal daylight mist
  surface: '#FFFFFF',
  card: '#FFFFFF',
  champagne: '#D97706', // Warm amber gold
  primary: '#0284C7', // Vivid coastal blue
  primaryText: '#FFFFFF',
  text: '#0F172A', // Rich slate midnight, maximum contrast & readability
  subtext: '#475569', // Clear secondary slate
  sand: '#E2E8F0',
  border: '#E2E8F0', // Clean subtle border
  accent: '#0284C7',
  accentLight: '#F0F9FF',
  divider: '#E2E8F0',
  cardHighlight: '#F0F9FF',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#0B0F17', // Deep maritime obsidian
  surface: '#131C2E',    // Elevated deep navy card
  card: '#131C2E',
  champagne: '#F59E0B',  // Warm refined golden amber
  primary: '#0284C7',    // Coastal Ocean Blue
  primaryText: '#FFFFFF',// Crisp pure white
  text: '#F8FAFC',       // Bright high-contrast white
  subtext: '#94A3B8',    // Slate secondary
  sand: '#CBD5E1',
  border: 'rgba(255, 255, 255, 0.08)', // Frosted subtle border
  accent: '#38BDF8',     // Sky highlight
  accentLight: 'rgba(56, 189, 248, 0.12)',
  divider: 'rgba(255, 255, 255, 0.08)',
  cardHighlight: 'rgba(56, 189, 248, 0.06)',
  inputBg: '#0F172A',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
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

  return (
    <ThemeContext.Provider value={{ mode, theme, isDark, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
