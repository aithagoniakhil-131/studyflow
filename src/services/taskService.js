import { repo } from './repo';
import { awardXP, evaluateAchievements } from './gamificationEngine';

// Centralised constants for Task Categories
export const TASK_CATEGORIES = [
  'Study',
  'Assignment',
  'Project',
  'Exam Preparation',
  'Lab',
  'Revision',
  'Reading',
  'Other'
];

// Helper to determine if a task is overdue
export const isTaskOverdue = (task) => {
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  if (!task.due_date) return false;
  
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (task.due_date < todayStr) return true;
  
  // If due date is today, check if due time has passed
  if (task.due_date === todayStr && task.due_time) {
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    return task.due_time < nowTime;
  }
  
  return false;
};

// Calculate next occurrence date for recurring tasks
export const calculateNextOccurrence = (task) => {
  if (!task.recurring || !task.due_date) return null;

  const currentDueDate = new Date(task.due_date + 'T12:00:00'); // Mid-day avoids timezone drift
  const interval = task.repeat_interval || 1;
  const nextDate = new Date(currentDueDate);

  if (task.repeat_type === 'daily') {
    nextDate.setDate(currentDueDate.getDate() + interval);
  } else if (task.repeat_type === 'weekly') {
    nextDate.setDate(currentDueDate.getDate() + 7 * interval);
  } else if (task.repeat_type === 'selected_days') {
    const activeDays = task.repeat_days || [];
    if (activeDays.length === 0) return null;

    const weekdayMap = {
      0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
    };

    let found = false;
    // Check up to 30 days ahead to find the next valid weekday occurrence
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(currentDueDate);
      checkDate.setDate(currentDueDate.getDate() + i);
      const dayName = weekdayMap[checkDate.getDay()];
      
      if (activeDays.includes(dayName)) {
        nextDate.setTime(checkDate.getTime());
        found = true;
        break;
      }
    }
    if (!found) return null;
  } else {
    return null;
  }

  // Format as YYYY-MM-DD
  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextDate.getDate()).padStart(2, '0');
  const nextDateStr = `${yyyy}-${mm}-${dd}`;

  // Enforce repeat_until boundaries
  if (task.repeat_until && nextDateStr > task.repeat_until) {
    return null;
  }

  return nextDateStr;
};

// Task Operations Service Interface
export const taskService = {
  list: async (userId) => {
    return repo.tasks.list(userId);
  },

  get: async (id) => {
    return repo.tasks.get(id);
  },

  create: async (userId, data) => {
    // Validate inputs
    if (!data.title || !data.title.trim()) {
      throw new Error('Task title is required.');
    }
    if (data.estimated_minutes !== undefined && Number(data.estimated_minutes) < 0) {
      throw new Error('Estimated duration must be greater than or equal to 0.');
    }
    
    // Validate URLs if provided
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (data.video_url && !urlPattern.test(data.video_url)) {
      throw new Error('Please enter a valid YouTube URL.');
    }
    if (data.resource_url && !urlPattern.test(data.resource_url)) {
      throw new Error('Please enter a valid Resource URL.');
    }

    const payload = {
      title: data.title.trim(),
      description: data.description || '',
      subject: data.subject || 'General',
      category: data.category || 'Study',
      priority: data.priority || 'medium',
      status: 'pending',
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      due_time: data.due_time || '',
      estimated_minutes: Number(data.estimated_minutes) || 0,
      recurring: !!data.recurring,
      repeat_type: data.recurring ? (data.repeat_type || 'daily') : null,
      repeat_interval: data.recurring ? (Number(data.repeat_interval) || 1) : 1,
      repeat_days: data.recurring && data.repeat_type === 'selected_days' ? (data.repeat_days || []) : null,
      repeat_until: data.recurring ? (data.repeat_until || null) : null,
      notes: data.notes || '',
      video_url: data.video_url || '',
      resource_url: data.resource_url || '',
      exam_id: data.exam_id || null
    };

    return repo.tasks.create(userId, payload);
  },

  update: async (id, data) => {
    if (data.title !== undefined && (!data.title || !data.title.trim())) {
      throw new Error('Task title is required.');
    }
    if (data.estimated_minutes !== undefined && Number(data.estimated_minutes) < 0) {
      throw new Error('Estimated duration must be greater than or equal to 0.');
    }
    
    // Validate URLs if provided
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (data.video_url && !urlPattern.test(data.video_url)) {
      throw new Error('Please enter a valid YouTube URL.');
    }
    if (data.resource_url && !urlPattern.test(data.resource_url)) {
      throw new Error('Please enter a valid Resource URL.');
    }

    const payload = { ...data };
    if (data.title) payload.title = data.title.trim();
    
    return repo.tasks.update(id, payload);
  },

  delete: async (id) => {
    return repo.tasks.delete(id);
  },

  complete: async (taskId) => {
    const task = await repo.tasks.get(taskId);
    if (!task) throw new Error('Task not found.');

    const now = new Date().toISOString();
    
    // 1. Mark current task as completed
    const completedTask = await repo.tasks.update(taskId, {
      status: 'completed',
      completed_at: now
    });

    // 2. Award XP idempotently based on task criteria
    try {
      let xp = 10; // Standard task
      if (task.priority === 'high') xp = 15; // High priority task
      const todayStr = new Date().toISOString().split('T')[0];
      if (task.due_date && task.due_date < todayStr) xp = 15; // Overdue comeback task
      if (task.exam_id) xp = 15; // Exam preparation task

      await awardXP(task.user_id, xp, `task_completed_${task.id}`);
      await evaluateAchievements(task.user_id);
    } catch (e) {
      console.error('Failed to trigger task gamification:', e);
    }

    // 3. Handle recurrence generation
    if (task.recurring) {
      const nextDate = calculateNextOccurrence(task);
      if (nextDate) {
        const nextOccurrencePayload = {
          title: task.title,
          description: task.description,
          subject: task.subject,
          category: task.category,
          priority: task.priority,
          status: 'pending',
          due_date: nextDate,
          due_time: task.due_time,
          estimated_minutes: task.estimated_minutes,
          recurring: true,
          repeat_type: task.repeat_type,
          repeat_interval: task.repeat_interval,
          repeat_days: task.repeat_days,
          repeat_until: task.repeat_until,
          notes: task.notes,
          video_url: task.video_url,
          resource_url: task.resource_url
        };
        await repo.tasks.create(task.user_id, nextOccurrencePayload);
      }
    }

    return completedTask;
  },

  uncomplete: async (taskId) => {
    return repo.tasks.update(taskId, {
      status: 'pending',
      completed_at: null
    });
  },

  cancel: async (taskId) => {
    return repo.tasks.update(taskId, {
      status: 'cancelled',
      completed_at: null
    });
  }
};
