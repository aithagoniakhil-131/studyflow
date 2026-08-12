import { repo } from './repo';
import { awardXP, evaluateAchievements, evaluateStreakMilestones } from './gamificationEngine';

// Safe date formatter (YYYY-MM-DD in local timezone)
export const formatLocalDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getTodayDateString = () => {
  return formatLocalDateString(new Date());
};

// Check if a habit is expected on a specific YYYY-MM-DD date string
export const isHabitExpectedOnDate = (habit, dateStr) => {
  if (!habit.is_active) return false;

  const createdDateStr = habit.created_at.split('T')[0];
  if (dateStr < createdDateStr) return false; // Not created yet

  if (habit.frequency_type === 'daily') {
    const start = new Date(createdDateStr + 'T12:00:00');
    const current = new Date(dateStr + 'T12:00:00');
    const diffTime = current - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return false;
    return (diffDays % (habit.frequency_interval || 1)) === 0;
  }
  
  if (habit.frequency_type === 'selected_days') {
    const d = new Date(dateStr + 'T12:00:00');
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = daysMap[d.getDay()];
    return (habit.frequency_days || []).includes(weekday);
  }
  
  if (habit.frequency_type === 'weekly') {
    const d = new Date(dateStr + 'T12:00:00');
    // Align weekly habits to Sunday (day 0) for checklist representation
    return d.getDay() === 0;
  }

  return false;
};

// Calculate current streak of completed expected occurrences
export const calculateHabitStreak = (habit, logs) => {
  if (!habit.is_active) return 0;
  
  const todayStr = getTodayDateString();
  const startDate = new Date(habit.created_at.split('T')[0] + 'T12:00:00');
  const today = new Date(todayStr + 'T12:00:00');
  
  const expectedDates = [];
  const current = new Date(today);
  
  while (current >= startDate) {
    const curStr = formatLocalDateString(current);
    if (isHabitExpectedOnDate(habit, curStr)) {
      expectedDates.push(curStr);
    }
    current.setDate(current.getDate() - 1);
  }
  
  let streak = 0;
  const completedDates = new Set(
    logs.filter(l => l.habit_id === habit.id && l.completed).map(l => l.date)
  );
  
  for (let i = 0; i < expectedDates.length; i++) {
    const date = expectedDates[i];
    const isDone = completedDates.has(date);
    
    if (date === todayStr) {
      if (isDone) {
        streak++;
      }
      // If today is expected but not completed yet, the streak is NOT broken.
    } else {
      if (isDone) {
        streak++;
      } else {
        break; // Streak is broken
      }
    }
  }
  return streak;
};

// Calculate longest completed expected occurrences streak
export const calculateLongestHabitStreak = (habit, logs) => {
  const todayStr = getTodayDateString();
  const startDate = new Date(habit.created_at.split('T')[0] + 'T12:00:00');
  const today = new Date(todayStr + 'T12:00:00');
  
  const expectedDates = [];
  const current = new Date(startDate);
  
  while (current <= today) {
    const curStr = formatLocalDateString(current);
    if (isHabitExpectedOnDate(habit, curStr)) {
      expectedDates.push(curStr);
    }
    current.setDate(current.getDate() + 1);
  }
  
  const completedDates = new Set(
    logs.filter(l => l.habit_id === habit.id && l.completed).map(l => l.date)
  );
  
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (let i = 0; i < expectedDates.length; i++) {
    const date = expectedDates[i];
    const isDone = completedDates.has(date);
    
    if (isDone) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      if (date !== todayStr) {
        currentStreak = 0;
      }
    }
  }
  return maxStreak;
};

// Aggregate completion percentage over a custom date range
export const calculateWeeklyHabitCompletion = (habits, logs, startDateStr, endDateStr) => {
  let expectedCount = 0;
  let completedCount = 0;

  const start = new Date(startDateStr + 'T12:00:00');
  const end = new Date(endDateStr + 'T12:00:00');
  
  const datesInRange = [];
  const current = new Date(start);
  while (current <= end) {
    datesInRange.push(formatLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }

  const activeHabits = habits.filter(h => h.is_active);

  datesInRange.forEach(dateStr => {
    activeHabits.forEach(habit => {
      if (isHabitExpectedOnDate(habit, dateStr)) {
        expectedCount++;
        const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
        if (log && log.completed) {
          completedCount++;
        }
      }
    });
  });

  if (expectedCount === 0) return 0;
  return Math.round((completedCount / expectedCount) * 100);
};

// Count total missed occurrences for active habits
export const calculateMissedHabits = (habits, logs) => {
  const todayStr = getTodayDateString();
  let missedCount = 0;

  const activeHabits = habits.filter(h => h.is_active);

  activeHabits.forEach(habit => {
    const startDate = new Date(habit.created_at.split('T')[0] + 'T12:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    const current = new Date(startDate);
    while (current <= yesterday) {
      const dateStr = formatLocalDateString(current);
      if (isHabitExpectedOnDate(habit, dateStr)) {
        const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
        if (!log || !log.completed) {
          missedCount++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
  });

  return missedCount;
};

// Habit Operations Service wrappers
export const habitService = {
  list: async (userId) => {
    return repo.habits.list(userId);
  },

  create: async (userId, data) => {
    if (!data.title || !data.title.trim()) {
      throw new Error('Habit title is required.');
    }
    const payload = {
      title: data.title.trim(),
      frequency_type: data.frequency_type || 'daily',
      frequency_interval: Number(data.frequency_interval) || 1,
      frequency_days: data.frequency_days || null,
      is_active: data.is_active !== undefined ? !!data.is_active : true
    };
    return repo.habits.create(userId, payload);
  },

  update: async (id, data) => {
    if (data.title !== undefined && (!data.title || !data.title.trim())) {
      throw new Error('Habit title is required.');
    }
    const payload = { ...data };
    if (data.title) payload.title = data.title.trim();
    return repo.habits.update(id, payload);
  },

  delete: async (id) => {
    return repo.habits.delete(id);
  },

  toggleLog: async (userId, habitId, date, completed) => {
    const result = await repo.habitLogs.toggleLog(userId, habitId, date, completed);

    if (completed) {
      try {
        await awardXP(userId, 5, `habit_completed_${habitId}_${date}`);
        await evaluateAchievements(userId);

        // Fetch updated streak count to evaluate streak milestones
        const profile = await repo.profiles.get(userId);
        if (profile?.streak) {
          await evaluateStreakMilestones(userId, profile.streak);
        }
      } catch (e) {
        console.error('Failed to trigger habit gamification:', e);
      }
    }

    return result;
  },

  listLogsForWeek: async (userId, startDate, endDate) => {
    return repo.habitLogs.listForWeek(userId, startDate, endDate);
  }
};
