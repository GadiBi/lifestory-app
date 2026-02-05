import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="text-white font-bold text-xl">LifeStory Agent</div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your Life Story,
                <span className="text-blue-400"> Beautifully Told</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
                An AI-powered biographer that helps you document your memories through
                thoughtful conversations. Transform your life experiences into a
                beautifully written biography.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition text-center text-lg"
                >
                  Start Your Story
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border border-slate-600 hover:border-slate-500 text-white font-medium rounded-xl transition text-center text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="space-y-4">
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="AI-Guided Interviews"
                description="Have meaningful conversations with an empathetic AI that asks the right questions to unlock your memories."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Chronological Timeline"
                description="See your life events organized beautifully from childhood to present day."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                title="Life Script Generation"
                description="Transform your memories into a professionally written biography you can share or keep private."
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Powered by Claude AI. Your stories are private and secure.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
