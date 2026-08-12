import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { repo } from '../services/repo';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  
  const defaultSettings = {
    sound_enabled: true,
    sound_volume: 0.5,
    pomodoro_focus: 25,
    pomodoro_short_break: 5,
    pomodoro_long_break: 15,
    pomodoro_sessions_count: 4,
    auto_start_breaks: false,
    auto_start_focus: false,
    weekly_focus_target: 10
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings once user state is resolved
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings({ ...defaultSettings, motivation_style: 'Random' });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        let userSettings = await repo.settings.get(user.id);
        if (!userSettings) {
          userSettings = await repo.settings.update(user.id, defaultSettings);
        }
        
        const localStyle = localStorage.getItem(`motivation_style_${user.id}`) || 'Random';
        setSettings({
          ...userSettings,
          motivation_style: localStyle
        });
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (updates) => {
    if (!user) return false;
    try {
      const { motivation_style, ...dbUpdates } = updates;
      let updatedSettings = { ...settings };

      if (Object.keys(dbUpdates).length > 0) {
        const updatedDb = await repo.settings.update(user.id, dbUpdates);
        updatedSettings = { ...updatedSettings, ...updatedDb };
      }

      if (motivation_style !== undefined) {
        localStorage.setItem(`motivation_style_${user.id}`, motivation_style);
        updatedSettings.motivation_style = motivation_style;
      }

      setSettings(updatedSettings);
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
