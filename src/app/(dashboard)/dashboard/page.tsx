import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">LifeStory Agent</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">Welcome, {session.user.name}</span>
            <Link href="/profile" className="text-slate-600 hover:text-slate-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Your Life Story Journey</h2>
          <p className="text-slate-600 mt-1">Continue documenting your life story with our AI biographer.</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Interview Card */}
          <Link href="/interview" className="block group">
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition">Start Interview</h3>
              <p className="text-slate-600 mt-2 text-sm">Have a conversation with our AI biographer to document your memories.</p>
            </div>
          </Link>

          {/* Timeline Card */}
          <Link href="/timeline" className="block group">
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-green-600 transition">View Timeline</h3>
              <p className="text-slate-600 mt-2 text-sm">See all your documented life events organized chronologically.</p>
            </div>
          </Link>

          {/* Life Script Card */}
          <Link href="/life-script" className="block group">
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition">Generate Life Script</h3>
              <p className="text-slate-600 mt-2 text-sm">Compile your stories into a beautifully written biography.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
