import { PersonInput } from '@/lib/schemas';

export interface PersonMention {
  type: 'event' | 'conversation';
  id: string;
  title: string;
}

export interface Person {
  name: string;
  relationship: string;
  mentions: PersonMention[];
}

export async function fetchPeople(): Promise<Person[]> {
  const res = await fetch('/api/people');
  if (!res.ok) throw new Error(`Failed to fetch people: ${res.status}`);
  const data = await res.json();
  return data.people || [];
}

export async function createPerson(input: PersonInput): Promise<void> {
  const res = await fetch('/api/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create person: ${res.status}`);
  }
}
