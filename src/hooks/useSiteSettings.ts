import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export function useSiteSettings() {
  const [settings, setSettings] = useState<{ key: string; value: string }[] | null>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.values(data).map((entry: any) => ({
        key: entry.key,
        value: entry.value,
      }));
      setSettings(arr);
    });

    return () => unsubscribe();
  }, []);

  function get(keyName: string) {
    if (!settings) return '';
    const found = settings.find((s) => s.key === keyName);
    return found?.value || '';
  }

  return { settings, get };
}