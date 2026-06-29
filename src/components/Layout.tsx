import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-[100dvh] bg-[#f0f9ff] dark:bg-dark-slate">
      {/* Navigation (sidebar + topbar + bottom nav) */}
      <Navbar />

      {/* Main content area */}
      <main className="lg:ml-[240px] lg:pt-14 pt-14 pb-16 lg:pb-0 min-h-[100dvh]">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
