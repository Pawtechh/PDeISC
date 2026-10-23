import { TextStyle, Platform } from 'react-native';

const headingFontFamily =
  Platform.OS === 'web'
    ? "'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    : undefined;

const bodyFontFamily =
  Platform.OS === 'web'
    ? "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : undefined;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: headingFontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: headingFontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: headingFontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: headingFontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  'body-lg': {
    fontFamily: bodyFontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body: {
    fontFamily: bodyFontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontFamily: bodyFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  button: {
    fontFamily: bodyFontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
};

export type TypographyVariant = keyof typeof typography;
