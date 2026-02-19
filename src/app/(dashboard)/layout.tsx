'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/timeline': 'Memories',
  '/timeline-edit': 'Timeline',
  '/people': 'Relations',
  '/life-script': 'Life Story',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chatTitle, setChatTitle] = useState<string | null>(null);

  const pageTitle = PAGE_TITLES[pathname] ?? null;

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Expose setChatTitle globally so interview page can update it
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__setChatTitle = setChatTitle;
    return () => {
      delete (window as unknown as Record<string, unknown>).__setChatTitle;
    };
  }, []);

  function toggleSidebar() {
    setSidebarExpanded(!sidebarExpanded);
  }

  function closeSidebar() {
    setSidebarExpanded(false);
  }

  // Desktop sidebar width: 56px collapsed (w-14), 288px expanded (w-72)
  const desktopPaddingLeft = isMobile ? '0px' : sidebarExpanded ? '288px' : '56px';

  return (
    <>
      <Header
        onToggleSidebar={toggleSidebar}
        chatTitle={chatTitle}
        pageTitle={pageTitle}
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
      />
      <Sidebar expanded={sidebarExpanded} isMobile={isMobile} onClose={closeSidebar} onToggle={toggleSidebar} chatTitle={chatTitle} />

      <div
        className="pt-14 transition-all duration-200"
        style={{ paddingLeft: desktopPaddingLeft }}
      >
        {children}
      </div>
    </>
  );
}
