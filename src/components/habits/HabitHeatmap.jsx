import React from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { isHabitExpectedOnDate, formatLocalDateString } from '../../services/habitService';

export default function HabitHeatmap({ habits = [], logs = [] }) {
  // Generate 28 days (last 4 weeks ending on Sunday of current week)
  const getHeatmapWeeks = () => {
    const today = new Date();
    const day = today.getDay();
    // Monday of this week
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const thisMonday = new Date(today.setDate(diff));
    
    // Sunday of this week
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    
    const dates = [];
    // Go back 27 days from Sunday of current week (covers exactly 4 weeks, Mon to Sun)
    for (let i = 27; i >= 0; i--) {
      const d = new Date(thisSunday);
      d.setDate(thisSunday.getDate() - i);
      dates.push(d);
    }

    // Group into 4 weeks of 7 days
    const weeks = [];
    for (let i = 0; i < 28; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }
    return weeks;
  };

  const weeks = getHeatmapWeeks();
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Helper to determine completion rate and cell coloring
  const getCellStats = (date) => {
    const dateStr = formatLocalDateString(date);
    const activeHabits = habits.filter(h => h.is_active);
    
    let expectedCount = 0;
    let completedCount = 0;

    activeHabits.forEach(habit => {
      if (isHabitExpectedOnDate(habit, dateStr)) {
        expectedCount++;
        const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
        if (log && log.completed) {
          completedCount++;
        }
      }
    });

    const completionRate = expectedCount > 0 ? completedCount / expectedCount : 0;
    
    let colorClass = 'bg-zinc-900/60 border border-zinc-800/40 text-text-muted/30';
    if (expectedCount > 0) {
      if (completionRate === 0) {
        colorClass = 'bg-zinc-950 border border-zinc-900 text-text-muted/40';
      } else if (completionRate <= 0.34) {
        colorClass = 'bg-brand-purple/20 border border-brand-purple/10 text-brand-purple-hover';
      } else if (completionRate <= 0.67) {
        colorClass = 'bg-brand-purple/55 border border-brand-purple/30 text-white';
      } else {
        colorClass = 'bg-brand-purple border border-brand-purple/50 text-white font-bold';
      }
    }

    return {
      expectedCount,
      completedCount,
      ratePct: Math.round(completionRate * 100),
      colorClass,
      dateLabel: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      dateStr
    };
  };

  return (
    <Card className="border border-border-card/30 bg-bg-card/30">
      <CardHeader className="p-4 pb-2 text-left">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Consistency Heatmap (Last 4 Weeks)</span>
      </CardHeader>
      <CardBody className="p-4 pt-1 space-y-4">
        {/* Heatmap Grid container */}
        <div className="flex flex-col gap-1.5 overflow-x-auto select-none">
          {/* Weekday Names Header */}
          <div className="flex gap-2 justify-between">
            {weekdays.map((day, idx) => (
              <div key={idx} className="w-10 text-center text-[9px] font-bold text-text-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid cells */}
          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-2 justify-between">
                {week.map((date, dayIdx) => {
                  const stats = getCellStats(date);
                  
                  return (
                    <div
                      key={stats.dateStr}
                      className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all relative group cursor-default ${stats.colorClass}`}
                    >
                      <span className="font-mono">{date.getDate()}</span>
                      
                      {/* Floating tooltip hover display */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-32 bg-zinc-950 border border-border-card p-2 rounded-lg text-[9px] text-text-primary text-center font-semibold leading-relaxed shadow-2xl glass-panel">
                        <span className="block text-brand-purple-hover font-bold">{stats.dateLabel}</span>
                        {stats.expectedCount > 0 ? (
                          <span>{stats.completedCount}/{stats.expectedCount} completed ({stats.ratePct}%)</span>
                        ) : (
                          <span>No habits expected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[9px] font-bold text-text-muted uppercase tracking-wider pt-2 border-t border-border-card/10">
          <span>Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-zinc-950 border border-zinc-900" title="None expected" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-brand-purple/20 border border-brand-purple/10" title="1-33% completed" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-brand-purple/55 border border-brand-purple/30" title="34-66% completed" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-brand-purple border border-brand-purple/50" title="67-100% completed" />
            <span>High</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
