import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { BodyPhoto } from '@/types/bodyPhoto';
import type { DailyNote } from '@/types/dailyNote';
import { getAllBodyPhotos, clearBodyPhotos, insertBodyPhotoRaw } from './bodyPhotoService';
import { getAllDailyNotes, clearDailyNotes, insertDailyNoteRaw } from './dailyNoteService';

const SETTINGS_KEY = '@sparkshape_settings';

export type ProgressCallback = (percent: number) => void;
export type ImportMode = 'merge' | 'overwrite';

interface BackupMetadata {
  version: 1;
  exportedAt: string;
  photos: BodyPhoto[];
  dailyNotes: DailyNote[];
  settings: Record<string, unknown> | null;
}

export type ExportResult =
  | { ok: true; fileName: string }
  | { ok: false; cancelled: true }
  | { ok: false; error: string };

export type ImportResult =
  | { ok: true; count: number }
  | { ok: false; cancelled: true }
  | { ok: false; error: string };

/** Android: 跳出 SAF 資料夾選取器；iOS: 直接回傳 granted */
export async function pickExportDirectory(): Promise<
  { granted: true; uri: string } | { granted: false }
> {
  if (Platform.OS === 'android') {
    const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!perm.granted) return { granted: false };
    return { granted: true, uri: perm.directoryUri };
  }
  return { granted: true, uri: '' };
}

/**
 * 匯出備份
 * @param directoryUri Android SAF URI（iOS 傳空字串，使用 expo-sharing）
 */
export async function exportBackup(
  db: SQLiteDatabase,
  directoryUri: string,
  onProgress: ProgressCallback,
): Promise<ExportResult> {
  try {
    onProgress(0);

    // ── Phase 1: 讀取資料（0–10%）──
    const photos = await getAllBodyPhotos(db, 'asc');
    const dailyNotes = await getAllDailyNotes(db);
    const settingsRaw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = settingsRaw ? JSON.parse(settingsRaw) : null;
    onProgress(10);

    // ── Phase 2: 建立 ZIP（10–90%）──
    const zip = new JSZip();

    const metadata: BackupMetadata = {
      version: 1,
      exportedAt: new Date().toISOString(),
      photos,
      dailyNotes,
      settings,
    };
    zip.file('metadata.json', JSON.stringify(metadata));

    const total = photos.length;
    const SIZES = ['thumb', 'grid', 'detail', 'full'] as const;
    const pathOf = (p: BodyPhoto) => ({
      thumb: p.thumbPath,
      grid: p.gridPath,
      detail: p.detailPath,
      full: p.fullPath,
    });

    for (let i = 0; i < total; i++) {
      const photo = photos[i];
      const paths = pathOf(photo);
      for (const size of SIZES) {
        try {
          const info = await FileSystem.getInfoAsync(paths[size]);
          if (info.exists) {
            const b64 = await FileSystem.readAsStringAsync(paths[size], {
              encoding: FileSystem.EncodingType.Base64,
            });
            zip.file(`photos/${photo.id}/${size}.jpg`, b64, { base64: true });
          }
        } catch { /* 略過遺失檔案 */ }
      }
      onProgress(Math.round(10 + ((i + 1) / Math.max(total, 1)) * 40));
    }

    // 產生 ZIP（帶進度回呼）
    const b64Zip = await zip.generateAsync(
      { type: 'base64' },
      (meta) => onProgress(Math.round(50 + meta.percent * 0.4)),
    );
    onProgress(90);

    // ── Phase 3: 寫入手機（90–100%）──
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `sparkshape_backup_${dateStr}.zip`;

    if (Platform.OS === 'android') {
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        directoryUri,
        fileName,
        'application/zip',
      );
      await FileSystem.writeAsStringAsync(fileUri, b64Zip, {
        encoding: FileSystem.EncodingType.Base64,
      });
      onProgress(100);
      return { ok: true, fileName };
    } else {
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(cacheUri, b64Zip, {
        encoding: FileSystem.EncodingType.Base64,
      });
      onProgress(95);
      await Sharing.shareAsync(cacheUri, { mimeType: 'application/zip' });
      onProgress(100);
      return { ok: true, fileName };
    }
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** 匯入備份：先讓使用者選檔，再執行還原 */
export async function importBackup(
  db: SQLiteDatabase,
  mode: ImportMode,
  onProgress: ProgressCallback,
): Promise<ImportResult> {
  try {
    // 先選取檔案（進度條尚未顯示）
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/zip',
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return { ok: false, cancelled: true };

    onProgress(5);

    // ── Phase 1: 讀取 ZIP（5–25%）──
    const b64 = await FileSystem.readAsStringAsync(picked.assets[0].uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    onProgress(15);

    const zip = await JSZip.loadAsync(b64, { base64: true });
    onProgress(20);

    const metaFile = zip.file('metadata.json');
    if (!metaFile) return { ok: false, error: '無效的備份檔案' };

    const metadata: BackupMetadata = JSON.parse(await metaFile.async('string'));
    onProgress(25);

    // ── Phase 2: 還原照片檔案（25–60%）──
    const photoBase = `${FileSystem.documentDirectory}body_photos/`;

    if (mode === 'overwrite') {
      await FileSystem.deleteAsync(photoBase, { idempotent: true });
    }

    const photos = metadata.photos ?? [];
    const total = photos.length;

    for (let i = 0; i < total; i++) {
      const photo = photos[i];
      const dir = `${photoBase}${photo.id}/`;

      if (mode === 'merge') {
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists) {
          onProgress(Math.round(25 + ((i + 1) / Math.max(total, 1)) * 35));
          continue;
        }
      }

      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      for (const size of ['thumb', 'grid', 'detail', 'full']) {
        const zipFile = zip.file(`photos/${photo.id}/${size}.jpg`);
        if (zipFile) {
          const data = await zipFile.async('base64');
          await FileSystem.writeAsStringAsync(`${dir}${size}.jpg`, data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      onProgress(Math.round(25 + ((i + 1) / Math.max(total, 1)) * 35));
    }

    onProgress(60);

    // ── Phase 3: 還原 DB（60–80%）──
    if (mode === 'overwrite') {
      await clearBodyPhotos(db);
      await clearDailyNotes(db);
    }

    for (const photo of photos) {
      const base = `${FileSystem.documentDirectory}body_photos/${photo.id}/`;
      await insertBodyPhotoRaw(db, {
        ...photo,
        thumbPath:  `${base}thumb.jpg`,
        gridPath:   `${base}grid.jpg`,
        detailPath: `${base}detail.jpg`,
        fullPath:   `${base}full.jpg`,
      });
    }
    onProgress(70);

    for (const note of (metadata.dailyNotes ?? [])) {
      await insertDailyNoteRaw(db, note);
    }
    onProgress(80);

    // ── Phase 4: 還原設定（80–100%）──
    if (metadata.settings) {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(metadata.settings));
    }
    onProgress(100);

    return { ok: true, count: total };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
