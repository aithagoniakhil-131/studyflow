import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useToast } from '../context/ToastContext';
import { repo } from '../services/repo';
import { 
  taskService, 
  isTaskOverdue 
} from '../services/taskService';

import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import WeeklySummary from '../components/planner/WeeklySummary';
import DayColumn from '../components/planner/DayColumn';
import TaskFormModal from '../components/tasks/TaskFormModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';

import { 
  ChevronLeft, ChevronRight, Calendar, AlertTriangle, 
  Check, Play, Edit3, Trash2, ShieldAlert
} from 'lucide-react';

export default function Planner() {
  const { user } = useAuth();
  const toast = useToast();
  const { startTimer, triggerTaskSound } = usePomodoro();

  // Active Week Date State (Reference Date: Monday of the week being viewed)
  const [referenceMonday, setReferenceMonday] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  // Mobile active day index selector (0 = Mon, 6 = Sun)
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Map Sun -> 6, Mon -> 0
  });

  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals States
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState('');

  const loadPlannerData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [tasksList, examsList] = await Promise.all([
        taskService.list(user.id),
        repo.exams.list(user.id)
      ]);
      setTasks(tasksList);
      setExams(examsList);
      setError(null);
    } catch (err) {
      console.error('Failed to load planner data:', err);
      setError('Unable to load your weekly planner details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannerData();
  }, [user]);

  // Date Formatting Helper (Safe Local Date string)
  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Generate 7 weekdays starting from reference Monday
  const getWeekDates = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(referenceMonday);
      d.setDate(referenceMonday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDates = getWeekDates();
  const weekStartDateStr = formatDateString(weekDates[0]);
  const weekEndDateStr = formatDateString(weekDates[6]);

  // Navigation Handlers
  const handlePreviousWeek = () => {
    const newMon = new Date(referenceMonday);
    newMon.setDate(referenceMonday.getDate() - 7);
    setReferenceMonday(newMon);
  };

  const handleNextWeek = () => {
    const newMon = new Date(referenceMonday);
    newMon.setDate(referenceMonday.getDate() + 7);
    setReferenceMonday(newMon);
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    setReferenceMonday(mon);
    // Reset mobile view day to today
    const dayNum = today.getDay();
    setMobileDayIndex(dayNum === 0 ? 6 : dayNum - 1);
  };

  // Weekly Header Date Range Label
  const getWeekRangeLabel = () => {
    const startMonth = weekDates[0].toLocaleDateString('en-US', { month: 'long' });
    const endMonth = weekDates[6].toLocaleDateString('en-US', { month: 'long' });
    const startDay = weekDates[0].getDate();
    const endDay = weekDates[6].getDate();
    const year = weekDates[6].getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
  };

  // Task Actions
  const handleToggleComplete = async (taskId, isCurrentlyCompleted) => {
    try {
      if (isCurrentlyCompleted) {
        await taskService.uncomplete(taskId);
        toast.success('Task marked incomplete.');
      } else {
        triggerTaskSound();
        await taskService.complete(taskId);
        toast.success('Task completed!');
      }
      await loadPlannerData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task.');
    }
  };

  const handleMoveTask = async (taskId, newDate) => {
    try {
      await taskService.update(taskId, { due_date: newDate });
      toast.success('Task rescheduled');
      await loadPlannerData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reschedule task.');
    }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (activeTask) {
        await taskService.update(activeTask.id, formData);
        toast.success('Task updated');
      } else {
        await taskService.create(user.id, {
          ...formData,
          due_date: prefilledDate || formData.due_date
        });
        toast.success('Task created');
      }
      await loadPlannerData();
    } catch (err) {
      toast.error(err.message || 'Failed to save task.');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeTask) return;
    try {
      await taskService.delete(activeTask.id);
      toast.success('Task deleted');
      setDeleteOpen(false);
      setActiveTask(null);
      await loadPlannerData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete task.');
    }
  };

  // Tasks due in the currently selected week
  const weekTasks = tasks.filter(t => 
    t.due_date >= weekStartDateStr && 
    t.due_date <= weekEndDateStr && 
    t.status !== 'cancelled'
  );

  const completedWeekTasks = weekTasks.filter(t => t.status === 'completed');
  const weeklyPlannedMinutes = weekTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  // Overdue tasks from previous weeks (due date < Monday of active week, not cancelled/completed)
  const overdueTasksList = tasks.filter(t => 
    isTaskOverdue(t) && 
    t.due_date < weekStartDateStr
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-32 h-8" />
        </div>
        <Skeleton className="w-full h-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-priority-high text-sm font-semibold">{error}</p>
        <Button variant="primary" onClick={loadPlannerData} className="bg-brand-purple">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Weekly Planner</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Map out your study schedule and balance daily academic workloads.</p>
        </div>

        {/* Date Selector Row */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-lg border border-border-card bg-zinc-900/30 overflow-hidden">
            <button
              onClick={handlePreviousWeek}
              className="p-2.5 hover:bg-zinc-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-xs font-bold text-text-primary select-none font-mono">
              {getWeekRangeLabel()}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2.5 hover:bg-zinc-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleToday}
            variant="secondary"
            className="border border-border-card hover:bg-zinc-800/10 text-xs font-semibold py-2 px-3 rounded-lg"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Weekly summary metrics block */}
      <WeeklySummary 
        totalTasks={weekTasks.length}
        completedTasks={completedWeekTasks.length}
        totalPlannedMinutes={weeklyPlannedMinutes}
        overdueCount={overdueTasksList.length}
      />

      {/* Overdue Items Banner Row (if items are pending from prior weeks) */}
      {overdueTasksList.length > 0 && (
        <Card className="border border-rose-500/20 bg-rose-950/10 relative overflow-hidden">
          <CardBody className="p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span className="font-display font-extrabold text-sm uppercase tracking-wider">
                {overdueTasksList.length} Overdue Task{overdueTasksList.length > 1 ? 's' : ''} from Previous Weeks
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueTasksList.map(task => (
                <div 
                  key={task.id} 
                  className="p-3 rounded-xl border border-rose-500/15 bg-zinc-950/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-text-primary block truncate">{task.title}</span>
                    <span className="text-[10px] text-rose-300/80 font-bold uppercase mt-1 inline-block">
                      {task.subject} • Due {task.due_date}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(task.id, false)}
                    className="p-1 rounded bg-zinc-900 border border-rose-500/30 hover:border-rose-400 text-rose-400 flex items-center gap-1 text-[10px] font-bold cursor-pointer hover:bg-rose-950/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Mobile Week View Day Selector Panel (Visible only on mobile devices) */}
      <div className="block md:hidden">
        <div className="flex justify-between gap-1 p-1 bg-zinc-900/40 border border-border-card/30 rounded-xl overflow-x-auto">
          {weekDates.map((dayDate, idx) => {
            const dateStr = formatDateString(dayDate);
            const isSelected = mobileDayIndex === idx;
            const weekdayNameShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dayDate.getDate();
            const isToday = formatDateString(new Date()) === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setMobileDayIndex(idx)}
                className={`flex-1 min-w-[48px] py-2 px-1 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider">{weekdayNameShort}</span>
                <span className="text-sm font-extrabold font-mono">{dayNum}</span>
                {isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Column Grid View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-start">
        {weekDates.map((dayDate) => {
          const dateStr = formatDateString(dayDate);
          const isToday = formatDateString(new Date()) === dateStr;
          const dayTasks = tasks.filter(t => t.due_date === dateStr);
          const dayExams = exams.filter(e => e.date === dateStr);

          return (
            <DayColumn 
              key={dateStr}
              dayDate={dayDate}
              isToday={isToday}
              tasks={dayTasks}
              exams={dayExams}
              weekDays={weekDates}
              onToggleComplete={handleToggleComplete}
              onStartFocus={(task) => {
                startTimer(task.id, task.subject);
                toast.success(`Focus timer started for: ${task.title}`);
                navigate('/focus');
              }}
              onEditTask={(task) => {
                setActiveTask(task);
                setFormOpen(true);
              }}
              onDeleteTask={(task) => {
                setActiveTask(task);
                setDeleteOpen(true);
              }}
              onMoveTask={handleMoveTask}
              onAddTask={(date) => {
                setPrefilledDate(date);
                setActiveTask(null);
                setFormOpen(true);
              }}
            />
          );
        })}
      </div>

      {/* Mobile Focused Day Column View */}
      <div className="block md:hidden">
        {(() => {
          const selectedDayDate = weekDates[mobileDayIndex];
          const dateStr = formatDateString(selectedDayDate);
          const isToday = formatDateString(new Date()) === dateStr;
          const dayTasks = tasks.filter(t => t.due_date === dateStr);
          const dayExams = exams.filter(e => e.date === dateStr);

          return (
            <DayColumn 
              dayDate={selectedDayDate}
              isToday={isToday}
              tasks={dayTasks}
              exams={dayExams}
              weekDays={weekDates}
              onToggleComplete={handleToggleComplete}
              onStartFocus={(task) => {
                startTimer(task.id, task.subject);
                toast.success(`Focus timer started for: ${task.title}`);
                navigate('/focus');
              }}
              onEditTask={(task) => {
                setActiveTask(task);
                setFormOpen(true);
              }}
              onDeleteTask={(task) => {
                setActiveTask(task);
                setDeleteOpen(true);
              }}
              onMoveTask={handleMoveTask}
              onAddTask={(date) => {
                setPrefilledDate(date);
                setActiveTask(null);
                setFormOpen(true);
              }}
            />
          );
        })()}
      </div>

      {/* Shared Task form Modal (Create / Edit) */}
      <TaskFormModal 
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setActiveTask(null);
          setPrefilledDate('');
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
