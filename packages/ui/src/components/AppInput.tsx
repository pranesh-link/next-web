import { Input, styled } from 'tamagui';

/** Cross-platform text input with consistent styling. */
export const AppInput = styled(Input, {
  backgroundColor: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$3',
  fontSize: '$3',
  color: '$color',

  focusStyle: {
    borderColor: '$blue10',
    borderWidth: 2,
  },

  variants: {
    error: {
      true: {
        borderColor: '$red10',
        focusStyle: { borderColor: '$red10' },
      },
    },
    size: {
      sm: { paddingVertical: '$2', fontSize: '$2' },
      md: { paddingVertical: '$3', fontSize: '$3' },
      lg: { paddingVertical: '$4', fontSize: '$4' },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});
