import { act } from '@testing-library/react-native';
import { useComparisonStore } from '@/stores/comparisonStore';

const p1 = {
  id: 'p1', takenAt: '2026-01-01T00:00:00.000Z', note: null,
  thumbPath: '/t1.jpg', gridPath: '/g1.jpg', detailPath: '/d1.jpg', fullPath: '/f1.jpg',
};
const p2 = {
  id: 'p2', takenAt: '2026-05-01T00:00:00.000Z', note: null,
  thumbPath: '/t2.jpg', gridPath: '/g2.jpg', detailPath: '/d2.jpg', fullPath: '/f2.jpg',
};

beforeEach(() => {
  useComparisonStore.getState().clearComparison();
});

describe('useComparisonStore', () => {
  it('starts with both slots null', () => {
    const { leftPhoto, rightPhoto } = useComparisonStore.getState();
    expect(leftPhoto).toBeNull();
    expect(rightPhoto).toBeNull();
  });

  it('setLeftPhoto updates left slot', () => {
    act(() => { useComparisonStore.getState().setLeftPhoto(p1); });
    expect(useComparisonStore.getState().leftPhoto?.id).toBe('p1');
  });

  it('setRightPhoto updates right slot', () => {
    act(() => { useComparisonStore.getState().setRightPhoto(p2); });
    expect(useComparisonStore.getState().rightPhoto?.id).toBe('p2');
  });

  it('clearComparison resets both slots to null', () => {
    act(() => {
      useComparisonStore.getState().setLeftPhoto(p1);
      useComparisonStore.getState().setRightPhoto(p2);
    });
    act(() => { useComparisonStore.getState().clearComparison(); });
    expect(useComparisonStore.getState().leftPhoto).toBeNull();
    expect(useComparisonStore.getState().rightPhoto).toBeNull();
  });
});
