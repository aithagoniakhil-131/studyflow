// LocalStorage Driver for StudyFlow (Development & Offline Fallback)

const DB_PREFIX = 'studyflow_';

// Helper to get from local storage
const getTable = (name) => {
  const data = localStorage.getItem(`${DB_PREFIX}${name}`);
  return data ? JSON.parse(data) : [];
};

// Helper to set to local storage
const setTable = (name, data) => {
  localStorage.setItem(`${DB_PREFIX}${name}`, JSON.stringify(data));
};

// Seed Achievements
const SEED_ACHIEVEMENTS = [
  {
    id: 'ach-01',
    achievement_key: 'first_task',
    title: 'First Step',
    description: 'Complete your first task',
    xp_reward: 50,
    badge_icon: 'CheckCircle',
    requirement_type: 'tasks_completed',
    requirement_value: 1
  },
  {
    id: 'ach-02',
    achievement_key: 'first_focus',
    title: 'Laser Focus',
    description: 'Complete your first Pomodoro focus session',
    xp_reward: 100,
    badge_icon: 'Flame',
    requirement_type: 'focus_sessions',
    requirement_value: 1
  },
  {
    id: 'ach-03',
    achievement_key: 'streak_7',
    title: 'Week of Fire',
    description: 'Maintain a 7-day study streak',
    xp_reward: 250,
    badge_icon: 'Zap',
    requirement_type: 'streak_days',
    requirement_value: 7
  },
  {
    id: 'ach-04',
    achievement_key: 'focus_25',
    title: 'Pomodoro Master',
    description: 'Complete 25 focus sessions',
    xp_reward: 500,
    badge_icon: 'Award',
    requirement_type: 'focus_sessions',
    requirement_value: 25
  },
  {
    id: 'ach-05',
    achievement_key: 'tasks_100',
    title: 'Task Destroyer',
    description: 'Complete 100 tasks',
    xp_reward: 1000,
    badge_icon: 'ShieldAlert',
    requirement_type: 'tasks_completed',
    requirement_value: 100
  }
];

// Seed Resources
const SEED_RESOURCES = [
  {
    id: 'res-01',
    user_id: 'mock-user-id',
    title: 'Linear Algebra One Shot',
    description: 'Comprehensive review of eigenvalues, eigenvectors, and transformations.',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=JnTa9XyV7d8',
    subject: 'Mathematics',
    topic: 'Linear Algebra',
    thumbnail_url: 'https://img.youtube.com/vi/JnTa9XyV7d8/0.jpg',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'res-02',
    user_id: 'mock-user-id',
    title: 'DSA Roadmap & Practice',
    description: 'Professor Recommended list of practice problems and cheat sheet.',
    type: 'website',
    url: 'https://example.com/dsa-cheat-sheet',
    subject: 'Programming',
    topic: 'Data Structures',
    thumbnail_url: '',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Seed Tasks
const SEED_TASKS = [
  {
    id: 'task-01',
    user_id: 'mock-user-id',
    title: 'Revise Linear Algebra Eigenvalues',
    description: 'Review lecture notes and complete practice worksheet.',
    subject: 'Mathematics',
    category: 'Study',
    priority: 'high',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0], // Today
    due_time: '19:30',
    estimated_minutes: 45,
    recurring: false,
    notes: 'Focus on diagonalizability proofs.',
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task-02',
    user_id: 'mock-user-id',
    title: 'Complete DSA Lab Report',
    description: 'Write up stack and queue implementations in C++.',
    subject: 'Programming',
    category: 'Assignment',
    priority: 'medium',
    status: 'pending',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    due_time: '09:00',
    estimated_minutes: 120,
    recurring: false,
    notes: 'Submit PDF to portal.',
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task-03',
    user_id: 'mock-user-id',
    title: 'Physics Lab Record Prep',
    description: 'Plot spectrometer calibration curve.',
    subject: 'Physics',
    category: 'Project',
    priority: 'low',
    status: 'completed',
    due_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().split('T')[0], // Completed today
    due_time: '14:15',
    estimated_minutes: 60,
    recurring: false,
    notes: 'Verify focal length calculations.',
    completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Seed Habits
const SEED_HABITS = [
  {
    id: 'habit-01',
    user_id: 'mock-user-id',
    title: 'No Phone During Study',
    frequency_type: 'daily',
    frequency_interval: 1,
    frequency_days: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'habit-02',
    user_id: 'mock-user-id',
    title: 'Revise Core Concept',
    frequency_type: 'selected_days',
    frequency_interval: 1,
    frequency_days: ['mon', 'wed', 'fri'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Seed Habits Logs
const getMockHabitLogs = () => {
  const logs = [];
  const today = new Date();
  const format = (d) => d.toISOString().split('T')[0];

  // Populate logs for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    
    // habit 1 (daily) - log completed 80% of the time
    if (i !== 2 && i !== 5) {
      logs.push({
        id: `hlog-01-${i}`,
        user_id: 'mock-user-id',
        habit_id: 'habit-01',
        date: format(d),
        completed: true,
        created_at: d.toISOString(),
        updated_at: d.toISOString()
      });
    }
    
    // habit 2 (mon, wed, fri)
    if (['mon', 'wed', 'fri'].includes(dayStr)) {
      logs.push({
        id: `hlog-02-${i}`,
        user_id: 'mock-user-id',
        habit_id: 'habit-02',
        date: format(d),
        completed: i !== 1, // missed 1 occurrence
        created_at: d.toISOString(),
        updated_at: d.toISOString()
      });
    }
  }
  return logs;
};

// Initialize DB structure in LocalStorage if not present
export const initLocalStorageDb = () => {
  if (!localStorage.getItem(`${DB_PREFIX}initialized`)) {
    // 1. Set mock profile
    localStorage.setItem(`${DB_PREFIX}profiles`, JSON.stringify([{
      id: 'mock-user-id',
      name: 'Student',
      university: 'National Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: 3,
      semester: 5,
      career_goals: ['Learn Coding', 'Build Projects', 'Prepare for Placements'],
      academic_goals: ['Improve CGPA', 'Stay consistent', 'Revise regularly'],
      avatar_url: '',
      xp: 120,
      streak: 12,
      longest_streak: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]));

    // 2. Set mock user settings
    localStorage.setItem(`${DB_PREFIX}user_settings`, JSON.stringify([{
      user_id: 'mock-user-id',
      sound_enabled: true,
      sound_volume: 0.5,
      pomodoro_focus: 25,
      pomodoro_short_break: 5,
      pomodoro_long_break: 15,
      pomodoro_sessions_count: 4,
      auto_start_breaks: false,
      auto_start_focus: false,
      weekly_focus_target: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]));

    // 3. Set Achievements master
    localStorage.setItem(`${DB_PREFIX}achievements`, JSON.stringify(SEED_ACHIEVEMENTS));
    
    // 4. Set unlocked user achievements
    localStorage.setItem(`${DB_PREFIX}user_achievements`, JSON.stringify([
      {
        id: 'uach-01',
        user_id: 'mock-user-id',
        achievement_id: 'ach-01',
        unlocked_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]));

    // 5. Seed other tables
    localStorage.setItem(`${DB_PREFIX}tasks`, JSON.stringify(SEED_TASKS));
    localStorage.setItem(`${DB_PREFIX}resources`, JSON.stringify(SEED_RESOURCES));
    localStorage.setItem(`${DB_PREFIX}task_resources`, JSON.stringify([
      {
        id: 'tr-01',
        task_id: 'task-01',
        resource_id: 'res-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));

    localStorage.setItem(`${DB_PREFIX}weekly_goals`, JSON.stringify([
      { id: 'wg-01', user_id: 'mock-user-id', week_start: getStartOfWeek(new Date()), title: 'Submit lab records', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'wg-02', user_id: 'mock-user-id', week_start: getStartOfWeek(new Date()), title: 'Solve 15 LeetCode questions', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]));

    localStorage.setItem(`${DB_PREFIX}habits`, JSON.stringify(SEED_HABITS));
    localStorage.setItem(`${DB_PREFIX}habit_logs`, JSON.stringify(getMockHabitLogs()));

    localStorage.setItem(`${DB_PREFIX}exams`, JSON.stringify([
      {
        id: 'exam-01',
        user_id: 'mock-user-id',
        subject: 'Computer Science',
        title: 'Data Structures Midterm',
        exam_type: 'Mid Semester',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        time: '09:00',
        location: 'LH-102',
        syllabus: ['Arrays & Linked Lists', 'Stacks & Queues', 'Trees & Graphs'],
        syllabus_completed: ['Arrays & Linked Lists'],
        notes: 'Covers 40% of overall grade.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));

    localStorage.setItem(`${DB_PREFIX}study_sessions`, JSON.stringify([
      {
        id: 'sess-01',
        user_id: 'mock-user-id',
        task_id: 'task-03',
        subject: 'Physics',
        duration_seconds: 1500, // 25 min
        session_type: 'focus',
        completed: true,
        started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'sess-02',
        user_id: 'mock-user-id',
        task_id: 'task-01',
        subject: 'Mathematics',
        duration_seconds: 1800, // 30 min
        session_type: 'focus',
        completed: true,
        started_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(Date.now() - 24.5 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));

    localStorage.setItem(`${DB_PREFIX}semester_goals`, JSON.stringify([
      {
        id: 'sg-01',
        user_id: 'mock-user-id',
        title: 'Maintain CGPA > 8.5',
        category: 'GPA',
        target: '8.5',
        current_progress: 8.3,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));

    localStorage.setItem(`${DB_PREFIX}notifications`, JSON.stringify([
      {
        id: 'notif-01',
        user_id: 'mock-user-id',
        title: 'Midterm Approaching',
        message: 'Your Data Structures Midterm is scheduled for tomorrow at 9:00 AM.',
        read: false,
        type: 'warning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));

    localStorage.setItem(`${DB_PREFIX}initialized`, 'true');
  }
};

// Date helpers
function getStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(date.setDate(diff));
  return start.toISOString().split('T')[0];
}

// LocalStorage CRUD Mock functions
export const localStorageDb = {
  // Profiles
  profiles: {
    get: async (id) => {
      const list = getTable('profiles');
      return list.find(p => p.id === id) || null;
    },
    create: async (id, data) => {
      const list = getTable('profiles');
      const newProfile = {
        id,
        name: data.name || '',
        university: data.university || '',
        degree: data.degree || '',
        branch: data.branch || '',
        year: Number(data.year) || 1,
        semester: Number(data.semester) || 1,
        career_goals: data.career_goals || [],
        academic_goals: data.academic_goals || [],
        avatar_url: data.avatar_url || '',
        xp: 0,
        streak: 0,
        longest_streak: 0,
        student_id: data.student_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newProfile);
      setTable('profiles', list);
      return newProfile;
    },
    update: async (id, data) => {
      const list = getTable('profiles');
      const index = list.findIndex(p => p.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
      setTable('profiles', list);
      return list[index];
    }
  },

  // User Settings
  settings: {
    get: async (userId) => {
      const list = getTable('user_settings');
      return list.find(s => s.user_id === userId) || null;
    },
    update: async (userId, data) => {
      const list = getTable('user_settings');
      const index = list.findIndex(s => s.user_id === userId);
      if (index === -1) {
        const newSettings = { user_id: userId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        list.push(newSettings);
        setTable('user_settings', list);
        return newSettings;
      }
      list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
      setTable('user_settings', list);
      return list[index];
    }
  },

  // Tasks
  tasks: {
    list: async (userId) => {
      return getTable('tasks').filter(t => t.user_id === userId);
    },
    get: async (id) => {
      return getTable('tasks').find(t => t.id === id) || null;
    },
    create: async (userId, data) => {
      const list = getTable('tasks');
      const newTask = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: data.title || 'Untitled Task',
        description: data.description || '',
        subject: data.subject || 'General',
        category: data.category || 'Study',
        priority: data.priority || 'low',
        status: data.status || 'pending',
        due_date: data.due_date || new Date().toISOString().split('T')[0],
        due_time: data.due_time || '',
        estimated_minutes: Number(data.estimated_minutes) || 0,
        recurring: !!data.recurring,
        repeat_type: data.repeat_type || null,
        repeat_interval: data.repeat_interval || 1,
        repeat_days: data.repeat_days || null,
        repeat_until: data.repeat_until || null,
        notes: data.notes || '',
        video_url: data.video_url || '',
        resource_url: data.resource_url || '',
        exam_id: data.exam_id || null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newTask);
      setTable('tasks', list);
      return newTask;
    },
    update: async (id, data) => {
      const list = getTable('tasks');
      const index = list.findIndex(t => t.id === id);
      if (index === -1) return null;
      
      const previous = list[index];
      const updated = {
        ...previous,
        ...data,
        completed_at: data.status === 'completed' && previous.status !== 'completed' ? new Date().toISOString() : (data.status === 'pending' || data.status === 'in_progress' ? null : previous.completed_at),
        updated_at: new Date().toISOString()
      };
      list[index] = updated;
      setTable('tasks', list);

      // Perform achievements checks on task completion
      if (updated.status === 'completed' && previous.status !== 'completed') {
        await checkAchievements(updated.user_id, 'tasks_completed');
      }
      return updated;
    },
    delete: async (id) => {
      const list = getTable('tasks');
      const filtered = list.filter(t => t.id !== id);
      setTable('tasks', filtered);
      
      // Clean up task resource associations
      const maps = getTable('task_resources');
      const remainingMaps = maps.filter(m => m.task_id !== id);
      setTable('task_resources', remainingMaps);
      return true;
    }
  },

  // Resources
  resources: {
    list: async (userId) => {
      return getTable('resources').filter(r => r.user_id === userId);
    },
    get: async (id) => {
      return getTable('resources').find(r => r.id === id) || null;
    },
    create: async (userId, data) => {
      const list = getTable('resources');
      const newRes = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: data.title || 'Untitled Resource',
        description: data.description || '',
        type: data.type || 'website',
        url: data.url || '',
        subject: data.subject || 'General',
        topic: data.topic || '',
        thumbnail_url: data.type === 'youtube' && data.url ? getYoutubeThumb(data.url) : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newRes);
      setTable('resources', list);
      return newRes;
    },
    update: async (id, data) => {
      const list = getTable('resources');
      const index = list.findIndex(r => r.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
      setTable('resources', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('resources');
      setTable('resources', list.filter(r => r.id !== id));
      
      // Clean up maps
      const maps = getTable('task_resources');
      setTable('task_resources', maps.filter(m => m.resource_id !== id));
      return true;
    }
  },

  // Task <-> Resource Many to Many
  taskResources: {
    listForTask: async (taskId) => {
      const maps = getTable('task_resources').filter(m => m.task_id === taskId);
      const resources = getTable('resources');
      return maps.map(m => resources.find(r => r.id === m.resource_id)).filter(Boolean);
    },
    listForResource: async (resId) => {
      const maps = getTable('task_resources').filter(m => m.resource_id === resId);
      const tasks = getTable('tasks');
      return maps.map(m => tasks.find(t => t.id === m.task_id)).filter(Boolean);
    },
    link: async (taskId, resId) => {
      const list = getTable('task_resources');
      // Avoid duplicate links
      if (list.some(m => m.task_id === taskId && m.resource_id === resId)) return true;
      const newMap = {
        id: crypto.randomUUID(),
        task_id: taskId,
        resource_id: resId,
        created_at: new Date().toISOString()
      };
      list.push(newMap);
      setTable('task_resources', list);
      return newMap;
    },
    unlink: async (taskId, resId) => {
      const list = getTable('task_resources');
      setTable('task_resources', list.filter(m => !(m.task_id === taskId && m.resource_id === resId)));
      return true;
    }
  },

  // Weekly Goals
  weeklyGoals: {
    list: async (userId, weekStart) => {
      return getTable('weekly_goals').filter(g => g.user_id === userId && g.week_start === weekStart);
    },
    create: async (userId, title, weekStart) => {
      const list = getTable('weekly_goals');
      const newGoal = {
        id: crypto.randomUUID(),
        user_id: userId,
        week_start: weekStart || getStartOfWeek(new Date()),
        title,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newGoal);
      setTable('weekly_goals', list);
      return newGoal;
    },
    update: async (id, completed) => {
      const list = getTable('weekly_goals');
      const index = list.findIndex(g => g.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], completed, updated_at: new Date().toISOString() };
      setTable('weekly_goals', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('weekly_goals');
      setTable('weekly_goals', list.filter(g => g.id !== id));
      return true;
    }
  },

  // Habits
  habits: {
    list: async (userId) => {
      return getTable('habits').filter(h => h.user_id === userId);
    },
    create: async (userId, data) => {
      const list = getTable('habits');
      const newHabit = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: data.title || 'New Habit',
        frequency_type: data.frequency_type || 'daily',
        frequency_interval: data.frequency_interval || 1,
        frequency_days: data.frequency_days || null,
        is_active: data.is_active !== undefined ? !!data.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newHabit);
      setTable('habits', list);
      return newHabit;
    },
    update: async (id, data) => {
      const list = getTable('habits');
      const index = list.findIndex(h => h.id === id);
      if (index === -1) return null;
      list[index] = { 
        ...list[index], 
        ...data, 
        updated_at: new Date().toISOString() 
      };
      setTable('habits', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('habits');
      setTable('habits', list.filter(h => h.id !== id));
      
      const logs = getTable('habit_logs');
      setTable('habit_logs', logs.filter(l => l.habit_id !== id));
      return true;
    }
  },

  // Habit Logs
  habitLogs: {
    listForWeek: async (userId, startDate, endDate) => {
      return getTable('habit_logs').filter(l => 
        l.user_id === userId && 
        l.date >= startDate && 
        l.date <= endDate
      );
    },
    toggleLog: async (userId, habitId, date, completed) => {
      const list = getTable('habit_logs');
      const index = list.findIndex(l => l.user_id === userId && l.habit_id === habitId && l.date === date);
      
      if (index !== -1) {
        if (!completed) {
          // Remove if toggled off
          list.splice(index, 1);
          setTable('habit_logs', list);
          return null;
        } else {
          list[index] = { ...list[index], completed: true, updated_at: new Date().toISOString() };
          setTable('habit_logs', list);
          return list[index];
        }
      } else if (completed) {
        const newLog = {
          id: crypto.randomUUID(),
          user_id: userId,
          habit_id: habitId,
          date,
          completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        list.push(newLog);
        setTable('habit_logs', list);
        return newLog;
      }
    }
  },

  // Subtasks
  subtasks: {
    list: async (taskId) => {
      return getTable('subtasks').filter(s => s.task_id === taskId);
    },
    create: async (taskId, userId, title) => {
      const list = getTable('subtasks');
      const newSub = {
        id: crypto.randomUUID(),
        task_id: taskId,
        user_id: userId,
        title: title || 'New Subtask',
        completed: false,
        position: list.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newSub);
      setTable('subtasks', list);
      return newSub;
    },
    update: async (id, updates) => {
      const list = getTable('subtasks');
      const index = list.findIndex(s => s.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
      setTable('subtasks', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('subtasks');
      setTable('subtasks', list.filter(s => s.id !== id));
      return true;
    }
  },

  // Exams
  exams: {
    list: async (userId) => {
      return getTable('exams').filter(e => e.user_id === userId);
    },
    create: async (userId, data) => {
      const list = getTable('exams');
      const newExam = {
        id: crypto.randomUUID(),
        user_id: userId,
        subject: data.subject || 'General',
        title: data.title || 'Quiz',
        exam_type: data.exam_type || 'Quiz',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '10:00',
        location: data.location || '',
        syllabus: data.syllabus || [],
        syllabus_completed: [],
        notes: data.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newExam);
      setTable('exams', list);
      return newExam;
    },
    update: async (id, data) => {
      const list = getTable('exams');
      const index = list.findIndex(e => e.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
      setTable('exams', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('exams');
      setTable('exams', list.filter(e => e.id !== id));
      return true;
    }
  },

  // Study Sessions
  studySessions: {
    list: async (userId) => {
      return getTable('study_sessions').filter(s => s.user_id === userId);
    },
    create: async (userId, data) => {
      const list = getTable('study_sessions');
      const newSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        task_id: data.task_id || null,
        subject: data.subject || 'General',
        duration_seconds: Number(data.duration_seconds) || 0,
        session_type: data.session_type || 'focus',
        completed: !!data.completed,
        started_at: data.started_at || new Date().toISOString(),
        ended_at: data.ended_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newSession);
      setTable('study_sessions', list);

      // Check achievements for focus sessions completed
      if (newSession.completed && newSession.session_type === 'focus') {
        await checkAchievements(userId, 'focus_sessions');
      }
      return newSession;
    }
  },

  // Semester Goals
  semesterGoals: {
    list: async (userId) => {
      return getTable('semester_goals').filter(g => g.user_id === userId);
    },
    create: async (userId, data) => {
      const list = getTable('semester_goals');
      const newGoal = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: data.title || '',
        category: data.category || 'General',
        target: String(data.target || ''),
        current_progress: Number(data.current_progress) || 0,
        deadline: data.deadline || '',
        status: data.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newGoal);
      setTable('semester_goals', list);
      return newGoal;
    },
    update: async (id, data) => {
      const list = getTable('semester_goals');
      const index = list.findIndex(g => g.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
      setTable('semester_goals', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('semester_goals');
      setTable('semester_goals', list.filter(g => g.id !== id));
      return true;
    }
  },

  // Achievements
  achievements: {
    listMaster: async () => {
      return getTable('achievements');
    },
    listUnlocked: async (userId) => {
      const userAch = getTable('user_achievements').filter(ua => ua.user_id === userId);
      const master = getTable('achievements');
      return userAch.map(ua => {
        const ach = master.find(m => m.id === ua.achievement_id);
        return ach ? { ...ach, unlocked_at: ua.unlocked_at } : null;
      }).filter(Boolean);
    },
    unlock: async (userId, achievementId) => {
      const list = getTable('user_achievements');
      const existing = list.find(ua => ua.user_id === userId && ua.achievement_id === achievementId);
      if (existing) return existing;
      const newUnlock = {
        id: crypto.randomUUID(),
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newUnlock);
      setTable('user_achievements', list);
      return newUnlock;
    }
  },

  // Notifications
  notifications: {
    list: async (userId) => {
      return getTable('notifications').filter(n => n.user_id === userId);
    },
    create: async (userId, title, message, type) => {
      const list = getTable('notifications');
      const newNotif = {
        id: crypto.randomUUID(),
        user_id: userId,
        title,
        message,
        read: false,
        type: type || 'info',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      list.push(newNotif);
      setTable('notifications', list);
      return newNotif;
    },
    markRead: async (id) => {
      const list = getTable('notifications');
      const index = list.findIndex(n => n.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], read: true, updated_at: new Date().toISOString() };
      setTable('notifications', list);
      return list[index];
    },
    delete: async (id) => {
      const list = getTable('notifications');
      setTable('notifications', list.filter(n => n.id !== id));
      return true;
    }
  }
};

// Helpers for YouTube URL
function getYoutubeThumb(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
  }
  return '';
}

// Achievements Check engine
async function checkAchievements(userId, reqType) {
  const profileList = getTable('profiles');
  const profile = profileList.find(p => p.id === userId);
  if (!profile) return;

  const unlocked = getTable('user_achievements').filter(ua => ua.user_id === userId);
  const master = getTable('achievements');
  
  // Get all achievements of correct type that have not yet been unlocked
  const candidates = master.filter(m => 
    m.requirement_type === reqType && 
    !unlocked.some(u => u.achievement_id === m.id)
  );

  let currentVal = 0;
  if (reqType === 'tasks_completed') {
    currentVal = getTable('tasks').filter(t => t.user_id === userId && t.status === 'completed').length;
  } else if (reqType === 'focus_sessions') {
    currentVal = getTable('study_sessions').filter(s => s.user_id === userId && s.session_type === 'focus' && s.completed).length;
  } else if (reqType === 'streak_days') {
    currentVal = profile.streak || 0;
  }

  const newUnlocks = [];
  for (const ach of candidates) {
    if (currentVal >= ach.requirement_value) {
      newUnlocks.push({
        id: crypto.randomUUID(),
        user_id: userId,
        achievement_id: ach.id,
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Reward XP
      profile.xp = (profile.xp || 0) + ach.xp_reward;
      
      // Send notification
      await localStorageDb.notifications.create(
        userId,
        'Achievement Unlocked!',
        `Congratulations! You unlocked the badge "${ach.title}" and earned ${ach.xp_reward} XP.`,
        'success'
      );
    }
  }

  if (newUnlocks.length > 0) {
    // Save unlocked achievements
    const list = getTable('user_achievements');
    list.push(...newUnlocks);
    setTable('user_achievements', list);

    // Save updated profiles
    const index = profileList.findIndex(p => p.id === userId);
    profileList[index] = { ...profile, updated_at: new Date().toISOString() };
    setTable('profiles', profileList);
  }
}
