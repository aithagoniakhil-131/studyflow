// Unified Repository Selector for StudyFlow
import { supabase, supabaseDb } from './supabaseDb';
import { localStorageDb, initLocalStorageDb } from './localStorageDb';

// Pre-initialize localstorage databases for development/offline modes
initLocalStorageDb();

// Detect active storage driver
export const isSupabase = !!supabase;
const driver = isSupabase ? supabaseDb : localStorageDb;

console.log(
  isSupabase
    ? 'StudyFlow: Supabase credentials found. Running in live cloud mode.'
    : 'StudyFlow: Supabase keys not set. Running in offline LocalStorage fallback mode.'
);

// Unified Export Interface
export const repo = {
  isSupabase,
  profiles: driver.profiles,
  settings: driver.settings,
  tasks: driver.tasks,
  resources: driver.resources,
  taskResources: driver.taskResources,
  weeklyGoals: driver.weeklyGoals,
  habits: driver.habits,
  habitLogs: driver.habitLogs,
  subtasks: driver.subtasks,
  exams: driver.exams,
  studySessions: driver.studySessions,
  semesterGoals: driver.semesterGoals,
  achievements: driver.achievements,
  notifications: driver.notifications
};
