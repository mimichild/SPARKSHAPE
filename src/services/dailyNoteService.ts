import type { SQLiteDatabase } from 'expo-sqlite';
import type { DailyNote } from '@/types/dailyNote';

const TABLE = 'daily_notes';

interface DbRow {
  id: string;
  date: string;
  content: string;
  created_at: string;
}

function rowToNote(row: DbRow): DailyNote {
  return { id: row.id, date: row.date, content: row.content, createdAt: row.created_at };
}

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function initDailyNotesTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id         TEXT PRIMARY KEY,
      date       TEXT NOT NULL UNIQUE,
      content    TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

export async function upsertDailyNote(
  db: SQLiteDatabase,
  content: string,
  date: string = today(),
): Promise<void> {
  const id = `note-${date}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO ${TABLE} (id, date, content, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET content = excluded.content`,
    id, date, content, now,
  );
}

export async function getDailyNote(
  db: SQLiteDatabase,
  date: string = today(),
): Promise<DailyNote | null> {
  const row = await db.getFirstAsync<DbRow>(
    `SELECT * FROM ${TABLE} WHERE date = ?`, date,
  );
  return row ? rowToNote(row) : null;
}
