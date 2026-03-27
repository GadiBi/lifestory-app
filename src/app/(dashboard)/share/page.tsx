'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ErrorBanner from '@/components/ErrorBanner';


interface SharedStory {
  id: string;
  shareCode: string;
  title: string | null;
  isPublic: boolean;
  password: string | null;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  periodsIncluded: string | null;
  createdAt: string;
}

const PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood (0-5)' },
  { id: 'childhood', label: 'Childhood (6-12)' },
  { id: 'teenage', label: 'Teenage (13-19)' },
  { id: 'young_adult', label: 'Young Adult (20-35)' },
  { id: 'middle_adult', label: 'Middle Adult (36-55)' },
  { id: 'later_adult', label: 'Later Adult (56+)' },
];

export default function SharePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sharedStories, setSharedStories] = useState<SharedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchSharedStories();
  }, [session, status, router]);

  async function fetchSharedStories() {
    try {
      const response = await fetch('/api/share');
      if (!response.ok) throw new Error(`Failed to load shares: ${response.status}`);
      const data = await response.json();
      setSharedStories(data.sharedStories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  }

  async function createShare() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          isPublic,
          password: usePassword ? password : undefined,
          expiresIn: expiresIn || undefined,
          periods: selectedPeriods.length > 0 ? selectedPeriods : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create share: ${response.status}`);
      }
      fetchSharedStories();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share');
    } finally {
      setCreating(false);
    }
  }

  async function deleteShare(id: string) {
    if (!confirm('Delete this shared link? People with this link will no longer be able to view your story.')) return;
    // Optimistic update
    setSharedStories(prev => prev.filter(s => s.id !== id));
    try {
      const response = await fetch(`/api/share?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        setError(`Failed to delete share: ${response.status}`);
        fetchSharedStories(); // revert
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share');
      fetchSharedStories(); // revert
    }
  }

  function resetForm() {
    setTitle('');
    setIsPublic(true);
    setPassword('');
    setUsePassword(false);
    setExpiresIn('');
    setSelectedPeriods([]);
  }

  function copyLink(shareCode: string, id: string) {
    const url = `${window.location.origin}/story/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function togglePeriod(periodId: string) {
    setSelectedPeriods(prev =>
      prev.includes(periodId)
        ? prev.filter(p => p !== periodId)
        : [...prev, periodId]
    );
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 ml-14">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Share Your Story</h1>
                <p className="text-sm text-slate-500">Create shareable links for family and friends</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Link
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        {sharedStories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">No shared links yet</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Create a shareable link to let your family and friends view your life story.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedStories.map(story => (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{story.title || 'Untitled Story'}</h3>
                      {story.password && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Protected
                        </span>
                      )}
                      {story.expiresAt && new Date(story.expiresAt) > new Date() && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                          Expires {new Date(story.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {story.expiresAt && new Date(story.expiresAt) <= new Date() && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full">
                          Expired
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {story.viewCount} views
                      </span>
                      <span>Created {new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>

                    {story.periodsIncluded && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {story.periodsIncluded.split(',').map(p => (
                          <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {PERIODS.find(period => period.id === p)?.label || p}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                      <code className="text-sm text-slate-600 truncate flex-1">
                        {typeof window !== 'undefined' ? `${window.location.origin}/story/${story.shareCode}` : `/story/${story.shareCode}`}
                      </code>
                      <button
                        onClick={() => copyLink(story.shareCode, story.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          copiedId === story.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === story.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={`/story/${story.shareCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition"
                      title="Preview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      onClick={() => deleteShare(story.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Create Shareable Link</h2>
              <p className="text-sm text-slate-500 mt-1">Configure how you want to share your story</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Life Story"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              {/* Life Periods */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Include Periods
                </label>
                <p className="text-xs text-slate-500 mb-3">Leave empty to include all periods</p>
                <div className="grid grid-cols-2 gap-2">
                  {PERIODS.map(period => (
                    <button
                      key={period.id}
                      onClick={() => togglePeriod(period.id)}
                      className={`p-3 text-left text-sm rounded-xl border transition ${
                        selectedPeriods.includes(period.id)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Protection */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-slate-700">Password protect</span>
                </label>
                {usePassword && (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full mt-3 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Link Expiration
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">Never expires</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createShare}
                disabled={creating || (usePassword && !password)}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium disabled:opacity-50"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Link'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
