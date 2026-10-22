import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  'body-lg': {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
};

export type TypographyVariant = keyof typeof typography;
