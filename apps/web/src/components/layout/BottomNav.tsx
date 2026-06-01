import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '◉' },
  { to: '/ride', label: 'Pedalar', icon: '▶' },
  { to: '/history', label: 'Histórico', icon: '☰' },
  { to: '/analytics', label: 'Analytics', icon: '◈' },
  { to: '/profile', label: 'Perfil', icon: '◎' },
  { to: '/settings', label: 'Config', icon: '⚙' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-900/95 backdrop-blur-lg border-t border-dark-700 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-neon-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
