import { initDB, insertBodyPhoto, getAllBodyPhotos, getBodyPhotoById, deleteBodyPhoto } from '@/services/bodyPhotoService';
import type { BodyPhoto } from '@/types/bodyPhoto';

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

const sampleRow = {
  id: 'test-uuid-1', taken_at: '2026-05-01T10:00:00.000Z', note: null,
  thumb_path: '/docs/body_photos/test-uuid-1/thumb.jpg',
  grid_path:  '/docs/body_photos/test-uuid-1/grid.jpg',
  detail_path:'/docs/body_photos/test-uuid-1/detail.jpg',
  full_path:  '/docs/body_photos/test-uuid-1/full.jpg',
  photo_type: 'front', brightness: 1.0, contrast: 1.0,
  weight: null, chest: null, waist: null, lower_waist: null, hip: null,
};

const samplePhoto: BodyPhoto = {
  id: 'test-uuid-1', takenAt: '2026-05-01T10:00:00.000Z', note: null,
  thumbPath:  '/docs/body_photos/test-uuid-1/thumb.jpg',
  gridPath:   '/docs/body_photos/test-uuid-1/grid.jpg',
  detailPath: '/docs/body_photos/test-uuid-1/detail.jpg',
  fullPath:   '/docs/body_photos/test-uuid-1/full.jpg',
  photoType: 'front', brightness: 1.0, contrast: 1.0,
  weight: null, chest: null, waist: null, lowerWaist: null, hip: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initDB', () => {
  it('executes CREATE TABLE SQL and migrations', async () => {
    await initDB(mockDb as any);
    // 1 CREATE TABLE (body_photos) + 8 ALTER TABLE migrations + 1 CREATE TABLE (daily_notes)
    expect(mockDb.execAsync.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockDb.execAsync.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS body_photos');
  });
});

describe('insertBodyPhoto', () => {
  it('inserts a record and returns a BodyPhoto with generated id', async () => {
    const input = {
      takenAt: samplePhoto.takenAt, note: null,
      thumbPath: samplePhoto.thumbPath, gridPath: samplePhoto.gridPath,
      detailPath: samplePhoto.detailPath, fullPath: samplePhoto.fullPath,
      photoType: 'front' as const, brightness: 1.0, contrast: 1.0,
      weight: null, chest: null, waist: null, lowerWaist: null, hip: null,
    };
    const result = await insertBodyPhoto(mockDb as any, input);
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(result.id).toBeDefined();
    expect(result.takenAt).toBe(input.takenAt);
    expect(result.thumbPath).toBe(input.thumbPath);
  });
});

describe('getAllBodyPhotos', () => {
  it('returns photos sorted desc by default', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([sampleRow]);
    const photos = await getAllBodyPhotos(mockDb as any, 'desc');
    expect(photos).toHaveLength(1);
    expect(photos[0].id).toBe(samplePhoto.id);
    expect(photos[0].takenAt).toBe(samplePhoto.takenAt);
    const sql: string = mockDb.getAllAsync.mock.calls[0][0];
    expect(sql).toContain('ORDER BY taken_at DESC');
  });

  it('returns photos sorted asc when requested', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    await getAllBodyPhotos(mockDb as any, 'asc');
    const sql: string = mockDb.getAllAsync.mock.calls[0][0];
    expect(sql).toContain('ORDER BY taken_at ASC');
  });
});

describe('getBodyPhotoById', () => {
  it('returns the matching photo', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(sampleRow);
    const photo = await getBodyPhotoById(mockDb as any, 'test-uuid-1');
    expect(photo).not.toBeNull();
    expect(photo!.id).toBe('test-uuid-1');
  });

  it('returns null when not found', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const photo = await getBodyPhotoById(mockDb as any, 'nonexistent');
    expect(photo).toBeNull();
  });
});

describe('deleteBodyPhoto', () => {
  it('calls runAsync with DELETE statement and correct id', async () => {
    await deleteBodyPhoto(mockDb as any, 'test-uuid-1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM body_photos'),
      'test-uuid-1',
    );
  });
});
