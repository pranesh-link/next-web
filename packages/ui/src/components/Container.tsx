import { YStack, styled } from 'tamagui';

/** Cross-platform container with max-width and padding. */
export const Container = styled(YStack, {
  width: '100%',
  maxWidth: 1200,
  marginHorizontal: 'auto',
  paddingHorizontal: '$4',

  variants: {
    size: {
      sm: { maxWidth: 600 },
      md: { maxWidth: 900 },
      lg: { maxWidth: 1200 },
      full: { maxWidth: '100%' },
    },
  } as const,

  defaultVariants: {
    size: 'lg',
  },
});
