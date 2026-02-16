'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Media {
  url: string;
  title: string | null;
}

interface LifeEvent {
  title: string;
  description: string;
  date: string | null;
  period: string | null;
  category: string | null;
  emotions: string | null;
  media: Media[];
}

interface StoryData {
  title: string;
  userName: string;
  events: LifeEvent[];
  createdAt: string;
}

const PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood', years: '0-5', color: 'from-pink-400 to-rose-400', bg: 'bg-pink-50', text: 'text-pink-700' },
  { id: 'childhood', label: 'Childhood', years: '6-12', color: 'from-orange-400 to-amber-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  { id: 'teenage', label: 'Teenage Years', years: '13-19', color: 'from-amber-400 to-yellow-400', bg: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'young_adult', label: 'Young Adult', years: '20-35', color: 'from-emerald-400 to-green-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'middle_adult', label: 'Middle Adult', years: '36-55', color: 'from-blue-400 to-indigo-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  { id: 'later_adult', label: 'Later Adult', years: '56+', color: 'from-purple-400 to-violet-400', bg: 'bg-purple-50', text: 'text-purple-700' },
];

const CATEGORIES = [
  { id: 'family', icon: '👨‍👩‍👧' }, { id: 'education', icon: '🎓' }, { id: 'career', icon: '💼' },
  { id: 'relationship', icon: '❤️' }, { id: 'achievement', icon: '🏆' }, { id: 'challenge', icon: '🧗' },
  { id: 'milestone', icon: '🎯' }, { id: 'travel', icon: '✈️' }, { id: 'health', icon: '🏥' }, { id: 'other', icon: '📝' },
];

export default function PublicStoryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string | null } | null>(null);

  useEffect(() => {
    fetchStory();
  }, [code]);

  async function fetchStory(pwd?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = pwd ? `/api/story/${code}?password=${encodeURIComponent(pwd)}` : `/api/story/${code}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.status === 401 && data.passwordProtected) {
        setPasswordRequired(true);
        setStoryTitle(data.title || 'Protected Story');
        if (pwd) {
          setError('Invalid password');
        }
      } else if (!response.ok) {
        setError(data.error || 'Failed to load story');
      } else {
        setStory(data);
        setPasswordRequired(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchStory(password);
  }

  const getPeriod = (id: string | null) => PERIODS.find(p => p.id === id);
  const getCategory = (id: string | null) => CATEGORIES.find(c => c.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading story...
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">{storyTitle}</h1>
            <p className="text-slate-500 mt-2">This story is password protected</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-4"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium"
            >
              View Story
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-primary transition">
              Create your own life story
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">{error}</h1>
          <p className="text-slate-500 mb-6">This story may have been removed or the link has expired.</p>
          <Link href="/" className="text-primary hover:underline">
            Create your own life story
          </Link>
        </div>
      </div>
    );
  }

  if (!story) return null;

  // Group events by period
  const eventsByPeriod = PERIODS
    .map(p => ({ ...p, events: story.events.filter(e => e.period === p.id) }))
    .filter(g => g.events.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{story.title}</h1>
              <p className="text-sm text-slate-500">The life story of {story.userName}</p>
            </div>
            <Link
              href="/"
              className="text-xs sm:text-sm text-slate-500 hover:text-primary transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-8" />
                <path d="M9 22c0-2 1-3 3-3s3 1 3 3" />
                <path d="M12 14c-4 0-7-3-7-7 0-2.5 1.5-4.5 4-5.5.5 2 2 3 3 3s2.5-1 3-3c2.5 1 4 3 4 5.5 0 4-3 7-7 7z" />
              </svg>
              <span className="hidden sm:inline">Create your own</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {story.events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">This story doesn&apos;t have any events yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-emerald-300 to-purple-300" />

            <div className="space-y-12">
              {eventsByPeriod.map((group) => (
                <div key={group.id} className="relative">
                  {/* Period Header */}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-xs sm:text-lg">{group.years}</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{group.label}</h2>
                      <p className="text-sm text-slate-500">{group.events.length} memories</p>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-4 ml-12 sm:ml-20">
                    {group.events.map((event, idx) => {
                      const category = getCategory(event.category);

                      return (
                        <div
                          key={idx}
                          className="relative bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm"
                        >
                          {/* Timeline Node */}
                          <div className={`absolute -left-[34px] sm:-left-[52px] top-6 w-3 h-3 rounded-full bg-gradient-to-br ${group.color} ring-4 ring-white`} />

                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {category && (
                              <span className="text-xl">{category.icon}</span>
                            )}
                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                          </div>

                          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                            {event.description}
                          </p>

                          {/* Photos */}
                          {event.media && event.media.length > 0 && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {event.media.map((m, i) => (
                                <button
                                  key={i}
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
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
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
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm mb-4">
            Shared on {new Date(story.createdAt).toLocaleDateString()}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H12v10l-2-1.5L8 12V2" />
              <path d="M20 19.5v-15A2.5 2.5 0 0017.5 2H12v10l2-1.5 2 1.5V2" />
            </svg>
            Create Your Own Life Story
          </Link>
          <p className="text-xs text-slate-400 mt-4">Powered by Live Story</p>
        </div>
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
          <Image
            src={selectedImage.url}
            alt={selectedImage.title || 'Memory photo'}
            width={1200}
            height={800}
            className="max-h-[90vh] w-auto object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
