import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

const mockRow = {
  id: 'p1',
  taken_at: '2026-05-01T10:00:00.000Z',
  note: null,
  thumb_path: '/t1.jpg',
  grid_path: '/g1.jpg',
  detail_path: '/d1.jpg',
  full_path: '/f1.jpg',
};

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
  SQLiteProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useBodyPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getAllAsync.mockResolvedValue([mockRow]);
  });

  it('provides photos and loading state', async () => {
    const { result } = renderHook(() => useBodyPhotos());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].id).toBe('p1');
  });

  it('exposes reload function', async () => {
    const { result } = renderHook(() => useBodyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.reload(); });
    expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
  });

  it('exposes removePhoto that calls deleteBodyPhoto', async () => {
    const { result } = renderHook(() => useBodyPhotos());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.removePhoto('p1'); });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM body_photos'),
      'p1',
    );
  });
});
