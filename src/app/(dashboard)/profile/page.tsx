'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  fullName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  language: string | null;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  profile: Profile | null;
}

interface UsageData {
  totals: { inputTokens: number; outputTokens: number; totalTokens: number; totalCost: number; requestCount: number };
  byEndpoint: Record<string, { requests: number; cost: number; tokens: number }>;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'he', label: 'Hebrew' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [language, setLanguage] = useState('en');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/login'); return; }
    fetchData();
  }, [session, status, router]);

  async function fetchData() {
    try {
      const [profileRes, usageRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/usage'),
      ]);
      const profileData = await profileRes.json();
      const usageData = await usageRes.json();

      setUserData(profileData);
      setUsage(usageData);
      setUsername(profileData.username || '');
      setFullName(profileData.profile?.fullName || '');
      setBirthDate(profileData.profile?.birthDate ? profileData.profile.birthDate.split('T')[0] : '');
      setBirthPlace(profileData.profile?.birthPlace || '');
      setLanguage(profileData.profile?.language || 'en');
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setUsernameError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName: fullName || null, birthDate: birthDate || null, birthPlace: birthPlace || null, language }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else if (data.error === 'Username already taken') {
        setUsernameError('Username taken');
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setSaving(false);
    }
  }

  const formatCost = (cost: number) => cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
  const formatTokens = (tokens: number) => tokens >= 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : tokens >= 1000 ? `${(tokens / 1000).toFixed(0)}K` : tokens.toString();

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-600">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-16 space-y-6">
        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Saved successfully!</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 ${usernameError ? 'border-red-300' : 'border-slate-200'} focus:ring-2 focus:ring-primary focus:border-transparent`}
                />
                {usernameError && <p className="mt-1 text-xs text-red-600">{usernameError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">{userData?.email}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Birth Date</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Birth Place</label>
                <input type="text" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="City, Country" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:border-transparent">
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">AI will speak in this language</p>
            </div>

            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security Settings Link */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Security</h2>
              <p className="text-sm text-slate-500">Change password, delete account</p>
            </div>
            <Link
              href="/profile/security"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Manage
            </Link>
          </div>
        </div>

        {/* API Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">API Usage</h2>
          {usage ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{formatCost(usage.totals.totalCost)}</div>
                  <div className="text-sm text-slate-500">Total Cost</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{formatTokens(usage.totals.totalTokens)}</div>
                  <div className="text-sm text-slate-500">Tokens Used</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{usage.totals.requestCount}</div>
                  <div className="text-sm text-slate-500">API Calls</div>
                </div>
              </div>

              {Object.keys(usage.byEndpoint).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">By Feature</h3>
                  <div className="space-y-2">
                    {Object.entries(usage.byEndpoint).map(([endpoint, data]) => (
                      <div key={endpoint} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                        <span className="text-slate-700 capitalize">{endpoint.replace('-', ' ')}</span>
                        <span className="text-slate-500">{data.requests} calls · {formatCost(data.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-center py-4">No usage data yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
