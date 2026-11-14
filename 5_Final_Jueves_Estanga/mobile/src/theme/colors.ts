export const colors = {
  ocean: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0284C7', // PRIMARY OCEAN
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  seafoam: {
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
  },
  sunset: {
    400: '#FBBF24',
    500: '#F59E0B', // WARM GOLD/SUNSET
    600: '#D97706',
  },
  sand: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
  champagne: {
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm refined golden amber
    600: '#D97706',
    border: 'rgba(251, 191, 36, 0.28)',
    glow: 'rgba(245, 158, 11, 0.24)',
    subtle: 'rgba(251, 191, 36, 0.1)',
  },
  neon: {
    cyan: '#22D3EE',
    bioluminescent: '#00E5FF',
    cyanGlow: 'rgba(34, 211, 238, 0.28)',
    cyanHighlight: 'rgba(34, 211, 238, 0.10)',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#0EA5E9',
  },
  dark: {
    background: '#040914', // Abyssal oceanic sapphire
    surface: '#0B182B',    // Smoked midnight glass
    card: '#0B182B',
    champagne: '#FBBF24',
    primary: '#0EA5E9',    // Electric Pacific Blue
    primaryText: '#FFFFFF',// Crisp pure white
    text: '#F8FAFC',       // Bright high-contrast white
    subtext: '#94A3B8',    // Slate secondary
    sand: '#CBD5E1',
    border: 'rgba(56, 189, 248, 0.18)', // Bioluminescent crystalline rim
    accent: '#22D3EE',     // Bioluminescent cyan highlight
    accentLight: 'rgba(34, 211, 238, 0.14)',
    cardHighlight: 'rgba(34, 211, 238, 0.08)',
    inputBg: '#071120',
    inputBorder: 'rgba(56, 189, 248, 0.20)',
    glowChampagne: 'rgba(251, 191, 36, 0.22)',
    glowCyan: 'rgba(34, 211, 238, 0.24)',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
