import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { repo } from '../services/repo';
import { awardXP, evaluateAchievements } from '../services/gamificationEngine';

const PomodoroContext = createContext();

export const usePomodoro = () => useContext(PomodoroContext);

export const PomodoroProvider = ({ children }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const toast = useToast();

  // Helper to load timer state from localstorage
  const loadInitialState = () => {
    const saved = localStorage.getItem('studyflow_active_timer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify user matches
        if (parsed.userId === user?.id) {
          return {
            isActive: parsed.isActive,
            isPaused: parsed.isPaused,
            sessionType: parsed.sessionType,
            durationSeconds: parsed.durationSeconds,
            startTimestamp: parsed.startTimestamp,
            targetEndTimestamp: parsed.targetEndTimestamp,
            pausedRemainingSeconds: parsed.pausedRemainingSeconds,
            taskId: parsed.taskId,
            subject: parsed.subject
          };
        }
      } catch (e) {
        console.error('Error parsing saved timer state:', e);
      }
    }
    return {
      isActive: false,
      isPaused: false,
      sessionType: 'focus', // focus, short_break, long_break
      durationSeconds: (settings?.pomodoro_focus || 25) * 60,
      startTimestamp: null,
      targetEndTimestamp: null,
      pausedRemainingSeconds: (settings?.pomodoro_focus || 25) * 60,
      taskId: null,
      subject: ''
    };
  };

  const [timerState, setTimerState] = useState(loadInitialState);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const audioRef = useRef(null);

  // Re-sync duration configuration when settings load
  useEffect(() => {
    if (!timerState.isActive) {
      const focusMinutes = settings?.pomodoro_focus || 25;
      setTimerState(prev => ({
        ...prev,
        durationSeconds: focusMinutes * 60,
        pausedRemainingSeconds: focusMinutes * 60
      }));
    }
  }, [settings, timerState.isActive]);

  // Synchronize timerState to localStorage to survive page navigation/refresh
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        'studyflow_active_timer',
        JSON.stringify({ ...timerState, userId: user.id })
      );
    } else {
      localStorage.removeItem('studyflow_active_timer');
    }
  }, [timerState, user]);

  // Set up timer sound player
  const playSound = (soundType) => {
    if (!settings.sound_enabled) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = `/sounds/${soundType}.mp3`;
      audioRef.current.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.5;
      audioRef.current.play().catch(err => {
        // Safe fallback for browser autoplay policies
        console.warn('Autoplay audio prevented by browser policies:', err);
      });
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  // Timer Tick Calculation Loop
  useEffect(() => {
    let intervalId = null;

    const tick = () => {
      if (!timerState.isActive) {
        setRemainingSeconds(timerState.durationSeconds);
        return;
      }
      
      if (timerState.isPaused) {
        setRemainingSeconds(timerState.pausedRemainingSeconds);
        return;
      }

      const now = Date.now();
      const diff = Math.ceil((timerState.targetEndTimestamp - now) / 1000);

      if (diff <= 0) {
        setRemainingSeconds(0);
        handleTimerExpiry();
      } else {
        setRemainingSeconds(diff);
      }
    };

    tick(); // initial tick
    
    if (timerState.isActive && !timerState.isPaused) {
      intervalId = setInterval(tick, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState]);

  const handleTimerExpiry = async () => {
    playSound('timer-complete');
    const endedAt = new Date().toISOString();
    const startedAt = new Date(timerState.startTimestamp).toISOString();
    
    const typeNames = {
      focus: 'Focus session completed!',
      short_break: 'Short break over!',
      long_break: 'Long break over!'
    };

    toast.success(typeNames[timerState.sessionType] || 'Timer finished!', 4000);

    // Save study session if it was a completed focus mode
    if (timerState.sessionType === 'focus' && user) {
      try {
        await repo.studySessions.create(user.id, {
          task_id: timerState.taskId,
          subject: timerState.subject || 'General',
          duration_seconds: timerState.durationSeconds,
          session_type: 'focus',
          completed: true,
          started_at: startedAt,
          ended_at: endedAt
        });

        // Award XP and evaluate achievements via the gamification engine
        await awardXP(user.id, 20, `focus_session_${startedAt}`);
        await evaluateAchievements(user.id);
      } catch (err) {
        console.error('Failed to log study session:', err);
      }

      setCompletedSessionsCount(prev => prev + 1);
    }

    // Determine next phase automatically
    autoTransitionTimer();
  };

  const autoTransitionTimer = () => {
    let nextType = 'focus';
    let minutes = settings?.pomodoro_focus || 25;
    
    if (timerState.sessionType === 'focus') {
      const targetCount = settings?.pomodoro_sessions_count || 4;
      const willTakeLongBreak = (completedSessionsCount + 1) % targetCount === 0;
      
      if (willTakeLongBreak) {
        nextType = 'long_break';
        minutes = settings?.pomodoro_long_break || 15;
      } else {
        nextType = 'short_break';
        minutes = settings?.pomodoro_short_break || 5;
      }
    }

    const nextDuration = minutes * 60;
    const shouldAutoStart = nextType === 'focus' 
      ? settings?.auto_start_focus 
      : settings?.auto_start_breaks;

    if (shouldAutoStart) {
      const now = Date.now();
      setTimerState({
        isActive: true,
        isPaused: false,
        sessionType: nextType,
        durationSeconds: nextDuration,
        startTimestamp: now,
        targetEndTimestamp: now + nextDuration * 1000,
        pausedRemainingSeconds: nextDuration,
        taskId: nextType === 'focus' ? timerState.taskId : null,
        subject: nextType === 'focus' ? timerState.subject : ''
      });
      playSound('timer-start');
    } else {
      setTimerState({
        isActive: false,
        isPaused: false,
        sessionType: nextType,
        durationSeconds: nextDuration,
        startTimestamp: null,
        targetEndTimestamp: null,
        pausedRemainingSeconds: nextDuration,
        taskId: null,
        subject: ''
      });
    }
  };

  const startTimer = (taskId = null, subject = '') => {
    playSound('timer-start');
    const now = Date.now();
    const duration = timerState.durationSeconds;
    
    setTimerState({
      isActive: true,
      isPaused: false,
      sessionType: 'focus',
      durationSeconds: duration,
      startTimestamp: now,
      targetEndTimestamp: now + duration * 1000,
      pausedRemainingSeconds: duration,
      taskId,
      subject
    });
  };

  const pauseTimer = () => {
    if (!timerState.isActive || timerState.isPaused) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((timerState.targetEndTimestamp - now) / 1000));
    
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      pausedRemainingSeconds: remaining
    }));
  };

  const resumeTimer = () => {
    if (!timerState.isActive || !timerState.isPaused) return;
    
    playSound('timer-start');
    const now = Date.now();
    const newEnd = now + timerState.pausedRemainingSeconds * 1000;
    
    setTimerState(prev => ({
      ...prev,
      isPaused: false,
      targetEndTimestamp: newEnd
    }));
  };

  const resetTimer = () => {
    const minutes = timerState.sessionType === 'focus' 
      ? (settings?.pomodoro_focus || 25)
      : timerState.sessionType === 'short_break'
        ? (settings?.pomodoro_short_break || 5)
        : (settings?.pomodoro_long_break || 15);
    
    const resetDur = minutes * 60;
    
    setTimerState({
      isActive: false,
      isPaused: false,
      sessionType: timerState.sessionType,
      durationSeconds: resetDur,
      startTimestamp: null,
      targetEndTimestamp: null,
      pausedRemainingSeconds: resetDur,
      taskId: null,
      subject: ''
    });
  };

  const skipTimer = () => {
    // Skip to next state immediately
    autoTransitionTimer();
  };

  const triggerTaskSound = () => {
    playSound('task-complete');
  };

  const triggerAchievementSound = () => {
    playSound('achievement');
  };

  return (
    <PomodoroContext.Provider
      value={{
        ...timerState,
        remainingSeconds,
        completedSessionsCount,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipTimer,
        triggerTaskSound,
        triggerAchievementSound
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};
