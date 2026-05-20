import { Dialog, Adapt, Sheet } from 'tamagui';
import type { ReactNode } from 'react';

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}

/**
 * Cross-platform modal that renders as a dialog on web and a bottom sheet on mobile.
 */
export function AppModal({ open, onOpenChange, title, children }: AppModalProps) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Adapt when="sm" platform="touch">
        <Sheet zIndex={200000} modal dismissOnSnapToBottom>
          <Sheet.Frame padding="$4" gap="$4">
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          padding="$4"
        >
          {title && (
            <Dialog.Title fontSize="$6" fontWeight="700">
              {title}
            </Dialog.Title>
          )}
          {children}
          <Dialog.Close asChild>
            <></>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
