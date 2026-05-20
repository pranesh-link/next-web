import { Spacer as TamaguiSpacer, styled } from 'tamagui';

/** Cross-platform spacer for consistent spacing. */
export const Spacer = styled(TamaguiSpacer, {
  variants: {
    size: {
      xs: { size: '$1' },
      sm: { size: '$2' },
      md: { size: '$4' },
      lg: { size: '$6' },
      xl: { size: '$8' },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});
