import React from 'react';
import { Card, CardBody } from '../ui/Card';

export default function WeeklySummary({ 
  totalTasks = 0, 
  completedTasks = 0, 
  totalPlannedMinutes = 0, 
  overdueCount = 0 
}) {
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hours = Math.floor(totalPlannedMinutes / 60);
  const minutes = totalPlannedMinutes % 60;
  const workloadDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Card className="border border-border-card/30 bg-bg-card/30">
      <CardBody className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Text stats */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-left">
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">This Week's Tasks</span>
            <span className="text-xl font-black font-display text-text-primary mt-1 block">{totalTasks} Tasks</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Completed</span>
            <span className="text-xl font-black font-display text-emerald-400 mt-1 block">{completedTasks} Done</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Planned Workload</span>
            <span className="text-xl font-black font-display text-cyan-400 mt-1 block">{workloadDisplay}</span>
          </div>
          {overdueCount > 0 && (
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Overdue Items</span>
              <span className="text-xl font-black font-display text-rose-400 mt-1 block">{overdueCount} Pending</span>
            </div>
          )}
        </div>

        {/* Right Side: Progress Bar */}
        <div className="w-full md:w-64 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>Weekly Progress</span>
            <span className="text-brand-purple font-bold">{completedTasks}/{totalTasks} ({completionPct}%)</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-brand-purple h-2 rounded-full transition-all duration-500 shadow-md shadow-brand-purple/20" 
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
