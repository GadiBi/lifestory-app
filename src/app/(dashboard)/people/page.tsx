'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PersonMention {
  type: 'event' | 'conversation';
  id: string;
  title: string;
}

interface Person {
  name: string;
  relationship: string;
  mentions: PersonMention[];
}

export default function PeoplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRelationship, setNewPersonRelationship] = useState('Person');
  const [addingPerson, setAddingPerson] = useState(false);

  function fetchPeople() {
    fetch('/api/people')
      .then(res => res.json())
      .then(data => {
        setPeople(data.people || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchPeople();
  }, [session, status, router]);

  async function addPerson() {
    if (!newPersonName.trim()) return;
    setAddingPerson(true);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPersonName.trim(), relationship: newPersonRelationship }),
      });
      if (res.ok) {
        setNewPersonName('');
        setNewPersonRelationship('Person');
        setShowAddForm(false);
        setLoading(true);
        fetchPeople();
      }
    } catch (error) {
      console.error('Failed to add person:', error);
    } finally {
      setAddingPerson(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Group people by relationship type
  const familyRelations = ['Mother', 'Father', 'Grandmother', 'Grandfather', 'Brother', 'Sister', 'Wife', 'Husband', 'Son', 'Daughter', 'Uncle', 'Aunt', 'Cousin'];
  const family = people.filter(p => familyRelations.includes(p.relationship));
  const friends = people.filter(p => ['Friend'].includes(p.relationship));
  const professional = people.filter(p => ['Teacher/Mentor', 'Colleague', 'Neighbor'].includes(p.relationship));
  const others = people.filter(p => p.relationship === 'Person');

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-16">
        {/* Add Person Button & Form */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Person
            </button>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addPerson(); }}
                placeholder="Name..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                autoFocus
              />
              <select
                value={newPersonRelationship}
                onChange={(e) => setNewPersonRelationship(e.target.value)}
                className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option value="Person">Person</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Grandfather">Grandfather</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Cousin">Cousin</option>
                <option value="Friend">Friend</option>
                <option value="Teacher/Mentor">Teacher/Mentor</option>
                <option value="Colleague">Colleague</option>
                <option value="Neighbor">Neighbor</option>
              </select>
              <button
                onClick={addPerson}
                disabled={addingPerson || !newPersonName.trim()}
                className="px-4 py-2.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50"
              >
                {addingPerson ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewPersonName(''); }}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {people.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No people found yet</h2>
            <p className="text-slate-500 mb-6">Tell Bestie about the people in your life and they will appear here.</p>
            <Link
              href="/interview?new=true&context=relations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition font-medium"
            >
              Start a conversation
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {family.length > 0 && (
              <PeopleSection title="Family" people={family} />
            )}
            {friends.length > 0 && (
              <PeopleSection title="Friends" people={friends} />
            )}
            {professional.length > 0 && (
              <PeopleSection title="Teachers, Mentors & Others" people={professional} />
            )}
            {others.length > 0 && (
              <PeopleSection title="People Mentioned" people={others} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PeopleSection({ title, people }: { title: string; people: Person[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map((person) => (
          <PersonCard key={person.name} person={person} />
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  const eventMentions = person.mentions.filter(m => m.type === 'event');
  const convMentions = person.mentions.filter(m => m.type === 'conversation');

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
          {person.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{person.name}</h3>
          {person.relationship !== 'Person' && (
            <p className="text-xs text-primary">{person.relationship}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        {eventMentions.length > 0 && (
          <div className="text-slate-500">
            Mentioned in {eventMentions.length} life event{eventMentions.length !== 1 ? 's' : ''}
          </div>
        )}
        {convMentions.length > 0 && (
          <div className="text-slate-500">
            Mentioned in {convMentions.length} conversation{convMentions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Links to relevant conversations */}
      {convMentions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-primary/10 space-y-1">
          {convMentions.slice(0, 3).map((mention) => (
            <Link
              key={mention.id}
              href={`/interview?id=${mention.id}`}
              className="block text-xs text-primary hover:text-primary-dark transition truncate"
            >
              {mention.title}
            </Link>
          ))}
          {convMentions.length > 3 && (
            <span className="text-xs text-slate-400">+{convMentions.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}
