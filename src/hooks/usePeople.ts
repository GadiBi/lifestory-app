'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPeople, createPerson, type Person } from '@/services/people';
import { PersonInput } from '@/lib/schemas';

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPeople();
      setPeople(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load people';
      setError(msg);
      console.error('[usePeople] load error:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPerson = useCallback(async (input: PersonInput): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await createPerson(input);
      await load();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add person';
      setError(msg);
      console.error('[usePeople] add error:', msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { people, loading, error, saving, reload: load, addPerson };
}
