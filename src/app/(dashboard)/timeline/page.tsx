'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LifeEvent {
  id: string;
  title: string;
  description: string;
  date: string | null;
  period: string | null;
  category: string | null;
  emotions: string | null;
}

const PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood', color: 'bg-pink-100 text-pink-700' },
  { id: 'childhood', label: 'Childhood', color: 'bg-orange-100 text-orange-700' },
  { id: 'teenage', label: 'Teenage', color: 'bg-amber-100 text-amber-700' },
  { id: 'young_adult', label: 'Young Adult', color: 'bg-green-100 text-green-700' },
  { id: 'middle_adult', label: 'Middle Adult', color: 'bg-blue-100 text-blue-700' },
  { id: 'later_adult', label: 'Later Adult', color: 'bg-purple-100 text-purple-700' },
];

const CATEGORIES = [
  { id: 'family', icon: '👨‍👩‍👧' }, { id: 'education', icon: '🎓' }, { id: 'career', icon: '💼' },
  { id: 'relationship', icon: '❤️' }, { id: 'achievement', icon: '🏆' }, { id: 'challenge', icon: '🧗' },
  { id: 'milestone', icon: '🎯' }, { id: 'travel', icon: '✈️' }, { id: 'health', icon: '🏥' }, { id: 'other', icon: '📝' },
];

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchEvents();
  }, [session, status, router, filterPeriod, filterCategory]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPeriod) params.set('period', filterPeriod);
      if (filterCategory) params.set('category', filterCategory);
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Delete this event?')) return;
    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  const getPeriod = (id: string | null) => PERIODS.find(p => p.id === id);
  const getCategory = (id: string | null) => CATEGORIES.find(c => c.id === id);
  const eventsByPeriod = PERIODS.map(p => ({ ...p, events: events.filter(e => e.period === p.id) })).filter(g => g.events.length > 0);

  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-600">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Life Timeline</h1>
          </div>
          <div className="flex gap-2">
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700">
              <option value="">All Periods</option>
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No events yet</h2>
            <p className="text-slate-500 mb-6">Start a conversation to document your life story</p>
            <Link href="/interview" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
              Start Conversation
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {eventsByPeriod.map(group => (
              <div key={group.id}>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${group.color}`}>
                  {group.label}
                </div>
                <div className="space-y-3 ml-4 border-l-2 border-slate-200 pl-6">
                  {group.events.map(event => (
                    <div key={event.id} className="relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition">
                      <div className="absolute -left-[31px] top-5 w-4 h-4 bg-white border-2 border-primary rounded-full" />
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getCategory(event.category)?.icon || '📝'}</span>
                            <h3 className="font-medium text-slate-900">{event.title}</h3>
                          </div>
                          <p className="text-slate-600 text-sm mb-2">{event.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {event.date && <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">{new Date(event.date).toLocaleDateString()}</span>}
                            {event.emotions && <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded">{event.emotions}</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteEvent(event.id)} className="p-1 text-slate-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
