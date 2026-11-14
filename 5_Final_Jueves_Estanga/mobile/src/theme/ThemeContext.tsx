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

export const lightTheme: ThemeColors = {
  background: '#F5F1EA', // Sunlit Coastal Travertine Limestone
  surface: '#FDFCFA',    // Warm Gallery Chalk Paper
  surfaceElevated: '#EFEAE1', // Soft Sand Wash
  card: '#FDFCFA',
  champagne: '#A4701C',  // Deep Brushed Sun-Brass
  primary: '#C94A29',    // Fired Clay Terracotta (4.92:1 WCAG AA w/ white)
  primaryHover: '#D95A38',
  primaryDeep: '#A83A1E',
  primarySubtle: 'rgba(201, 74, 41, 0.09)',
  primaryBorder: 'rgba(201, 74, 41, 0.24)',
  primaryText: '#FFFFFF',
  text: '#1C1B18',       // Deep Espresso Umber Ink
  subtext: '#666056',    // Weathered Driftwood Secondary
  muted: '#7A7368',
  sand: '#E8E2D7',
  border: 'rgba(28, 27, 24, 0.09)',
  accent: '#7A7368',     // Warm Pebble Telemetry Chrome
  accentLight: 'rgba(122, 115, 104, 0.10)',
  divider: 'rgba(28, 27, 24, 0.06)',
  cardHighlight: '#EFEAE1',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(28, 27, 24, 0.14)',
  success: '#247360',    // Deep Coastal Sea-Kelp
  successBg: 'rgba(36, 115, 96, 0.09)',
  successBorder: 'rgba(36, 115, 96, 0.22)',
  successText: '#1A5648',
  warning: '#A4701C',    // Brushed Ochre Brass
  warningBg: 'rgba(164, 112, 28, 0.09)',
  warningBorder: 'rgba(164, 112, 28, 0.24)',
  warningText: '#7C5210',
  danger: '#B63933',     // Muted Rust Sienna
  dangerBg: 'rgba(182, 57, 51, 0.08)',
  dangerBorder: 'rgba(182, 57, 51, 0.22)',
  dangerText: '#8B2621',
  info: '#3B657E',       // Deep Atlantic Slate
  infoBg: 'rgba(59, 101, 126, 0.09)',
  infoBorder: 'rgba(59, 101, 126, 0.22)',
  infoText: '#2A4A5D',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  background: '#21201E', // Lifted Coastal Basalt Graphite (Zero pitch black, zero blue cast)
  surface: '#2A2926',    // Warm Mineral Surface
  surfaceElevated: '#35332F', // Elevated Basalt Recessed Tile
  card: 'rgba(45, 43, 40, 0.96)',
  champagne: '#DBA84C',  // Brushed Sun-Wax Brass
  primary: '#E06343',    // Sunlit Terracotta Accent
  primaryHover: '#EA7D60',
  primaryDeep: '#C94A29',
  primarySubtle: 'rgba(224, 99, 67, 0.13)',
  primaryBorder: 'rgba(224, 99, 67, 0.30)',
  primaryText: '#FFFFFF',
  text: '#F5F2EC',       // Warm Chalk White
  subtext: '#B6B0A5',    // Driftwood Stone Secondary
  muted: '#9E988D',
  sand: '#D6CFC3',
  border: 'rgba(245, 242, 236, 0.09)',
  accent: '#9E988D',     // Calm Mineral Telemetry Chrome
  accentLight: 'rgba(158, 152, 141, 0.13)',
  divider: 'rgba(245, 242, 236, 0.07)',
  cardHighlight: 'rgba(245, 242, 236, 0.05)',
  inputBg: '#35332F',
  inputBorder: 'rgba(245, 242, 236, 0.13)',
  success: '#52B097',    // Sea-Kelp Mineral Sage (Split-complement vs Terracotta)
  successBg: 'rgba(82, 176, 151, 0.12)',
  successBorder: 'rgba(82, 176, 151, 0.28)',
  successText: '#B5E2D5',
  warning: '#DBA84C',    // Brushed Brass
  warningBg: 'rgba(219, 168, 76, 0.12)',
  warningBorder: 'rgba(219, 168, 76, 0.28)',
  warningText: '#F3D9A6',
  danger: '#E26E66',     // Dusty Rust Clay
  dangerBg: 'rgba(226, 110, 102, 0.12)',
  dangerBorder: 'rgba(226, 110, 102, 0.28)',
  dangerText: '#F4BEBA',
  info: '#88A9BE',       // Softened Atlantic Slate
  infoBg: 'rgba(136, 169, 190, 0.12)',
  infoBorder: 'rgba(136, 169, 190, 0.26)',
  infoText: '#CBDDE8',
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
