import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';

export default function DisciplineCard({ disciplineScore = 0, activityHistory = [] }) {
  // activityHistory is expected to be an array of 14 numbers (activity counts for each of the last 14 days, index 13 is today)
  // Ensure we have exactly 14 items
  const history = activityHistory.length === 14 
    ? activityHistory 
    : Array(14).fill(0).map((_, idx) => activityHistory[idx] || 0);

  // Define purple opacity based on completed actions count
  const getBoxColorClass = (count) => {
    if (count === 0) return 'bg-zinc-900 border border-border-card/30';
    if (count === 1) return 'bg-brand-purple/20 border border-brand-purple/10';
    if (count === 2) return 'bg-brand-purple/50 border border-brand-purple/30';
    return 'bg-brand-purple border border-brand-purple/50 text-white';
  };

  return (
    <Card className="border border-border-card/40 bg-bg-card/50">
      <CardHeader className="flex items-center justify-between p-5 pb-3">
        <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted">Discipline Score</h3>
        <span className="text-xl font-black font-display text-text-primary">
          {disciplineScore}<span className="text-xs text-text-muted font-normal font-sans">/100</span>
        </span>
      </CardHeader>
      
      <CardBody className="p-5 pt-0 space-y-4">
        {/* 14 contribution boxes (2 rows of 7 boxes each) */}
        <div className="flex flex-col gap-2">
          {/* Row 1: Days 1 to 7 (First Week) */}
          <div className="grid grid-cols-7 gap-2">
            {history.slice(0, 7).map((count, idx) => (
              <div
                key={`h1-${idx}`}
                className={`aspect-square rounded-md transition-all duration-300 ${getBoxColorClass(count)}`}
                title={`${count} action${count !== 1 ? 's' : ''} completed`}
              />
            ))}
          </div>

          {/* Row 2: Days 8 to 14 (Second Week / Today is index 13) */}
          <div className="grid grid-cols-7 gap-2">
            {history.slice(7, 14).map((count, idx) => (
              <div
                key={`h2-${idx}`}
                className={`aspect-square rounded-md transition-all duration-300 ${getBoxColorClass(count)}`}
                title={`${count} action${count !== 1 ? 's' : ''} completed`}
              />
            ))}
          </div>
        </div>

        {/* Labels Footer */}
        <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <span>2W Ago</span>
          <span>Today</span>
        </div>
      </CardBody>
    </Card>
  );
}
