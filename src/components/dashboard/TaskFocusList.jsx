import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Link as LinkIcon, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TaskFocusList({ tasks = [], onToggleComplete, onStartFocus }) {
  const navigate = useNavigate();
  
  const todayTasks = tasks.filter(t => t.status !== 'cancelled');

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHours = h % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatCompletedTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <Card className="border border-border-card/40 bg-bg-card/50">
      <CardHeader className="flex items-center justify-between p-5 pb-3">
        <h3 className="font-bold text-base tracking-tight font-display text-text-primary">Today's Focus</h3>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => navigate('/tasks')} 
          className="bg-brand-purple hover:bg-brand-purple-hover text-xs font-semibold py-1.5 px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </Button>
      </CardHeader>
      <CardBody className="p-0 divide-y divide-border-card/20 max-h-[360px] overflow-y-auto">
        {todayTasks.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm space-y-2">
            <p>Your day is clear.</p>
            <p className="text-xs text-text-muted/60">Add a task to start planning today's focus.</p>
          </div>
        ) : (
          todayTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            
            return (
              <div 
                key={task.id} 
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isCompleted ? 'bg-zinc-950/20 text-text-muted' : 'hover:bg-zinc-900/10'
                }`}
              >
                {/* Left side: checkbox and task titles */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleComplete(task.id, isCompleted)}
                    className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                      isCompleted 
                        ? 'bg-brand-purple border-brand-purple text-bg-base' 
                        : 'border-border-card bg-zinc-900/60 hover:border-brand-purple/50'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 leading-tight">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${
                        isCompleted ? 'line-through text-text-muted/60' : 'text-text-primary'
                      }`}>
                        {task.title}
                      </span>
                      
                      {/* Priority Tag */}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-priority-high-bg text-priority-high border border-priority-high/15'
                          : task.priority === 'medium'
                            ? 'bg-priority-medium-bg text-priority-medium border border-priority-medium/15'
                            : 'bg-priority-low-bg text-priority-low border border-priority-low/15'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>

                    {/* Metadata Sub-labels Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-text-muted">
                      <span className="font-semibold text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded text-[10px]">
                        {task.subject}
                      </span>
                      
                      {task.estimated_minutes > 0 && (
                        <span>{task.estimated_minutes} min</span>
                      )}

                      {task.due_time && !isCompleted && (
                        <span>Due {formatTime(task.due_time)}</span>
                      )}

                      {isCompleted && task.completed_at && (
                        <span className="text-emerald-400">
                          Completed at {formatCompletedTime(task.completed_at)}
                        </span>
                      )}
                      
                      {/* Attached resource links indicator */}
                      {task.hasResources && (
                        <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                          <LinkIcon className="w-3 h-3" />
                          Vault
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Start Focus trigger play button */}
                {!isCompleted && (
                  <button
                    onClick={() => onStartFocus(task)}
                    className="p-2 rounded-lg border border-border-card bg-zinc-900/60 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple transition-all cursor-pointer hover:scale-105 flex-shrink-0"
                    title="Start focus block"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
