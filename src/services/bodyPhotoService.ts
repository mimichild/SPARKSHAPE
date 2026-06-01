import type { SQLiteDatabase } from 'expo-sqlite';
import type { BodyPhoto, BodyPhotoInput, PhotoType } from '@/types/bodyPhoto';
import { TABLE_BODY_PHOTOS } from '@/constants/db';
import { initDailyNotesTable } from './dailyNoteService';

interface DbRow {
  id: string;
  taken_at: string;
  note: string | null;
  thumb_path: string;
  grid_path: string;
  detail_path: string;
  full_path: string;
  photo_type: string | null;
  brightness: number | null;
  contrast: number | null;
  weight: string | null;
  chest: string | null;
  waist: string | null;
  lower_waist: string | null;
  hip: string | null;
}

function rowToPhoto(row: DbRow): BodyPhoto {
  return {
    id: row.id,
    takenAt: row.taken_at,
    note: row.note,
    thumbPath: row.thumb_path,
    gridPath: row.grid_path,
    detailPath: row.detail_path,
    fullPath: row.full_path,
    photoType: (row.photo_type as PhotoType) ?? 'front',
    brightness: row.brightness ?? 1.0,
    contrast: row.contrast ?? 1.0,
    weight: row.weight,
    chest: row.chest,
    waist: row.waist,
    lowerWaist: row.lower_waist,
    hip: row.hip,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function addColumnIfMissing(db: SQLiteDatabase, column: string, def: string) {
  try {
    await db.execAsync(`ALTER TABLE ${TABLE_BODY_PHOTOS} ADD COLUMN ${column} ${def};`);
  } catch { /* already exists */ }
}

export async function initDB(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_BODY_PHOTOS} (
      id          TEXT PRIMARY KEY,
      taken_at    TEXT NOT NULL,
      note        TEXT,
      thumb_path  TEXT NOT NULL,
      grid_path   TEXT NOT NULL,
      detail_path TEXT NOT NULL,
      full_path   TEXT NOT NULL,
      photo_type  TEXT NOT NULL DEFAULT 'front',
      brightness  REAL NOT NULL DEFAULT 1.0,
      contrast    REAL NOT NULL DEFAULT 1.0,
      weight      TEXT,
      chest       TEXT,
      waist       TEXT,
      lower_waist TEXT,
      hip         TEXT
    );
  `);
  // 遷移舊欄位
  await addColumnIfMissing(db, 'photo_type',  "TEXT NOT NULL DEFAULT 'front'");
  await addColumnIfMissing(db, 'brightness',  'REAL NOT NULL DEFAULT 1.0');
  await addColumnIfMissing(db, 'contrast',    'REAL NOT NULL DEFAULT 1.0');
  await addColumnIfMissing(db, 'weight',      'TEXT');
  await addColumnIfMissing(db, 'chest',       'TEXT');
  await addColumnIfMissing(db, 'waist',       'TEXT');
  await addColumnIfMissing(db, 'lower_waist', 'TEXT');
  await addColumnIfMissing(db, 'hip',         'TEXT');

  await initDailyNotesTable(db);
}

export async function insertBodyPhoto(
  db: SQLiteDatabase,
  input: BodyPhotoInput,
): Promise<BodyPhoto> {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO ${TABLE_BODY_PHOTOS}
       (id, taken_at, note, thumb_path, grid_path, detail_path, full_path,
        photo_type, brightness, contrast, weight, chest, waist, lower_waist, hip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.takenAt, input.note,
    input.thumbPath, input.gridPath, input.detailPath, input.fullPath,
    input.photoType, input.brightness, input.contrast,
    input.weight, input.chest, input.waist, input.lowerWaist, input.hip,
  );
  return { id, ...input };
}

export async function getAllBodyPhotos(
  db: SQLiteDatabase,
  order: 'asc' | 'desc' = 'desc',
): Promise<BodyPhoto[]> {
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  const rows = await db.getAllAsync<DbRow>(
    `SELECT * FROM ${TABLE_BODY_PHOTOS} ORDER BY taken_at ${dir}`,
  );
  return rows.map(rowToPhoto);
}

export async function getBodyPhotoById(
  db: SQLiteDatabase,
  id: string,
): Promise<BodyPhoto | null> {
  const row = await db.getFirstAsync<DbRow>(
    `SELECT * FROM ${TABLE_BODY_PHOTOS} WHERE id = ?`, id,
  );
  return row ? rowToPhoto(row) : null;
}

export async function deleteBodyPhoto(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM ${TABLE_BODY_PHOTOS} WHERE id = ?`, id);
}

/** 刪除指定日期＋類型的所有照片記錄，回傳被刪除的 id 列表（供呼叫方清除檔案） */
export async function deletePhotosByDateAndType(
  db: SQLiteDatabase,
  date: string,   // YYYY-MM-DD
  photoType: PhotoType,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM ${TABLE_BODY_PHOTOS}
     WHERE substr(taken_at, 1, 10) = ? AND photo_type = ?`,
    date, photoType,
  );
  for (const row of rows) {
    await db.runAsync(`DELETE FROM ${TABLE_BODY_PHOTOS} WHERE id = ?`, row.id);
  }
  return rows.map((r) => r.id);
}

export async function updateBodyPhotoMeta(
  db: SQLiteDatabase,
  id: string,
  updates: {
    brightness:  number;
    contrast:    number;
    weight:      string | null;
    chest:       string | null;
    waist:       string | null;
    lowerWaist:  string | null;
    hip:         string | null;
  },
): Promise<void> {
  await db.runAsync(
    `UPDATE ${TABLE_BODY_PHOTOS}
     SET brightness = ?, contrast = ?, weight = ?, chest = ?, waist = ?, lower_waist = ?, hip = ?
     WHERE id = ?`,
    updates.brightness, updates.contrast,
    updates.weight, updates.chest, updates.waist, updates.lowerWaist, updates.hip,
    id,
  );
}
