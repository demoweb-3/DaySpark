import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { dbGetSettings, dbPutSettings } from '../utils/db';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await dbGetSettings();
        if (cancelled) return;
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...stored });
        }
      } catch {
        // Non-fatal — fall back to defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Persist on change (skip initial load)
  useEffect(() => {
    if (firstLoad.current) {
      if (!loading) firstLoad.current = false;
      return;
    }
    dbPutSettings(settings).catch(() => {
      // Non-fatal
    });
  }, [settings, loading]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const replaceSettings = useCallback((newSettings: Settings) => {
    setSettings({ ...DEFAULT_SETTINGS, ...newSettings });
  }, []);

  return { settings, loading, updateSettings, replaceSettings };
}
