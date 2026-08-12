import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Timer, MoreHorizontal } from 'lucide-react';

export default function MobileBottomNav({ onOpenMore }) {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Focus', path: '/focus', icon: Timer, isPrimary: true },
    { name: 'Habits', path: '/habits', icon: Target },
  ];

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-950/90 backdrop-blur-xl border-t border-border-card/60 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          if (item.isPrimary) {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5 group"
                aria-label="Focus Mode Timer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
                  isActive 
                    ? 'bg-brand-purple text-white ring-4 ring-brand-purple/30 shadow-lg shadow-brand-purple/50 scale-105' 
                    : 'bg-gradient-to-tr from-brand-purple to-purple-500 text-white shadow-md shadow-brand-purple/35'
                }`}>
                  <Icon className="w-6 h-6 animate-pulse motion-reduce:animate-none" />
                </div>
                <span className={`text-[10px] font-extrabold tracking-tight mt-1 uppercase ${
                  isActive ? 'text-brand-purple-hover' : 'text-text-muted'
                }`}>
                  {item.name}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-brand-purple-hover font-bold' 
                  : 'text-text-muted hover:text-text-primary font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] tracking-tight mt-1">{item.name}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-text-muted hover:text-text-primary transition-all duration-200 active:scale-95 cursor-pointer"
          aria-label="Open More Menu"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
