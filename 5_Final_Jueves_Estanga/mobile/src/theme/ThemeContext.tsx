import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from './colors';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  champagne: string;
  primary: string;
  primaryHover: string;
  primaryDeep: string;
  primarySubtle: string;
  primaryBorder: string;
  primaryText: string;
  text: string;
  subtext: string;
  muted: string;
  sand: string;
  border: string;
  accent: string;
  accentLight: string;
  divider: string;
  cardHighlight: string;
  inputBg: string;
  inputBorder: string;
  success: string;
  successBg: string;
  successBorder: string;
  successText: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  info: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  isDark: boolean;
}

/**
 * Computes WCAG 2.1 accessible foreground ink ('#0C1719' or '#FFFFFF') for any custom hex accent color
 * (e.g., individual Agency profile accentColor).
 */
export function getContrastInk(hex?: string | null): string {
  if (!hex || !/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex)) {
    return '#FFFFFF';
  }
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  const contrastWithWhite = 1.05 / (lum + 0.05);
  const contrastWithInk = (lum + 0.05) / 0.059;
  return contrastWithInk >= contrastWithWhite ? '#0C1719' : '#FFFFFF';
}

export const lightTheme: ThemeColors = {
  background: '#F4F5F2', // Sunlit Salt-Chalk Limestone
  surface: '#FCFCFA',    // Gallery Paper White
  surfaceElevated: '#EAECE8', // Soft Fog Sand
  card: '#FCFCFA',
  champagne: '#9A6312',  // Deep Brushed Sun-Wax Brass
  primary: '#0E6B74',    // Deep Atlantic Teal (6.22:1 WCAG AA w/ #FFFFFF)
  primaryHover: '#0A575E',
  primaryDeep: '#08444A',
  primarySubtle: 'rgba(14, 107, 116, 0.09)',
  primaryBorder: 'rgba(14, 107, 116, 0.24)',
  primaryText: '#FFFFFF',
  text: '#131A1D',       // Deep Slate Umber Ink
  subtext: '#4A575D',    // Coastal Mineral Slate
  muted: '#5A676D',      // 4.91:1 on #EAECE8
  sand: '#EAECE8',
  border: 'rgba(19, 26, 29, 0.10)',
  accent: '#5A676D',     // Calm Pebble Telemetry Chrome
  accentLight: 'rgba(90, 103, 109, 0.10)',
  divider: 'rgba(19, 26, 29, 0.07)',
  cardHighlight: '#EAECE8',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(19, 26, 29, 0.15)',
  success: '#1D6F5A',    // Deep Coastal Sea-Kelp
  successBg: 'rgba(29, 111, 90, 0.09)',
  successBorder: 'rgba(29, 111, 90, 0.24)',
  successText: '#155444',
  warning: '#9A6312',    // Brushed Wax Brass
  warningBg: 'rgba(154, 99, 18, 0.10)',
  warningBorder: 'rgba(154, 99, 18, 0.25)',
  warningText: '#73490B', // 7.61:1 on #FCFCFA
  danger: '#B63933',     // Reef Rust Crimson
  dangerBg: 'rgba(182, 57, 51, 0.08)',
  dangerBorder: 'rgba(182, 57, 51, 0.24)',
  dangerText: '#8B2621',
  info: '#2B5B78',       // Deep Atlantic Steel
  infoBg: 'rgba(43, 91, 120, 0.09)',
  infoBorder: 'rgba(43, 91, 120, 0.24)',
  infoText: '#1E445C',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#1A1F22', // Coastal Atlantic Slate (Zero pitch black, zero harsh neon cast)
  surface: '#232A2E',    // Elevated Mineral Charcoal
  surfaceElevated: '#2D363B', // Tidepool Recessed Tile
  card: 'rgba(35, 42, 46, 0.96)',
  champagne: '#D9AE57',  // Brushed Sun-Wax Brass
  primary: '#38BDC7',    // Sea-Glass Teal Accent (6.43:1 on #232A2E)
  primaryHover: '#51CCD5',
  primaryDeep: '#2499A3',
  primarySubtle: 'rgba(56, 189, 199, 0.13)',
  primaryBorder: 'rgba(56, 189, 199, 0.30)',
  primaryText: '#0C1719', // Deep Abyssal Ink (8.05:1 WCAG AAA contrast on #38BDC7)
  text: '#F2F5F4',       // Salt-Chalk White (15.16:1 on #1A1F22)
  subtext: '#B1BDC2',    // Mist Driftwood Secondary
  muted: '#9CAAB0',      // 6.10:1 on #232A2E, 5.16:1 on #2D363B
  sand: '#D4DBD8',
  border: 'rgba(242, 245, 244, 0.09)',
  accent: '#9CAAB0',     // Calm Mineral Telemetry Chrome
  accentLight: 'rgba(156, 170, 176, 0.13)',
  divider: 'rgba(242, 245, 244, 0.07)',
  cardHighlight: 'rgba(242, 245, 244, 0.05)',
  inputBg: '#2D363B',
  inputBorder: 'rgba(242, 245, 244, 0.14)',
  success: '#4FC3A1',    // Sea-Kelp Mineral Mint
  successBg: 'rgba(79, 195, 161, 0.12)',
  successBorder: 'rgba(79, 195, 161, 0.28)',
  successText: '#B8EFE0',
  warning: '#E3B252',    // Brushed Sun-Wax Brass
  warningBg: 'rgba(227, 178, 82, 0.12)',
  warningBorder: 'rgba(227, 178, 82, 0.28)',
  warningText: '#F8DFAA',
  danger: '#EC7A73',     // Reef Coral Red
  dangerBg: 'rgba(236, 122, 115, 0.12)',
  dangerBorder: 'rgba(236, 122, 115, 0.28)',
  dangerText: '#F8C4C0',
  info: '#7FB2CE',       // Open Atlantic Steel
  infoBg: 'rgba(127, 178, 206, 0.12)',
  infoBorder: 'rgba(127, 178, 206, 0.26)',
  infoText: '#D0E7F4',
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
