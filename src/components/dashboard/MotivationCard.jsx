import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { repo } from '../../services/repo';
import { getMotivation } from '../../services/motivationEngine';
import { Card, CardBody } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export default function MotivationCard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Format quotes helper
  const renderFormattedQuote = (quote) => {
    if (!quote) return '';
    const parts = quote.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span 
            key={idx} 
            className="text-brand-purple-hover drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] font-black uppercase tracking-tight block md:inline"
          >
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const fetchContextAndMotivation = async () => {
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

        const result = getMotivation({
          overdueCount,
          upcomingExamsCount,
          completedTasksCount,
          habitStreak,
          preferredCategory: settings?.motivation_style || 'Random'
        });

        setMotivation(result);
      } catch (err) {
        console.error('Failed to resolve context motivation:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContextAndMotivation();
  }, [user, settings]);

  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-3xl" />;
  }

  if (!motivation) return null;

  const { character, quote } = motivation;
  const isRightAlign = character.quoteAlignment === 'right';

  return (
    <Card className="border border-border-card/45 bg-zinc-950/90 overflow-hidden relative group h-[200px] rounded-3xl transition-all duration-300 hover:border-brand-purple/40 hover:shadow-lg hover:shadow-brand-purple/5">
      {/* Character Image - Clearly visible */}
      <img
        src={character.image}
        alt={character.name}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ${
          character.objectPosition || 'object-center'
        } opacity-75 group-hover:opacity-85 group-hover:scale-102 select-none`}
        loading="lazy"
      />
      
      {/* Dynamic cinematic alignment gradient overlay */}
      <div 
        className={`absolute inset-0 z-5 transition-all duration-500 ${
          isRightAlign
            ? 'bg-gradient-to-l from-zinc-950 via-zinc-950/75 to-transparent'
            : 'bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-transparent'
        }`}
      />

      {/* Quote Content overlay */}
      <CardBody className={`relative z-10 h-full flex flex-col justify-end p-5 space-y-2 ${
        isRightAlign ? 'text-right items-end' : 'text-left items-start'
      }`}>
        <span className="bg-brand-purple-bg/95 text-brand-purple-hover px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-extrabold w-fit border border-brand-purple/15 shadow-sm">
          {character.categories[0]}
        </span>
        
        <p className="text-xs md:text-sm font-black text-white leading-tight uppercase font-display tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] select-text">
          {renderFormattedQuote(quote)}
        </p>

        <div className={`flex items-center gap-1.5 text-[8px] font-bold text-text-muted/80 tracking-wider ${
          isRightAlign ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span className="text-text-primary font-extrabold">{character.name}</span>
          <span>•</span>
          <span className="uppercase text-[7px] font-semibold">{character.role}</span>
        </div>
      </CardBody>
    </Card>
  );
}
