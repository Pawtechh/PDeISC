export const colors = {
  ocean: {
    50: '#EFF8FF',
    100: '#D1E9FF',
    200: '#B2DBFF',
    300: '#84C5FF',
    400: '#4DA5FF',
    500: '#1E85F5', // PRIMARY
    600: '#0A66D4',
    700: '#084FA8',
    800: '#063B7C',
    900: '#052A57',
  },
  sunset: {
    400: '#FFB347',
    500: '#FF8C42', // ACCENT
    600: '#F26B1D',
  },
  sand: {
    50: '#FAFAF7',
    100: '#F4F3EE',
    200: '#E8E6DD',
    300: '#D4D0C2',
    500: '#8A8574',
    700: '#4A473C',
    900: '#1F1E19',
  },
  // Luxury Champagne & Neon Cyan accents
  champagne: {
    100: '#FBF7EE',
    200: '#F5ECDA',
    300: '#E8D5A7',
    400: '#DEBF6E',
    500: '#D4AF37', // Champagne gold
    600: '#B39129',
    border: 'rgba(212, 175, 55, 0.22)',
    glow: 'rgba(212, 175, 55, 0.25)',
    subtle: 'rgba(212, 175, 55, 0.12)',
  },
  neon: {
    cyan: '#00E5FF', // Ocean neon cyan
    cyanGlow: 'rgba(0, 229, 255, 0.2)',
    cyanHighlight: 'rgba(0, 229, 255, 0.08)',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  dark: {
    background: '#090C10', // Deep maritime obsidian
    surface: '#121824',
    card: '#121824',
    champagne: '#D4AF37', // Champagne gold
    primary: '#00E5FF', // Ocean neon cyan
    primaryText: '#090C10',
    text: '#F1F5F9',
    subtext: '#94A3B8',
    sand: '#E5DFD5',
    border: 'rgba(212, 175, 55, 0.22)', // Golden champagne glow
    accent: '#D4AF37',
    accentLight: 'rgba(212, 175, 55, 0.12)',
    cardHighlight: 'rgba(0, 229, 255, 0.08)',
    inputBg: '#0D131D',
    inputBorder: 'rgba(212, 175, 55, 0.25)',
    glowChampagne: 'rgba(212, 175, 55, 0.25)',
    glowCyan: 'rgba(0, 229, 255, 0.2)',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
