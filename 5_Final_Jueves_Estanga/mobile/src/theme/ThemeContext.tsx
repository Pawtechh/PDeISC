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
  background: '#F5F6F8', // Warm Architectural Stone White
  surface: '#FFFFFF',
  card: '#FFFFFF',
  champagne: '#C48422', // Warm brushed sandstone
  primary: '#E25B3C',   // Signature Warm Terracotta
  primaryText: '#FFFFFF',
  text: '#16181E',      // Softened Charcoal Ink
  subtext: '#5B6270',   // Balanced Slate Secondary
  sand: '#E5E7EB',
  border: 'rgba(15, 23, 42, 0.08)',
  accent: '#64748B',    // Neutral Slate Chrome
  accentLight: 'rgba(100, 116, 139, 0.09)',
  divider: 'rgba(15, 23, 42, 0.06)',
  cardHighlight: '#F8FAFC',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(15, 23, 42, 0.12)',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#222630', // Lifted Charcoal Slate (Not harsh black)
  surface: '#2B303C',    // Elevated Graphite Surface
  card: 'rgba(45, 50, 64, 0.94)',
  champagne: '#E5B869',  // Muted Warm Sandstone
  primary: '#E25B3C',    // Signature Warm Terracotta
  primaryText: '#FFFFFF',
  text: '#F3F4F6',       // Crisp Soft White
  subtext: '#B4BAC6',    // Mineral Slate Secondary
  sand: '#D1D5DB',
  border: 'rgba(255, 255, 255, 0.10)',
  accent: '#94A3B8',     // Calm Slate Telemetry
  accentLight: 'rgba(148, 163, 184, 0.12)',
  divider: 'rgba(255, 255, 255, 0.08)',
  cardHighlight: 'rgba(255, 255, 255, 0.05)',
  inputBg: '#343A48',
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
