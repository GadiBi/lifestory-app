'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
  chatTitle?: string | null;
  sidebarExpanded?: boolean;
  isMobile?: boolean;
}

export default function Header({ onToggleSidebar, chatTitle, sidebarExpanded, isMobile }: HeaderProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = session?.user?.name || 'User';
  const initials = userName.charAt(0).toUpperCase();

  // Desktop padding: when sidebar expanded, shift header right so brand is outside sidebar
  const headerPaddingLeft = isMobile ? undefined : sidebarExpanded ? '288px' : '56px';
  // Hide bow icon from header when sidebar is expanded on desktop (it's inside sidebar)
  const showBowInHeader = isMobile || !sidebarExpanded;

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 bg-white z-40 flex items-center px-3 transition-all duration-200"
      style={{ paddingLeft: headerPaddingLeft }}
    >
      {/* Left: Menu icon (hidden when sidebar expanded on desktop — it's in the sidebar) */}
      {showBowInHeader && (
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600 mr-2"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Center/Left: Brand */}
      <div className="flex-1 flex items-center min-w-0">
        {/* Desktop: brand always visible */}
        <Link href="/interview" className="hidden md:flex items-center gap-2 shrink-0">
          <span className="font-bold text-lg text-primary">My Story</span>
        </Link>

        {/* Mobile: centered brand or chat title */}
        <div className="md:hidden flex-1 text-center">
          <span className="font-semibold text-base text-primary truncate">
            {chatTitle || 'My Story'}
          </span>
        </div>
      </div>

      {/* Right: User icon */}
      <div className="relative mr-2" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium hover:opacity-90 transition"
        >
          {initials}
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
            <button
              onClick={() => {
                setUserMenuOpen(false);
                signOut({ callbackUrl: '/login' });
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
            <div className="border-t border-slate-100 my-1" />
            <Link
              href="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="font-medium">{userName}</div>
                  <div className="text-xs text-slate-400">{session?.user?.email}</div>
                </div>
              </div>
            </Link>
            <div className="border-t border-slate-100 my-1" />
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
