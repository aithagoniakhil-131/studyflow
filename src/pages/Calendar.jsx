import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { repo } from '../services/repo';
import { 
  taskService, 
  isTaskOverdue,
  TASK_CATEGORIES 
} from '../services/taskService';

import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import TaskFormModal from '../components/tasks/TaskFormModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';
import ExamDetailModal from '../components/calendar/ExamDetailModal';

import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Search, SlidersHorizontal, Check, Play, Edit3, Trash2,
  FileText, Clock, AlertCircle, Plus, Info, LayoutGrid, List
} from 'lucide-react';

export default function Calendar() {
  const { user } = useAuth();
  const toast = useToast();
  const { startTimer, triggerTaskSound } = usePomodoro();
  const navigate = useNavigate();

  // Navigation: First day of the currently viewed month
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Mobile layout: selected date for displaying details (defaults to today's date)
  const [mobileSelectedDateStr, setMobileSelectedDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // View Mode: 'calendar' (Month Grid) | 'agenda' (Chronological list)
  const [viewMode, setViewMode] = useState('calendar');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, tasks, exams, completed, pending, overdue, high

  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals controllers
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState('');

  const loadCalendarData = async () => {
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
      console.error('Failed to load calendar data:', err);
      setError('Unable to load academic calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [user]);

  // Safe formatting to YYYY-MM-DD
  const formatDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayDateString = () => {
    return formatDateString(new Date());
  };

  // Navigations Actions
  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setMobileSelectedDateStr(getTodayDateString());
  };

  const getMonthLabel = () => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Event Adapter: Transform tasks & exams into a common UI representation
  const adaptEvents = () => {
    const adapted = [];

    // 1. Map tasks
    tasks.forEach(task => {
      if (task.status === 'cancelled') return;
      adapted.push({
        id: `task-${task.id}`,
        sourceType: 'task',
        sourceId: task.id,
        title: task.title,
        date: task.due_date,
        time: task.due_time,
        category: task.category,
        subject: task.subject,
        status: task.status,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        recurring: task.recurring,
        resource_url: task.resource_url,
        video_url: task.video_url,
        notes: task.notes,
        originalData: task
      });
    });

    // 2. Map exams
    exams.forEach(exam => {
      adapted.push({
        id: `exam-${exam.id}`,
        sourceType: 'exam',
        sourceId: exam.id,
        title: exam.title,
        date: exam.date,
        time: exam.time,
        category: 'Exam',
        subject: exam.subject,
        exam_type: exam.exam_type,
        location: exam.location,
        syllabus: exam.syllabus,
        syllabus_completed: exam.syllabus_completed,
        notes: exam.notes,
        originalData: exam
      });
    });

    return adapted;
  };

  const allEvents = adaptEvents();

  // Filter logic
  const filteredEvents = allEvents.filter(evt => {
    // Search match
    const searchMatch = !searchTerm.trim() || 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Category / Type filter
    if (categoryFilter === 'tasks') {
      return evt.sourceType === 'task';
    }
    if (categoryFilter === 'exams') {
      return evt.sourceType === 'exam';
    }
    if (categoryFilter === 'completed') {
      return evt.sourceType === 'task' && evt.status === 'completed';
    }
    if (categoryFilter === 'pending') {
      return evt.sourceType === 'task' && evt.status === 'pending';
    }
    if (categoryFilter === 'overdue') {
      return evt.sourceType === 'task' && isTaskOverdue(evt.originalData);
    }
    if (categoryFilter === 'high') {
      return evt.sourceType === 'task' && evt.priority === 'high';
    }

    return true;
  });

  // Month Calendar Grid date calculation: Sunday to Saturday, 42 cells
  const getGridDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstGridDay = new Date(year, month, 1);
    firstGridDay.setDate(1 - firstGridDay.getDay()); // Offset to start on Sunday
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(firstGridDay);
      d.setDate(firstGridDay.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const gridDays = getGridDays();

  // Task Handlers
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
      await loadCalendarData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task.');
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
      await loadCalendarData();
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
      await loadCalendarData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete task.');
    }
  };

  // Grouped events for Agenda View
  const getGroupedAgendaEvents = () => {
    const sorted = [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date));
    const groups = {};
    sorted.forEach(evt => {
      if (!groups[evt.date]) {
        groups[evt.date] = [];
      }
      groups[evt.date].push(evt);
    });
    return groups;
  };

  const agendaGroups = getGroupedAgendaEvents();
  const agendaDates = Object.keys(agendaGroups).sort();

  const formatHeaderTime = (timeStr) => {
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-48 h-8" />
        </div>
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Calendar Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Academic Calendar</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Your timeline for tasks, homeworks, projects, and midterm exams.</p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Toggles */}
          <div className="flex rounded-lg border border-border-card bg-zinc-900/30 overflow-hidden p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'calendar' 
                  ? 'bg-brand-purple text-white shadow' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Month Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'agenda' 
                  ? 'bg-brand-purple text-white shadow' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Agenda List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Month selector controls */}
          <div className="flex items-center rounded-lg border border-border-card bg-zinc-900/30 overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 hover:bg-zinc-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-xs font-bold text-text-primary select-none font-mono min-w-[120px] text-center">
              {getMonthLabel()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2.5 hover:bg-zinc-800 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Next Month"
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

      {/* Filter and Search Bar */}
      <Card className="border border-border-card/30 bg-bg-card/30">
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events by title, subject, category..."
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple placeholder:text-text-muted/60"
            />
          </div>

          {/* Selector filters dropdowns */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Type:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900/60 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Items</option>
              <option value="tasks">Tasks Only</option>
              <option value="exams">Exams Only</option>
              <option value="completed">Completed Tasks</option>
              <option value="pending">Pending Tasks</option>
              <option value="overdue">Overdue Tasks</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* View modes rendering container */}
      {viewMode === 'calendar' ? (
        <>
          {/* Desktop Month view grid */}
          <div className="hidden md:block">
            <Card className="border border-border-card/40 bg-bg-card/40 overflow-hidden">
              {/* Day Labels Mon-Sun */}
              <div className="grid grid-cols-7 border-b border-border-card/20 bg-zinc-950/20 text-center py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 grid-rows-6 border-b border-border-card/10">
                {gridDays.map((dayDate, idx) => {
                  const dateStr = formatDateString(dayDate);
                  const isCurrentMonth = dayDate.getMonth() === currentMonthDate.getMonth();
                  const isToday = getTodayDateString() === dateStr;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[100px] border-r border-b border-border-card/20 p-2 flex flex-col justify-between transition-all group relative ${
                        isCurrentMonth ? 'bg-transparent' : 'bg-zinc-950/10 opacity-30'
                      }`}
                    >
                      {/* Cell Header date index */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                          isToday 
                            ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                            : 'text-text-primary'
                        }`}>
                          {dayDate.getDate()}
                        </span>
                        
                        {/* Hover Quick Add Task trigger */}
                        {isCurrentMonth && (
                          <button
                            onClick={() => {
                              setPrefilledDate(dateStr);
                              setActiveTask(null);
                              setFormOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-zinc-900 border border-border-card text-text-muted hover:text-brand-purple hover:border-brand-purple/40 transition-all cursor-pointer"
                            title="Add Task for this date"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Cell events lists stack */}
                      <div className="flex-1 mt-2 space-y-1.5 overflow-y-auto max-h-[70px]">
                        {dayEvents.slice(0, 3).map(evt => {
                          const isExam = evt.sourceType === 'exam';
                          const isCompleted = evt.status === 'completed';
                          const isOverdue = evt.sourceType === 'task' && isTaskOverdue(evt.originalData);

                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                // Prevent double trigger when clicking task check mark
                                if (e.target.closest('button')) return;
                                if (isExam) {
                                  setActiveExam(evt.originalData);
                                  setExamOpen(true);
                                } else {
                                  setActiveTask(evt.originalData);
                                  setFormOpen(true);
                                }
                              }}
                              className={`p-1 rounded text-[10px] text-left leading-tight truncate border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isExam
                                  ? 'bg-rose-950/20 border-rose-500/20 text-rose-400 hover:bg-rose-950/30'
                                  : isCompleted
                                    ? 'bg-zinc-950/20 border-zinc-800 text-text-muted/60 line-through opacity-70'
                                    : isOverdue
                                      ? 'bg-rose-950/10 border-rose-500/10 text-rose-400 hover:bg-rose-950/20'
                                      : 'bg-zinc-900/40 border-border-card/30 text-text-muted hover:text-text-primary'
                              }`}
                              title={evt.title}
                            >
                              {/* Task Checkbox check */}
                              {!isExam && (
                                <button
                                  onClick={() => handleToggleComplete(evt.sourceId, isCompleted)}
                                  className={`w-3 h-3 rounded flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                                    isCompleted 
                                      ? 'bg-brand-purple border border-brand-purple text-bg-base' 
                                      : 'border border-border-card bg-zinc-950/40 hover:border-brand-purple/40'
                                  }`}
                                >
                                  {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </button>
                              )}
                              
                              <span className="truncate flex-1">{evt.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-text-muted font-bold pl-1">
                            + {dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Mobile Calendar Layout: Option C Month overview grid + details list */}
          <div className="block md:hidden space-y-4">
            <Card className="border border-border-card/40 bg-bg-card/40 overflow-hidden p-3">
              {/* Labels header */}
              <div className="grid grid-cols-7 text-center py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-border-card/10">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i}>{day}</div>
                ))}
              </div>
              
              {/* Mobile cells overview */}
              <div className="grid grid-cols-7 grid-rows-6 mt-1.5">
                {gridDays.map((dayDate) => {
                  const dateStr = formatDateString(dayDate);
                  const isCurrentMonth = dayDate.getMonth() === currentMonthDate.getMonth();
                  const isSelected = mobileSelectedDateStr === dateStr;
                  const isToday = getTodayDateString() === dateStr;
                  const dayEvents = filteredEvents.filter(e => e.date === dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setMobileSelectedDateStr(dateStr)}
                      className={`py-2 flex flex-col items-center justify-between rounded-lg relative cursor-pointer ${
                        isSelected 
                          ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                          : isCurrentMonth 
                            ? 'text-text-primary' 
                            : 'text-text-muted/30'
                      }`}
                    >
                      <span className={`text-xs font-bold font-mono ${
                        isToday && !isSelected ? 'text-brand-purple-hover underline font-black' : ''
                      }`}>
                        {dayDate.getDate()}
                      </span>
                      
                      {/* Dots representation of events */}
                      {dayEvents.length > 0 && (
                        <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                          isSelected 
                            ? 'bg-white' 
                            : dayEvents.some(e => e.sourceType === 'exam') 
                              ? 'bg-rose-400' 
                              : 'bg-brand-purple'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Mobile selected date events list details */}
            <Card className="border border-border-card/40 bg-bg-card/40">
              <CardHeader className="p-4 pb-2 border-b border-border-card/10 flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Events on {mobileSelectedDateStr}
                </span>
                <button
                  onClick={() => {
                    setPrefilledDate(mobileSelectedDateStr);
                    setActiveTask(null);
                    setFormOpen(true);
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-purple bg-brand-purple-bg px-2.5 py-1 rounded-lg border border-brand-purple/15 hover:border-brand-purple/40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </CardHeader>
              
              <CardBody className="p-4 space-y-2 max-h-[250px] overflow-y-auto">
                {(() => {
                  const dayEvents = filteredEvents.filter(e => e.date === mobileSelectedDateStr);
                  if (dayEvents.length === 0) {
                    return (
                      <div className="py-6 text-center text-text-muted/50 text-xs">
                        No events scheduled for this day
                      </div>
                    );
                  }

                  return dayEvents.map(evt => {
                    const isExam = evt.sourceType === 'exam';
                    const isCompleted = evt.status === 'completed';
                    
                    return (
                      <div
                        key={evt.id}
                        onClick={() => {
                          if (isExam) {
                            setActiveExam(evt.originalData);
                            setExamOpen(true);
                          } else {
                            setActiveTask(evt.originalData);
                            setFormOpen(true);
                          }
                        }}
                        className={`p-3 rounded-xl border border-border-card/30 bg-zinc-900/20 text-xs flex items-center justify-between gap-3 text-left cursor-pointer hover:border-border-card/60`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isExam ? (
                            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(evt.sourceId, isCompleted);
                              }}
                              className={`w-4.5 h-4.5 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                                isCompleted 
                                  ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                  : 'border-border-card bg-zinc-950/40 hover:border-brand-purple/50'
                              }`}
                            >
                              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          )}
                          <div className="min-w-0 leading-tight">
                            <span className={`font-semibold block truncate ${
                              isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                            }`}>
                              {evt.title}
                            </span>
                            <span className="text-[10px] text-text-muted mt-1 inline-block">
                              {evt.subject} {evt.time ? `• ${formatHeaderTime(evt.time)}` : ''}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${
                          isExam 
                            ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' 
                            : 'bg-zinc-900/60 border-border-card/40 text-text-muted'
                        }`}>
                          {isExam ? 'Exam' : 'Task'}
                        </span>
                      </div>
                    );
                  });
                })()}
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        /* Agenda List View */
        <div className="space-y-4">
          {agendaDates.length === 0 ? (
            <Card className="border border-border-card/40 bg-bg-card/40 py-20 text-center max-w-md mx-auto space-y-4">
              <h3 className="text-lg font-bold text-text-primary font-display">Your agenda is clear</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                No matching academic calendar events are scheduled. Add tasks or exams to begin building your StudyFlow timeline.
              </p>
            </Card>
          ) : (
            agendaDates.map(dateStr => {
              const dayEvents = agendaGroups[dateStr];
              const dateObj = new Date(dateStr + 'T12:00:00'); // Mid-day avoids timezone drift
              
              const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
              const dateLabel = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
              const isToday = getTodayDateString() === dateStr;

              return (
                <div key={dateStr} className="space-y-2">
                  {/* Date Heading Header */}
                  <div className="flex items-center gap-2.5 pl-1 text-xs">
                    <span className={`font-bold uppercase tracking-wider ${
                      isToday ? 'text-brand-purple font-black' : 'text-text-primary font-extrabold'
                    }`}>
                      {isToday ? 'Today' : dayOfWeek}
                    </span>
                    <span className="text-text-muted font-normal">{dateLabel}</span>
                    <div className="flex-1 h-px bg-border-card/20" />
                  </div>

                  {/* Date list cards stack */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayEvents.map(evt => {
                      const isExam = evt.sourceType === 'exam';
                      const isCompleted = evt.status === 'completed';
                      const isOverdue = evt.sourceType === 'task' && isTaskOverdue(evt.originalData);

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            if (isExam) {
                              setActiveExam(evt.originalData);
                              setExamOpen(true);
                            } else {
                              setActiveTask(evt.originalData);
                              setFormOpen(true);
                            }
                          }}
                          className={`p-4 rounded-2xl border bg-bg-card/50 flex items-center justify-between gap-4 text-left cursor-pointer transition-all ${
                            isCompleted 
                              ? 'opacity-60 bg-zinc-950/10 border-dashed' 
                              : isOverdue 
                                ? 'border-rose-500/20 hover:border-rose-500/40 bg-rose-950/5' 
                                : 'border-border-card/30 hover:border-border-card/60'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Checkbox checks */}
                            {isExam ? (
                              <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <FileText className="w-3 h-3 text-rose-400" />
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(evt.sourceId, isCompleted);
                                }}
                                className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                                  isCompleted 
                                    ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                    : 'border-border-card bg-zinc-900/60 hover:border-brand-purple/50'
                                }`}
                              >
                                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            )}

                            <div className="min-w-0 leading-tight">
                              <span className={`text-sm font-semibold truncate block ${
                                isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}>
                                {evt.title}
                              </span>

                              {/* Metadata labels row */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-2 text-xs text-text-muted">
                                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                  isExam ? 'text-rose-400 bg-rose-950/20' : 'text-brand-purple-hover bg-brand-purple-bg'
                                }`}>
                                  {evt.subject}
                                </span>
                                
                                {evt.time && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatHeaderTime(evt.time)}
                                  </span>
                                )}

                                {evt.estimated_minutes > 0 && (
                                  <span>{evt.estimated_minutes} min</span>
                                )}

                                {isOverdue && (
                                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide">
                                    Overdue ⚠️
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detail tags */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Focus Timer trigger (Only for incomplete tasks) */}
                            {!isExam && !isCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTimer(evt.sourceId, evt.subject);
                                  toast.success(`Focus timer started for: ${evt.title}`);
                                  navigate('/focus');
                                }}
                                className="p-1.5 rounded-lg border border-border-card bg-zinc-900/60 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple transition-all cursor-pointer"
                                title="Start Focus timer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                            
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              isExam 
                                ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' 
                                : 'bg-zinc-900/60 border-border-card/40 text-text-muted'
                            }`}>
                              {isExam ? 'Exam' : 'Task'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Task form Modal */}
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

      {/* Exam Details Modal (Read-Only) */}
      <ExamDetailModal 
        isOpen={examOpen}
        onClose={() => {
          setExamOpen(false);
          setActiveExam(null);
        }}
        exam={activeExam}
      />
    </div>
  );
}
