import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

/**
 * Responsive app frame.
 * - Desktop: a fixed left sidebar + a full-width scrolling content area.
 * - Mobile: full-width content above a sticky bottom nav.
 */
export function AppShell() {
  return (
    <div className="flex h-full min-h-screen bg-ink-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
