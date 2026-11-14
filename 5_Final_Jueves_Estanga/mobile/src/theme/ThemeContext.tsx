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
  background: '#F5F5F7', // Apple Pearl Alabaster
  surface: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.86)',
  champagne: '#D97706', // Warm amber gold
  primary: '#FF5A36', // Coral Sunset
  primaryText: '#FFFFFF',
  text: '#111115', // Crisp Charcoal Obsidian Ink
  subtext: '#52525B', // Clean neutral zinc
  sand: '#E4E4E7',
  border: 'rgba(0, 0, 0, 0.07)', // Subtle Apple hairline
  accent: '#0891B2', // Lagoon Aqua
  accentLight: 'rgba(8, 145, 178, 0.08)',
  divider: 'rgba(0, 0, 0, 0.06)',
  cardHighlight: '#FAFAFC',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0, 0, 0, 0.10)',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#050507', // Pure Obsidian
  surface: '#111115',    // Smoked Neutral Glass
  card: 'rgba(18, 18, 22, 0.76)',
  champagne: '#FBBF24',  // Warm Golden Hour amber
  primary: '#FF5A36',    // Coral Sunset
  primaryText: '#FFFFFF',
  text: '#F5F5F7',       // Titanium White
  subtext: '#A1A1AA',    // Neutral Zinc Secondary
  sand: '#D4D4D8',
  border: 'rgba(255, 255, 255, 0.08)', // Crisp neutral glass border
  accent: '#00D2D3',     // Aqua Telemetry Secondary
  accentLight: 'rgba(0, 210, 211, 0.12)',
  divider: 'rgba(255, 255, 255, 0.07)',
  cardHighlight: 'rgba(255, 255, 255, 0.04)',
  inputBg: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',
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
