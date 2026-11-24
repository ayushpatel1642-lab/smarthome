import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useHome } from '../../context/HomeContext';

const DESKTOP_NAV = [
  { to: '/desktop', label: 'Command Center', icon: 'dashboard' },
  { to: '/', label: 'Home Overview', icon: 'home', end: true },
  { to: '/devices', label: 'Devices', icon: 'devices_other' },
  { to: '/automation', label: 'Automations', icon: 'auto_mode' },
  { to: '/energy', label: 'Energy Grid', icon: 'bolt' },
  { to: '/security', label: 'Security', icon: 'shield' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export const DesktopSidebar: React.FC = () => {
  const { state, onlineDevicesCount } = useHome();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface-container-low border-r border-outline h-screen sticky top-0 font-gellix">
      {/* Brand header — Black/White monochrome logomark & wordmark per Amplitude Logo rules */}
      <div className="h-14 px-5 flex items-center border-b border-outline">
        <button
          type="button"
          onClick={() => navigate('/desktop')}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface">
            home_iot_device
          </span>
          <span className="text-text-m font-semibold tracking-tight text-on-surface whitespace-nowrap">
            Aware Home
          </span>
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Desktop navigation">
        {DESKTOP_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-text-s font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-accent/10 text-accent-text'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[19px] ${
                      isActive ? 'material-symbols-filled' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                {item.to === '/security' && state.profile.securityAlertActive && (
                  <span className="text-text-xxs font-semibold text-error">Alert</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Residence Summary Footer */}
      <div className="p-4 border-t border-outline">
        <div className="text-text-s font-semibold text-on-surface truncate">
          {state.profile.residenceName}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-text-xs text-on-surface-variant tabular-nums">
          <span>{onlineDevicesCount} nodes ready</span>
          <span aria-hidden="true">·</span>
          <span className="text-accent-text">Simulated bridge</span>
        </div>
      </div>
    </aside>
  );
};
