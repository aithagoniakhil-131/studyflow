// Centralised Calculation Service for StudyFlow Dashboard & Analytics

// Date Helpers
const getStartAndEndOfWeek = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  // Adjust so week starts on Monday
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(current.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const formatLocalDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 1. Task Progress
export const calculateTaskProgress = (tasks, dateStr) => {
  const targetDate = dateStr || getTodayDateString();
  const todayTasks = tasks.filter(t => t.due_date === targetDate && t.status !== 'cancelled');
  
  if (todayTasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  const completed = todayTasks.filter(t => t.status === 'completed').length;
  const total = todayTasks.length;
  const percentage = Math.round((completed / total) * 100);
  
  return { completed, total, percentage };
};

// 2. Today's Workload (Light: 0-119, Moderate: 120-300, Heavy: >300 mins)
export const calculateWorkload = (tasks, dateStr) => {
  const targetDate = dateStr || getTodayDateString();
  const activeTasks = tasks.filter(t => t.due_date === targetDate && t.status !== 'cancelled');
  
  const totalMinutes = activeTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let category = 'Light';
  if (totalMinutes >= 120 && totalMinutes <= 300) {
    category = 'Moderate';
  } else if (totalMinutes > 300) {
    category = 'Heavy';
  }
  
  const display = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return { totalMinutes, hours, minutes, display, category };
};

// 3. Weekly Workload (estimated minutes by day)
export const calculateWeeklyWorkload = (tasks) => {
  const { start } = getStartAndEndOfWeek(new Date());
  const dailyWorkload = [];
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatLocalDateString(d);
    
    const dayTasks = tasks.filter(t => t.due_date === dateStr && t.status !== 'cancelled');
    const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const hours = Number((totalMinutes / 60).toFixed(1)); // Express in hours for chart height
    
    dailyWorkload.push({
      day: weekdays[i],
      minutes: totalMinutes,
      hours,
      display: totalMinutes > 0 ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : '0m'
    });
  }

  return dailyWorkload;
};

// 4. Discipline Score (weights: 40% Tasks, 30% Habits, 20% Focus, 10% On-Time over rolling 14-day period)
export const calculateDisciplineScore = (tasks = [], habits = [], habitLogs = [], studySessions = [], focusTarget = 10) => {
  const today = new Date();
  const todayStr = formatLocalDateString(today);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 13);
  const startStr = formatLocalDateString(fourteenDaysAgo);

  // A. Task Consistency (40%)
  const scheduledTasks = tasks.filter(t => 
    t.due_date >= startStr && 
    t.due_date <= todayStr && 
    t.status !== 'cancelled'
  );
  let taskConsistency = 0;
  if (scheduledTasks.length > 0) {
    const completedTasks = scheduledTasks.filter(t => t.status === 'completed').length;
    taskConsistency = (completedTasks / scheduledTasks.length) * 100;
  }

  // B. Habit Consistency (30%)
  let expectedOccurrences = 0;
  habits.forEach(habit => {
    if (habit.is_active === false) return;
    const habitCreatedStr = (habit.created_at || '').split('T')[0] || startStr;
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(fourteenDaysAgo.getDate() + i);
      const curStr = formatLocalDateString(d);
      if (curStr < habitCreatedStr || curStr > todayStr) continue;

      if (habit.frequency_type === 'daily') {
        expectedOccurrences++;
      } else if (habit.frequency_type === 'selected_days') {
        const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        if ((habit.frequency_days || []).includes(daysMap[d.getDay()])) {
          expectedOccurrences++;
        }
      } else if (habit.frequency_type === 'weekly') {
        if (d.getDay() === 0) expectedOccurrences++;
      }
    }
  });

  const periodLogs = habitLogs.filter(log => 
    log.date >= startStr && 
    log.date <= todayStr && 
    log.completed
  );
  const completedOccurrences = periodLogs.length;

  let habitConsistency = 0;
  if (expectedOccurrences > 0) {
    habitConsistency = Math.min(100, (completedOccurrences / expectedOccurrences) * 100);
  }

  // C. Focus Consistency (20% - Baseline 10 completed focus sessions in 14 days)
  const periodFocusSessions = studySessions.filter(s => {
    if (!s.started_at || s.session_type !== 'focus' || !s.completed) return false;
    const sessionDate = s.started_at.split('T')[0];
    return sessionDate >= startStr && sessionDate <= todayStr;
  });

  const targetSessions = focusTarget || 10;
  const focusConsistency = Math.min(100, (periodFocusSessions.length / targetSessions) * 100);

  // D. On-Time Completion (10%)
  const completedInPeriod = tasks.filter(t => 
    t.status === 'completed' && 
    t.due_date && 
    t.due_date >= startStr && 
    t.due_date <= todayStr
  );
  let onTimeCompletion = 0;
  if (completedInPeriod.length > 0) {
    const onTimeCount = completedInPeriod.filter(t => {
      if (!t.completed_at || !t.due_date) return true;
      const dueDateTimeStr = `${t.due_date}T${t.due_time || '23:59:59'}`;
      return new Date(t.completed_at) <= new Date(dueDateTimeStr);
    }).length;
    onTimeCompletion = (onTimeCount / completedInPeriod.length) * 100;
  }

  const finalScore = Math.round(
    (taskConsistency * 0.40) +
    (habitConsistency * 0.30) +
    (focusConsistency * 0.20) +
    (onTimeCompletion * 0.10)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    taskConsistency: Math.round(taskConsistency),
    habitConsistency: Math.round(habitConsistency),
    focusConsistency: Math.round(focusConsistency),
    onTimeCompletion: Math.round(onTimeCompletion),
    expectedOccurrences,
    completedOccurrences,
    focusSessionsCount: periodFocusSessions.length,
    weeklyFocusTarget: targetSessions
  };
};

// 5. Weekly Study Hours (hours by day)
export const calculateWeeklyStudyHours = (studySessions = []) => {
  const { start } = getStartAndEndOfWeek(new Date());
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dailyHours = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatLocalDateString(d);

    const daySessions = studySessions.filter(s => {
      if (!s.started_at || s.session_type !== 'focus' || (s.duration_seconds || 0) < 10) return false;
      return s.started_at.split('T')[0] === dateStr;
    });

    const totalSeconds = daySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const hours = Number((totalSeconds / 3600).toFixed(1));

    dailyHours.push({
      name: weekdays[i],
      hours: hours,
      label: hours > 0 ? `${hours}h` : '0h'
    });
  }

  return dailyHours;
};

// 6. Subject Study Distribution
export const calculateSubjectStudyDistribution = (studySessions = []) => {
  const subjectTotals = {};
  
  studySessions.forEach(s => {
    if (s.session_type !== 'focus' || (s.duration_seconds || 0) < 10) return;
    const subject = s.subject || 'General';
    subjectTotals[subject] = (subjectTotals[subject] || 0) + (s.duration_seconds || 0);
  });

  return Object.entries(subjectTotals).map(([subject, seconds]) => {
    const totalMinutes = Math.round(seconds / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    return {
      subject,
      minutes: totalMinutes,
      display: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
    };
  }).sort((a, b) => b.minutes - a.minutes);
};

// 7. Get Upcoming Exams
export const getUpcomingExams = (exams) => {
  const todayStr = getTodayDateString();
  const activeExams = exams.filter(e => e.date >= todayStr);
  
  return activeExams.map(exam => {
    const examDate = new Date(`${exam.date}T${exam.time || '00:00:00'}`);
    const today = new Date();
    
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let countdown = '';
    if (diffDays === 0) {
      countdown = 'Today';
    } else if (diffDays === 1) {
      countdown = 'Tomorrow';
    } else {
      countdown = `In ${diffDays} days`;
    }
    
    return {
      ...exam,
      daysLeft: diffDays,
      countdown
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
};

// 8. Get Upcoming Deadlines
export const getUpcomingDeadlines = (tasks) => {
  const todayStr = getTodayDateString();
  const activeTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.due_date >= todayStr
  );

  return activeTasks.map(task => {
    const taskDate = new Date(`${task.due_date}T${task.due_time || '23:59:59'}`);
    const today = new Date();
    
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let countdown = '';
    if (diffDays === 0) {
      countdown = 'Today';
    } else if (diffDays === 1) {
      countdown = 'Tomorrow';
    } else {
      countdown = `In ${diffDays} days`;
    }

    return {
      ...task,
      daysLeft: diffDays,
      countdown
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
};
