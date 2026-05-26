'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ToastContainer } from './Toast';
import type { ToastItem, ToastType } from './Toast';

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

/** Value returned by the useToast hook. */
interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

/**
 * Provides a toast notification system to its children.
 * Renders a fixed-position container at bottom-right.
 * Max 3 visible toasts; auto-dismisses after 4 seconds.
 */
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast: ToastItem = { id, message, type };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Trim to max visible
        if (updated.length > MAX_VISIBLE) {
          const removed = updated.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return updated;
      });

      // Auto-dismiss
      const timer = setTimeout(() => {
        removeToast(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}
