import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  CalendarDays, CalendarRange, FileText, Library, 
  BarChart3, Compass, Bot, Settings, Volume2, VolumeX, 
  LogOut, X, Sparkles 
} from 'lucide-react';

export default function MobileMoreSheet({ 
  isOpen, 
  onClose, 
  settings, 
  onToggleMute, 
  onLogout 
}) {
  const navigate = useNavigate();

  // Handle ESC key press to close sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const moreItems = [
    { name: 'Calendar', path: '/calendar', icon: CalendarDays, color: 'text-cyan-400' },
    { name: 'Weekly Planner', path: '/planner', icon: CalendarRange, color: 'text-indigo-400' },
    { name: 'Exams', path: '/exams', icon: FileText, color: 'text-rose-400' },
    { name: 'Resources', path: '/resources', icon: Library, color: 'text-amber-400' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, color: 'text-emerald-400' },
    { name: 'Motivation', path: '/motivation', icon: Compass, color: 'text-brand-purple-hover' },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, color: 'text-purple-300' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'text-zinc-300' },
  ];

  const handleItemClick = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Sliding Sheet Panel */}
      <div 
        className="relative z-10 w-full bg-zinc-950/95 border-t border-border-card/70 rounded-t-3xl p-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl shadow-black text-left transform transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="More navigation menu"
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full mx-auto mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between border-b border-border-card/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-purple-hover" />
            <h3 className="text-sm font-extrabold font-display tracking-tight text-white uppercase">
              More Features
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-border-card/40 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid of Navigation Items */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {moreItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item.path)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-850 border border-border-card/40 hover:border-brand-purple/40 text-text-primary text-xs font-semibold transition-all cursor-pointer active:scale-95 min-h-[48px]"
              >
                <div className={`w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center ${item.color} border border-border-card/30 flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions: Sound Toggle + Logout */}
        <div className="space-y-2 pt-3 border-t border-border-card/30">
          <button
            onClick={onToggleMute}
            className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-border-card/40 rounded-2xl text-xs font-medium text-text-muted hover:text-text-primary transition-all cursor-pointer active:scale-95 min-h-[44px]"
          >
            <span className="flex items-center gap-2 font-medium text-text-primary">
              {settings?.sound_enabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              Sound Effects
            </span>
            <span className="text-[10px] font-extrabold text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded-full border border-brand-purple/30 uppercase">
              {settings?.sound_enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 hover:text-rose-200 transition-all cursor-pointer active:scale-95 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of StudyFlow</span>
          </button>
        </div>
      </div>
    </div>
  );
}
