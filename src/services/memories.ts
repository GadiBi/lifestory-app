import { LifeEventInput } from '@/lib/schemas';

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string | null;
  endDate: string | null;
  period: string | null;
  category: string | null;
  emotions: string | null;
  media: { id: string; url: string; title: string | null; width: number | null; height: number | null }[];
}

export async function fetchMemories(period?: string, category?: string): Promise<Memory[]> {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (category) params.set('category', category);
  const res = await fetch(`/api/events?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch memories: ${res.status}`);
  const data = await res.json();
  return data.events || [];
}

export async function createMemory(input: Partial<LifeEventInput>): Promise<Memory> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create memory: ${res.status}`);
  }
  const data = await res.json();
  return data.event;
}

export async function updateMemory(id: string, input: Partial<LifeEventInput>): Promise<Memory> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update memory: ${res.status}`);
  }
  const data = await res.json();
  return data.event;
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete memory: ${res.status}`);
  }
}

export async function extractAllMemories(): Promise<{ totalEvents: number; message: string }> {
  const res = await fetch('/api/interview/extract-all', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Extraction failed: ${res.status}`);
  }
  return res.json();
}
