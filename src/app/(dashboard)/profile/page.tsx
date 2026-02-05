'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  fullName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  profile: Profile | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  async function fetchProfile() {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      setUserData(data);
      setFullName(data.profile?.fullName || '');
      setBirthDate(data.profile?.birthDate ? data.profile.birthDate.split('T')[0] : '');
      setBirthPlace(data.profile?.birthPlace || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName || null,
          birthDate: birthDate || null,
          birthPlace: birthPlace || null,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Your Profile</h1>
        </div>
      </header>

      {/* Profile Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Account Info (read-only) */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {userData?.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {userData?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Profile */}
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
            <p className="text-sm text-slate-600 mb-6">
              This information helps the AI biographer personalize your interview experience.
            </p>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}

            <div className="grid gap-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-2">
                  Birth Date
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="birthPlace" className="block text-sm font-medium text-slate-700 mb-2">
                  Birth Place
                </label>
                <input
                  id="birthPlace"
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="City, Country"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
