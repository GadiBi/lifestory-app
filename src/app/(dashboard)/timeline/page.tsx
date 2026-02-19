'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Media {
  id: string;
  url: string;
  title: string | null;
  width: number | null;
  height: number | null;
}

interface LifeEvent {
  id: string;
  title: string;
  description: string;
  date: string | null;
  period: string | null;
  category: string | null;
  emotions: string | null;
  media: Media[];
}

const PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood', years: '0-5', color: 'from-pink-400 to-rose-400', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  { id: 'childhood', label: 'Childhood', years: '6-12', color: 'from-orange-400 to-amber-400', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { id: 'teenage', label: 'Teenage Years', years: '13-19', color: 'from-amber-400 to-yellow-400', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { id: 'young_adult', label: 'Young Adult', years: '20-35', color: 'from-emerald-400 to-green-400', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { id: 'middle_adult', label: 'Middle Adult', years: '36-55', color: 'from-blue-400 to-indigo-400', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'later_adult', label: 'Later Adult', years: '56+', color: 'from-purple-400 to-violet-400', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
];

const CATEGORIES = [
  { id: 'family', icon: '👨‍👩‍👧', label: 'Family' },
  { id: 'education', icon: '🎓', label: 'Education' },
  { id: 'career', icon: '💼', label: 'Career' },
  { id: 'relationship', icon: '❤️', label: 'Relationship' },
  { id: 'achievement', icon: '🏆', label: 'Achievement' },
  { id: 'challenge', icon: '🧗', label: 'Challenge' },
  { id: 'milestone', icon: '🎯', label: 'Milestone' },
  { id: 'travel', icon: '✈️', label: 'Travel' },
  { id: 'health', icon: '🏥', label: 'Health' },
  { id: 'other', icon: '📝', label: 'Other' },
];

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const filterPeriod = '';
  const filterCategory = '';
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string | null } | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoUpload(eventId: string, file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lifeEventId', eventId);

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadingFor(null);
    }
  }

  async function addMemory() {
    if (!newMemoryTitle.trim()) return;
    setAddingMemory(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMemoryTitle.trim() }),
      });
      if (res.ok) {
        setNewMemoryTitle('');
        setShowAddForm(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to add memory:', error);
    } finally {
      setAddingMemory(false);
    }
  }

  function toggleExpanded(eventId: string) {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  const getPeriod = (id: string | null) => PERIODS.find(p => p.id === id);
  const getCategory = (id: string | null) => CATEGORIES.find(c => c.id === id);
  const eventsByPeriod = PERIODS.map(p => ({ ...p, events: events.filter(e => e.period === p.id) })).filter(g => g.events.length > 0);
  const totalPhotos = events.reduce((sum, e) => sum + e.media.length, 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar */}
      <header className="bg-white border-b border-slate-100 sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Memories</h1>
                <p className="text-sm text-slate-500">{events.length} events · {totalPhotos} photos</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Memory
              </button>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Add Memory Form */}
      {showAddForm && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <input
              type="text"
              value={newMemoryTitle}
              onChange={(e) => setNewMemoryTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addMemory(); }}
              placeholder="Memory title..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              autoFocus
            />
            <button
              onClick={addMemory}
              disabled={addingMemory || !newMemoryTitle.trim()}
              className="px-4 py-2.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50"
            >
              {addingMemory ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewMemoryTitle(''); }}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading your timeline...
            </div>
          </div>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'timeline' ? (
          <TimelineView
            eventsByPeriod={eventsByPeriod}
            expandedEvents={expandedEvents}
            toggleExpanded={toggleExpanded}
            deleteEvent={deleteEvent}
            setSelectedImage={setSelectedImage}
            setUploadingFor={setUploadingFor}
            getCategory={getCategory}
          />
        ) : (
          <GridView
            events={events}
            expandedEvents={expandedEvents}
            toggleExpanded={toggleExpanded}
            deleteEvent={deleteEvent}
            setSelectedImage={setSelectedImage}
            setUploadingFor={setUploadingFor}
            getPeriod={getPeriod}
            getCategory={getCategory}
          />
        )}
      </main>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-5xl max-h-[90vh] relative">
            <Image
              src={selectedImage.url}
              alt={selectedImage.title || 'Memory photo'}
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto object-contain rounded-lg"
            />
            {selectedImage.title && (
              <p className="text-white text-center mt-4 text-lg">{selectedImage.title}</p>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadingFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Photo to Memory</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(uploadingFor, file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-12 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition flex flex-col items-center gap-3"
            >
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-600">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-600">Click to select a photo</span>
                </>
              )}
            </button>
            <button
              onClick={() => setUploadingFor(null)}
              className="w-full mt-3 py-2 text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-3">Your timeline is empty</h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Start having conversations with your AI biographer to capture and organize your life memories.
      </p>
      <Link
        href="/interview"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Start Your Story
      </Link>
    </div>
  );
}

interface TimelineViewProps {
  eventsByPeriod: Array<{
    id: string;
    label: string;
    years: string;
    color: string;
    bg: string;
    text: string;
    border: string;
    events: LifeEvent[];
  }>;
  expandedEvents: Set<string>;
  toggleExpanded: (id: string) => void;
  deleteEvent: (id: string) => void;
  setSelectedImage: (img: { url: string; title: string | null } | null) => void;
  setUploadingFor: (id: string | null) => void;
  getCategory: (id: string | null) => { id: string; icon: string; label: string } | undefined;
}

function TimelineView({
  eventsByPeriod,
  expandedEvents,
  toggleExpanded,
  deleteEvent,
  setSelectedImage,
  setUploadingFor,
  getCategory
}: TimelineViewProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-emerald-300 to-purple-300" />

      <div className="space-y-12">
        {eventsByPeriod.map((group) => (
          <div key={group.id} className="relative">
            {/* Period Header */}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-xs sm:text-lg">{group.years}</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{group.label}</h2>
                <p className="text-sm text-slate-500">{group.events.length} memories</p>
              </div>
            </div>

            {/* Events */}
            <div className="space-y-4 ml-10 sm:ml-20">
              {group.events.map((event) => {
                const isExpanded = expandedEvents.has(event.id);
                const category = getCategory(event.category);
                const needsExpand = event.description.length > 200;

                return (
                  <div
                    key={event.id}
                    className={`relative bg-white rounded-2xl border ${group.border} p-4 sm:p-5 hover:shadow-md transition-all duration-200`}
                  >
                    {/* Timeline Node */}
                    <div className={`absolute -left-[26px] sm:-left-[52px] top-6 w-3 h-3 rounded-full bg-gradient-to-br ${group.color} ring-4 ring-white`} />

                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {category && (
                            <span className="text-xl" title={category.label}>{category.icon}</span>
                          )}
                          <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{event.title}</h3>
                        </div>

                        <p className={`text-slate-600 text-sm sm:text-base leading-relaxed ${!isExpanded && needsExpand ? 'line-clamp-3' : ''}`}>
                          {event.description}
                        </p>

                        {needsExpand && (
                          <button
                            onClick={() => toggleExpanded(event.id)}
                            className="text-primary text-sm font-medium mt-2 hover:underline"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}

                        {/* Photos */}
                        {event.media.length > 0 && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {event.media.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setSelectedImage({ url: m.url, title: m.title })}
                                className="relative group"
                              >
                                <Image
                                  src={m.url}
                                  alt={m.title || 'Memory'}
                                  width={80}
                                  height={80}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-200 group-hover:border-primary transition"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                          {event.date && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                          )}
                          {event.emotions && (
                            <span className={`px-2 py-1 ${group.bg} ${group.text} rounded-md`}>
                              {event.emotions}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setUploadingFor(event.id)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition"
                          title="Add photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GridViewProps {
  events: LifeEvent[];
  expandedEvents: Set<string>;
  toggleExpanded: (id: string) => void;
  deleteEvent: (id: string) => void;
  setSelectedImage: (img: { url: string; title: string | null } | null) => void;
  setUploadingFor: (id: string | null) => void;
  getPeriod: (id: string | null) => typeof PERIODS[number] | undefined;
  getCategory: (id: string | null) => { id: string; icon: string; label: string } | undefined;
}

function GridView({
  events,
  expandedEvents,
  toggleExpanded,
  deleteEvent,
  setSelectedImage,
  setUploadingFor,
  getPeriod,
  getCategory
}: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const period = getPeriod(event.period);
        const category = getCategory(event.category);
        const isExpanded = expandedEvents.has(event.id);
        const needsExpand = event.description.length > 150;
        const hasPhotos = event.media.length > 0;

        return (
          <div
            key={event.id}
            className={`bg-white rounded-2xl border ${period?.border || 'border-slate-200'} overflow-hidden hover:shadow-lg transition-all duration-200`}
          >
            {/* Photo Header */}
            {hasPhotos ? (
              <button
                onClick={() => setSelectedImage({ url: event.media[0].url, title: event.media[0].title })}
                className="relative w-full h-40 overflow-hidden group"
              >
                <Image
                  src={event.media[0].url}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {event.media.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                    +{event.media.length - 1}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </button>
            ) : (
              <div className={`h-3 bg-gradient-to-r ${period?.color || 'from-slate-300 to-slate-400'}`} />
            )}

            <div className="p-4">
              {/* Category & Title */}
              <div className="flex items-center gap-2 mb-2">
                {category && <span className="text-lg">{category.icon}</span>}
                <h3 className="font-semibold text-slate-900 line-clamp-1">{event.title}</h3>
              </div>

              {/* Description */}
              <p className={`text-slate-600 text-sm leading-relaxed ${!isExpanded && needsExpand ? 'line-clamp-2' : ''}`}>
                {event.description}
              </p>
              {needsExpand && (
                <button
                  onClick={() => toggleExpanded(event.id)}
                  className="text-primary text-sm font-medium mt-1 hover:underline"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                {period && (
                  <span className={`px-2 py-1 ${period.bg} ${period.text} rounded-md`}>
                    {period.label}
                  </span>
                )}
                {event.date && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setUploadingFor(event.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add Photo
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
