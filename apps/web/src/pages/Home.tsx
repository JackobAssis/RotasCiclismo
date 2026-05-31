import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../stores/auth.store';
import { authService } from '../services/auth.service';

export default function Home() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
            RotasCiclismo
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {user?.displayName || user?.username || 'Cyclist'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {/* Hero */}
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Ready to Ride?
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Start a new cycling session with GPS tracking, real-time HUD,
            and automatic route recording. Works offline.
          </p>
        </div>

        {/* Start Ride Button */}
        <button
          onClick={() => navigate('/ride')}
          className="w-full max-w-xs px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
        >
          Start Ride
        </button>

        {/* Quick Stats (placeholder) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">
              --
            </div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Rides
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">
              --
            </div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Distance
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-lg font-bold text-neutral-900 dark:text-white">
              --
            </div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Hours
            </div>
          </div>
        </div>

        {/* Debug Link */}
        <button
          onClick={() => navigate('/debug')}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline transition-colors"
        >
          Debug Panel
        </button>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-600">
          RotasCiclismo v0.1 — Offline-first cycling computer
        </p>
      </footer>
    </div>
  );
}
