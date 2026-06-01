import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
