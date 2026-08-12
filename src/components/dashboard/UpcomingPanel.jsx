import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { FileText, CheckSquare, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UpcomingPanel({ exams = [], tasks = [] }) {
  // 1. Prepare exams list
  const examItems = exams.map(exam => ({
    id: `exam-${exam.id}`,
    title: exam.title,
    subject: exam.subject,
    type: 'Exam',
    date: exam.date,
    time: exam.time,
    daysLeft: exam.daysLeft,
    countdown: exam.countdown,
    icon: <FileText className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: 'border-l-2 border-rose-500'
  }));

  // 2. Prepare deadline tasks list (non-completed and non-cancelled)
  const taskItems = tasks.map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    subject: task.subject,
    type: 'Assignment',
    date: task.due_date,
    time: task.due_time,
    daysLeft: task.daysLeft,
    countdown: task.countdown,
    icon: <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />,
    colorClass: 'border-l-2 border-cyan-500'
  }));

  // 3. Combine and sort by proximity (closest first)
  const allUpcoming = [...examItems, ...taskItems]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3); // Display top 3 nearest items

  return (
    <Card className="border border-border-card/40 bg-bg-card/50">
      <CardHeader className="flex items-center justify-between p-5 pb-3">
        <h3 className="font-bold text-base tracking-tight font-display text-text-primary">Upcoming</h3>
        <Link 
          to="/planner" 
          className="text-xs font-semibold text-text-muted hover:text-brand-purple flex items-center gap-0.5 transition-colors"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      
      <CardBody className="p-4 pt-0 space-y-3">
        {allUpcoming.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-xs">
            No upcoming exams or deadlines found.
          </div>
        ) : (
          allUpcoming.map((item) => {
            const isTomorrow = item.daysLeft === 1 || item.countdown === 'Tomorrow';
            const isToday = item.daysLeft === 0 || item.countdown === 'Today';
            
            let countdownColor = 'text-cyan-400';
            if (isToday || isTomorrow) {
              countdownColor = 'text-rose-400';
            }

            return (
              <div 
                key={item.id}
                className={`p-3 rounded-lg bg-zinc-900/30 border border-border-card/20 flex items-center justify-between gap-3 text-xs leading-tight ${item.colorClass}`}
              >
                {/* Left section: title and subtitle info */}
                <div className="min-w-0">
                  <div className="font-bold text-text-primary truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted font-medium">
                    <span className="flex items-center gap-1">
                      {item.icon}
                      {item.type}
                    </span>
                    <span>•</span>
                    <span>{item.subject}</span>
                    {item.time && (
                      <>
                        <span>•</span>
                        <span>{item.time.substring(0, 5)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right section: countdown display */}
                <span className={`font-bold flex-shrink-0 whitespace-nowrap text-right ${countdownColor}`}>
                  {item.countdown}
                </span>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
