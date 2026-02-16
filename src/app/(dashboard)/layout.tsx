'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chatTitle, setChatTitle] = useState<string | null>(null);

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
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
      />
      <Sidebar expanded={sidebarExpanded} isMobile={isMobile} onClose={closeSidebar} />

      <div
        className="pt-14 transition-all duration-200"
        style={{ paddingLeft: desktopPaddingLeft }}
      >
        {/* Desktop: Live feed title bar below header */}
        {chatTitle && !isMobile && (
          <div className="bg-slate-50 px-4 py-1.5">
            <p className="text-sm text-slate-500 font-medium text-center truncate">{chatTitle}</p>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
