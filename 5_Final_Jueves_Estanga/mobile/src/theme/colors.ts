export const colors = {
  coral: {
    300: '#F29B86',
    400: '#EA7357',
    500: '#E25B3C', // SIGNATURE WARM TERRACOTTA
    600: '#CC482A',
    700: '#A9381E',
    border: 'rgba(226, 91, 60, 0.28)',
    glow: 'rgba(226, 91, 60, 0.20)',
    subtle: 'rgba(226, 91, 60, 0.11)',
  },
  ocean: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569', // ARCHITECTURAL SLATE NEUTRAL
    700: '#334155',
    800: '#27303F',
    900: '#1E2430',
  },
  seafoam: {
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
  },
  sunset: {
    400: '#E5B869',
    500: '#D99B38', // WARM SANDSTONE GOLD
    600: '#B87E22',
  },
  sand: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    500: '#71717A',
    700: '#3F3F46',
    900: '#111115',
  },
  champagne: {
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#F3D28B',
    400: '#E5B869',
    500: '#D99B38', // Warm brushed brass / sandstone
    600: '#B87E22',
    border: 'rgba(229, 184, 105, 0.24)',
    glow: 'rgba(217, 155, 56, 0.16)',
    subtle: 'rgba(229, 184, 105, 0.09)',
  },
  neon: {
    cyan: '#94A3B8',
    bioluminescent: '#CBD5E1',
    cyanGlow: 'rgba(148, 163, 184, 0.14)',
    cyanHighlight: 'rgba(148, 163, 184, 0.08)',
  },
  semantic: {
    success: '#22A86B',
    warning: '#D99B38',
    danger: '#DF4E4E',
    info: '#94A3B8',
  },
  dark: {
    background: '#222630', // Lifted Neutral Charcoal Slate
    surface: '#2B303C',    // Elevated Clean Graphite Surface
    card: '#2D3240',
    champagne: '#E5B869',
    primary: '#E25B3C',    // Warm Terracotta Accent
    primaryText: '#FFFFFF',
    text: '#F3F4F6',       // Crisp Soft White
    subtext: '#B4BAC6',    // Balanced Cool Mineral Secondary
    sand: '#D1D5DB',
    border: 'rgba(255, 255, 255, 0.10)',
    accent: '#94A3B8',     // Clean Slate Telemetry
    accentLight: 'rgba(148, 163, 184, 0.12)',
    cardHighlight: 'rgba(255, 255, 255, 0.05)',
    inputBg: '#343A48',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    glowChampagne: 'rgba(229, 184, 105, 0.14)',
    glowCyan: 'rgba(226, 91, 60, 0.18)',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
