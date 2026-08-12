import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePomodoro } from '../../context/PomodoroContext';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Flame, Timer, Zap, ArrowRight, Pause } from 'lucide-react';

export default function DashboardFocusCard({ studyTimeStr = '0m', streak = 0, currentLevel = 1 }) {
  const navigate = useNavigate();
  const {
    isActive,
    isPaused,
    sessionType,
    remainingSeconds,
    subject
  } = usePomodoro();

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFocusClick = () => {
    navigate('/focus');
  };

  return (
    <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl overflow-hidden relative group hover:border-brand-purple/40 transition-all duration-500 shadow-lg shadow-black/25">
      {/* Background Anime Focus Artwork with gentle parallax hover & gradient mask */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-35 group-hover:scale-103 transition-all duration-700 select-none pointer-events-none motion-reduce:transition-none"
        style={{ backgroundImage: `url('/assets/motivation/focus-pomodoro.png')` }}
      />
      
      {/* Directional gradient mask to ensure maximum readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/60 pointer-events-none" />

      <CardBody className="relative z-10 p-5 flex flex-col justify-between h-full space-y-4 text-left">
        {/* Top Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-purple-bg border border-brand-purple/40 text-brand-purple-hover flex items-center justify-center shadow-md shadow-brand-purple/10">
              <Timer className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple-hover block">
                Focus Session
              </span>
              <h3 className="text-sm font-extrabold text-white leading-tight">
                {isActive ? 'Deep Work Active' : 'Ready to Focus?'}
              </h3>
            </div>
          </div>

          {isActive ? (
            <span className="bg-brand-purple-bg/80 border border-brand-purple/50 text-brand-purple-hover text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple-hover" />
              In Progress
            </span>
          ) : (
            <span className="bg-zinc-900/80 border border-border-card/50 text-text-muted text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Pomodoro Mode
            </span>
          )}
        </div>

        {/* Middle State: Timer Countdown or Metrics Snapshot */}
        {isActive ? (
          <div className="bg-zinc-950/70 border border-brand-purple/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-md">
            <div>
              <div className="text-3xl font-black font-display tracking-tight text-white tabular-nums">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {subject || 'General Study Session'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-hover flex items-center justify-center">
              {isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="bg-zinc-900/60 border border-border-card/30 rounded-xl p-2 text-center">
              <div className="text-[9px] font-bold text-text-muted uppercase">Today's Focus</div>
              <div className="text-xs font-black text-emerald-400 mt-0.5">{studyTimeStr}</div>
            </div>
            <div className="bg-zinc-900/60 border border-border-card/30 rounded-xl p-2 text-center">
              <div className="text-[9px] font-bold text-text-muted uppercase">Streak</div>
              <div className="text-xs font-black text-amber-400 mt-0.5">{streak} Days</div>
            </div>
            <div className="bg-zinc-900/60 border border-border-card/30 rounded-xl p-2 text-center">
              <div className="text-[9px] font-bold text-text-muted uppercase">Level</div>
              <div className="text-xs font-black text-brand-purple-hover mt-0.5">Lvl {currentLevel}</div>
            </div>
          </div>
        )}

        {/* Primary Call to Action Button */}
        <Button
          onClick={handleFocusClick}
          className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-brand-purple/50 ${
            isActive
              ? 'bg-gradient-to-r from-brand-purple to-purple-600 hover:from-brand-purple-hover hover:to-purple-500 text-white shadow-brand-purple/25'
              : 'bg-brand-purple hover:bg-brand-purple-hover text-white shadow-brand-purple/20'
          }`}
        >
          {isActive ? (
            <>
              <span>Continue Focus Session</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Start Focus Session</span>
            </>
          )}
        </Button>
      </CardBody>
    </Card>
  );
}
