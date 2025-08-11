import { create } from 'zustand';

interface UIStoreState {
  isBootstrapping: boolean;
  hasBootstrapped: boolean;
  setBootstrapping: (value: boolean) => void;
  setHasBootstrapped: (value: boolean) => void;
  resetUI: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  isBootstrapping: false,
  hasBootstrapped: false,
  setBootstrapping: (value: boolean) => set({ isBootstrapping: value }),
  setHasBootstrapped: (value: boolean) => set({ hasBootstrapped: value }),
  resetUI: () => set({ isBootstrapping: false, hasBootstrapped: false }),
}));


