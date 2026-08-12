import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { repo } from '../../services/repo';
import { evaluateAchievements } from '../../services/gamificationEngine';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Trophy, Flame, Zap, Award, CheckCircle, Lock, Target } from 'lucide-react';

const ICON_MAP = {
  CheckCircle: CheckCircle,
  Flame: Flame,
  Zap: Zap,
  Award: Award,
  Target: Target,
  Trophy: Trophy
};

export default function AchievementsList() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [unlockedMap, setUnlockedMap] = useState({});
  const [userStats, setUserStats] = useState({ tasks: 0, sessions: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  const loadAchievementsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Run automatic evaluation first
      await evaluateAchievements(user.id);

      const [masterList, unlockedList, tasksList, sessionsList, profile] = await Promise.all([
        repo.achievements.listMaster(),
        repo.achievements.listUnlocked(user.id),
        repo.tasks.list(user.id),
        repo.studySessions.list(user.id),
        repo.profiles.get(user.id)
      ]);

      const unlocked = {};
      (unlockedList || []).forEach(u => {
        unlocked[u.achievement_key || u.id] = u;
      });

      setAchievements(masterList || []);
      setUnlockedMap(unlocked);
      setUserStats({
        tasks: tasksList.filter(t => t.status === 'completed').length,
        sessions: sessionsList.filter(s => s.completed && s.session_type === 'focus').length,
        streak: Number(profile?.streak) || 0
      });
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievementsData();

    // Listen for XP and achievement events
    const handleXPEvent = () => {
      loadAchievementsData();
    };

    window.addEventListener('studyflow-xp-awarded', handleXPEvent);
    return () => window.removeEventListener('studyflow-xp-awarded', handleXPEvent);
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <Skeleton key={n} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border-card/25 pb-2">
        <div>
          <h2 className="text-lg font-extrabold font-display tracking-tight text-text-primary flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-amber-400" />
            Scholarly Achievements
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5">
            Earn permanent recognition and bonus XP by achieving consistent academic milestones.
          </p>
        </div>
        <div className="text-[11px] font-bold text-text-muted">
          <span className="text-brand-purple-hover font-extrabold">{Object.keys(unlockedMap).length}</span> / {achievements.length} Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => {
          const isUnlocked = !!unlockedMap[ach.achievement_key || ach.id];
          const IconComponent = ICON_MAP[ach.badge_icon] || Trophy;

          // Calculate progress
          let currentVal = 0;
          if (ach.requirement_type === 'tasks_completed') currentVal = userStats.tasks;
          else if (ach.requirement_type === 'focus_sessions') currentVal = userStats.sessions;
          else if (ach.requirement_type === 'streak_days') currentVal = userStats.streak;

          const reqVal = ach.requirement_value || 1;
          const progressPct = Math.min(100, Math.round((currentVal / reqVal) * 100));

          return (
            <Card
              key={ach.id || ach.achievement_key}
              className={`border transition-all duration-300 rounded-2xl overflow-hidden ${
                isUnlocked
                  ? 'border-brand-purple/40 bg-zinc-950/80 shadow-md shadow-brand-purple/5'
                  : 'border-border-card/40 bg-zinc-950/40 opacity-75'
              }`}
            >
              <CardBody className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isUnlocked
                          ? 'bg-brand-purple-bg/90 border-brand-purple/40 text-brand-purple-hover'
                          : 'bg-zinc-900 border-border-card/50 text-text-muted'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-text-primary leading-tight">
                        {ach.title}
                      </h4>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 whitespace-nowrap">
                    +{ach.xp_reward} XP
                  </span>
                </div>

                {/* Progress / Status row */}
                <div className="pt-2 border-t border-border-card/20 flex items-center justify-between text-[9px] font-bold text-text-muted">
                  {isUnlocked ? (
                    <div className="text-emerald-400 flex items-center gap-1 font-extrabold">
                      <CheckCircle className="w-3 h-3" /> Unlocked
                    </div>
                  ) : (
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-text-muted">
                        <span className="flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Progress
                        </span>
                        <span>
                          {currentVal} / {reqVal}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-border-card/20">
                        <div
                          className="bg-brand-purple h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
