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
  createdAt: string;
}

const LIFE_PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'childhood', label: 'Childhood', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'teenage', label: 'Teenage', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'young_adult', label: 'Young Adult', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'middle_adult', label: 'Middle Adult', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'later_adult', label: 'Later Adult', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const CATEGORIES = [
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'relationship', label: 'Relationship', icon: '❤️' },
  { id: 'achievement', label: 'Achievement', icon: '🏆' },
  { id: 'challenge', label: 'Challenge', icon: '🧗' },
  { id: 'milestone', label: 'Milestone', icon: '🎯' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'other', label: 'Other', icon: '📝' },
];

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

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
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }

  function getPeriodStyle(period: string | null) {
    const found = LIFE_PERIODS.find((p) => p.id === period);
    return found?.color || 'bg-slate-100 text-slate-700 border-slate-200';
  }

  function getPeriodLabel(period: string | null) {
    const found = LIFE_PERIODS.find((p) => p.id === period);
    return found?.label || period || 'Unknown';
  }

  function getCategoryIcon(category: string | null) {
    const found = CATEGORIES.find((c) => c.id === category);
    return found?.icon || '📝';
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Group events by period
  const eventsByPeriod = LIFE_PERIODS.map((period) => ({
    ...period,
    events: events.filter((e) => e.period === period.id),
  })).filter((group) => group.events.length > 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Your Life Timeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900"
            >
              <option value="">All Periods</option>
              {LIFE_PERIODS.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-slate-600 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No life events yet</h2>
            <p className="text-slate-600 mb-6">Start an interview to begin documenting your life story.</p>
            <Link
              href="/interview"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start Interview
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {eventsByPeriod.map((group) => (
              <div key={group.id}>
                <h2 className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-6 border ${group.color}`}>
                  {group.label}
                </h2>
                <div className="space-y-4 ml-4 border-l-2 border-slate-200 pl-6">
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-6 w-4 h-4 bg-white border-2 border-slate-300 rounded-full" />

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getCategoryIcon(event.category)}</span>
                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                          </div>
                          <p className="text-slate-600 text-sm mb-3">{event.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {event.date && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                {formatDate(event.date)}
                              </span>
                            )}
                            {event.emotions && (
                              <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded">
                                {event.emotions}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Delete event"
                        >
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
