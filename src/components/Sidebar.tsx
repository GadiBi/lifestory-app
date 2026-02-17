'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PastChat {
  id: string;
  currentPeriod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

const NAV_ITEMS = [
  {
    id: 'interview',
    label: 'Continue Chat',
    href: '/interview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'new',
    label: 'New Chat',
    href: '/interview?new=true',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: 'My Memories',
    href: '/timeline',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'life-script',
    label: 'My Story',
    href: '/life-script',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'people',
    label: 'People in My Life',
    href: '/people',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  expanded: boolean;
  isMobile: boolean;
  onClose: () => void;
  onToggle: () => void;
  chatTitle?: string | null;
}

export default function Sidebar({ expanded, isMobile, onClose, onToggle, chatTitle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [chatsExpanded, setChatsExpanded] = useState(false);
  const [pastChats, setPastChats] = useState<PastChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    if (chatsExpanded && pastChats.length === 0) {
      loadChats();
    }
  }, [chatsExpanded]);

  async function loadChats() {
    setLoadingChats(true);
    try {
      const res = await fetch('/api/interview/chat');
      if (res.ok) {
        const data = await res.json();
        setPastChats(data.interviews || []);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoadingChats(false);
    }
  }

  function navigate(href: string) {
    if (isMobile) onClose();
    router.push(href);
  }

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.id === 'interview') {
      // Continue Chat is active when on /interview AND chat has a real title (not New Chat)
      return pathname === '/interview' && !!chatTitle && chatTitle !== 'New Chat';
    }
    if (item.id === 'new') {
      // New Chat is active when on /interview AND title is New Chat or null
      return pathname === '/interview' && (!chatTitle || chatTitle === 'New Chat');
    }
    return pathname === item.href;
  }

  // Mobile: show nothing if not expanded
  if (isMobile && !expanded) return null;

  // Mobile overlay sidebar
  if (isMobile && expanded) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

        {/* Drawer - full height, on top of everything */}
        <div className="fixed inset-y-0 left-0 w-72 bg-slate-50 z-50 shadow-xl flex flex-col animate-slide-in">
          {/* Top: bow icon */}
          <div className="h-14 flex items-center px-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-600"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="px-3 pb-1">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:text-slate-500 transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search your story...
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  isActive(item)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className={`text-sm ${item.id === 'interview' || item.id === 'new' ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            ))}

            {/* Chats section */}
            <ChatsList
              chatsExpanded={chatsExpanded}
              setChatsExpanded={setChatsExpanded}
              loadingChats={loadingChats}
              pastChats={pastChats}
              navigate={navigate}
            />
          </nav>

          {/* Settings - pinned bottom */}
          <SettingsButton pathname={pathname} navigate={navigate} showLabel />
        </div>
      </>
    );
  }

  // Desktop collapsed: narrow icon rail — full height from top to bottom, ON TOP of header
  if (!expanded) {
    return (
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-14 bg-slate-50 z-50 flex-col items-center">
        {/* Bow icon at very top, same height as header */}
        <div className="h-14 flex items-center justify-center shrink-0">
          <button
            onClick={onToggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 py-2">
          {/* Search icon */}
          <div className="relative">
            <button
              onClick={() => navigate('/search')}
              onMouseEnter={() => setHoveredItem('search')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {hoveredItem === 'search' && (
              <Tooltip label="Search" />
            )}
          </div>

          <div className="w-6 my-1" />

          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
                  isActive(item)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {item.icon}
              </button>
              {hoveredItem === item.id && (
                <Tooltip label={item.label} />
              )}
            </div>
          ))}

          {/* Chats icon */}
          <div className="relative">
            <button
              onClick={() => navigate('/interview?history=true')}
              onMouseEnter={() => setHoveredItem('chats')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </button>
            {hoveredItem === 'chats' && (
              <Tooltip label="Chats" />
            )}
          </div>
        </nav>

        {/* Settings at very bottom */}
        <div className="relative pb-2">
          <button
            onClick={() => navigate('/settings')}
            onMouseEnter={() => setHoveredItem('settings')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
              pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <SettingsIcon />
          </button>
          {hoveredItem === 'settings' && (
            <Tooltip label="Settings" />
          )}
        </div>
      </div>
    );
  }

  // Desktop expanded: full sidebar — full height, on top of header
  return (
    <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-slate-50 z-50 flex-col animate-slide-in">
      {/* Top row: Bow icon + Search bar (same height as header) */}
      <div className="h-14 flex items-center gap-2 px-2 shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-600 shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/search')}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:text-slate-500 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search your story...
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.href)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition ${
              isActive(item)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.icon}
            <span className={`text-sm ${item.id === 'interview' || item.id === 'new' ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        ))}

        {/* Chats section */}
        <ChatsList
          chatsExpanded={chatsExpanded}
          setChatsExpanded={setChatsExpanded}
          loadingChats={loadingChats}
          pastChats={pastChats}
          navigate={navigate}
        />
      </nav>

      {/* Settings - pinned bottom */}
      <SettingsButton pathname={pathname} navigate={navigate} showLabel />
    </div>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 pointer-events-none">
      {label}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SettingsButton({ pathname, navigate, showLabel }: { pathname: string; navigate: (href: string) => void; showLabel: boolean }) {
  return (
    <div className="p-2">
      <button
        onClick={() => navigate('/settings')}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
          pathname === '/settings'
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <SettingsIcon />
        {showLabel && <span className="text-sm">Settings</span>}
      </button>
    </div>
  );
}

function ChatsList({
  chatsExpanded,
  setChatsExpanded,
  loadingChats,
  pastChats,
  navigate,
}: {
  chatsExpanded: boolean;
  setChatsExpanded: (v: boolean) => void;
  loadingChats: boolean;
  pastChats: PastChat[];
  navigate: (href: string) => void;
}) {
  return (
    <div>
      <button
        onClick={() => setChatsExpanded(!chatsExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
        <span className="flex-1 text-left text-sm font-medium">Chats</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${chatsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {chatsExpanded && (
        <div className="pl-6 pr-2 pb-2 max-h-60 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : pastChats.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No past chats</p>
          ) : (
            pastChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/interview?id=${chat.id}`)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition group"
              >
                <p className="text-sm text-slate-700 truncate">{chat.preview || 'New conversation'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(chat.createdAt).toLocaleDateString()} — {new Date(chat.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
