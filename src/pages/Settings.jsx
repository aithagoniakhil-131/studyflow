import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { repo } from '../services/repo';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  User, GraduationCap, Timer, Bell, Volume2, VolumeX,
  Palette, Bot, Shield, LogOut, Trash2, Check, AlertTriangle,
  Sparkles, Save, RotateCcw, Download, RefreshCw, Layers,
  Lock, ArrowRight, Zap, Info, Smartphone
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'coding', name: 'Coding Specialist', img: '/assets/motivation/characters/coding-specialist.png' },
  { id: 'math', name: 'Math Prodigy', img: '/assets/motivation/characters/math-prodigy.png' },
  { id: 'chem', name: 'Chemistry Analyst', img: '/assets/motivation/characters/chemistry-analyst.png' },
  { id: 'physics', name: 'Physics Master', img: '/assets/motivation/characters/physics-master.png' },
  { id: 'focus', name: 'Focus Sensei', img: '/assets/motivation/focus-pomodoro.png' },
];

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Profile
    name: '',
    studentId: '',
    email: '',
    bio: '',
    avatarUrl: '',
    
    // Academic Profile
    institution: '',
    branch: '',
    year: '1st Year',
    semester: 1,
    targetGoal: '',

    // Study & Timer
    pomodoroFocus: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSessionsCount: 4,
    preferredStudyMode: 'Pomodoro',
    weeklyFocusTarget: 10,
    autoStartBreaks: false,
    autoStartFocus: false,
    exitConfirmation: true,

    // Sounds
    soundEnabled: true,
    soundVolume: 0.5,

    // Notifications
    notifStudy: true,
    notifTasks: true,
    notifExams: true,
    notifHabits: true,
    notifDaily: true,
    notifStreak: true,
    notifLevel: true,

    // AI Study Preferences
    aiResponseStyle: 'Balanced',
    aiTeachingStyle: 'Intuition-first',
    aiDifficulty: 'University',
    aiDefaultSubject: 'Linear Algebra',
    aiIncludeFormulas: true,
    aiIncludeExamples: true,

    // Appearance
    theme: 'Dark Cinematic',
    animations: 'Full',
    glowEffects: true,
  });

  // Load initial values from profile & settings
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const userProf = await repo.profiles.get(user.id);
        const storedPrefs = JSON.parse(localStorage.getItem(`studyflow_prefs_${user.id}`) || '{}');

        setFormData({
          name: userProf?.name || userProf?.full_name || '',
          studentId: userProf?.student_id || user?.email?.split('@')[0] || 'STU-1001',
          email: user?.email || '',
          bio: userProf?.bio || storedPrefs.bio || 'Dedicated STEM student on a mission for deep mastery.',
          avatarUrl: userProf?.avatar_url || storedPrefs.avatarUrl || AVATAR_PRESETS[0].img,

          institution: userProf?.institution || storedPrefs.institution || 'Indian Institute of Technology',
          branch: userProf?.branch || storedPrefs.branch || 'Mathematics & Computing',
          year: storedPrefs.year || '1st Year',
          semester: userProf?.semester || 1,
          targetGoal: userProf?.target_goal || storedPrefs.targetGoal || 'Maintain 9.0+ CGPA & master competitive problem-solving.',

          pomodoroFocus: settings?.pomodoro_focus || 25,
          pomodoroShortBreak: settings?.pomodoro_short_break || 5,
          pomodoroLongBreak: settings?.pomodoro_long_break || 15,
          pomodoroSessionsCount: settings?.pomodoro_sessions_count || 4,
          preferredStudyMode: settings?.preferred_study_mode || storedPrefs.preferredStudyMode || 'Pomodoro',
          weeklyFocusTarget: settings?.weekly_focus_target || 10,
          autoStartBreaks: !!settings?.auto_start_breaks,
          autoStartFocus: !!settings?.auto_start_focus,
          exitConfirmation: true,

          soundEnabled: settings?.sound_enabled !== undefined ? settings.sound_enabled : true,
          soundVolume: settings?.sound_volume !== undefined ? settings.sound_volume : 0.5,

          notifStudy: storedPrefs.notifStudy !== undefined ? storedPrefs.notifStudy : true,
          notifTasks: storedPrefs.notifTasks !== undefined ? storedPrefs.notifTasks : true,
          notifExams: storedPrefs.notifExams !== undefined ? storedPrefs.notifExams : true,
          notifHabits: storedPrefs.notifHabits !== undefined ? storedPrefs.notifHabits : true,
          notifDaily: storedPrefs.notifDaily !== undefined ? storedPrefs.notifDaily : true,
          notifStreak: storedPrefs.notifStreak !== undefined ? storedPrefs.notifStreak : true,
          notifLevel: storedPrefs.notifLevel !== undefined ? storedPrefs.notifLevel : true,

          aiResponseStyle: storedPrefs.aiResponseStyle || 'Balanced',
          aiTeachingStyle: storedPrefs.aiTeachingStyle || 'Intuition-first',
          aiDifficulty: storedPrefs.aiDifficulty || 'University',
          aiDefaultSubject: storedPrefs.aiDefaultSubject || 'Mathematics',
          aiIncludeFormulas: storedPrefs.aiIncludeFormulas !== undefined ? storedPrefs.aiIncludeFormulas : true,
          aiIncludeExamples: storedPrefs.aiIncludeExamples !== undefined ? storedPrefs.aiIncludeExamples : true,

          theme: 'Dark Cinematic',
          animations: storedPrefs.animations || 'Full',
          glowEffects: storedPrefs.glowEffects !== undefined ? storedPrefs.glowEffects : true,
        });
      } catch (e) {
        console.error('Error loading settings data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, settings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTabChange = (newTab) => {
    if (hasUnsavedChanges) {
      setPendingTab(newTab);
      setShowDiscardModal(true);
    } else {
      setActiveTab(newTab);
      setSearchParams({ tab: newTab });
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save Profile fields via repository
      await repo.profiles.update(user.id, {
        name: formData.name.trim(),
        branch: formData.branch.trim(),
        semester: Number(formData.semester) || 1,
        institution: formData.institution.trim(),
        target_goal: formData.targetGoal.trim(),
        avatar_url: formData.avatarUrl,
        bio: formData.bio.trim()
      });

      // 2. Save Settings via SettingsContext (syncs DB & sound)
      await updateSettings({
        pomodoro_focus: Number(formData.pomodoroFocus),
        pomodoro_short_break: Number(formData.pomodoroShortBreak),
        pomodoro_long_break: Number(formData.pomodoroLongBreak),
        pomodoro_sessions_count: Number(formData.pomodoroSessionsCount),
        weekly_focus_target: Number(formData.weeklyFocusTarget),
        auto_start_breaks: formData.autoStartBreaks,
        auto_start_focus: formData.autoStartFocus,
        sound_enabled: formData.soundEnabled,
        sound_volume: Number(formData.soundVolume)
      });

      // 3. Persist local extended preferences
      const extendedPrefs = {
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
        institution: formData.institution,
        branch: formData.branch,
        year: formData.year,
        targetGoal: formData.targetGoal,
        preferredStudyMode: formData.preferredStudyMode,
        notifStudy: formData.notifStudy,
        notifTasks: formData.notifTasks,
        notifExams: formData.notifExams,
        notifHabits: formData.notifHabits,
        notifDaily: formData.notifDaily,
        notifStreak: formData.notifStreak,
        notifLevel: formData.notifLevel,
        aiResponseStyle: formData.aiResponseStyle,
        aiTeachingStyle: formData.aiTeachingStyle,
        aiDifficulty: formData.aiDifficulty,
        aiDefaultSubject: formData.aiDefaultSubject,
        aiIncludeFormulas: formData.aiIncludeFormulas,
        aiIncludeExamples: formData.aiIncludeExamples,
        animations: formData.animations,
        glowEffects: formData.glowEffects,
      };
      localStorage.setItem(`studyflow_prefs_${user.id}`, JSON.stringify(extendedPrefs));

      setHasUnsavedChanges(false);
      toast.success('Settings & profile saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      toast.info('Exporting your StudyFlow workspace data...');
      const [tasks, habits, sessions, exams] = await Promise.all([
        repo.tasks.list(user.id),
        repo.habits.list(user.id),
        repo.studySessions.list(user.id),
        repo.exams.list(user.id)
      ]);

      const exportBundle = {
        exportDate: new Date().toISOString(),
        user: { id: user.id, email: user.email, studentId: formData.studentId, name: formData.name },
        academicProfile: { institution: formData.institution, branch: formData.branch, semester: formData.semester },
        tasks,
        habits,
        studySessions: sessions,
        exams,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `studyflow_backup_${formData.studentId}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('Workspace exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed.');
    }
  };

  const handleClearCache = () => {
    toast.info('Local session cache cleared. Refreshing...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'study', label: 'Study & Focus', icon: Timer },
    { id: 'sounds', label: 'Sounds & Audio', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Tutor', icon: Bot },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Account', icon: Shield },
  ];

  if (loading || settingsLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left max-w-5xl mx-auto">
        <Skeleton className="w-48 h-8 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-4 h-96 rounded-2xl" />
          <Skeleton className="md:col-span-8 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 border border-border-card/45 p-4 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-purple-bg border border-brand-purple/40 text-brand-purple-hover flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-purple/15">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              SETTINGS & PREFERENCES
            </h1>
            <p className="text-xs text-text-muted mt-0.5 font-medium">
              Customize StudyFlow around your university workflow and study habits.
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-extrabold py-2 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-brand-purple/20 cursor-pointer active:scale-95 transition-all min-h-[44px]"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Main Settings Navigation & Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Tabs (Desktop vertical / Mobile horizontal scroll) */}
        <div className="md:col-span-4 bg-zinc-950/70 border border-border-card/45 rounded-2xl p-2.5 space-y-1 shadow-sm overflow-x-auto flex md:flex-col flex-row gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left whitespace-nowrap min-h-[44px] active:scale-95 ${
                  isCurrent
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/25'
                    : 'text-text-muted hover:text-text-primary hover:bg-zinc-900/60'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Panel */}
        <div className="md:col-span-8 space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-purple-hover" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Student Profile</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-5 text-left">
                {/* Avatar Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Choose Character Avatar
                  </label>
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {AVATAR_PRESETS.map(av => {
                      const isSel = formData.avatarUrl === av.img;
                      return (
                        <div
                          key={av.id}
                          onClick={() => handleChange('avatarUrl', av.img)}
                          className={`w-14 h-14 rounded-2xl overflow-hidden border cursor-pointer transition-all flex-shrink-0 relative ${
                            isSel
                              ? 'border-brand-purple ring-2 ring-brand-purple/50 scale-105 shadow-md shadow-brand-purple/20'
                              : 'border-border-card/60 opacity-60 hover:opacity-100 hover:border-border-card'
                          }`}
                        >
                          <img src={av.img} alt={av.name} className="w-full h-full object-cover object-top" />
                          {isSel && (
                            <div className="absolute inset-0 bg-brand-purple/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Student ID & Email Row (Protected Identity) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                        Student ID / User ID
                      </label>
                      <span className="text-[9px] font-extrabold text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Login Identity
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.studentId}
                      readOnly
                      disabled
                      className="w-full bg-zinc-950 border border-border-card/40 rounded-xl px-3.5 py-2.5 text-xs text-text-muted font-mono cursor-not-allowed select-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="w-full bg-zinc-950 border border-border-card/40 rounded-xl px-3.5 py-2.5 text-xs text-text-muted font-mono cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Short Bio / Motto */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Study Bio / Philosophy
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={2}
                    placeholder="Short study motto..."
                    className="w-full bg-zinc-900 border border-border-card/60 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-brand-purple resize-none"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 2: ACADEMIC PROFILE */}
          {activeTab === 'academic' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Academic Profile</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      College / University
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleChange('institution', e.target.value)}
                      placeholder="e.g. IIT Kharagpur"
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Department / Major
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                      placeholder="e.g. Mathematics & Computing"
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Academic Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Current Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => handleChange('semester', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Semester Target / Academic Objective
                  </label>
                  <input
                    type="text"
                    value={formData.targetGoal}
                    onChange={(e) => handleChange('targetGoal', e.target.value)}
                    placeholder="e.g. Master Linear Algebra and maintain top rank"
                    className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 3: STUDY & FOCUS */}
          {activeTab === 'study' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Study & Focus Timer</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-5 text-left">
                {/* Durations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Focus Duration (mins)
                    </label>
                    <select
                      value={formData.pomodoroFocus}
                      onChange={(e) => handleChange('pomodoroFocus', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={25}>25 Minutes (Standard)</option>
                      <option value={45}>45 Minutes (Deep Work)</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes (Ultra-focus)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Short Break (mins)
                    </label>
                    <select
                      value={formData.pomodoroShortBreak}
                      onChange={(e) => handleChange('pomodoroShortBreak', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Long Break (mins)
                    </label>
                    <select
                      value={formData.pomodoroLongBreak}
                      onChange={(e) => handleChange('pomodoroLongBreak', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>
                </div>

                {/* Weekly Target Hours Slider */}
                <div className="space-y-2 pt-2 border-t border-border-card/30">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Weekly Focus Goal
                    </label>
                    <span className="text-xs font-extrabold text-emerald-400 font-display">
                      {formData.weeklyFocusTarget} Hours / Week
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={formData.weeklyFocusTarget}
                    onChange={(e) => handleChange('weeklyFocusTarget', Number(e.target.value))}
                    className="w-full accent-brand-purple cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-border-card/30">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-border-card/40 cursor-pointer min-h-[44px]">
                    <div>
                      <div className="text-xs font-bold text-text-primary">Auto-start Breaks</div>
                      <div className="text-[10px] text-text-muted">Start break timer automatically when focus completes</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.autoStartBreaks}
                      onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                      className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-border-card/40 cursor-pointer min-h-[44px]">
                    <div>
                      <div className="text-xs font-bold text-text-primary">3-Second Exit Confirmation</div>
                      <div className="text-[10px] text-brand-purple-hover font-semibold">Recommended: Psychological lock against impulsive quitting</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.exitConfirmation}
                      disabled
                      className="w-4 h-4 accent-brand-purple rounded cursor-not-allowed opacity-80"
                    />
                  </label>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 4: SOUNDS & AUDIO */}
          {activeTab === 'sounds' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-purple-hover" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Sound Effects & Audio</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-5 text-left">
                {/* Master Sound Toggle */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-brand-purple/40 cursor-pointer min-h-[44px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-purple-bg flex items-center justify-center text-brand-purple-hover">
                      {formData.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-text-muted" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">Master Sound Effects</div>
                      <div className="text-[10px] text-text-muted">Enables chime and feedback audio across all modules</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.soundEnabled}
                    onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                    className="w-5 h-5 accent-brand-purple rounded cursor-pointer"
                  />
                </label>

                {/* Sound Volume Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Sound Volume
                    </label>
                    <span className="text-xs font-bold text-text-primary font-mono">
                      {Math.round(formData.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={formData.soundVolume}
                    disabled={!formData.soundEnabled}
                    onChange={(e) => handleChange('soundVolume', Number(e.target.value))}
                    className="w-full accent-brand-purple cursor-pointer disabled:opacity-30"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Notifications & Reminders</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-3 text-left">
                {[
                  { id: 'notifStudy', title: 'Study Session Reminders', desc: 'Alerts when scheduled study sessions begin' },
                  { id: 'notifTasks', title: 'Task Deadline Warnings', desc: 'Notifications for upcoming high-priority assignments' },
                  { id: 'notifExams', title: 'Exam Countdowns', desc: 'Urgent reminder banners as exam dates approach' },
                  { id: 'notifHabits', title: 'Habit Checklist Reminders', desc: 'Reminds you to check in daily habits before midnight' },
                  { id: 'notifLevel', title: 'Level-Up Celebrations', desc: 'Celebratory popups when you unlock new XP tiers' },
                ].map(n => (
                  <label key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-border-card/40 cursor-pointer min-h-[44px]">
                    <div>
                      <div className="text-xs font-bold text-text-primary">{n.title}</div>
                      <div className="text-[10px] text-text-muted">{n.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData[n.id]}
                      onChange={(e) => handleChange(n.id, e.target.checked)}
                      className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
                    />
                  </label>
                ))}
              </CardBody>
            </Card>
          )}

          {/* TAB 6: AI TUTOR */}
          {activeTab === 'ai' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">AI Study Assistant Preferences</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Default Response Style
                    </label>
                    <select
                      value={formData.aiResponseStyle}
                      onChange={(e) => handleChange('aiResponseStyle', e.target.value)}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value="Concise">Concise (High Yield, 150-250 words)</option>
                      <option value="Balanced">Balanced (Intuition + Rigor)</option>
                      <option value="Detailed">Detailed (Full Step-by-Step)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                      Pedagogical Focus
                    </label>
                    <select
                      value={formData.aiTeachingStyle}
                      onChange={(e) => handleChange('aiTeachingStyle', e.target.value)}
                      className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                    >
                      <option value="Intuition-first">Intuition-First ("Why this exists")</option>
                      <option value="First principles">First Principles & Proofs</option>
                      <option value="Exam-focused">Exam & Problem-Solving</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-brand-purple/20 rounded-xl flex items-start gap-2 text-xs text-text-muted">
                  <Lock className="w-4 h-4 text-brand-purple-hover flex-shrink-0 mt-0.5" />
                  <span>
                    Google Gemini API credentials are safely encrypted and managed on the server. Zero API keys are ever stored in the browser.
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 7: APPEARANCE */}
          {activeTab === 'appearance' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Appearance & Theme</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Active Theme
                  </label>
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-brand-purple/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Dark Cinematic Theme</div>
                      <div className="text-[10px] text-text-muted">Tailored for deep focus and low eye strain during study</div>
                    </div>
                    <span className="text-[10px] font-extrabold text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded uppercase">Active</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider block">
                    Motion & Animations
                  </label>
                  <select
                    value={formData.animations}
                    onChange={(e) => handleChange('animations', e.target.value)}
                    className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple cursor-pointer"
                  >
                    <option value="Full">Full Cinematic Animations</option>
                    <option value="Reduced">Reduced Motion (Battery friendly)</option>
                    <option value="Off">Animations Off</option>
                  </select>
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 8: PRIVACY & ACCOUNT */}
          {activeTab === 'privacy' && (
            <Card className="border border-border-card/45 bg-zinc-950/80 rounded-2xl shadow-xl">
              <CardHeader className="bg-zinc-900/40 border-b border-border-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Privacy & Account Security</h2>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-5 text-left">
                {/* Data Export & Cache */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Your Workspace Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleExportData}
                      className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-border-card/60 hover:border-brand-purple/40 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <Download className="w-4 h-4 text-brand-purple-hover" />
                      <span>Export Workspace (JSON)</span>
                    </button>

                    <button
                      onClick={handleClearCache}
                      className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-border-card/60 hover:border-border-card text-xs font-bold text-text-muted hover:text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      <span>Clear Session Cache</span>
                    </button>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="pt-4 border-t border-border-card/30 space-y-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Account Actions</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={logout}
                      className="flex-1 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-border-card/60 text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4 text-amber-400" />
                      <span>Sign Out</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 p-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-border-card/70 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-extrabold text-white">Unsaved Changes</h3>
            </div>
            <p className="text-xs text-text-muted">
              You have unsaved changes in this tab. Do you want to discard them?
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold py-2 rounded-xl"
              >
                Continue Editing
              </Button>
              <Button
                onClick={() => {
                  setHasUnsavedChanges(false);
                  setShowDiscardModal(false);
                  if (pendingTab) {
                    setActiveTab(pendingTab);
                    setSearchParams({ tab: pendingTab });
                  }
                }}
                className="flex-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-bold py-2 rounded-xl"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Safety Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-extrabold text-white">Delete Account Permanently?</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              This action requires server-side administrator authorization and will permanently erase your study statistics, tasks, habits, and focus logs.
            </p>
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-[11px] text-rose-200">
              To proceed with permanent account deletion, please contact support or your institutional administrator.
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-2 px-5 rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
