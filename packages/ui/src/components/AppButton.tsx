import { Button, styled } from 'tamagui';

/** Cross-platform button with consistent styling. */
export const AppButton = styled(Button, {
  backgroundColor: '$blue10',
  color: '$white1',
  borderRadius: '$4',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  fontWeight: '600',

  pressStyle: {
    opacity: 0.85,
    scale: 0.97,
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$blue10',
        color: '$white1',
      },
      secondary: {
        backgroundColor: '$gray4',
        color: '$gray12',
      },
      danger: {
        backgroundColor: '$red10',
        color: '$white1',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$blue10',
        borderWidth: 1,
        borderColor: '$blue10',
      },
    },
    size: {
      sm: { paddingHorizontal: '$3', paddingVertical: '$2', fontSize: '$2' },
      md: { paddingHorizontal: '$4', paddingVertical: '$3', fontSize: '$3' },
      lg: { paddingHorizontal: '$5', paddingVertical: '$4', fontSize: '$4' },
    },
    fullWidth: {
      true: { width: '100%' },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
