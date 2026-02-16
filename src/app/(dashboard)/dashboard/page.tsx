import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
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

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-8" />
                <path d="M9 22c0-2 1-3 3-3s3 1 3 3" />
                <path d="M12 14c-4 0-7-3-7-7 0-2.5 1.5-4.5 4-5.5.5 2 2 3 3 3s2.5-1 3-3c2.5 1 4 3 4 5.5 0 4-3 7-7 7z" />
                <path d="M12 6v5" />
                <path d="M9.5 8.5L12 7l2.5 1.5" />
              </svg>
            </div>
            <span className="text-slate-900 font-semibold text-xl hidden sm:block">LifeStory</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/search" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition" title="Search">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link href="/settings" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition" title="Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link href="/profile" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition" title="Profile">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

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

        {/* Row 1: Continue Conversation - Hero button (primary colored) */}
        <div className="space-y-3 mb-8">
          <ContinueConversationButton />

          {/* Row 2: Conversations + Begin New - theme-tinted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/interview?history=true"
              className="block w-full bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80 border border-[var(--color-primary)]/15 rounded-2xl p-5 transition group hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">Conversations</h3>
                  <p className="text-slate-500 text-sm">View past conversations</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

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
                  <h3 className="text-base font-semibold text-slate-900">Begin New Conversation</h3>
                  <p className="text-slate-500 text-sm">Start sharing new memories</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Row 3: Life Events + Life Script + People - theme-tinted, 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
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
                <h3 className="text-base font-semibold text-slate-900">Life Events</h3>
                <p className="text-slate-500 text-sm">View your timeline</p>
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
                <h3 className="text-base font-semibold text-slate-900">Life Script</h3>
                <p className="text-slate-500 text-sm">Your written story</p>
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
                <h3 className="text-base font-semibold text-slate-900">People in My Life</h3>
                <p className="text-slate-500 text-sm">Key people from your story</p>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Row 4: Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            href="/life-script"
            icon={<DownloadIcon />}
            label="Download"
            color="text-rose-600 bg-rose-50"
          />
          <QuickAction
            href="/upload"
            icon={<UploadIcon />}
            label="Upload"
            color="text-amber-600 bg-amber-50"
          />
          <QuickAction
            href="/share"
            icon={<ShareIcon />}
            label="Share"
            color="text-emerald-600 bg-emerald-50"
          />
        </div>
      </main>
    </div>
  );
}

function QuickAction({ href, icon, label, color }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition cursor-pointer">
        <div className="flex flex-col items-center text-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-slate-600">{label}</span>
        </div>
      </div>
    </Link>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
