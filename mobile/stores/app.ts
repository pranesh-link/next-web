import { create } from 'zustand';

interface AppState {
  isOnboarded: boolean;
  setOnboarded: (value: boolean) => void;
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
}

/** Global app state store. */
export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  setOnboarded: (value) => set({ isOnboarded: value }),
  selectedCurrency: 'INR',
  setCurrency: (currency) => set({ selectedCurrency: currency }),
}));
