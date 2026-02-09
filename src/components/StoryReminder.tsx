'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReminderSettings {
  enabled: boolean;
  daysSinceLastActivity: number;
  dismissedUntil: string | null;
}

const PROMPTS = [
  {
    category: 'childhood',
    questions: [
      "What was your favorite game to play as a child?",
      "Do you remember your first best friend?",
      "What was your childhood bedroom like?",
      "What sounds or smells remind you of your childhood home?",
    ],
  },
  {
    category: 'family',
    questions: [
      "What family traditions were special to you growing up?",
      "Who taught you something you still use today?",
      "What stories did your grandparents share with you?",
      "What was your favorite family meal?",
    ],
  },
  {
    category: 'milestones',
    questions: [
      "What achievement are you most proud of?",
      "Tell me about a turning point in your life.",
      "What was a moment that changed how you saw the world?",
      "What challenges helped shape who you are today?",
    ],
  },
  {
    category: 'emotions',
    questions: [
      "What moment made you feel most alive?",
      "When did you feel truly at peace?",
      "What brings you joy that hasn't changed over the years?",
      "What lesson took you a long time to learn?",
    ],
  },
];

export default function StoryReminder() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<{ category: string; question: string } | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('lifestory-reminder-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch {
        setSettings({ enabled: true, daysSinceLastActivity: 3, dismissedUntil: null });
      }
    } else {
      setSettings({ enabled: true, daysSinceLastActivity: 3, dismissedUntil: null });
    }

    // Get last activity from API
    fetchLastActivity();
  }, []);

  useEffect(() => {
    if (!settings || !lastActivity) return;

    // Check if dismissed
    if (settings.dismissedUntil && new Date(settings.dismissedUntil) > new Date()) {
      setShowReminder(false);
      return;
    }

    // Check if should show reminder
    const daysSince = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (settings.enabled && daysSince >= settings.daysSinceLastActivity) {
      setShowReminder(true);
      selectRandomPrompt();
    }
  }, [settings, lastActivity]);

  async function fetchLastActivity() {
    try {
      const response = await fetch('/api/interview/last-active');
      if (response.ok) {
        const data = await response.json();
        if (data.interview?.updatedAt) {
          setLastActivity(new Date(data.interview.updatedAt));
        } else {
          // No conversations yet - show reminder after a shorter period
          setLastActivity(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)); // 7 days ago
        }
      }
    } catch (error) {
      console.error('Failed to fetch last activity:', error);
    }
  }

  function selectRandomPrompt() {
    const category = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const question = category.questions[Math.floor(Math.random() * category.questions.length)];
    setCurrentPrompt({ category: category.category, question });
  }

  function dismissReminder(days: number) {
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + days);
    const newSettings = { ...settings!, dismissedUntil: dismissedUntil.toISOString() };
    setSettings(newSettings);
    localStorage.setItem('lifestory-reminder-settings', JSON.stringify(newSettings));
    setShowReminder(false);
  }

  function disableReminders() {
    const newSettings = { ...settings!, enabled: false };
    setSettings(newSettings);
    localStorage.setItem('lifestory-reminder-settings', JSON.stringify(newSettings));
    setShowReminder(false);
  }

  if (!showReminder || !currentPrompt) {
    return null;
  }

  const categoryIcons: Record<string, string> = {
    childhood: '🧒',
    family: '👨‍👩‍👧',
    milestones: '🏆',
    emotions: '💭',
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{categoryIcons[currentPrompt.category] || '📝'}</span>
            <span className="text-sm font-medium text-primary capitalize">{currentPrompt.category}</span>
          </div>
          <p className="text-slate-800 text-lg font-medium mb-3">
            {currentPrompt.question}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Continue My Story
            </Link>
            <button
              onClick={selectRandomPrompt}
              className="text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Different question
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => dismissReminder(1)}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
            title="Remind me tomorrow"
          >
            Remind later
          </button>
          <button
            onClick={disableReminders}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
            title="Disable reminders"
          >
            Don&apos;t remind me
          </button>
        </div>
      </div>
    </div>
  );
}
