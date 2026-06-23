import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Mobile app frame: a scrolling content area above a sticky bottom nav. */
export function AppShell() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-ink-900">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 pb-6 pt-6">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
