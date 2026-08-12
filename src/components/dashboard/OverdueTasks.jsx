import React from 'react';
import { Card, CardBody } from '../ui/Card';
import { AlertCircle, Check } from 'lucide-react';

export default function OverdueTasks({ tasks = [], onToggleComplete }) {
  if (tasks.length === 0) return null;

  return (
    <Card className="border border-priority-high/20 bg-priority-high-bg/10 relative overflow-hidden">
      <CardBody className="p-4 space-y-3">
        {/* Header alert */}
        <div className="flex items-center gap-2 text-priority-high">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-display font-extrabold text-sm uppercase tracking-wider">
            {tasks.length} Overdue Task{tasks.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Tasks list */}
        <div className="divide-y divide-priority-high/10">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="py-3 flex items-center justify-between gap-4 text-xs font-semibold"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <button
                  onClick={() => onToggleComplete(task.id, false)}
                  className="w-4 h-4 rounded border border-priority-high/40 bg-zinc-950/40 hover:border-priority-high text-priority-high flex-shrink-0 flex items-center justify-center cursor-pointer mt-0.5"
                >
                  <Check className="w-3 h-3 opacity-0 hover:opacity-100" />
                </button>
                <div className="min-w-0">
                  <div className="text-text-primary truncate">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                    <span className="text-priority-high font-bold uppercase">{task.subject}</span>
                    <span>•</span>
                    <span>Due {task.due_date}</span>
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-priority-high-bg text-priority-high border border-priority-high/20">
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
