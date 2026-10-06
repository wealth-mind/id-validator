/**
 * src/components/AppLayout.jsx
 * Shared layout for every authenticated admin page: Sidebar + top header bar
 * (with the theme toggle) + the current page rendered through <Outlet />.
 *
 * Below `lg:` the sidebar becomes an off-canvas drawer opened from a
 * hamburger button in the header; at `lg:` and up it is permanently docked.
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever the route changes
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close on Escape, and lock body scroll while the drawer is open
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Backdrop behind the off-canvas drawer (hidden at lg+) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar — visible on every page */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#13111f]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="sidebar-menu-btn"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="lg:hidden -ml-2 inline-flex items-center justify-center w-11 h-11 rounded-xl text-black dark:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="text-sm font-semibold text-black dark:text-gray-100 truncate">
              <span className="hidden sm:inline">Student ID Validation System</span>
              <span className="sm:hidden">ID Validation</span>
            </p>
          </div>
          <ThemeToggle id="header-theme-toggle-btn" showLabel />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
