// Supabase Driver for StudyFlow (Production Engine)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Safe initialization of client
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabase = !!supabase;

// Supabase DB operations reflecting schema and RLS policies
export const supabaseDb = {
  profiles: {
    get: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    create: async (id, data) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: inserted, error } = await supabase
        .from('profiles')
        .insert({
          id,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  settings: {
    get: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    update: async (userId, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  tasks: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (userId, taskData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  resources: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (userId, resData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('resources')
        .insert({
          user_id: userId,
          ...resData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  taskResources: {
    listForTask: async (taskId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('task_resources')
        .select('resources(*)')
        .eq('task_id', taskId);
      if (error) throw error;
      return data.map(item => item.resources).filter(Boolean);
    },
    listForResource: async (resId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('task_resources')
        .select('tasks(*)')
        .eq('resource_id', resId);
      if (error) throw error;
      return data.map(item => item.tasks).filter(Boolean);
    },
    link: async (taskId, resId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('task_resources')
        .insert({ task_id: taskId, resource_id: resId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    unlink: async (taskId, resId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('task_resources')
        .delete()
        .eq('task_id', taskId)
        .eq('resource_id', resId);
      if (error) throw error;
      return true;
    }
  },

  weeklyGoals: {
    list: async (userId, weekStart) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart);
      if (error) throw error;
      return data;
    },
    create: async (userId, title, weekStart) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('weekly_goals')
        .insert({
          user_id: userId,
          title,
          week_start: weekStart,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, completed) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('weekly_goals')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('weekly_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  habits: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    create: async (userId, habitData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          ...habitData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('habits')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  habitLogs: {
    listForWeek: async (userId, startDate, endDate) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      return data;
    },
    toggleLog: async (userId, habitId, date, completed) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!completed) {
        // Delete log if unchecked
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .eq('date', date);
        if (error) throw error;
        return null;
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .upsert({
            user_id: userId,
            habit_id: habitId,
            date,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  },

  subtasks: {
    list: async (taskId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
    create: async (taskId, userId, title) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          user_id: userId,
          title,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('subtasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  exams: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    create: async (userId, examData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('exams')
        .insert({
          user_id: userId,
          ...examData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('exams')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  studySessions: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    create: async (userId, sessionData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          ...sessionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  semesterGoals: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('semester_goals')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    create: async (userId, goalData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('semester_goals')
        .insert({
          user_id: userId,
          ...goalData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('semester_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('semester_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  achievements: {
    listMaster: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('achievements')
        .select('*');
      if (error) throw error;
      return data;
    },
    listUnlocked: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(item => ({
        ...item.achievements,
        unlocked_at: item.unlocked_at
      })).filter(Boolean);
    },
    unlock: async (userId, achievementId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  notifications: {
    list: async (userId) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    create: async (userId, title, message, type) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: type || 'info',
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    markRead: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  }
};
