import { create } from 'zustand';
import type { BodyPhoto } from '@/types/bodyPhoto';

interface ComparisonState {
  leftPhoto: BodyPhoto | null;
  rightPhoto: BodyPhoto | null;
  setLeftPhoto: (photo: BodyPhoto | null) => void;
  setRightPhoto: (photo: BodyPhoto | null) => void;
  clearComparison: () => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  leftPhoto: null,
  rightPhoto: null,
  setLeftPhoto: (photo) => set({ leftPhoto: photo }),
  setRightPhoto: (photo) => set({ rightPhoto: photo }),
  clearComparison: () => set({ leftPhoto: null, rightPhoto: null }),
}));
