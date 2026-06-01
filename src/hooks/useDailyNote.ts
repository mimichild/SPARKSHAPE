import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getDailyNote, upsertDailyNote } from '@/services/dailyNoteService';

export function useDailyNote() {
  const db = useSQLiteContext();
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getDailyNote(db).then((note) => {
      if (note) setContent(note.content);
      setLoaded(true);
    });
  }, [db]);

  const save = useCallback(
    (text: string) => {
      setContent(text);
      upsertDailyNote(db, text).catch((e) => console.warn('save note failed:', e));
    },
    [db],
  );

  return { content, save, loaded };
}
