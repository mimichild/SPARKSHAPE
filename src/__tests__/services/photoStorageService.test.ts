import { saveBodyPhoto, deleteBodyPhotoFiles } from '@/services/photoStorageService';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

jest.mock('expo-file-system/legacy');
jest.mock('expo-image-manipulator');

const mockMakeDir = FileSystem.makeDirectoryAsync as jest.Mock;
const mockManipulate = ImageManipulator.manipulateAsync as jest.Mock;
const mockDelete = FileSystem.deleteAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockMakeDir.mockResolvedValue(undefined);
  (FileSystem.moveAsync as jest.Mock).mockResolvedValue(undefined);
  mockManipulate.mockImplementation((_uri: string, _actions: unknown, _options: unknown) =>
    Promise.resolve({ uri: '/mock/documents/result.jpg' }),
  );
  mockDelete.mockResolvedValue(undefined);
});

describe('saveBodyPhoto', () => {
  it('creates directory and returns 4 size paths', async () => {
    const result = await saveBodyPhoto('/mock/source.jpg', 'photo-123');
    expect(mockMakeDir).toHaveBeenCalledWith(
      expect.stringContaining('photo-123'),
      expect.objectContaining({ intermediates: true }),
    );
    expect(mockManipulate).toHaveBeenCalledTimes(4);
    expect(result).toMatchObject({
      thumbPath: expect.stringContaining('thumb'),
      gridPath: expect.stringContaining('grid'),
      detailPath: expect.stringContaining('detail'),
      fullPath: expect.stringContaining('full'),
    });
  });

  it('produces thumb size ≤ 120px wide', async () => {
    await saveBodyPhoto('/mock/source.jpg', 'photo-123');
    const thumbCall = mockManipulate.mock.calls.find(
      ([, , opts]: [string, unknown, { base64?: boolean }]) =>
        JSON.stringify(opts).includes('thumb') ||
        mockManipulate.mock.calls.indexOf([, , opts]) === 0,
    );
    const resizeAction = mockManipulate.mock.calls[0][1][0];
    expect(resizeAction.resize.width).toBeLessThanOrEqual(120);
  });
});

describe('deleteBodyPhotoFiles', () => {
  it('calls deleteAsync on the photo directory', async () => {
    await deleteBodyPhotoFiles('photo-abc');
    expect(mockDelete).toHaveBeenCalledWith(
      expect.stringContaining('photo-abc'),
      expect.objectContaining({ idempotent: true }),
    );
  });
});
