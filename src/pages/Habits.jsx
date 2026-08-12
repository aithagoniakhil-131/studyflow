import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { repo } from '../services/repo';
import { 
  habitService, 
  isHabitExpectedOnDate, 
  calculateHabitStreak, 
  calculateLongestHabitStreak, 
  calculateWeeklyHabitCompletion, 
  calculateMissedHabits,
  formatLocalDateString,
  getTodayDateString 
} from '../services/habitService';
import { calculateDisciplineScore } from '../services/dashboardCalcs';

import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import HabitFormModal from '../components/habits/HabitFormModal';
import HabitHeatmap from '../components/habits/HabitHeatmap';
import HabitDetailModal from '../components/habits/HabitDetailModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';

import { 
  Plus, ChevronLeft, ChevronRight, Check, Flame, 
  Star, Award, ToggleLeft, Edit3, Trash2, HelpCircle, Play, Eye
} from 'lucide-react';

export default function Habits() {
  const { user } = useAuth();
  const toast = useToast();

  // Navigation: Monday of the week being viewed
  const [referenceMonday, setReferenceMonday] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  // Mobile selected weekday index (0 = Mon, 6 = Sun)
  const [mobileDayIdx, setMobileDayIdx] = useState(() => {
    const dayNum = new Date().getDay();
    return dayNum === 0 ? 6 : dayNum - 1;
  });

  // Core Data States
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action Controllers
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeHabit, setActiveHabit] = useState(null);
  const [showDisciplineInfo, setShowDisciplineInfo] = useState(false);

  const loadHabitsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch data
      const [habitsList, tasksList, sessionsList] = await Promise.all([
        habitService.list(user.id),
        repo.tasks.list(user.id),
        repo.studySessions.list(user.id)
      ]);

      // Fetch logs for the past 90 days to compute streaks and heatmap correctly
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startStr = formatLocalDateString(ninetyDaysAgo);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const endStr = formatLocalDateString(nextWeek);

      const logsList = await habitService.listLogsForWeek(user.id, startStr, endStr);

      setHabits(habitsList);

      // Invalidate and delete any future completions relative to user's local date
      const todayStr = getTodayDateString();
      const futureLogs = logsList.filter(l => l.date > todayStr && l.completed);
      
      if (futureLogs.length > 0) {
        await Promise.all(
          futureLogs.map(l => habitService.toggleLog(user.id, l.habit_id, l.date, false))
        );
        const cleanLogs = await habitService.listLogsForWeek(user.id, startStr, endStr);
        setLogs(cleanLogs);
      } else {
        setLogs(logsList);
      }
      setTasks(tasksList);
      setStudySessions(sessionsList);
      setError(null);
    } catch (err) {
      console.error('Failed to load habits data:', err);
      setError('Unable to load habits and discipline statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabitsData();
  }, [user]);

  // Generate 7 week dates starting from reference Monday
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
  const weekStartStr = formatLocalDateString(weekDates[0]);
  const weekEndStr = formatLocalDateString(weekDates[6]);

  // Navigation Handlers
  const handlePrevWeek = () => {
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
    const dayNum = today.getDay();
    setMobileDayIdx(dayNum === 0 ? 6 : dayNum - 1);
  };

  const getWeekRangeLabel = () => {
    const startMonth = weekDates[0].toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekDates[6].toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekDates[0].getDate();
    const endDay = weekDates[6].getDate();
    const year = weekDates[6].getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
  };

  // Toggle log completion status
  const handleToggleLog = async (habitId, dateStr, currentCompleted) => {
    if (dateStr > getTodayDateString()) {
      toast.error('Cannot mark future expected dates as completed.');
      return;
    }
    try {
      await habitService.toggleLog(user.id, habitId, dateStr, !currentCompleted);
      
      // Reload logs immediately to reconcile state
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startStr = formatLocalDateString(ninetyDaysAgo);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const endStr = formatLocalDateString(nextWeek);

      const logsList = await habitService.listLogsForWeek(user.id, startStr, endStr);
      setLogs(logsList);
      
      const dateObj = new Date(dateStr + 'T12:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      toast.success(currentCompleted ? 'Habit completion removed' : `Habit marked complete for ${formattedDate}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update habit progress.');
    }
  };

  // Pause / Resume toggles
  const handleTogglePause = async (habit) => {
    try {
      const newStatus = !habit.is_active;
      await habitService.update(habit.id, { is_active: newStatus });
      toast.success(newStatus ? 'Habit resumed' : 'Habit paused');
      await loadHabitsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update habit status.');
    }
  };

  // Save (Create/Edit submit)
  const handleSaveHabit = async (formData) => {
    try {
      if (activeHabit) {
        await habitService.update(activeHabit.id, formData);
        toast.success('Habit updated');
      } else {
        await habitService.create(user.id, formData);
        toast.success('Habit created');
      }
      await loadHabitsData();
    } catch (e) {
      toast.error(e.message || 'Failed to save habit.');
      throw e;
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!activeHabit) return;
    try {
      await habitService.delete(activeHabit.id);
      toast.success('Habit deleted');
      setDeleteOpen(false);
      setActiveHabit(null);
      await loadHabitsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete habit.');
    }
  };

  // Centralised Stats calculations
  const activeHabits = habits.filter(h => h.is_active);
  
  const stats = {
    currentStreak: activeHabits.length > 0 
      ? Math.max(0, ...activeHabits.map(h => calculateHabitStreak(h, logs))) 
      : 0,
    longestStreak: activeHabits.length > 0 
      ? Math.max(0, ...activeHabits.map(h => calculateLongestHabitStreak(h, logs))) 
      : 0,
    weeklyCompletion: calculateWeeklyHabitCompletion(habits, logs, weekStartStr, weekEndStr),
    disciplineScore: calculateDisciplineScore(tasks, habits, logs, studySessions).score
  };

  // Today's expected habits checklist list
  const todayStr = getTodayDateString();
  const todayHabits = habits.filter(h => isHabitExpectedOnDate(h, todayStr));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-36 h-8" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-priority-high text-sm font-semibold">{error}</p>
        <Button variant="primary" onClick={loadHabitsData} className="bg-brand-purple">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header bar and navigation actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Habits & Discipline</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Track daily academic patterns, check streaks, and grow consistency.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Week Navigators */}
          <div className="flex items-center rounded-lg border border-border-card bg-zinc-900/30 overflow-hidden">
            <button
              onClick={handlePrevWeek}
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

          <Button 
            variant="primary" 
            onClick={() => {
              setActiveHabit(null);
              setFormOpen(true);
            }}
            className="bg-brand-purple hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/20 flex items-center gap-1.5 font-semibold py-2 px-4 text-xs rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </Button>
        </div>
      </div>

      {/* Top Statistics block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400 p-1.5 rounded-lg bg-orange-950/20 fill-orange-400/10" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Current Streak</div>
              <div className="text-xl font-black font-display text-text-primary mt-0.5">
                {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400 p-1.5 rounded-lg bg-yellow-950/20 fill-yellow-400/10" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Longest Streak</div>
              <div className="text-xl font-black font-display text-text-primary mt-0.5">
                {stats.longestStreak} day{stats.longestStreak === 1 ? '' : 's'}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-border-card/40 bg-bg-card/40">
          <CardBody className="p-4 flex items-center gap-3">
            <Award className="w-8 h-8 text-cyan-400 p-1.5 rounded-lg bg-cyan-950/20" />
            <div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Weekly Completion</div>
              <div className="text-xl font-black font-display text-text-primary mt-0.5">
                {stats.weeklyCompletion}%
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-border-card/40 bg-bg-card/40 relative group">
          <CardBody className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-brand-purple p-1.5 rounded-lg bg-brand-purple-bg" />
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    Discipline Score
                  </div>
                  <div className="text-xl font-black font-display text-text-primary mt-0.5">
                    {stats.disciplineScore}/100
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowDisciplineInfo(!showDisciplineInfo)} 
                className="p-1.5 text-text-muted hover:text-brand-purple-hover transition-colors cursor-pointer rounded-lg hover:bg-zinc-900"
                title="View score formula"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {showDisciplineInfo && (
              <div className="mt-3 pt-3 border-t border-border-card/20 text-[9px] text-text-muted space-y-1 text-left animate-fade-in">
                <div className="font-extrabold text-text-primary uppercase tracking-wider text-[8px] mb-1">Consistency (Rolling 14-Day)</div>
                <div className="flex justify-between"><span>Task Consistency (40%)</span><span className="text-text-primary font-bold">{calculateDisciplineScore(tasks, habits, logs, studySessions).taskConsistency}%</span></div>
                <div className="flex justify-between"><span>Habit Consistency (30%)</span><span className="text-text-primary font-bold">{calculateDisciplineScore(tasks, habits, logs, studySessions).habitConsistency}%</span></div>
                <div className="flex justify-between"><span>Focus Consistency (20%)</span><span className="text-text-primary font-bold">{calculateDisciplineScore(tasks, habits, logs, studySessions).focusConsistency}%</span></div>
                <div className="flex justify-between"><span>On-Time Completion (10%)</span><span className="text-text-primary font-bold">{calculateDisciplineScore(tasks, habits, logs, studySessions).onTimeCompletion}%</span></div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Main Grid View */}
      {habits.length === 0 ? (
        <Card className="border border-border-card/40 bg-bg-card/40 py-20 text-center max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-bold text-text-primary font-display">No habits created.</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Build your first habit. Daily routines and consistency shape your academic progression. Schedule study sessions, exercises, readings, or coding tasks.
          </p>
          <Button 
            variant="primary" 
            onClick={() => {
              setActiveHabit(null);
              setFormOpen(true);
            }}
            className="bg-brand-purple hover:bg-brand-purple-hover"
          >
            + Create First Habit
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Weekly Grid Checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop Checklist grid */}
            <div className="hidden md:block">
              <Card className="border border-border-card/40 bg-bg-card/40 overflow-hidden">
                <div className="grid grid-cols-12 border-b border-border-card/20 bg-zinc-950/20 py-3 px-4 text-[10px] font-bold text-text-muted uppercase tracking-wider items-center text-center">
                  <div className="col-span-5 text-left pl-2">Habit</div>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="col-span-1">{day}</div>
                  ))}
                </div>

                <div className="divide-y divide-border-card/25">
                  {habits.map((habit) => {
                    const streak = calculateHabitStreak(habit, logs);
                    
                    return (
                      <div 
                        key={habit.id}
                        className={`grid grid-cols-12 py-3 px-4 items-center text-center hover:bg-zinc-900/10 transition-colors ${
                          !habit.is_active ? 'opacity-55' : ''
                        }`}
                      >
                        {/* Title details name & shortcuts */}
                        <div className="col-span-5 text-left flex items-center justify-between min-w-0 pr-4">
                          <div className="min-w-0 leading-tight">
                            <span 
                              onClick={() => {
                                setActiveHabit(habit);
                                setDetailOpen(true);
                              }}
                              className="font-semibold text-xs text-text-primary hover:text-brand-purple-hover transition-colors truncate block cursor-pointer"
                              title="View detailed statistics"
                            >
                              {habit.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-text-muted uppercase tracking-wider font-bold">
                              <span>{habit.frequency_type}</span>
                              {habit.is_active && streak > 0 && (
                                <span className="text-orange-400 flex items-center">
                                  🔥 {streak}
                                </span>
                              )}
                              {!habit.is_active && (
                                <span className="bg-zinc-800 text-text-muted px-1.5 py-0.2 rounded font-normal text-[8px]">
                                  Paused
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controls edit / pause / delete hover actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Detailed stats */}
                            <button
                              onClick={() => {
                                setActiveHabit(habit);
                                setDetailOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-900/40 border border-border-card/40 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple cursor-pointer transition-all"
                              title="View logs analytics"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            {/* Pause trigger */}
                            <button
                              onClick={() => handleTogglePause(habit)}
                              className={`p-1 rounded bg-zinc-900/40 border cursor-pointer transition-all ${
                                habit.is_active 
                                  ? 'border-border-card/40 text-text-muted hover:border-orange-500/20 hover:text-orange-400'
                                  : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/10'
                              }`}
                              title={habit.is_active ? 'Pause Habit' : 'Resume Habit'}
                            >
                              <ToggleLeft className={`w-3 h-3 ${!habit.is_active ? 'rotate-180 text-emerald-400' : ''}`} />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setActiveHabit(habit);
                                setFormOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-900/40 border border-border-card/40 hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 cursor-pointer transition-all"
                              title="Edit habit settings"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                setActiveHabit(habit);
                                setDeleteOpen(true);
                              }}
                              className="p-1 rounded bg-zinc-900/40 border border-border-card/40 hover:border-rose-500/40 text-text-muted hover:text-rose-400 cursor-pointer transition-all"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Mon-Sun Cell buttons */}
                        {weekDates.map((dayDate, dayIdx) => {
                          const dateStr = formatLocalDateString(dayDate);
                          const isExpected = isHabitExpectedOnDate(habit, dateStr);
                          const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
                          const isCompleted = !!(log && log.completed);
                          const isFuture = dateStr > todayStr;

                          return (
                            <div key={dayIdx} className="col-span-1 flex items-center justify-center">
                              {isExpected ? (
                                <button
                                  disabled={isFuture}
                                  onClick={() => handleToggleLog(habit.id, dateStr, isCompleted)}
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    isFuture 
                                      ? 'opacity-40 border border-zinc-850 bg-zinc-950/40 cursor-not-allowed text-text-muted/20' 
                                      : isCompleted 
                                        ? 'bg-brand-purple border border-brand-purple text-bg-base cursor-pointer' 
                                        : 'border border-border-card bg-zinc-950/20 hover:border-brand-purple/50 cursor-pointer'
                                  }`}
                                  aria-label={isFuture ? `Future expected habit on ${dateStr}` : `Toggle habit completion on ${dateStr}`}
                                >
                                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              ) : (
                                <span className="text-[10px] text-text-muted/20 font-bold select-none">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Mobile View: selected day selector slider + details items */}
            <div className="block md:hidden space-y-4">
              <div className="flex justify-between gap-1 p-1 bg-zinc-900/40 border border-border-card/30 rounded-xl overflow-x-auto">
                {weekDates.map((dayDate, idx) => {
                  const dateStr = formatLocalDateString(dayDate);
                  const isSelected = mobileDayIdx === idx;
                  const weekdayNameShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dayDate.getDate();
                  const isToday = getTodayDateString() === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setMobileDayIdx(idx)}
                      className={`flex-1 min-w-[42px] py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-brand-purple text-white shadow-lg' 
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider">{weekdayNameShort}</span>
                      <span className="text-xs font-mono font-bold">{dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-brand-purple" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Selected Date Expected checklist */}
              <Card className="border border-border-card/40 bg-bg-card/40">
                <CardHeader className="p-4 pb-2 border-b border-border-card/10">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                    Expected Habits ({formatLocalDateString(weekDates[mobileDayIdx])})
                  </span>
                </CardHeader>
                <CardBody className="p-4 space-y-2">
                  {(() => {
                    const selDateStr = formatLocalDateString(weekDates[mobileDayIdx]);
                    const expectedHabits = habits.filter(h => isHabitExpectedOnDate(h, selDateStr));
                    
                    if (expectedHabits.length === 0) {
                      return (
                        <div className="py-8 text-center text-text-muted/50 text-xs">
                          No habits scheduled for this day
                        </div>
                      );
                    }

                    return expectedHabits.map(habit => {
                      const log = logs.find(l => l.habit_id === habit.id && l.date === selDateStr);
                      const isCompleted = !!(log && log.completed);
                      const streak = calculateHabitStreak(habit, logs);

                      const isFuture = selDateStr > todayStr;

                      return (
                        <div 
                          key={habit.id}
                          className="p-3 rounded-xl border border-border-card/30 bg-zinc-900/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <button
                              disabled={isFuture}
                              onClick={() => handleToggleLog(habit.id, selDateStr, isCompleted)}
                              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${
                                isFuture 
                                  ? 'opacity-40 border border-zinc-850 bg-zinc-950/40 cursor-not-allowed text-text-muted/20' 
                                  : isCompleted 
                                    ? 'bg-brand-purple border border-brand-purple text-bg-base cursor-pointer' 
                                    : 'border border-border-card bg-zinc-950/20 hover:border-brand-purple/50 cursor-pointer'
                              }`}
                            >
                              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div className="min-w-0 leading-tight">
                              <span className={`font-semibold block truncate ${
                                isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}>
                                {habit.title}
                              </span>
                              {streak > 0 && (
                                <span className="text-[10px] text-orange-400 mt-1 inline-block">
                                  🔥 {streak} Streak
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setActiveHabit(habit);
                                setDetailOpen(true);
                              }}
                              className="px-2.5 py-1 bg-zinc-900 border border-border-card rounded text-[10px] font-bold text-text-muted cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </CardBody>
              </Card>
            </div>

            {/* Heatmap Section */}
            <HabitHeatmap habits={habits} logs={logs} />
          </div>

          {/* Right Column: Today's expected Habits list summary & Discipline tooltips */}
          <div className="space-y-6">
            <Card className="border border-border-card/40 bg-bg-card/40">
              <CardHeader className="p-4 pb-2 border-b border-border-card/10 flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Today's Habits</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">
                  {todayHabits.filter(h => logs.some(l => l.habit_id === h.id && l.date === todayStr && l.completed)).length} / {todayHabits.length} Done
                </span>
              </CardHeader>
              <CardBody className="p-4 space-y-3">
                {todayHabits.length === 0 ? (
                  <div className="py-8 text-center text-text-muted/50 text-xs">
                    No habits expected today
                  </div>
                ) : (
                  todayHabits.map((habit) => {
                    const log = logs.find(l => l.habit_id === habit.id && l.date === todayStr);
                    const isCompleted = !!(log && log.completed);
                    const streak = calculateHabitStreak(habit, logs);

                    return (
                      <div 
                        key={habit.id}
                        className={`p-3 rounded-xl border border-border-card/30 bg-zinc-900/20 text-xs flex items-center justify-between gap-3 text-left transition-all ${
                          isCompleted ? 'opacity-65 bg-zinc-950/10' : 'hover:border-border-card/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <button
                            onClick={() => handleToggleLog(habit.id, todayStr, isCompleted)}
                            className={`w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted 
                                ? 'bg-brand-purple border border-brand-purple text-bg-base' 
                                : 'border border-border-card bg-zinc-950/20 hover:border-brand-purple/50'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div className="min-w-0 leading-tight">
                            <span className={`font-semibold block truncate ${
                              isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                            }`}>
                              {habit.title}
                            </span>
                            <span className="text-[9px] text-text-muted mt-1 inline-block capitalize">
                              {habit.frequency_type}
                            </span>
                          </div>
                        </div>

                        {streak > 0 && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/10 border border-orange-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            🔥 {streak}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>

            {/* Discipline explanation tooltip block */}
            <Card className="border border-border-card/30 bg-bg-card/30">
              <CardHeader className="p-4 pb-2 border-b border-border-card/10">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Discipline Score</span>
              </CardHeader>
              <CardBody className="p-4 text-xs text-text-muted space-y-2.5 leading-relaxed">
                <p>
                  Your Discipline Score is calculated weekly using a transparent weighted average formula that evaluates academic consistency:
                </p>
                <div className="space-y-1.5 p-3 bg-zinc-900/30 border border-border-card/20 rounded-xl font-semibold">
                  <div className="flex justify-between">
                    <span>Task Consistency</span>
                    <span className="text-text-primary">40% Weight</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Habit Consistency</span>
                    <span className="text-text-primary">30% Weight</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Focus Consistency</span>
                    <span className="text-text-primary">20% Weight</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Time Tasks</span>
                    <span className="text-text-primary">10% Weight</span>
                  </div>
                </div>
                <p className="text-[10px] italic">
                  Note: Paused habits and cancelled tasks do not penalise your score. Streaks represent completed expected days.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Habit creation/editing Modal */}
      <HabitFormModal 
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setActiveHabit(null);
        }}
        onSave={handleSaveHabit}
        habit={activeHabit}
      />

      {/* Habit detailed analytics Modal */}
      <HabitDetailModal
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveHabit(null);
        }}
        habit={activeHabit}
        logs={logs}
      />

      {/* Delete confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setActiveHabit(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskTitle={activeHabit ? activeHabit.title : ''}
      />
    </div>
  );
}
