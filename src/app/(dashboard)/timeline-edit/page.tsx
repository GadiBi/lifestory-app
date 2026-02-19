'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string | null;
  period: string | null;
  category: string | null;
  emotions: string | null;
}

const CATEGORIES = [
  { id: 'family', label: 'Family' },
  { id: 'education', label: 'Education' },
  { id: 'career', label: 'Career' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'achievement', label: 'Achievement' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'milestone', label: 'Milestone' },
  { id: 'travel', label: 'Travel' },
  { id: 'health', label: 'Health' },
  { id: 'other', label: 'Other' },
];

export default function TimelineEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchEntries();
  }, [session, status, router]);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEntries(data.events || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormTitle('');
    setFormDescription('');
    setFormDate('');
    setFormCategory('');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(entry: TimelineEntry) {
    setFormTitle(entry.title);
    setFormDescription(entry.description || '');
    setFormDate(entry.date ? entry.date.slice(0, 10) : '');
    setFormCategory(entry.category || '');
    setEditingId(entry.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory || null,
      };
      if (formDate) body.date = new Date(formDate).toISOString();

      if (editingId) {
        // Update existing
        const res = await fetch(`/api/events/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchEntries();
          resetForm();
        }
      } else {
        // Create new
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchEntries();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  // Sort entries by date (newest first), undated at the end
  const sortedEntries = [...entries].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Timeline</h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              {editingId ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What happened?"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                autoFocus
              />
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what you experienced, felt, or lived through..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  >
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle.trim()}
                  className="px-5 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600 mb-2">Your timeline is empty</p>
            <p className="text-sm text-slate-400 mb-6">Add entries manually or chat with Bestie to build your timeline</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-5 py-2.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition font-medium"
            >
              Add your first entry
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-4">
              {sortedEntries.map((entry) => {
                const cat = CATEGORIES.find(c => c.id === entry.category);
                return (
                  <div key={entry.id} className="relative pl-12">
                    {/* Dot */}
                    <div className="absolute left-3.5 top-4 w-3 h-3 rounded-full bg-primary ring-4 ring-white" />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900">{entry.title}</h3>
                          {entry.description && (
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{entry.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            {entry.date && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            )}
                            {cat && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                {cat.label}
                              </span>
                            )}
                            {entry.emotions && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                                {entry.emotions}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
