import React from 'react';
import { X, Flame, CheckCircle, AlertTriangle, Calendar, Star } from 'lucide-react';
import { 
  calculateHabitStreak, 
  calculateLongestHabitStreak, 
  isHabitExpectedOnDate,
  formatLocalDateString 
} from '../../services/habitService';
import { Button } from '../ui/Button';

export default function HabitDetailModal({ isOpen, onClose, habit = null, logs = [] }) {
  if (!isOpen || !habit) return null;

  const currentStreak = calculateHabitStreak(habit, logs);
  const longestStreak = calculateLongestHabitStreak(habit, logs);

  const habitLogs = logs.filter(l => l.habit_id === habit.id);
  const totalCompleted = habitLogs.filter(l => l.completed).length;

  // Calculate missed count since creation
  const calculateTotalMissed = () => {
    const createdDateStr = habit.created_at.split('T')[0];
    const startDate = new Date(createdDateStr + 'T12:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    let missed = 0;
    const completedSet = new Set(habitLogs.filter(l => l.completed).map(l => l.date));

    const current = new Date(startDate);
    while (current <= yesterday) {
      const curStr = formatLocalDateString(current);
      if (isHabitExpectedOnDate(habit, curStr) && !completedSet.has(curStr)) {
        missed++;
      }
      current.setDate(current.getDate() + 1);
    }
    return missed;
  };

  const totalMissed = calculateTotalMissed();
  const totalExpectedCount = totalCompleted + totalMissed;
  const consistencyPct = totalExpectedCount > 0 ? Math.round((totalCompleted / totalExpectedCount) * 100) : 100;

  // Render recent 7 days expected status row
  const getRecentHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatLocalDateString(d);
      
      const isExpected = isHabitExpectedOnDate(habit, dateStr);
      const log = habitLogs.find(l => l.date === dateStr);
      const isCompleted = !!(log && log.completed);

      history.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isExpected,
        isCompleted
      });
    }
    return history;
  };

  const recentHistory = getRecentHistory();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-bg-card border border-border-card w-full max-w-md rounded-2xl p-6 relative shadow-2xl glass-panel space-y-4 text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Details */}
        <div className="space-y-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
            habit.is_active 
              ? 'bg-emerald-950/20 border-emerald-500/10 text-emerald-400' 
              : 'bg-zinc-900/60 border-border-card text-text-muted'
          }`}>
            {habit.is_active ? 'Active' : 'Paused'}
          </span>
          <h2 className="text-xl font-extrabold font-display text-text-primary mt-1.5 leading-tight">
            {habit.title}
          </h2>
          <p className="text-xs text-text-muted font-medium capitalize">
            Repeat: {habit.frequency_type} {habit.frequency_type === 'daily' && habit.frequency_interval > 1 ? `(every ${habit.frequency_interval} days)` : ''}
          </p>
        </div>

        <div className="h-px bg-border-card/20" />

        {/* Streaks metrics panel grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-400 fill-orange-400/20" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Current Streak</span>
              <span className="text-sm font-black font-display text-text-primary">{currentStreak} occurrences</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Longest Streak</span>
              <span className="text-sm font-black font-display text-text-primary">{longestStreak} occurrences</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Total Completed</span>
              <span className="text-sm font-black font-display text-text-primary">{totalCompleted} times</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Total Missed</span>
              <span className="text-sm font-black font-display text-text-primary">{totalMissed} times</span>
            </div>
          </div>
        </div>

        {/* Consistency progress bar */}
        <div className="space-y-2 p-3 bg-zinc-900/20 border border-border-card/20 rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Overall Consistency</span>
            <span className="text-brand-purple font-bold">{consistencyPct}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div 
              className="bg-brand-purple h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${consistencyPct}%` }}
            />
          </div>
        </div>

        {/* Recent 7 Days Timeline grid */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Recent Week Timeline
          </span>
          <div className="grid grid-cols-7 gap-1.5 p-2 rounded-xl bg-zinc-900/20 border border-border-card/20 text-center">
            {recentHistory.map((hist) => (
              <div 
                key={hist.dateStr}
                className={`py-1.5 rounded-lg flex flex-col items-center gap-1 ${
                  !hist.isExpected 
                    ? 'opacity-30' 
                    : hist.isCompleted 
                      ? 'bg-brand-purple/15 text-brand-purple-hover border border-brand-purple/20' 
                      : 'bg-rose-950/10 text-rose-400 border border-rose-500/10'
                }`}
              >
                <span className="text-[8px] font-bold uppercase">{hist.dayName}</span>
                <span className="text-[10px] font-mono font-bold">{hist.dayNum}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="border border-border-card hover:bg-zinc-800/10 px-5 rounded-lg text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
