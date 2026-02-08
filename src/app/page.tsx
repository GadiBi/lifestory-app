import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-xl">LifeStory</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 transition font-medium">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary mb-8">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Powered by Claude AI
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Every Life Has a Story
              <span className="block mt-2 text-primary">
                Worth Telling
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Have meaningful conversations with an AI biographer that helps you discover,
              remember, and preserve your most precious memories. Your story matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition text-lg"
              >
                Start Your Story
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition border border-slate-200 text-lg"
              >
                Continue Writing
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
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
        <div className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xl text-slate-700 italic mb-6">
              "I never thought my ordinary life had stories worth telling.
              This helped me discover memories I'd forgotten and see my life in a whole new way."
            </p>
            <p className="text-slate-500">— Someone just like you</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Begin?</h2>
          <p className="text-lg text-slate-600 mb-8">Your story is waiting to be told. Start free today.</p>
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
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2024 LifeStory. Your memories, beautifully preserved.</p>
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
