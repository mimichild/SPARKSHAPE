import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PHOTO_SIZES } from '@/constants/photo';

export interface PhotoPaths {
  thumbPath: string;
  gridPath: string;
  detailPath: string;
  fullPath: string;
}

function photoDir(photoId: string): string {
  return `${FileSystem.documentDirectory}body_photos/${photoId}/`;
}

export async function saveBodyPhoto(
  sourceUri: string,
  photoId: string,
): Promise<PhotoPaths> {
  const dir = photoDir(photoId);
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  async function processSize(sizeKey: string, sizeWidth: number, quality: number): Promise<string> {
    const result = await manipulateAsync(
      sourceUri,
      [{ resize: { width: sizeWidth } }],
      { compress: quality, format: SaveFormat.JPEG, base64: false },
    );
    const dest = `${dir}${sizeKey}.jpg`;
    await FileSystem.moveAsync({ from: result.uri, to: dest });
    return dest;
  }

  const [thumbPath, gridPath, detailPath, fullPath] = await Promise.all([
    processSize('thumb',  PHOTO_SIZES.thumb.width,  PHOTO_SIZES.thumb.quality),
    processSize('grid',   PHOTO_SIZES.grid.width,   PHOTO_SIZES.grid.quality),
    processSize('detail', PHOTO_SIZES.detail.width, PHOTO_SIZES.detail.quality),
    processSize('full',   PHOTO_SIZES.full.width,   PHOTO_SIZES.full.quality),
  ]);

  return { thumbPath, gridPath, detailPath, fullPath };
}

export async function deleteBodyPhotoFiles(photoId: string): Promise<void> {
  await FileSystem.deleteAsync(photoDir(photoId), { idempotent: true });
}
