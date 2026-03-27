'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchMemories, extractAllMemories, type Memory } from '@/services/memories';

export function useMemories(period?: string, category?: string) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMemories(period, category);
      setMemories(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load memories';
      setError(msg);
      console.error('[useMemories] load error:', msg);
    } finally {
      setLoading(false);
    }
  }, [period, category]);

  const syncAndLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await extractAllMemories();
    } catch (err) {
      // extraction errors are non-fatal — log but keep going
      console.warn('[useMemories] extraction skipped:', err instanceof Error ? err.message : err);
    }
    await load();
  }, [load]);

  const extract = useCallback(async (): Promise<number> => {
    setExtracting(true);
    setError(null);
    try {
      const result = await extractAllMemories();
      if (result.totalEvents > 0) await load();
      return result.totalEvents;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setError(msg);
      console.error('[useMemories] extract error:', msg);
      return 0;
    } finally {
      setExtracting(false);
    }
  }, [load]);

  useEffect(() => {
    syncAndLoad();
  }, [syncAndLoad]);

  return { memories, setMemories, loading, error, extracting, reload: load, extract };
}
