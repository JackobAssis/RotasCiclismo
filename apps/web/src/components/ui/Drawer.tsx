import { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'bottom';
}

const sideClasses = {
  left: 'inset-y-0 left-0 w-80 max-w-[85vw] translate-x-0',
  right: 'inset-y-0 right-0 w-80 max-w-[85vw] translate-x-0',
  bottom:
    'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl translate-y-0',
};

const enterClasses = {
  left: '-translate-x-full',
  right: 'translate-x-full',
  bottom: 'translate-y-full',
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
}: DrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed z-50 bg-dark-900 border border-dark-700 shadow-glass transition-transform duration-300 ease-in-out overflow-y-auto ${
          sideClasses[side]
        } ${open ? 'translate-x-0 translate-y-0' : enterClasses[side]}`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-900/90 backdrop-blur-sm border-b border-dark-700">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-dark-800 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
