'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LifeEvent {
  id: string;
  title: string;
  description: string;
  period: string | null;
  category: string | null;
  emotions: string | null;
  date: string | null;
  createdAt: string;
}

interface ConversationMatch {
  id: string;
  currentPeriod: string;
  updatedAt: string;
  matchingMessages: Array<{
    role: string;
    content: string;
    preview: string;
  }>;
}

const PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood (0-5)' },
  { id: 'childhood', label: 'Childhood (6-12)' },
  { id: 'teenage', label: 'Teenage (13-19)' },
  { id: 'young_adult', label: 'Young Adult (20-35)' },
  { id: 'middle_adult', label: 'Middle Adult (36-55)' },
  { id: 'later_adult', label: 'Later Adult (56+)' },
];

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEvents([]);
      setConversations([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: 'all',
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      setEvents(data.events || []);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [searchParams, performSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(query);
    // Update URL without navigation
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    window.history.replaceState({}, '', `/search?${params}`);
  }

  function highlightText(text: string, searchTerm: string) {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  const totalResults = events.length + conversations.length;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-4 ml-14">
            <h1 className="text-lg font-semibold text-slate-900">Search</h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your life story..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 text-lg"
                autoFocus
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {searched && !loading && (
          <p className="text-sm text-slate-500 mb-4">
            {totalResults === 0
              ? 'No results found'
              : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`}
          </p>
        )}

        {/* Events Results */}
        {events.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Life Events ({events.length})
            </h2>
            <div className="space-y-3">
              {events.map(event => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition"
                >
                  <h3 className="font-medium text-slate-900 mb-1">
                    {highlightText(event.title, query)}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {highlightText(event.description, query)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.period && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {PERIODS.find(p => p.id === event.period)?.label || event.period}
                      </span>
                    )}
                    {event.category && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full capitalize">
                        {event.category}
                      </span>
                    )}
                    {event.emotions && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
                        {highlightText(event.emotions, query)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations Results */}
        {conversations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Conversations ({conversations.length})
            </h2>
            <div className="space-y-3">
              {conversations.map(conv => (
                <Link
                  key={conv.id}
                  href={`/interview?id=${conv.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                      {PERIODS.find(p => p.id === conv.currentPeriod)?.label || conv.currentPeriod}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {conv.matchingMessages.map((msg, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-primary' : 'text-slate-500'}`}>
                        {msg.role === 'user' ? 'You' : 'AI'}:
                      </span>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {highlightText(msg.preview, query)}
                      </p>
                    </div>
                  ))}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searched && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Search Your Story</h3>
            <p className="text-slate-500">Find memories, people, places, and moments from your life</p>
          </div>
        )}
      </main>
    </div>
  );
}
