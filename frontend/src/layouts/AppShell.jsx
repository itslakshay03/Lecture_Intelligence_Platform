import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import TopNav from '@/components/layout/TopNav';
import { findNavByPath } from '@/components/layout/navConfig';
import useMediaQuery from '@/hooks/useMediaQuery';

/**
 * Phase 5: desktop navigation moved from a persistent left sidebar to a top
 * navigation bar (TopNav) — full-width content, no left column. Mobile is
 * untouched: same hamburger + drawer (Sidebar) as every earlier phase.
 */
export default function AppShell() {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const nav = findNavByPath(location.pathname);
  const title = nav?.title || 'LectraAI';
  const subtitle = nav?.subtitle;

  // Close the mobile drawer whenever the route changes or we grow to desktop.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {isMobile ? (
        <Topbar title={title} subtitle={subtitle} showMenuButton onOpenNav={() => setDrawerOpen(true)} />
      ) : (
        <TopNav />
      )}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-drawer)',
            backgroundColor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(2px)',
            animation: 'lai-fade-in 120ms both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="lai-animate-fade-in"
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)', boxShadow: 'var(--shadow-xl)' }}
          >
            <Sidebar showClose onClose={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
