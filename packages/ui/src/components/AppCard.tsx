import { Card, styled } from 'tamagui';

/** Cross-platform card container with elevation and border. */
export const AppCard = styled(Card, {
  backgroundColor: '$background',
  borderRadius: '$4',
  padding: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  elevation: '$1',

  variants: {
    variant: {
      elevated: { elevation: '$2', borderWidth: 0 },
      outlined: { elevation: '$0', borderWidth: 1, borderColor: '$borderColor' },
      flat: { elevation: '$0', borderWidth: 0, backgroundColor: '$gray2' },
    },
    pressable: {
      true: {
        pressStyle: { scale: 0.98, opacity: 0.9 },
        cursor: 'pointer',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'outlined',
  },
});
