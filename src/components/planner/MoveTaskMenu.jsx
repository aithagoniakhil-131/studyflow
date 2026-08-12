import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export default function MoveTaskMenu({ days = [], onMove, onClose }) {
  const menuRef = useRef(null);

  // Close menu if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDayLabel = (date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 mt-2 w-48 rounded-xl bg-bg-card border border-border-card shadow-2xl p-2 z-50 glass-panel space-y-1 text-xs text-text-primary"
    >
      <div className="px-2 py-1.5 border-b border-border-card/40 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        <span>Reschedule To</span>
      </div>
      
      <div className="max-h-56 overflow-y-auto space-y-0.5">
        {days.map((dayDate) => {
          const dateStr = formatDateString(dayDate);
          
          return (
            <button
              key={dateStr}
              onClick={() => {
                onMove(dateStr);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/40 text-text-muted hover:text-text-primary font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>{getDayName(dayDate)}</span>
              <span className="text-[10px] text-text-muted/60">{getDayLabel(dayDate)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
