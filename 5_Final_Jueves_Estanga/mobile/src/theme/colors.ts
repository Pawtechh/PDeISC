export const colors = {
  ocean: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7', // PRIMARY OCEAN
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  sunset: {
    400: '#FBBF24',
    500: '#F59E0B', // WARM GOLD/SUNSET
    600: '#D97706',
  },
  sand: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    500: '#78716C',
    700: '#44403C',
    900: '#1C1917',
  },
  champagne: {
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm refined golden amber
    600: '#D97706',
    border: 'rgba(245, 158, 11, 0.25)',
    glow: 'rgba(245, 158, 11, 0.2)',
    subtle: 'rgba(245, 158, 11, 0.1)',
  },
  neon: {
    cyan: '#38BDF8',
    cyanGlow: 'rgba(56, 189, 248, 0.25)',
    cyanHighlight: 'rgba(56, 189, 248, 0.08)',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#0284C7',
  },
  dark: {
    background: '#0B0F17', // Deep maritime obsidian night
    surface: '#131C2E',    // Elevated deep navy card
    card: '#131C2E',
    champagne: '#F59E0B',
    primary: '#0284C7',    // Coastal Ocean Blue
    primaryText: '#FFFFFF',// Crisp pure white
    text: '#F8FAFC',       // Bright high-contrast white
    subtext: '#94A3B8',    // Slate secondary
    sand: '#CBD5E1',
    border: 'rgba(255, 255, 255, 0.08)', // Frosted subtle border
    accent: '#38BDF8',     // Sky highlight
    accentLight: 'rgba(56, 189, 248, 0.12)',
    cardHighlight: 'rgba(56, 189, 248, 0.06)',
    inputBg: '#0F172A',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    glowChampagne: 'rgba(245, 158, 11, 0.2)',
    glowCyan: 'rgba(56, 189, 248, 0.2)',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
