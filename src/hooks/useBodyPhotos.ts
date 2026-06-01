import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { BodyPhoto, BodyPhotoInput } from '@/types/bodyPhoto';
import { getAllBodyPhotos, insertBodyPhoto, deleteBodyPhoto } from '@/services/bodyPhotoService';

interface UseBodyPhotosResult {
  photos: BodyPhoto[];
  loading: boolean;
  reload: () => Promise<void>;
  addPhoto: (input: BodyPhotoInput) => Promise<BodyPhoto>;
  removePhoto: (id: string) => Promise<void>;
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

  return { photos, loading, reload, addPhoto, removePhoto };
}
