import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { repo } from '../services/repo';
import { getMotivation } from '../services/motivationEngine';
import { motivationCharacters } from '../data/motivationCharacters';

import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import AchievementsList from '../components/gamification/AchievementsList';

import { RefreshCw, Sliders, Target } from 'lucide-react';

export default function Motivation() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();

  // Core Motivation States
  const [currentMotivation, setCurrentMotivation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextData, setContextData] = useState({});
  const [activeCategory, setActiveCategory] = useState('Random');
  const [fadeState, setFadeState] = useState(true); // Control image/text transition fade

  // Format quotes helper
  const renderFormattedQuote = (quote) => {
    if (!quote) return '';
    const parts = quote.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span 
            key={idx} 
            className="text-brand-purple-hover drop-shadow-[0_0_15px_rgba(168,85,247,0.45)] font-black uppercase tracking-tight block md:inline"
          >
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  // Load Context on Mount
  const loadContext = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const [tasksList, examsList, profileData] = await Promise.all([
        repo.tasks.list(user.id),
        repo.exams.list(user.id),
        repo.profiles.get(user.id)
      ]);

      const overdueCount = tasksList.filter(t => 
        t.status !== 'completed' && 
        t.status !== 'cancelled' && 
        t.due_date < todayStr
      ).length;

      const upcomingExamsCount = examsList.filter(e => e.date >= todayStr).length;
      const completedTasksCount = tasksList.filter(t => t.status === 'completed').length;
      const habitStreak = profileData?.streak || 0;

      const context = {
        overdueCount,
        upcomingExamsCount,
        completedTasksCount,
        habitStreak,
        preferredCategory: settings?.motivation_style || 'Random'
      };

      setContextData(context);
      setActiveCategory(settings?.motivation_style || 'Random');

      const result = getMotivation(context);
      setCurrentMotivation(result);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load motivation vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [user, settings?.motivation_style]);

  // Handle refresh action (random quote/character within the preference)
  const handleRefresh = () => {
    if (!currentMotivation) return;
    
    // Smooth transition fade-out
    setFadeState(false);
    
    // Play UI click feedback sound if enabled
    if (settings?.sound_enabled) {
      try {
        const audio = new Audio('/sounds/timer-start.mp3');
        audio.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.5;
        audio.play().catch(err => console.warn('Audio play prevented', err));
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      const result = getMotivation(contextData, true);
      setCurrentMotivation(result);
      setFadeState(true); // Fade back in
      toast.success('Inspiration refreshed!');
    }, 250);
  };

  // Handle category updates
  const handleCategoryChange = async (category) => {
    try {
      const success = await updateSettings({ motivation_style: category });
      if (success) {
        setActiveCategory(category);
        toast.success(`Motivation style updated to: ${category}`);
      } else {
        toast.error('Failed to update preference.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving preference.');
    }
  };

  const styleOptions = [
    { label: 'Automatic (Context-aware)', value: 'Random' },
    { label: 'Discipline', value: 'Discipline' },
    { label: 'Focus Mode', value: 'Focus' },
    { label: 'Exam Strategy', value: 'Exams' },
    { label: 'Coding & CS', value: 'Coding' },
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Resilience Comeback', value: 'Comeback' },
    { label: 'High Achievement', value: 'Achievement' }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <Skeleton className="w-48 h-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-96" />
          <Skeleton className="lg:col-span-4 h-96" />
        </div>
      </div>
    );
  }

  const char = currentMotivation?.character;
  const quote = currentMotivation?.quote;
  const isRightAlign = char?.quoteAlignment === 'right';

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-primary">
          Motivation Vault
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-normal">
          Unlock context-driven guidance from original study characters to stay consistent.
        </p>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Today's Motivation Card */}
        {currentMotivation && (
          <div className="lg:col-span-8 space-y-4">
            <Card className="border border-border-card/35 bg-zinc-950/90 overflow-hidden relative min-h-[420px] flex flex-col justify-between p-6 md:p-8 rounded-3xl group select-none">
              
              {/* Background Art - recognizable, lighter mask */}
              <img
                src={char.image}
                alt={char.name}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ${
                  char.objectPosition || 'object-center'
                } opacity-75 group-hover:scale-102 transition-opacity duration-300 ${
                  fadeState ? 'opacity-75' : 'opacity-0'
                }`}
              />

              {/* Dynamic cinematic alignment gradient overlay */}
              <div 
                className={`absolute inset-0 z-5 transition-opacity duration-300 ${
                  isRightAlign
                    ? 'bg-gradient-to-l from-zinc-950 via-zinc-950/70 to-transparent'
                    : 'bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent'
                } ${fadeState ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Vignette edge mask to add premium depth */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-zinc-950/80 pointer-events-none z-6" />

              {/* Top Row: Categories */}
              <div 
                className={`relative z-10 flex flex-wrap gap-1.5 transition-all duration-300 ${
                  isRightAlign ? 'justify-end' : 'justify-start'
                } ${fadeState ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
              >
                {char.categories.map(cat => (
                  <span 
                    key={cat}
                    className="bg-brand-purple-bg/90 text-brand-purple-hover px-3 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest border border-brand-purple/20 shadow-md shadow-brand-purple/5"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Flex grows to fill space, pushing quote to the bottom */}
              <div className="flex-1 min-h-[40px]" />

              {/* Lower Section Content: Quote and Scholar Info in a single flow */}
              <div 
                className={`relative z-10 space-y-5 transition-all duration-300 ${
                  fadeState ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                {/* Moderate-sized Quote near bottom, left-aligned, restricted width */}
                <blockquote className="text-[clamp(1.4rem,2.8vw,2.6rem)] font-black font-display tracking-tight text-white leading-none uppercase max-w-[70%] select-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] text-left">
                  {renderFormattedQuote(quote)}
                </blockquote>

                {/* Details and Refresh control */}
                <div 
                  className="flex items-end justify-between border-t border-border-card/25 pt-4 flex-wrap gap-4"
                >
                  <div className="leading-tight text-left">
                    <span className="text-[10px] text-brand-purple-hover uppercase font-bold tracking-wider block">Featured Scholar</span>
                    <h3 className="text-lg font-extrabold text-text-primary mt-0.5">{char.name}</h3>
                    <span className="text-[10px] text-text-muted/80 font-medium">{char.role}</span>
                  </div>

                  <Button
                    onClick={handleRefresh}
                    className="bg-zinc-900/90 hover:bg-zinc-800 border border-border-card text-text-muted hover:text-text-primary px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-brand-purple/40 hover:text-brand-purple transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Next Inspiration
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Right Column: Motivation Style selector */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-border-card/35 bg-bg-card/45">
            <CardHeader className="p-4 pb-2 border-b border-border-card/10 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-purple" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Motivation Style</span>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <p className="text-[10px] text-text-muted leading-relaxed font-normal">
                Choose a preferred style. Selecting a specific category will guide character selection across the dashboard.
              </p>
              
              <div className="space-y-2">
                {styleOptions.map(opt => {
                  const isActive = activeCategory === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleCategoryChange(opt.value)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-brand-purple-bg/30 border-brand-purple text-brand-purple-hover font-bold shadow-md shadow-brand-purple/5' 
                          : 'bg-zinc-900/40 border-border-card/45 hover:border-brand-purple/40 text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && <Target className="w-4.5 h-4.5 text-brand-purple-hover animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Characters Gallery grid */}
      <div className="space-y-3 mt-8">
        <div className="border-b border-border-card/25 pb-2">
          <h2 className="text-lg font-extrabold font-display tracking-tight text-text-primary">
            Character Gallery
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5 font-normal">
            Meet the StudyFlow scholarly crew designed to guide your habits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {motivationCharacters.map(c => (
            <Card 
              key={c.id} 
              className="border border-border-card/35 bg-bg-card/45 overflow-hidden group hover:border-brand-purple/35 transition-all duration-300 rounded-2xl hover:shadow-lg hover:shadow-brand-purple/5"
            >
              {/* Header Character Card image - Lighter, clearer focus mask */}
              <div className="relative h-44 overflow-hidden bg-zinc-900/50">
                <img 
                  src={c.image} 
                  alt={c.name}
                  className={`w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-102 transition-all duration-500 select-none pointer-events-none ${
                    c.objectPosition || 'object-center'
                  }`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-5" />
                <div className="absolute bottom-3 left-3 right-3 text-left z-10 leading-tight">
                  <h4 className="text-sm font-extrabold text-white">{c.name}</h4>
                  <span className="text-[9px] text-brand-purple-hover font-bold uppercase tracking-wider">{c.role}</span>
                </div>
              </div>
              {/* Card contents */}
              <CardBody className="p-4 space-y-3 text-left">
                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {c.categories.slice(0, 3).map(cat => (
                    <span 
                      key={cat} 
                      className="bg-zinc-900 border border-border-card/50 text-text-muted px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                {/* Sample Quote */}
                <p className="text-[10px] text-text-muted/80 italic font-medium leading-relaxed">
                  "{c.quotes[0].replace(/\*\*/g, '')}"
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="pt-4 border-t border-border-card/20">
        <AchievementsList />
      </div>
    </div>
  );
}
