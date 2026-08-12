import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Zap, Trophy, Sparkles, X } from 'lucide-react';

export default function GamificationOverlay() {
  const { settings } = useSettings();
  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);

  useEffect(() => {
    const handleXPEvent = (event) => {
      const { amount, leveledUp, newLevel } = event.detail || {};
      if (!amount) return;

      // Play audio feedback if sounds enabled
      if (settings?.sound_enabled) {
        try {
          const soundFile = leveledUp ? '/sounds/timer-complete.mp3' : '/sounds/timer-start.mp3';
          const audio = new Audio(soundFile);
          audio.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.5;
          audio.play().catch(() => {});
        } catch (e) {
          // ignore audio catch
        }
      }

      // 1. Level up celebration modal
      if (leveledUp) {
        setLevelUpData({ newLevel });
        setTimeout(() => {
          setLevelUpData(null);
        }, 4500);
      } else {
        // 2. Floating XP badge toast
        const id = Date.now() + Math.random();
        setXpToasts(prev => [...prev.slice(-3), { id, amount }]);

        setTimeout(() => {
          setXpToasts(prev => prev.filter(t => t.id !== id));
        }, 2200);
      }
    };

    window.addEventListener('studyflow-xp-awarded', handleXPEvent);
    return () => window.removeEventListener('studyflow-xp-awarded', handleXPEvent);
  }, [settings]);

  return (
    <>
      {/* Floating XP Badge Notifications (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {xpToasts.map(toast => (
          <div
            key={toast.id}
            className="bg-zinc-950/90 border border-brand-purple/50 text-brand-purple-hover px-4 py-2 rounded-2xl shadow-xl shadow-brand-purple/20 flex items-center gap-2 text-xs font-black uppercase tracking-wider font-display animate-bounce"
          >
            <Zap className="w-4 h-4 text-brand-purple-hover fill-brand-purple-hover" />
            <span>+{toast.amount} XP Earned</span>
          </div>
        ))}
      </div>

      {/* Celebratory Level Up Modal */}
      {levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-brand-purple/50 p-6 md:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl shadow-brand-purple/30 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial-gradient from-brand-purple/20 via-transparent to-transparent pointer-events-none" />

            <button
              onClick={() => setLevelUpData(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-brand-purple-bg/90 border border-brand-purple/50 text-brand-purple-hover mx-auto flex items-center justify-center mb-4 shadow-lg shadow-brand-purple/20">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-black text-brand-purple-hover block">
                Academic Milestone
              </span>
              <h2 className="text-3xl font-black text-white uppercase font-display tracking-tight">
                Level {levelUpData.newLevel} Unlocked!
              </h2>
              <p className="text-xs text-text-muted mt-2">
                Your discipline and consistency are scaling your intelligence. Keep it up!
              </p>
            </div>

            <button
              onClick={() => setLevelUpData(null)}
              className="mt-6 w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow-md shadow-brand-purple/20 transition-colors"
            >
              Continue Studying
            </button>
          </div>
        </div>
      )}
    </>
  );
}
