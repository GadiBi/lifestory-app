import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/interview');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-8" />
                <path d="M9 22c0-2 1-3 3-3s3 1 3 3" />
                <path d="M12 14c-4 0-7-3-7-7 0-2.5 1.5-4.5 4-5.5.5 2 2 3 3 3s2.5-1 3-3c2.5 1 4 3 4 5.5 0 4-3 7-7 7z" />
                <path d="M12 6v5" />
                <path d="M9.5 8.5L12 7l2.5 1.5" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-xl">My Story</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-sm sm:text-base text-slate-600 hover:text-slate-900 transition font-medium">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition font-medium text-sm sm:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-32">
          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary mb-6 sm:mb-8">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Powered by Claude AI
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4 sm:mb-6">
              Every Life Has a Story
              <span className="block mt-2 text-primary">
                Worth Telling
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto">
              Have meaningful conversations with an AI biographer that helps you discover,
              remember, and preserve your most precious memories. Transform your memories into a written legacy.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/signup"
                className="px-6 py-3.5 sm:px-8 sm:py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition text-base sm:text-lg"
              >
                Start Your Story
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 sm:px-8 sm:py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition border border-slate-200 text-base sm:text-lg"
              >
                Continue Writing
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12 sm:mb-20">
            <FeatureCard
              icon="🎙️"
              title="Voice & Text"
              description="Speak or type - share your memories however feels natural to you"
            />
            <FeatureCard
              icon="🧠"
              title="AI Memory"
              description="Your biographer remembers everything and builds on past conversations"
            />
            <FeatureCard
              icon="🌍"
              title="Any Language"
              description="Share your story in your native language - we support 17+ languages"
            />
          </div>

          {/* How It Works */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <Step number="1" title="Chat" description="Have natural conversations about your life, memories, and experiences" />
              <Step number="2" title="Organize" description="AI extracts and organizes events into a beautiful timeline" />
              <Step number="3" title="Generate" description="Create your Life Script - a written biography of your journey" />
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white border-y border-slate-200 py-10 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-lg sm:text-xl text-slate-700 italic mb-6">
              "I never thought my ordinary life had stories worth telling.
              This helped me discover memories I'd forgotten and see my life in a whole new way."
            </p>
            <p className="text-slate-500">— Someone just like you</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Ready to Begin?</h2>
          <p className="text-base sm:text-lg text-slate-600 mb-8">Your story is waiting to be told. Start free today.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition text-lg"
          >
            Create Your Account
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 sm:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2024 My Story. Your memories, beautifully preserved.</p>
          <p className="text-slate-500 text-sm">Private & Secure • Powered by Claude AI</p>
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
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  );
}
