import { Text, styled } from 'tamagui';

/** Cross-platform text component with semantic variants. */
export const AppText = styled(Text, {
  color: '$color',
  fontFamily: '$body',

  variants: {
    variant: {
      heading: { fontFamily: '$heading', fontSize: '$6', fontWeight: '700' },
      subheading: { fontFamily: '$heading', fontSize: '$5', fontWeight: '600' },
      body: { fontSize: '$3', fontWeight: '400' },
      caption: { fontSize: '$2', color: '$gray10' },
      label: { fontSize: '$2', fontWeight: '600', textTransform: 'uppercase' },
    },
    muted: {
      true: { color: '$gray10' },
    },
    center: {
      true: { textAlign: 'center' },
    },
  } as const,

  defaultVariants: {
    variant: 'body',
  },
});
