import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  headerMode?: 'main' | 'stack';
  title?: string;
  subtitle?: string;
  backTo?: string;
  rightSlot?: React.ReactNode;
  hideBottomNav?: boolean;
  showDesktopLink?: boolean;
  maxWidthClass?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  headerMode = 'main',
  title,
  subtitle,
  backTo,
  rightSlot,
  hideBottomNav = false,
  showDesktopLink = true,
  maxWidthClass = 'max-w-3xl',
}) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      <DesktopSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <MobileHeader
          mode={headerMode}
          title={title}
          subtitle={subtitle}
          backTo={backTo}
          rightSlot={rightSlot}
          showDesktopLink={showDesktopLink}
        />
        <main
          className={`flex-1 w-full mx-auto px-4 lg:px-8 pt-4 ${
            hideBottomNav ? 'pb-10' : 'pb-24 lg:pb-10'
          } ${maxWidthClass}`}
        >
          {children}
        </main>
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
};
