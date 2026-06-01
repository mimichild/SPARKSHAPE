import type { SQLiteDatabase } from 'expo-sqlite';
import type { BodyPhoto, BodyPhotoInput } from '@/types/bodyPhoto';
import { TABLE_BODY_PHOTOS } from '@/constants/db';

interface DbRow {
  id: string;
  taken_at: string;
  note: string | null;
  thumb_path: string;
  grid_path: string;
  detail_path: string;
  full_path: string;
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
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
      full_path   TEXT NOT NULL
    );
  `);
}

export async function insertBodyPhoto(
  db: SQLiteDatabase,
  input: BodyPhotoInput,
): Promise<BodyPhoto> {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO ${TABLE_BODY_PHOTOS} (id, taken_at, note, thumb_path, grid_path, detail_path, full_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.takenAt,
    input.note,
    input.thumbPath,
    input.gridPath,
    input.detailPath,
    input.fullPath,
  );
  return { id, ...input };
}

export async function getAllBodyPhotos(
  db: SQLiteDatabase,
  order: 'asc' | 'desc' = 'desc',
): Promise<BodyPhoto[]> {
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  const rows = await db.getAllAsync<DbRow>(
    `SELECT * FROM ${TABLE_BODY_PHOTOS} ORDER BY taken_at ${direction}`,
  );
  return rows.map(rowToPhoto);
}

export async function getBodyPhotoById(
  db: SQLiteDatabase,
  id: string,
): Promise<BodyPhoto | null> {
  const row = await db.getFirstAsync<DbRow>(
    `SELECT * FROM ${TABLE_BODY_PHOTOS} WHERE id = ?`,
    id,
  );
  return row ? rowToPhoto(row) : null;
}

export async function deleteBodyPhoto(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM ${TABLE_BODY_PHOTOS} WHERE id = ?`, id);
}
