import { createContext, useContext, useEffect, useState } from 'react';
import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { initDB } from '@/services/bodyPhotoService';
import { DB_NAME } from '@/constants/db';

interface DBContextValue {
  db: SQLiteDatabase | null;
}

const DBContext = createContext<DBContextValue>({ db: null });

export function DBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    let active = true;
    openDatabaseAsync(DB_NAME).then(async (database) => {
      await initDB(database);
      if (active) setDb(database);
    });
    return () => { active = false; };
  }, []);

  return <DBContext.Provider value={{ db }}>{children}</DBContext.Provider>;
}

export function useDBContext(): SQLiteDatabase {
  const { db } = useContext(DBContext);
  if (!db) throw new Error('useDBContext must be used inside DBProvider');
  return db;
}
