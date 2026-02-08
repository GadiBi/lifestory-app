import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get user data and stats
  const [user, eventCount, interviewCount, totalUsage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    }),
    prisma.lifeEvent.count({ where: { userId: session.user.id } }),
    prisma.interview.count({ where: { userId: session.user.id } }),
    prisma.apiUsage.aggregate({
      where: { userId: session.user.id },
      _sum: { costUsd: true },
    }),
  ]);

  const displayName = user?.profile?.fullName || user?.username || session.user.name;
  const totalCost = totalUsage._sum.costUsd || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-slate-900 font-semibold text-xl hidden sm:block">LifeStory</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-slate-600 text-sm hidden sm:block">Welcome, {displayName}</span>
            <Link href="/profile" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Continue sharing your life journey with our advanced Life Story Agent.
          </p>
          <p className="text-slate-600 max-w-2xl mt-1">
            Speak any language and transform your memories into a beautifully written story you can download at any time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard
            label="Life Events"
            value={eventCount}
            icon={<EventIcon />}
            href="/timeline"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Conversations"
            value={interviewCount}
            icon={<ChatIcon />}
            href="/interview?history=true"
            color="bg-green-50 text-green-600"
          />
          <StatCard
            label="Life Script"
            value={eventCount >= 3 ? "Ready" : "Need 3+"}
            icon={<BookIcon />}
            href="/life-script"
            color="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Primary Actions */}
        <div className="space-y-3 mb-8">
          <Link
            href="/interview?new=true"
            className="block w-full bg-primary hover:bg-primary-dark text-white rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">Begin Conversation</h3>
                <p className="text-white/80 text-sm">Start a new conversation</p>
              </div>
              <svg className="w-6 h-6 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/interview"
            className="block w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <ChatIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-1">Continue Conversation</h3>
                <p className="text-slate-600 text-sm">Resume your last conversation</p>
              </div>
              <svg className="w-6 h-6 text-primary/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SecondaryAction
            href="/timeline"
            icon={<TimelineIcon />}
            label="View Timeline"
            color="bg-blue-50 text-blue-600"
          />
          <SecondaryAction
            href="/life-script"
            icon={<BookIcon />}
            label="Generate Life Script"
            color="bg-purple-50 text-purple-600"
          />
          <SecondaryAction
            href="/life-script#download"
            icon={<DownloadIcon />}
            label="Download PDF"
            color="bg-green-50 text-green-600"
          />
          <SecondaryAction
            href="/upload"
            icon={<UploadIcon />}
            label="Upload Media"
            color="bg-amber-50 text-amber-600"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, href, color }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">{label}</div>
            <div className="text-lg font-bold text-primary">{value}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SecondaryAction({ href, icon, label, color }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition cursor-pointer h-full">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
      </div>
    </Link>
  );
}

function EventIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
