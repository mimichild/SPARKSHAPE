import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { BodyPhoto, BodyPhotoInput } from '@/types/bodyPhoto';
import {
  getAllBodyPhotos, insertBodyPhoto, deleteBodyPhoto,
  updateBodyPhotoMeta, deletePhotosByDateAndType,
} from '@/services/bodyPhotoService';
import { deleteBodyPhotoFiles } from '@/services/photoStorageService';

interface UseBodyPhotosResult {
  photos: BodyPhoto[];
  loading: boolean;
  reload: () => Promise<void>;
  addPhoto: (input: BodyPhotoInput) => Promise<BodyPhoto>;
  /** 新增照片前，自動刪除同一天同類型的舊照片（含檔案），再插入新紀錄 */
  replaceDaily: (input: BodyPhotoInput) => Promise<BodyPhoto>;
  removePhoto: (id: string) => Promise<void>;
  updatePhotoMeta: (id: string, updates: Parameters<typeof updateBodyPhotoMeta>[2]) => Promise<void>;
}

export function useBodyPhotos(order: 'asc' | 'desc' = 'desc'): UseBodyPhotosResult {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<BodyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await getAllBodyPhotos(db, order);
    setPhotos(data);
    setLoading(false);
  }, [db, order]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPhoto = useCallback(
    async (input: BodyPhotoInput): Promise<BodyPhoto> => {
      const photo = await insertBodyPhoto(db, input);
      await reload();
      return photo;
    },
    [db, reload],
  );

  const removePhoto = useCallback(
    async (id: string): Promise<void> => {
      await deleteBodyPhoto(db, id);
      await reload();
    },
    [db, reload],
  );

  const replaceDaily = useCallback(
    async (input: BodyPhotoInput): Promise<BodyPhoto> => {
      const date = input.takenAt.slice(0, 10); // YYYY-MM-DD
      const oldIds = await deletePhotosByDateAndType(db, date, input.photoType);
      // 非同步刪除舊檔案（不阻塞主流程）
      oldIds.forEach((id) => deleteBodyPhotoFiles(id).catch(() => {}));
      const photo = await insertBodyPhoto(db, input);
      await reload();
      return photo;
    },
    [db, reload],
  );

  const updatePhotoMeta = useCallback(
    async (id: string, updates: Parameters<typeof updateBodyPhotoMeta>[2]): Promise<void> => {
      await updateBodyPhotoMeta(db, id, updates);
      await reload();
    },
    [db, reload],
  );

  return { photos, loading, reload, addPhoto, replaceDaily, removePhoto, updatePhotoMeta };
}
