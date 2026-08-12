import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabase } from '../services/supabaseDb';
import { repo } from '../services/repo';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabase) {
          // Supabase Session Fetching
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
            const prof = await repo.profiles.get(session.user.id);
            setProfile(prof);
          }
          
          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              setUser(session.user);
              const prof = await repo.profiles.get(session.user.id);
              setProfile(prof);
            } else {
              setUser(null);
              setProfile(null);
            }
            setLoading(false);
          });
          
          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // LocalStorage Mock Auth Session Fetching
          const localSession = localStorage.getItem('studyflow_session');
          if (localSession) {
            const parsedSession = JSON.parse(localSession);
            setUser(parsedSession.user);
            const prof = await repo.profiles.get(parsedSession.user.id);
            setProfile(prof);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const studentIdToEmail = (studentId) => {
    if (!studentId) return '';
    const trimmed = studentId.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@studyflow.internal`;
  };

  const login = async (studentId, password) => {
    setLoading(true);
    try {
      const email = studentIdToEmail(studentId);
      if (isSupabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        setUser(data.user);
        
        // Safe profile query - auto-creates profile if missing (first login fallback)
        let prof = await repo.profiles.get(data.user.id);
        if (!prof) {
          prof = await repo.profiles.create(data.user.id, {
            student_id: studentId.trim().toLowerCase(),
            name: studentId,
            university: '',
            degree: '',
            branch: '',
            year: 1,
            semester: 1
          });
          
          await repo.settings.update(data.user.id, {
            sound_enabled: true,
            sound_volume: 0.5,
            pomodoro_focus: 25,
            pomodoro_short_break: 5,
            pomodoro_long_break: 15,
            pomodoro_sessions_count: 4,
            auto_start_breaks: false,
            auto_start_focus: false,
            weekly_focus_target: 10
          });
        }
        
        setProfile(prof);
        return { user: data.user, profile: prof };
      } else {
        // Simulate LocalStorage login
        const users = JSON.parse(localStorage.getItem('studyflow_users') || '[]');
        let localUser = users.find(u => u.email === email);
        
        if (!localUser) {
          localUser = { id: 'mock-user-id', email };
        } else if (localUser.password !== password) {
          throw new Error('Invalid User ID or password');
        }

        const session = { user: { id: localUser.id, email: localUser.email } };
        localStorage.setItem('studyflow_session', JSON.stringify(session));
        setUser(session.user);

        // Fetch or create profile
        let prof = await repo.profiles.get(localUser.id);
        if (!prof) {
          prof = await repo.profiles.create(localUser.id, {
            student_id: studentId.trim().toLowerCase(),
            name: studentId,
            university: '',
            degree: '',
            branch: '',
            year: 1,
            semester: 1
          });
          
          const settingsList = JSON.parse(localStorage.getItem('studyflow_user_settings') || '[]');
          if (!settingsList.some(s => s.user_id === localUser.id)) {
            settingsList.push({
              user_id: localUser.id,
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
            });
            localStorage.setItem('studyflow_user_settings', JSON.stringify(settingsList));
          }
        }

        setProfile(prof);
        return { user: session.user, profile: prof };
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (studentId, password) => {
    setLoading(true);
    try {
      const email = studentIdToEmail(studentId);
      const cleanStudentId = studentId.trim().toLowerCase();
      
      if (isSupabase) {
        // Uniquely verify Student ID is available in profiles
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', cleanStudentId)
          .maybeSingle();
          
        if (existingProf) {
          throw new Error('Student ID is already registered.');
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        setUser(data.user);

        // Immediately insert matching profile record linked to auth id
        const prof = await repo.profiles.create(data.user.id, {
          student_id: cleanStudentId,
          name: studentId,
          university: '',
          degree: '',
          branch: '',
          year: 1,
          semester: 1
        });

        // Initialize user settings
        await repo.settings.update(data.user.id, {
          sound_enabled: true,
          sound_volume: 0.5,
          pomodoro_focus: 25,
          pomodoro_short_break: 5,
          pomodoro_long_break: 15,
          pomodoro_sessions_count: 4,
          auto_start_breaks: false,
          auto_start_focus: false,
          weekly_focus_target: 10
        });

        setProfile(prof);
        return { user: data.user, profile: prof };
      } else {
        // Simulate LocalStorage signup
        const users = JSON.parse(localStorage.getItem('studyflow_users') || '[]');
        if (users.some(u => u.email === email)) {
          throw new Error('Student ID is already registered.');
        }

        const newId = crypto.randomUUID();
        const newUser = { id: newId, email, password };
        users.push(newUser);
        localStorage.setItem('studyflow_users', JSON.stringify(users));

        const session = { user: { id: newId, email } };
        localStorage.setItem('studyflow_session', JSON.stringify(session));
        setUser(session.user);

        const prof = await repo.profiles.create(newId, {
          student_id: cleanStudentId,
          name: studentId,
          university: '',
          degree: '',
          branch: '',
          year: 1,
          semester: 1
        });

        const settingsList = JSON.parse(localStorage.getItem('studyflow_user_settings') || '[]');
        settingsList.push({
          user_id: newId,
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
        });
        localStorage.setItem('studyflow_user_settings', JSON.stringify(settingsList));

        setProfile(prof);
        return { user: session.user, profile: prof };
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isSupabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        localStorage.removeItem('studyflow_session');
      }
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onboard = async (onboardingData) => {
    if (!user) throw new Error('No user is currently authenticated');
    try {
      const updatedProfile = await repo.profiles.update(user.id, onboardingData);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const prof = await repo.profiles.get(user.id);
      setProfile(prof);
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    onboard,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
