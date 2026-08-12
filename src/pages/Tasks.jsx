import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  taskService, 
  TASK_CATEGORIES, 
  isTaskOverdue 
} from '../services/taskService';

import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import TaskFormModal from '../components/tasks/TaskFormModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';

import { 
  Plus, Search, SlidersHorizontal, Check, 
  Play, Video, Link as LinkIcon, Trash2, 
  Edit3, Calendar, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { startTimer, triggerTaskSound } = usePomodoro();

  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, today, upcoming, overdue, completed
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date'); // due_date, priority, created_at, estimated_minutes

  // Modal Controllers
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // Used for edit or delete target

  const loadTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await taskService.list(user.id);
      setTasks(list);
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Unable to load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  // Task Action: Toggle Completion
  const handleToggleComplete = async (taskId, isCurrentlyCompleted) => {
    try {
      if (isCurrentlyCompleted) {
        await taskService.uncomplete(taskId);
        toast.success('Task marked incomplete.');
      } else {
        triggerTaskSound(); // Audio cue
        await taskService.complete(taskId);
        toast.success('Task completed!');
      }
      await loadTasks();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task completion.');
    }
  };

  // Task Action: Cancel
  const handleCancelTask = async (taskId) => {
    try {
      await taskService.cancel(taskId);
      toast.success('Task cancelled.');
      await loadTasks();
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel task.');
    }
  };

  // Task Action: Save (Create/Edit submit)
  const handleSaveTask = async (formData) => {
    try {
      if (activeTask) {
        await taskService.update(activeTask.id, formData);
        toast.success('Task updated');
      } else {
        await taskService.create(user.id, formData);
        toast.success('Task created');
      }
      await loadTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to save task.');
      throw err;
    }
  };

  // Task Action: Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!activeTask) return;
    try {
      await taskService.delete(activeTask.id);
      toast.success('Task deleted');
      setDeleteOpen(false);
      setActiveTask(null);
      await loadTasks();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete task.');
    }
  };

  // Start Focus (Pomodoro launch)
  const handleStartFocus = (task) => {
    startTimer(task.id, task.subject);
    toast.success(`Focus timer started for: ${task.title}`);
    navigate('/focus');
  };

  // Statistics Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter(t => t.status !== 'cancelled');

  const stats = {
    today: activeTasks.filter(t => t.due_date === todayStr && t.status !== 'completed').length,
    completedToday: tasks.filter(t => t.status === 'completed' && t.completed_at && t.completed_at.startsWith(todayStr)).length,
    overdue: tasks.filter(isTaskOverdue).length,
    thisWeek: activeTasks.filter(t => {
      const today = new Date();
      const currentDay = today.getDay();
      const diffToMon = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const mon = new Date(today.setDate(diffToMon));
      mon.setHours(0,0,0,0);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23,59,59,999);
      
      const monStr = mon.toISOString().split('T')[0];
      const sunStr = sun.toISOString().split('T')[0];
      return t.due_date >= monStr && t.due_date <= sunStr;
    }).length
  };

  // Dynamic Subjects List for filter
  const subjectsList = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    // 1. Text Search matching
    const searchMatch = !searchTerm.trim() || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // 2. Status/Date filter mapping
    if (statusFilter === 'today') {
      if (task.due_date !== todayStr || task.status === 'cancelled') return false;
    } else if (statusFilter === 'upcoming') {
      if (task.due_date <= todayStr || task.status === 'completed' || task.status === 'cancelled') return false;
    } else if (statusFilter === 'overdue') {
      if (!isTaskOverdue(task)) return false;
    } else if (statusFilter === 'completed') {
      if (task.status !== 'completed') return false;
    }

    // 3. Dropdowns filters mapping
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (subjectFilter !== 'all' && task.subject !== subjectFilter) return false;

    return true;
  });

  // Sort Tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      const dateCompare = a.due_date.localeCompare(b.due_date);
      if (dateCompare !== 0) return dateCompare;
      return (a.due_time || '23:59').localeCompare(b.due_time || '23:59');
    }
    
    if (sortBy === 'priority') {
      const pValues = { high: 3, medium: 2, low: 1 };
      return (pValues[b.priority] || 2) - (pValues[a.priority] || 2);
    }
    
    if (sortBy === 'created_at') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    
    if (sortBy === 'estimated_minutes') {
      return (b.estimated_minutes || 0) - (a.estimated_minutes || 0);
    }

    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header bar actions */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Task Management</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Organise, track, and complete your academic workloads.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setActiveTask(null);
            setFormOpen(true);
          }}
          className="bg-brand-purple hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/20 flex items-center gap-1.5 font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-cyan-400 p-1.5 rounded-lg bg-cyan-950/20" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Today's Remaining</div>
              <div className="text-2xl font-black font-display text-text-primary mt-0.5">{stats.today}</div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 p-1.5 rounded-lg bg-emerald-950/20" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Completed Today</div>
              <div className="text-2xl font-black font-display text-text-primary mt-0.5">{stats.completedToday}</div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 p-1.5 rounded-lg bg-rose-950/20" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Overdue Tasks</div>
              <div className="text-2xl font-black font-display text-text-primary mt-0.5">{stats.overdue}</div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-brand-purple p-1.5 rounded-lg bg-brand-purple-bg" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Due This Week</div>
              <div className="text-2xl font-black font-display text-text-primary mt-0.5">{stats.thisWeek}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters, search and sort toolbar */}
      <Card className="border border-border-card/30 bg-bg-card/30">
        <CardBody className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks by title, subject, notes..."
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple transition-all placeholder:text-text-muted/60"
              />
            </div>

            {/* Sort Order select dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-auto text-xs font-semibold text-text-muted">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-900/60 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created_at">Date Created</option>
                <option value="estimated_minutes">Estimated Mins</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-border-card/20" />

          {/* Detailed Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status pills navigation */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'All', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Completed', value: 'completed' }
              ].map(pill => (
                <button
                  key={pill.value}
                  onClick={() => setStatusFilter(pill.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === pill.value
                      ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                      : 'bg-zinc-900/40 border border-border-card/30 text-text-muted hover:text-text-primary'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Subject, Priority, Category dropdown selects */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-900/40 border border-border-card/40 rounded-lg px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Categories</option>
                {TASK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Priority selector */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-zinc-900/40 border border-border-card/40 rounded-lg px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              {/* Subject selector */}
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-zinc-900/40 border border-border-card/40 rounded-lg px-2.5 py-1.5 text-xs text-text-muted focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error / Loading / Content grids */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <p className="text-priority-high text-sm font-semibold">{error}</p>
          <Button variant="primary" onClick={loadTasks} className="bg-brand-purple">Retry</Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="py-20 text-center max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold text-text-primary font-display">No tasks yet.</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Create your first task and start taking control of your academic workload. Define subjects, estimated durations, resource vault links, and recurring calendars.
            </p>
            <Button 
              variant="primary" 
              onClick={() => {
                setActiveTask(null);
                setFormOpen(true);
              }}
              className="bg-brand-purple hover:bg-brand-purple-hover"
            >
              + Create Task
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isCancelled = task.status === 'cancelled';
            const isOverdue = isTaskOverdue(task);

            return (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border border-border-card/30 bg-bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left transition-all ${
                  isCompleted 
                    ? 'opacity-60 bg-zinc-950/10' 
                    : isCancelled 
                      ? 'opacity-40 border-dashed bg-zinc-950/20' 
                      : 'hover:border-border-card/60'
                }`}
              >
                {/* Left block: Checkbox and title elements */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task.id, isCompleted)}
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
                        isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
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

                      {/* Status indicator badges */}
                      {isCancelled && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-800 text-text-muted border border-zinc-700/30">
                          Cancelled
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-950/20 text-rose-400 border border-rose-500/10">
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Description excerpt */}
                    {task.description && (
                      <p className="text-xs text-text-muted mt-1 truncate max-w-xl font-normal">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Sub-labels */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-text-muted">
                      <span className="font-semibold text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded text-[10px]">
                        {task.subject}
                      </span>
                      <span className="text-text-muted/80">{task.category}</span>
                      
                      {task.estimated_minutes > 0 && (
                        <span>{task.estimated_minutes} min</span>
                      )}

                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {task.due_date} {task.due_time ? `@ ${task.due_time}` : ''}
                        </span>
                      )}

                      {task.recurring && (
                        <span className="bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded text-[9px] font-bold border border-cyan-500/10 uppercase">
                          ↻ {task.repeat_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right block: Action links focus, watch, edits, delete */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                  {/* YouTube Action watch video link */}
                  {task.video_url && (
                    <a
                      href={task.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/25 bg-red-950/10 hover:bg-red-950/25 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
                      title="Watch YouTube attachment"
                    >
                      <Video className="w-3.5 h-3.5 fill-current" />
                      <span>Watch</span>
                    </a>
                  )}

                  {/* Resource Web Action Link */}
                  {task.resource_url && (
                    <a
                      href={task.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan-500/25 bg-cyan-950/10 hover:bg-cyan-950/25 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Open attached resource link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </a>
                  )}

                  {/* Focus Action play button */}
                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => handleStartFocus(task)}
                      className="p-1.5 rounded-lg border border-border-card/80 bg-zinc-900/60 hover:border-brand-purple/50 text-text-muted hover:text-brand-purple transition-all cursor-pointer"
                      title="Start Focus session"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  {/* Edit task button */}
                  <button
                    onClick={() => {
                      setActiveTask(task);
                      setFormOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-border-card/80 bg-zinc-900/60 hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 transition-all cursor-pointer"
                    title="Edit task details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Cancel task button (only if not cancelled or completed) */}
                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => handleCancelTask(task.id)}
                      className="px-2 py-1.5 rounded-lg border border-border-card/80 bg-zinc-900/60 text-[10px] font-bold text-text-muted hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
                      title="Cancel task"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Delete task button */}
                  <button
                    onClick={() => {
                      setActiveTask(task);
                      setDeleteOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-border-card/80 bg-zinc-900/60 hover:border-rose-500/40 text-text-muted hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task form Modal (Create / Edit) */}
      <TaskFormModal 
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setActiveTask(null);
        }}
        onSave={handleSaveTask}
        task={activeTask}
      />

      {/* Delete confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setActiveTask(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskTitle={activeTask ? activeTask.title : ''}
      />
    </div>
  );
}
