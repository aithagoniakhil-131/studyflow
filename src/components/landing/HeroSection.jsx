import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ArrowRight, Flame, Timer, CheckCircle2 } from 'lucide-react';
import { getArtworkById } from '../../services/motivationData';

export default function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get landing hero artwork from registry
  const heroArt = getArtworkById('landing-hero');

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleExplore = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
      {/* Background faded branding quote */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 select-none pointer-events-none opacity-2 text-[6rem] md:text-[10rem] font-display font-black text-white/5 whitespace-nowrap leading-none hidden lg:block">
        Your future is built today.
      </div>

      {/* Hero Left Column (60% width on lg) */}
      <div className="lg:col-span-7 space-y-8 z-10 text-left">
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple-bg border border-brand-purple/20 text-brand-purple text-xs font-semibold uppercase tracking-wider animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
          Version 2.0 Live
        </div>

        {/* Cinematic Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight uppercase font-display">
            YOUR COLLEGE LIFE.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-brand-purple bg-clip-text text-transparent">
              UNDER CONTROL.
            </span>
          </h1>
          <p className="text-text-muted text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed">
            Plan your semester. Track your study. Build discipline. Never miss an exam or deadline. A cinematic workspace for high-achievers.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button 
            onClick={handleStart} 
            variant="primary" 
            size="lg" 
            className="group shadow-lg shadow-brand-purple/25 flex items-center justify-center gap-2 hover:bg-brand-purple-hover font-semibold py-3.5 px-6 rounded-lg text-sm sm:text-base"
          >
            Start Your Journey 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            onClick={handleExplore} 
            variant="secondary" 
            size="lg"
            className="border border-border-card bg-zinc-900/30 hover:bg-zinc-800/20 py-3.5 px-6 rounded-lg text-sm sm:text-base font-semibold"
          >
            Explore Dashboard
          </Button>
        </div>
      </div>

      {/* Hero Right Column (50% width on lg) */}
      <div className="lg:col-span-5 relative flex flex-col items-center">
        {/* Relative card frame surrounding image */}
        <div className="relative w-full max-w-md aspect-[4/3] sm:h-[420px] rounded-2xl border border-border-card/60 bg-zinc-950/40 p-2 shadow-2xl overflow-visible">
          {heroArt ? (
            <img 
              src={heroArt.image} 
              alt="Anime student studying at desk with laptop" 
              className="w-full h-full object-cover rounded-xl border border-border-card/40"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center text-text-muted text-sm border border-border-card/30">
              [Landing Hero Art]
            </div>
          )}

          {/* Floating Metric 1: Today's Progress (Top-Left) */}
          <div className="absolute -top-6 -left-6 bg-bg-card/90 backdrop-blur-md border border-border-card rounded-xl p-3 shadow-xl hidden sm:flex flex-col gap-2 w-48 glass-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Progress</span>
              <span className="text-[9px] bg-rose-950/30 text-rose-400 px-1.5 py-0.5 rounded font-bold border border-rose-500/10">
                14 Days Left
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Circular SVG Ring */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="16" className="stroke-zinc-800 fill-none" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" className="stroke-cyan-400 fill-none" strokeWidth="3" 
                          strokeDasharray="100" strokeDashoffset="28" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                  72%
                </span>
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-text-primary">On Track</div>
                <div className="text-[10px] text-text-muted">Today's Goals</div>
              </div>
            </div>
          </div>

          {/* Floating Metric 2: Streak (Top-Right) */}
          <div className="absolute -top-8 -right-6 bg-bg-card/90 backdrop-blur-md border border-border-card rounded-xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2.5 glass-card">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-text-primary">12 Day Streak</div>
              <div className="text-[9px] text-text-muted">Stay consistent</div>
            </div>
          </div>

          {/* Floating Metric 3: Study Time (Bottom-Left) */}
          <div className="absolute -bottom-6 -left-6 bg-bg-card/90 backdrop-blur-md border border-border-card rounded-xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2.5 glass-card">
            <Timer className="w-5 h-5 text-brand-purple" />
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-text-primary">3h 25m</div>
              <div className="text-[9px] text-text-muted">Focus study today</div>
            </div>
          </div>

          {/* Floating Metric 4: Tasks Progress (Bottom-Right) */}
          <div className="absolute bottom-6 -right-10 bg-bg-card/90 backdrop-blur-md border border-border-card rounded-xl p-3 shadow-xl hidden sm:flex flex-col gap-1.5 w-44 glass-card">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <span>Tasks</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 fill-emerald-950/20" /> 6 / 8
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        {/* Mobile Metric Cards Grid (Only visible on screens < sm) */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-6 sm:hidden">
          <div className="bg-bg-card border border-border-card rounded-xl p-3 flex items-center gap-2.5 glass-card">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-text-primary">12 Days</div>
              <span className="text-[9px] text-text-muted">Current Streak</span>
            </div>
          </div>
          
          <div className="bg-bg-card border border-border-card rounded-xl p-3 flex items-center gap-2.5 glass-card">
            <Timer className="w-4 h-4 text-brand-purple" />
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-text-primary">3h 25m</div>
              <span className="text-[9px] text-text-muted">Study Time</span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-card rounded-xl p-3 flex items-center gap-2.5 glass-card col-span-2 justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div className="text-left leading-none">
                <div className="text-xs font-bold text-text-primary">Tasks Checklist</div>
                <span className="text-[9px] text-text-muted">6 out of 8 completed today</span>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/10">72%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
