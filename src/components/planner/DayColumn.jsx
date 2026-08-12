import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Play, Link as LinkIcon, Check, Plus, 
  CalendarRange, MoveHorizontal, Edit3, Trash2, 
  AlertCircle, FileText, CheckCircle2 
} from 'lucide-react';
import MoveTaskMenu from './MoveTaskMenu';

export default function DayColumn({ 
  dayDate,
  isToday = false,
  tasks = [],
  exams = [],
  weekDays = [],
  onToggleComplete,
  onStartFocus,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onAddTask
}) {
  const [activeRescheduleTaskId, setActiveRescheduleTaskId] = useState(null);

  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const dayDateStr = formatDateString(dayDate);
  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayLabel = dayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  // Calculate stats for non-cancelled tasks
  const activeTasks = tasks.filter(t => t.status !== 'cancelled');
  const completedTasks = activeTasks.filter(t => t.status === 'completed');
  
  const totalMinutes = activeTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const workloadText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Workload classification thresholds
  // Light: 0-119 mins, Moderate: 120-300 mins, Heavy: >300 mins
  let workloadCategory = 'Light';
  let workloadColorClass = 'text-text-muted bg-zinc-900/60 border-zinc-800/40';
  if (totalMinutes >= 120 && totalMinutes <= 300) {
    workloadCategory = 'Moderate';
    workloadColorClass = 'text-cyan-400 bg-cyan-950/10 border-cyan-500/10';
  } else if (totalMinutes > 300) {
    workloadCategory = 'Heavy';
    workloadColorClass = 'text-rose-400 bg-rose-950/20 border-rose-500/20';
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <Card 
      className={`border flex flex-col h-[520px] transition-all relative ${
        isToday 
          ? 'border-brand-purple shadow-lg shadow-brand-purple/5 bg-bg-card/75' 
          : 'border-border-card/40 bg-bg-card/50'
      }`}
    >
      {/* Column Header */}
      <CardHeader className="p-4 pb-3 border-b border-border-card/20 flex flex-col items-start gap-1">
        <div className="flex items-center justify-between w-full">
          <span className="font-display font-black text-sm tracking-wide text-text-primary uppercase">
            {dayName}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
            isToday 
              ? 'bg-brand-purple text-bg-base border-brand-purple' 
              : 'text-text-muted bg-zinc-900/40 border-border-card/30'
          }`}>
            {dayLabel}
          </span>
        </div>

        {/* Workload Metrics & Alert */}
        <div className="flex items-center justify-between w-full mt-2">
          <div className="text-[10px] text-text-muted font-bold">
            {activeTasks.length} Tasks • {completedTasks.length} Done
          </div>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none ${workloadColorClass}`}>
            {workloadText} {workloadCategory === 'Heavy' && '⚠️'}
          </span>
        </div>

        {workloadCategory === 'Heavy' && (
          <div className="w-full mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-950/20 border border-rose-500/10 p-1.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Heavy Workload. Reschedule items to balance stress.</span>
          </div>
        )}
      </CardHeader>

      {/* Tasks & Exams lists */}
      <CardBody className="p-2 flex-1 overflow-y-auto space-y-2.5 max-h-[360px]">
        {/* Exams items lists */}
        {exams.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest pl-2 block">
              Exams
            </span>
            {exams.map(exam => (
              <div 
                key={exam.id} 
                className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-950/10 text-left text-xs leading-tight border-l-2 border-l-rose-500"
              >
                <div className="font-bold text-text-primary truncate">{exam.title}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-rose-300/80 font-medium">
                  <span className="flex items-center gap-0.5">
                    <FileText className="w-3 h-3" />
                    Syllabus
                  </span>
                  <span>•</span>
                  <span>{exam.subject}</span>
                  {exam.time && (
                    <>
                      <span>•</span>
                      <span>{formatTime(exam.time)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks list */}
        <div className="space-y-2">
          {exams.length > 0 && activeTasks.length > 0 && (
            <span className="text-[9px] font-bold text-brand-purple uppercase tracking-widest pl-2 block">
              Tasks
            </span>
          )}
          
          {activeTasks.length === 0 && exams.length === 0 ? (
            <div className="py-12 text-center text-text-muted/50 text-[11px] leading-tight">
              No tasks scheduled
            </div>
          ) : (
            activeTasks.map(task => {
              const isCompleted = task.status === 'completed';
              
              return (
                <div 
                  key={task.id}
                  className={`p-2.5 rounded-xl border border-border-card/30 bg-zinc-900/30 text-left text-xs relative flex flex-col justify-between gap-2.5 group transition-all ${
                    isCompleted ? 'opacity-50 border-dashed bg-zinc-950/20' : 'hover:border-border-card/60'
                  }`}
                >
                  {/* Top block checkbox and titles */}
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => onToggleComplete(task.id, isCompleted)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                        isCompleted 
                          ? 'bg-brand-purple border-brand-purple text-bg-base' 
                          : 'border-border-card bg-zinc-900/60 hover:border-brand-purple/50'
                      }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className={`font-semibold block truncate ${
                        isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}>
                        {task.title}
                      </span>
                      <span className="text-[9px] font-semibold text-brand-purple-hover bg-brand-purple-bg px-1.5 py-0.5 rounded mt-1.5 inline-block">
                        {task.subject}
                      </span>
                    </div>
                  </div>

                  {/* Task details tags metadata */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-text-muted">
                    {task.estimated_minutes > 0 && (
                      <span>{task.estimated_minutes}m</span>
                    )}
                    {task.due_time && (
                      <span>{formatTime(task.due_time)}</span>
                    )}
                    {task.recurring && (
                      <span className="text-[9px] text-cyan-400 font-bold">↻</span>
                    )}
                    {task.resource_url && (
                      <LinkIcon className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>

                  {/* Hover Actions triggers toolbar */}
                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border-card/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Focus Session Action */}
                    {!isCompleted && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="p-1 rounded bg-zinc-900 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple transition-all cursor-pointer"
                        title="Start Focus Timer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    {/* Reschedule move day Action */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveRescheduleTaskId(
                          activeRescheduleTaskId === task.id ? null : task.id
                        )}
                        className="p-1 rounded bg-zinc-900 hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 transition-all cursor-pointer"
                        title="Move to another day"
                      >
                        <MoveHorizontal className="w-3.5 h-3.5" />
                      </button>
                      
                      {activeRescheduleTaskId === task.id && (
                        <MoveTaskMenu 
                          days={weekDays}
                          onMove={(newDate) => {
                            onMoveTask(task.id, newDate);
                            setActiveRescheduleTaskId(null);
                          }}
                          onClose={() => setActiveRescheduleTaskId(null)}
                        />
                      )}
                    </div>

                    {/* Edit Action */}
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded bg-zinc-900 hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 transition-all cursor-pointer"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={() => onDeleteTask(task)}
                      className="p-1 rounded bg-zinc-900 hover:border-rose-500/40 text-text-muted hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>

      {/* Column Footer: Quick add task trigger */}
      <div className="p-3 border-t border-border-card/20 bg-zinc-950/20">
        <button
          onClick={() => onAddTask(dayDateStr)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border-card/40 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple text-xs font-semibold cursor-pointer transition-all hover:bg-zinc-900/10"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </Card>
  );
}
