import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useSettings } from '../context/SettingsContext';
import { taskService } from '../services/taskService';
import { repo } from '../services/repo';
import { getMotivation } from '../services/motivationEngine';

import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

import { 
  Play, Pause, RotateCcw, SkipForward, ArrowLeft, 
  Settings as SettingsIcon, Volume2, VolumeX, AlertCircle, X, Check, Bot
} from 'lucide-react';

export default function Focus() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('task');

  const { settings, updateSettings } = useSettings();
  const {
    isActive,
    isPaused,
    sessionType,
    durationSeconds,
    startTimestamp,
    taskId,
    subject,
    remainingSeconds,
    completedSessionsCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer
  } = usePomodoro();

  // Local Page States
  const [associatedTask, setAssociatedTask] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customSubject, setCustomSubject] = useState('General');
  const [loading, setLoading] = useState(true);

  // Exit Safety Flow State
  const [exitCountdown, setExitCountdown] = useState(0);
  const exitTimerRef = useRef(null);

  // Load Task contexts
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const allTasks = await taskService.list(user.id);
        const pending = allTasks.filter(t => t.status === 'pending');
        setPendingTasks(pending);

        const targetId = taskIdParam || taskId;
        if (targetId) {
          const taskObj = allTasks.find(t => t.id === targetId);
          if (taskObj) {
            setAssociatedTask(taskObj);
            setSelectedTaskId(taskObj.id);
            setCustomSubject(taskObj.subject);
          }
        }
      } catch (err) {
        console.error('Failed to load tasks context:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user, taskIdParam, taskId]);

  // Keep associated task synced with context taskId
  useEffect(() => {
    if (taskId && (!associatedTask || associatedTask.id !== taskId)) {
      const syncTask = async () => {
        try {
          const taskObj = await taskService.get(taskId);
          if (taskObj) setAssociatedTask(taskObj);
        } catch (e) {
          console.error(e);
        }
      };
      syncTask();
    } else if (!taskId) {
      setAssociatedTask(null);
    }
  }, [taskId]);

  // Exit Countdown Management
  useEffect(() => {
    if (exitCountdown > 0) {
      exitTimerRef.current = setTimeout(() => {
        setExitCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [exitCountdown]);

  // Exit Safety Handler
  const handleExitClick = async () => {
    if (exitCountdown > 0) {
      // Second click confirmed within 3s window -> Actually exit
      if (settings?.sound_enabled) {
        try {
          const audio = new Audio('/sounds/timer-complete.mp3');
          audio.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
      }

      // Log partial session safely if focus was active
      if (isActive && sessionType === 'focus' && startTimestamp) {
        const elapsed = Math.max(0, durationSeconds - remainingSeconds);
        if (elapsed >= 10 && user) {
          try {
            await repo.studySessions.create(user.id, {
              task_id: taskId || null,
              subject: subject || 'General',
              duration_seconds: elapsed,
              session_type: 'focus',
              completed: false,
              started_at: new Date(startTimestamp).toISOString(),
              ended_at: new Date().toISOString()
            });
          } catch (err) {
            console.error('Failed to log partial session:', err);
          }
        }
      }

      resetTimer();
      navigate('/dashboard');
    } else {
      // First click: trigger psychological commitment 3-second countdown
      if (settings?.sound_enabled) {
        try {
          const audio = new Audio('/sounds/timer-start.mp3');
          audio.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
      }
      setExitCountdown(3);
    }
  };

  const handleCancelExit = () => {
    setExitCountdown(0);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
  };

  // Timer Control Handlers
  const handleStart = () => {
    if (isActive) {
      if (isPaused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    } else {
      const currentId = selectedTaskId || null;
      const currentSub = associatedTask ? associatedTask.subject : (customSubject || 'General');
      startTimer(currentId, currentSub);
      toast.success('Focus timer started. Enter deep work!');
    }
  };

  const handleReset = async () => {
    if (isActive && sessionType === 'focus' && startTimestamp) {
      const elapsed = Math.max(0, durationSeconds - remainingSeconds);
      if (elapsed >= 10 && user) {
        try {
          await repo.studySessions.create(user.id, {
            task_id: taskId || null,
            subject: subject || 'General',
            duration_seconds: elapsed,
            session_type: 'focus',
            completed: false,
            started_at: new Date(startTimestamp).toISOString(),
            ended_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to log partial session:', err);
        }
      }
    }
    resetTimer();
    toast.info('Timer reset.');
  };

  const handleSkip = () => {
    skipTimer();
    toast.info('Skipped session.');
  };

  const handleTaskSelectChange = (e) => {
    const tid = e.target.value;
    setSelectedTaskId(tid);
    if (tid) {
      const found = pendingTasks.find(t => t.id === tid);
      if (found) {
        setAssociatedTask(found);
        setCustomSubject(found.subject);
      }
    } else {
      setAssociatedTask(null);
    }
  };

  const toggleSound = () => {
    updateSettings({ sound_enabled: !settings.sound_enabled });
    toast.success(settings.sound_enabled ? 'Focus audio muted' : 'Focus audio enabled');
  };

  // Calculations
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isFocusPhase = sessionType === 'focus';
  const phaseLabel = isFocusPhase 
    ? 'Focus Session' 
    : sessionType === 'short_break' 
      ? 'Short Break' 
      : 'Long Break';

  const totalCycles = settings?.pomodoro_sessions_count || 4;
  const currentCycleIndex = completedSessionsCount % totalCycles;

  // Dynamic context-aware motivation character
  const activeMotivation = getMotivation({
    isFocusTimerActive: true,
    activeSubject: subject || customSubject,
    preferredCategory: settings?.motivation_style
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-full h-80" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-3xl border border-border-card/35 bg-zinc-950 p-6 text-center text-text-primary">
      
      {/* Anime Focus Character Artwork - Clearly recognizable with cinematic gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center select-none pointer-events-none transition-all duration-1000 ease-in-out z-0 motion-reduce:transition-none"
        style={{ 
          backgroundImage: `url('${activeMotivation.character.image || '/assets/motivation/focus-pomodoro.png'}')`,
          opacity: isActive && !isPaused ? 0.45 : 0.60
        }}
      />

      {/* Subtle radial vignette & gradient mask for readability */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-zinc-950/75 to-zinc-950/95 pointer-events-none z-5" />

      {/* Main Glassmorphic workspace */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center justify-between gap-6 py-6 md:py-8">
        
        {/* Header toolbar */}
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Exit Safety Button / Countdown display */}
          {exitCountdown > 0 ? (
            <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 text-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse shadow-lg shadow-rose-950/40">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <button 
                onClick={handleExitClick}
                className="hover:underline text-white font-extrabold cursor-pointer"
              >
                Click again to exit ({exitCountdown}s)
              </button>
              <button 
                onClick={handleCancelExit}
                className="p-1 hover:text-white cursor-pointer ml-1"
                title="Cancel exit"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleExitClick}
              className="text-xs font-bold text-text-muted hover:text-brand-purple-hover flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-900/60 border border-border-card/30 hover:border-brand-purple/40 transition-all cursor-pointer hover:scale-105 active:scale-95 focus:ring-2 focus:ring-brand-purple/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Focus
            </button>
          )}

          <div className="flex items-center gap-2">
            <Link
              to={`/ai-assistant?subject=${encodeURIComponent(subject || customSubject)}&topic=${encodeURIComponent(associatedTask?.title || '')}`}
              className="p-2 rounded-xl bg-zinc-900/60 border border-border-card/30 hover:border-brand-purple/50 text-text-muted hover:text-brand-purple-hover transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-brand-purple/40 flex items-center gap-1.5 text-xs font-bold"
              title="Ask AI Study Assistant"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Help</span>
            </Link>
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-zinc-900/60 border border-border-card/30 hover:border-brand-purple/50 text-text-muted hover:text-text-primary transition-all cursor-pointer hover:scale-105 active:scale-95 focus:ring-2 focus:ring-brand-purple/40"
              title={settings.sound_enabled ? 'Mute sound' : 'Enable sound'}
            >
              {settings.sound_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Link
              to="/settings"
              className="p-2 rounded-xl bg-zinc-900/60 border border-border-card/30 hover:border-brand-purple/50 text-text-muted hover:text-text-primary transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-brand-purple/40"
              title="Timer settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Phase Pill Badge */}
        <div className="mt-2">
          <span className={`px-4 py-1.5 rounded-full border text-xs font-extrabold uppercase tracking-widest shadow-lg leading-none ${
            isFocusPhase 
              ? 'bg-brand-purple-bg/60 border-brand-purple/50 text-brand-purple-hover shadow-brand-purple/15' 
              : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-emerald-500/15'
          }`}>
            {phaseLabel}
          </span>
        </div>

        {/* Cinematic Clock Display with breathing pulse */}
        <div className="relative flex flex-col items-center justify-center my-4 select-none">
          <div className={`text-7xl md:text-8xl font-black font-display tracking-tighter tabular-nums select-none transition-all duration-300 ${
            isActive && !isPaused
              ? isFocusPhase 
                ? 'text-brand-purple-hover drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse motion-reduce:animate-none' 
                : 'text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse motion-reduce:animate-none'
              : 'text-white drop-shadow-md'
          }`}>
            {formatTime(remainingSeconds)}
          </div>
          
          <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-2">
            {isActive ? (isPaused ? 'Session Paused' : 'Deep Focus Active') : 'Flow Idle'}
          </div>
        </div>

        {/* Task Context Section */}
        <div className="w-full bg-zinc-900/50 border border-border-card/35 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-lg">
          {isActive ? (
            <div className="space-y-2">
              <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider block">Active Study Objective</span>
              <h3 className="text-sm font-extrabold text-text-primary leading-tight line-clamp-1">
                {associatedTask ? associatedTask.title : 'Custom Deep Study Session'}
              </h3>
              <span className="inline-block bg-brand-purple-bg text-brand-purple-hover px-2.5 py-0.5 rounded text-[9px] uppercase font-extrabold border border-brand-purple/20">
                {subject || 'General'}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider block text-left">Select Objective</span>
                <select
                  value={selectedTaskId}
                  onChange={handleTaskSelectChange}
                  className="w-full bg-zinc-950 border border-border-card/65 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                >
                  <option value="">General Custom Study</option>
                  {pendingTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.subject})</option>
                  ))}
                </select>
              </div>

              {!selectedTaskId && (
                <div className="space-y-1">
                  <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider block text-left">Subject Category</span>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Mathematics, Programming, Chemistry..."
                    className="w-full bg-zinc-950 border border-border-card/65 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cycle indicators */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalCycles }).map((_, idx) => {
              const isDone = idx < currentCycleIndex;
              const isCurrent = idx === currentCycleIndex && isActive && isFocusPhase;
              return (
                <div 
                  key={idx}
                  className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                    isDone 
                      ? 'bg-brand-purple border-brand-purple shadow-sm shadow-brand-purple/50' 
                      : isCurrent 
                        ? 'bg-brand-purple-bg border-brand-purple-hover animate-pulse scale-125 shadow-md shadow-brand-purple' 
                        : 'border-border-card bg-zinc-900/60'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-text-muted">
            Cycle {currentCycleIndex + 1} of {totalCycles}
          </span>
        </div>

        {/* Action Controls with micro-interactions */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <Button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-zinc-900/80 border border-border-card/40 hover:border-rose-500/40 text-text-muted hover:text-rose-400 transition-all cursor-pointer hover:scale-105 active:scale-95 focus:ring-2 focus:ring-rose-500/40"
            title="Reset session"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleStart}
            className={`p-5 rounded-2xl text-white shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-108 active:scale-95 focus:ring-2 focus:ring-brand-purple/50 ${
              isActive && !isPaused
                ? 'bg-zinc-800 border border-border-card hover:bg-zinc-700 hover:border-text-primary'
                : 'bg-brand-purple hover:bg-brand-purple-hover shadow-brand-purple/30'
            }`}
          >
            {isActive && !isPaused ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </Button>

          <Button
            onClick={handleSkip}
            disabled={!isActive}
            className="p-3.5 rounded-2xl bg-zinc-900/80 border border-border-card/40 hover:border-brand-purple/40 text-text-muted hover:text-brand-purple-hover disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer hover:scale-105 active:scale-95 focus:ring-2 focus:ring-brand-purple/40"
            title="Skip current session"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Motivational quote block */}
        <p className="text-xs text-text-muted/80 italic font-medium leading-relaxed max-w-md mt-4 select-text">
          {isFocusPhase 
            ? `"${activeMotivation.quote.replace(/\*\*/g, '')}" — ${activeMotivation.character.name}` 
            : '"Take a deep breath. Stand up, stretch, and relax."'}
        </p>

      </div>
    </div>
  );
}
