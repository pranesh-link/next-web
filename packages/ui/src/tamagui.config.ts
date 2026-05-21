import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';

const headingFont = createInterFont({
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 22, 6: 28, 7: 34, 8: 42 },
  weight: { 4: '300', 5: '400', 6: '600', 7: '700' },
});

const bodyFont = createInterFont({
  size: { 1: 12, 2: 14, 3: 16, 4: 18, lg: 18, xl: 20 },
  weight: { 4: '300', 5: '400', 6: '600' },
});

export const tamaguiConfig = createTamagui({
  themes,
  tokens,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  defaultFont: 'body',
  media: {
    xs: { maxWidth: 480 },
    sm: { maxWidth: 768 },
    md: { maxWidth: 1024 },
    lg: { maxWidth: 1280 },
    xl: { minWidth: 1281 },
  },
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
