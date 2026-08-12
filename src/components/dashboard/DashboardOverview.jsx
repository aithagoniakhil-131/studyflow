import React from 'react';
import { Card, CardBody } from '../ui/Card';
import { Flame, CheckSquare, Timer, Target, GraduationCap } from 'lucide-react';

export default function DashboardOverview({
  progressPct = 0,
  tasksCount = '0/0',
  studyTimeStr = '0m',
  streakDays = 0,
  semesterStr = 'Semester 1'
}) {
  const cards = [
    {
      label: 'Daily Progress',
      value: `${progressPct}%`,
      icon: <Target className="w-4 h-4 text-brand-purple" />,
      colorClass: 'text-brand-purple'
    },
    {
      label: 'Tasks Completed',
      value: tasksCount,
      icon: <CheckSquare className="w-4 h-4 text-cyan-400" />,
      colorClass: 'text-cyan-400'
    },
    {
      label: 'Study Time',
      value: studyTimeStr,
      icon: <Timer className="w-4 h-4 text-emerald-400" />,
      colorClass: 'text-emerald-400'
    },
    {
      label: 'Current Streak',
      value: `${streakDays} Days`,
      icon: <Flame className="w-4 h-4 text-amber-500 fill-amber-500/20" />,
      colorClass: 'text-amber-500'
    },
    {
      label: 'Academic Term',
      value: semesterStr,
      icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
      colorClass: 'text-blue-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border border-border-card/40 bg-bg-card/50">
          <CardBody className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <span>{card.label}</span>
              {card.icon}
            </div>
            <div className={`text-xl md:text-2xl font-extrabold tracking-tight font-display ${card.colorClass}`}>
              {card.value}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
