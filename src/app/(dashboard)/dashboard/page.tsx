import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ContinueConversationButton from '@/components/ContinueConversationButton';
import StoryReminder from '@/components/StoryReminder';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  const displayName = user?.profile?.fullName || user?.username || session.user.name;

  return (
    <div className="min-h-screen bg-white">
      {/* Top accent gradient line */}
      <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]" />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)]/40 to-white p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-500 text-lg">
            Transform your memories into a written legacy.
          </p>
        </div>

        {/* Story Reminder */}
        <StoryReminder />

        {/* Row 1: Continue + New - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <ContinueConversationButton />

          <Link
            href="/interview?new=true"
            className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-5 transition group hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">New</h3>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Row 2: My Events + My Story + My People + Conversations - 4 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link
            href="/timeline"
            className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-4 transition group hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">My Events</h3>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/life-script"
            className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-4 transition group hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <BookIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">My Story</h3>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/people"
            className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-4 transition group hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">My People</h3>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/interview?history=true"
            className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-4 transition group hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900">Chats</h3>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}


function BookIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

