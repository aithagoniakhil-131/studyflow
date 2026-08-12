import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { usePomodoro } from '../context/PomodoroContext';
import { repo } from '../services/repo';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';

import DashboardOverview from '../components/dashboard/DashboardOverview';
import TaskFocusList from '../components/dashboard/TaskFocusList';
import OverdueTasks from '../components/dashboard/OverdueTasks';
import WeeklyStudyChart from '../components/dashboard/WeeklyStudyChart';
import DisciplineCard from '../components/dashboard/DisciplineCard';
import UpcomingPanel from '../components/dashboard/UpcomingPanel';
import MotivationCard from '../components/dashboard/MotivationCard';
import DashboardFocusCard from '../components/dashboard/DashboardFocusCard';
import QuickActions from '../components/dashboard/QuickActions';
import { Skeleton } from '../components/ui/Skeleton';
import { getLevelFromXP } from '../services/gamificationEngine';
import { Zap } from 'lucide-react';

import {
  calculateTaskProgress,
  calculateWorkload,
  calculateDisciplineScore,
  calculateWeeklyStudyHours,
  getUpcomingExams,
  getUpcomingDeadlines
} from '../services/dashboardCalcs';

export default function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const { startTimer, triggerTaskSound } = usePomodoro();

  // Core Data States
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [exams, setExams] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 13);
      const startDate = fourteenDaysAgo.toISOString().split('T')[0];

      const [profData, tasksData, habitsData, logsData, sessionsData, examsData] = await Promise.all([
        repo.profiles.get(user.id),
        repo.tasks.list(user.id),
        repo.habits.list(user.id),
        repo.habitLogs.listForWeek(user.id, startDate, endDate),
        repo.studySessions.list(user.id),
        repo.exams.list(user.id)
      ]);

      setProfile(profData);
      setTasks(tasksData);
      setHabits(habitsData);
      setHabitLogs(logsData);
      setStudySessions(sessionsData);
      setExams(examsData);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard workspace. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleXPEvent = () => {
      fetchData();
    };

    window.addEventListener('studyflow-xp-awarded', handleXPEvent);
    return () => window.removeEventListener('studyflow-xp-awarded', handleXPEvent);
  }, [user]);

  // Handle Task Completion Toggle from Dashboard
  const handleToggleComplete = async (taskId, isCurrentlyCompleted) => {
    try {
      // Sound chime trigger
      if (!isCurrentlyCompleted) {
        triggerTaskSound();
      }

      if (isCurrentlyCompleted) {
        await taskService.uncomplete(taskId);
      } else {
        await taskService.complete(taskId);
      }

      toast.success(isCurrentlyCompleted ? 'Task marked incomplete.' : 'Task completed!');
      
      // Reload calculations & charts in real-time
      await fetchData();
    } catch (e) {
      console.error('Failed to update task completion:', e);
      toast.error('Could not save task status.');
    }
  };

  // Start Focus Session for a Task
  const handleStartFocus = (task) => {
    startTimer(task.id, task.subject);
    toast.success(`Focus timer started for: ${task.title}`);
    navigate('/focus');
  };

  // Trigger empty focus session from chart
  const handleStartGeneralFocus = () => {
    startTimer(null, 'General');
    toast.success('Focus session started.');
    navigate('/focus');
  };

  // 1. Dynamic Greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    const name = profile?.full_name || user?.email?.split('@')[0] || 'Student';
    
    let timeGreeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hours >= 17) {
      timeGreeting = 'Good evening';
    }
    return `${timeGreeting}, ${name} 👋`;
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-48 h-4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-[280px]" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-44" />
            <Skeleton className="h-[180px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-priority-high text-sm font-semibold">{error}</p>
        <button 
          onClick={fetchData} 
          className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover text-xs font-semibold cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // TODAY'S CALCULATIONS
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Task Progress Percentage
  const progress = calculateTaskProgress(tasks, todayStr);

  // 2. Today's Study Time (includes both full and partial focus sessions)
  const todaySessions = studySessions.filter(s => 
    s.started_at && 
    s.started_at.split('T')[0] === todayStr && 
    s.session_type === 'focus' &&
    (s.duration_seconds || 0) >= 10
  );
  const todayStudySeconds = todaySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const todayStudyHrs = Math.floor(todayStudySeconds / 3600);
  const rawMins = Math.round((todayStudySeconds % 3600) / 60);
  const todayStudyMins = (todayStudyHrs === 0 && todayStudySeconds >= 30 && rawMins === 0) ? 1 : rawMins;
  const studyTimeText = todayStudyHrs > 0 ? `${todayStudyHrs}h ${todayStudyMins}m` : `${todayStudyMins}m`;

  // 3. Current Streak
  const streak = profile?.streak || 0;

  // 4. Discipline Score
  const discipline = calculateDisciplineScore(
    tasks, 
    habits, 
    habitLogs, 
    studySessions, 
    settings?.weekly_focus_target || 10
  );

  // 5. Workload Calculation
  const workload = calculateWorkload(tasks, todayStr);

  // 6. Overdue Tasks (due date has passed, not completed/cancelled)
  const overdueList = tasks.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.due_date < todayStr
  );

  // 7. Recharts Weekly study hours
  const weeklyHoursData = calculateWeeklyStudyHours(studySessions);

  // 8. Upcoming deadlines and exams
  const upcomingExamsList = getUpcomingExams(exams);
  const upcomingDeadlinesList = getUpcomingDeadlines(tasks);

  // 9. Generate 14-day history contribution grid counts
  const generate14DayHistory = () => {
    const counts = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Completed actions
      const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at && t.completed_at.startsWith(dateStr)).length;
      const completedHabits = habitLogs.filter(hl => hl.date === dateStr && hl.completed).length;
      const completedSessions = studySessions.filter(s => s.completed && s.started_at && s.started_at.startsWith(dateStr)).length;

      counts.push(completedTasks + completedHabits + completedSessions);
    }
    return counts;
  };

  const activityHistory = generate14DayHistory();
  const levelInfo = getLevelFromXP(profile?.xp || 0);

  return (
    <div className="space-y-6">
      {/* Top row overview stats cards */}
      <DashboardOverview 
        progressPct={progress.percentage}
        tasksCount={`${progress.completed}/${progress.total}`}
        studyTimeStr={studyTimeText}
        streakDays={streak}
        semesterStr={`Semester ${profile?.semester || 1}`}
      />

      {/* Gamification Level & XP Progress Widget */}
      <div className="bg-zinc-950/70 border border-border-card/45 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-left">
        <div className="flex items-center gap-3">
          <div className="bg-brand-purple-bg/90 border border-brand-purple/30 text-brand-purple-hover font-black text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider font-display flex items-center gap-1.5 shadow-sm shadow-brand-purple/10">
            <Zap className="w-3.5 h-3.5 text-brand-purple-hover fill-brand-purple-hover/20" />
            Level {levelInfo.currentLevel}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-extrabold text-text-primary">
              {levelInfo.currentXP.toLocaleString()} XP Total
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {levelInfo.xpToNextLevel} XP to Level {levelInfo.currentLevel + 1}
            </div>
          </div>
        </div>

        <div className="w-full sm:max-w-xs md:max-w-md space-y-1">
          <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase tracking-wider">
            <span>Level Progress</span>
            <span>{levelInfo.progressPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-900 border border-border-card/30 h-2 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-brand-purple to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-brand-purple/40"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Overdue alert block if overdue tasks exist */}
      <OverdueTasks 
        tasks={overdueList} 
        onToggleComplete={handleToggleComplete} 
      />

      {/* Primary Dashboard columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (col-span 7 or 8 on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 text-left">
          {/* Today's Focus Widget */}
          <TaskFocusList 
            tasks={tasks.filter(t => t.due_date === todayStr)}
            onToggleComplete={handleToggleComplete}
            onStartFocus={handleStartFocus}
          />

          {/* Weekly study hours Recharts widget */}
          <WeeklyStudyChart 
            chartData={weeklyHoursData}
            onStartFocus={handleStartGeneralFocus}
          />
        </div>

        {/* Right Column (col-span 4 or 5 on large screens) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 text-left">
          {/* Dedicated Focus Session Hub */}
          <DashboardFocusCard 
            studyTimeStr={studyTimeText}
            streak={streak}
            currentLevel={levelInfo.currentLevel}
          />

          {/* Anime quote motivation card */}
          <MotivationCard />

          {/* Upcoming deadlines and exams panel */}
          <UpcomingPanel 
            exams={upcomingExamsList}
            tasks={upcomingDeadlinesList}
          />

          {/* Discipline Score card */}
          <DisciplineCard 
            disciplineScore={discipline.score}
            activityHistory={activityHistory}
          />

          {/* Quick Actions (Focus Timer / Add Exam shortcuts) */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
