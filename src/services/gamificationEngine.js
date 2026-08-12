import { repo } from './repo';

// Conservative Level Scaling Thresholds
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1050,  // Level 6
  1500,  // Level 7
  2050,  // Level 8
  2700,  // Level 9
  3500   // Level 10
];

// Calculate Level and Progress Metrics from Total XP
export const getLevelFromXP = (xp = 0) => {
  const safeXP = Math.max(0, Number(xp) || 0);
  let currentLevel = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXP >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
      break;
    }
  }

  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || (currentLevelXP + 500);
  const xpInLevel = safeXP - currentLevelXP;
  const xpRequiredForNext = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min(100, Math.max(0, Math.round((xpInLevel / xpRequiredForNext) * 100)));
  const xpToNextLevel = Math.max(0, nextLevelXP - safeXP);

  return {
    currentLevel,
    currentXP: safeXP,
    nextLevelXP,
    progressPercentage,
    xpToNextLevel
  };
};

// Safe Idempotent XP Awarding Service
export const awardXP = async (userId, amount, eventKey) => {
  if (!userId || !amount || amount <= 0) {
    return { awarded: false, reason: 'invalid_parameters' };
  }

  // Idempotency: Check if this unique event has already been rewarded
  const idempotencyKey = `studyflow_xp_awarded_${userId}_${eventKey}`;
  if (eventKey && localStorage.getItem(idempotencyKey)) {
    return { awarded: false, reason: 'already_awarded' };
  }

  try {
    const profile = await repo.profiles.get(userId);
    if (!profile) return { awarded: false, reason: 'profile_not_found' };

    const oldXP = Number(profile.xp) || 0;
    const newXP = oldXP + amount;

    const oldLevel = getLevelFromXP(oldXP).currentLevel;
    const newLevel = getLevelFromXP(newXP).currentLevel;
    const leveledUp = newLevel > oldLevel;

    // Persist new XP to database
    await repo.profiles.update(userId, { xp: newXP });

    // Mark event as awarded locally to prevent duplicate farming
    if (eventKey) {
      localStorage.setItem(idempotencyKey, new Date().toISOString());
    }

    // Dispatch global event for instant UI feedback & subtle audio chime
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('studyflow-xp-awarded', {
          detail: {
            amount,
            newXP,
            leveledUp,
            newLevel,
            oldLevel
          }
        })
      );
    }

    return {
      awarded: true,
      amount,
      oldXP,
      newXP,
      leveledUp,
      newLevel
    };
  } catch (err) {
    console.error('Failed to award XP:', err);
    return { awarded: false, error: err };
  }
};

// Evaluate and award achievements
export const evaluateAchievements = async (userId) => {
  if (!userId) return [];

  try {
    const [masterList, unlockedList, tasksList, sessionsList, profile] = await Promise.all([
      repo.achievements.listMaster(),
      repo.achievements.listUnlocked(userId),
      repo.tasks.list(userId),
      repo.studySessions.list(userId),
      repo.profiles.get(userId)
    ]);

    const completedTasksCount = tasksList.filter(t => t.status === 'completed').length;
    const focusSessionsCount = sessionsList.filter(s => s.completed && s.session_type === 'focus').length;
    const streakDays = Number(profile?.streak) || 0;

    const unlockedKeys = new Set(unlockedList.map(u => u.achievement_key || u.id));
    const newlyUnlocked = [];

    for (const ach of masterList) {
      const achKey = ach.achievement_key || ach.id;
      if (unlockedKeys.has(achKey)) continue;

      let satisfied = false;
      if (ach.requirement_type === 'tasks_completed' && completedTasksCount >= ach.requirement_value) {
        satisfied = true;
      } else if (ach.requirement_type === 'focus_sessions' && focusSessionsCount >= ach.requirement_value) {
        satisfied = true;
      } else if (ach.requirement_type === 'streak_days' && streakDays >= ach.requirement_value) {
        satisfied = true;
      }

      if (satisfied) {
        if (repo.achievements.unlock) {
          await repo.achievements.unlock(userId, ach.id);
        }
        await awardXP(userId, ach.xp_reward || 50, `achievement_${achKey}`);
        newlyUnlocked.push(ach);
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('Error evaluating achievements:', err);
    return [];
  }
};

// Check Streak Milestones
export const evaluateStreakMilestones = async (userId, currentStreak) => {
  if (!userId || !currentStreak || currentStreak <= 0) return;

  const milestones = [
    { days: 3, xp: 25 },
    { days: 7, xp: 50 },
    { days: 14, xp: 100 },
    { days: 30, xp: 250 }
  ];

  for (const m of milestones) {
    if (currentStreak >= m.days) {
      await awardXP(userId, m.xp, `streak_milestone_${m.days}_days`);
    }
  }
};
