import React from 'react';
import { NavLink } from 'react-router-dom';
import { useHome } from '../../context/HomeContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/devices', label: 'Devices', icon: 'devices_other', end: false },
  { to: '/automation', label: 'Automation', icon: 'bolt', end: false },
  { to: '/energy', label: 'Energy', icon: 'eco', end: false },
  { to: '/security', label: 'Security', icon: 'shield', end: false },
];

export const BottomNav: React.FC = () => {
  const { state } = useHome();
  const alertActive = state.profile.securityAlertActive;

  return (
    <nav
      aria-label="Primary navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-low/95 backdrop-blur-lg border-t border-outline pb-safe font-gellix"
    >
      <div className="max-w-lg mx-auto h-16 px-2 grid grid-cols-5 items-center">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-accent-text' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isActive ? 'material-symbols-filled' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.to === '/security' && alertActive && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-error" />
                  )}
                </span>
                <span className="text-text-xxs font-medium tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
