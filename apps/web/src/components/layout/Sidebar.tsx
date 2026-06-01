import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '◉' },
  { to: '/ride', label: 'Pedalar', icon: '▶' },
  { to: '/history', label: 'Histórico', icon: '☰' },
  { to: '/analytics', label: 'Analytics', icon: '◈' },
  { to: '/profile', label: 'Perfil', icon: '◎' },
  { to: '/settings', label: 'Config', icon: '⚙' },
  { to: '/debug', label: 'Debug', icon: '⊞' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-dark-900 border-r border-dark-700 fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-500/20 border border-neon-500/30 flex items-center justify-center text-neon-400 text-sm font-bold">
            R
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">RotasCiclismo</h1>
            <p className="text-[10px] text-gray-600">cycling computer</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-dark-800 text-neon-400 border border-neon-900/30 shadow-neon-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-800/50 border border-transparent'
              }`
            }
          >
            <span className="w-5 text-center text-xs">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-dark-700">
        <div className="px-3 py-2 rounded-xl bg-dark-850 border border-dark-700">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Offline-first cycling computer
            <br />
            v0.1
          </p>
        </div>
      </div>
    </aside>
  );
}
