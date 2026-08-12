import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { repo } from '../services/repo';
import { Button } from './ui/Button';
import { 
  LayoutDashboard, CheckSquare, CalendarDays, CalendarRange, 
  Target, FileText, Library, BarChart3, Compass, Settings, 
  LogOut, Bot, Bell, Search, X, Volume2, VolumeX
} from 'lucide-react';
import MobileBottomNav from './navigation/MobileBottomNav';
import MobileMoreSheet from './navigation/MobileMoreSheet';

export default function DashboardShell({ children }) {
  const { user, profile, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      if (user) {
        try {
          const list = await repo.notifications.list(user.id);
          setNotifications(list);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchNotifs();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  const markNotificationRead = async (id) => {
    try {
      await repo.notifications.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await repo.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    updateSettings({ sound_enabled: !settings.sound_enabled });
    toast.success(settings.sound_enabled ? 'Sounds muted' : 'Sounds enabled');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'My Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { name: 'Weekly Planner', path: '/planner', icon: <CalendarRange className="w-5 h-5" /> },
    { name: 'Calendar', path: '/calendar', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'Habits', path: '/habits', icon: <Target className="w-5 h-5" /> },
    { name: 'Exams', path: '/exams', icon: <FileText className="w-5 h-5" /> },
    { name: 'Resources', path: '/resources', icon: <Library className="w-5 h-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Motivation', path: '/motivation', icon: <Compass className="w-5 h-5" /> },
    { name: 'AI Assistant', path: '/ai-assistant', icon: <Bot className="w-5 h-5" /> },
  ];

  // Dynamic header welcome/title based on route
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      const hours = new Date().getHours();
      const name = profile?.name ? profile.name.split(' ')[0] : 'Student';
      let greeting = 'Good morning';
      if (hours >= 12 && hours < 17) {
        greeting = 'Good afternoon';
      } else if (hours >= 17) {
        greeting = 'Good evening';
      }
      return `${greeting}, ${name} 👋`;
    }

    const titles = {
      '/tasks': 'My Tasks',
      '/planner': 'Weekly Planner',
      '/calendar': 'Calendar',
      '/habits': 'Habits & Discipline',
      '/exams': 'Exam Center',
      '/resources': 'Resources Vault',
      '/analytics': 'Academic Analytics',
      '/motivation': 'Motivation Gallery',
      '/focus': 'Pomodoro Focus Timer',
      '/ai-assistant': 'AI Study Assistant',
      '/profile': 'Student Profile',
      '/settings': 'System Settings'
    };

    const matchedKey = Object.keys(titles).find(k => path.startsWith(k));
    return matchedKey ? titles[matchedKey] : 'StudyFlow Workspace';
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex">
      {/* Sidebar Component for Desktop (preserved at md/lg) */}
      <aside className="w-64 bg-bg-sidebar border-r border-border-card hidden md:flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border-card/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-cyan-400 flex items-center justify-center font-bold text-bg-base text-lg font-display shadow-md shadow-brand-purple/20">
              S
            </div>
            <span className="font-display font-extrabold text-xl tracking-wide bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
              StudyFlow
            </span>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                    : 'text-text-muted hover:text-text-primary hover:bg-zinc-800/20'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-border-card/40 space-y-2">
          {/* Quick Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-text-muted hover:text-text-primary bg-zinc-900/30 hover:bg-zinc-900/60 rounded-md border border-border-card/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium">
              {settings.sound_enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Sound Effects
            </span>
            <span className="text-[10px] text-brand-purple font-semibold uppercase">
              {settings.sound_enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <NavLink
            to="/settings"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-zinc-800 text-white border border-border-card' 
                  : 'text-text-muted hover:text-text-primary hover:bg-zinc-800/20'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition-all cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Topbar Component with Responsive Mobile Header */}
        <header className="h-16 md:h-20 bg-bg-base/85 backdrop-blur-md border-b border-border-card/40 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0">
          {/* Left panel: Logo badge on mobile / Welcome statement on desktop */}
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-purple to-cyan-400 flex md:hidden items-center justify-center font-bold text-bg-base text-sm font-display flex-shrink-0 shadow-sm shadow-brand-purple/20">
              S
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-xl font-bold tracking-tight text-text-primary truncate max-w-[200px] sm:max-w-none">
                {getHeaderTitle()}
              </h2>
              <p className="text-[10px] sm:text-xs text-text-muted font-medium hidden sm:block">
                {dateStr}
              </p>
            </div>
          </div>

          {/* Right panel: Search, Notifications, Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Search input on desktop */}
            <div className="relative max-w-xs w-full hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="bg-zinc-900/60 border border-border-card rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple w-56 transition-all placeholder:text-text-muted/60"
                placeholder="Search tasks, notes..."
              />
            </div>

            {/* Notification trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="p-2 min-w-[40px] min-h-[40px] rounded-xl border border-border-card/60 bg-zinc-900/40 hover:bg-zinc-900/70 hover:text-brand-purple text-text-primary transition-all relative cursor-pointer active:scale-95 flex items-center justify-center"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-purple text-bg-base rounded-full flex items-center justify-center font-bold text-[9px] border border-bg-base shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay List */}
              {showNotifPanel && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-zinc-950 border border-border-card/70 rounded-2xl shadow-2xl p-4 z-40 space-y-3 glass-panel animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border-card/40 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Notifications</span>
                    <button 
                      onClick={() => setShowNotifPanel(false)}
                      className="text-text-muted hover:text-text-primary cursor-pointer p-1"
                      aria-label="Close notifications"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-text-muted text-center py-6">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 rounded-xl border text-xs relative group ${
                            notif.read 
                              ? 'bg-zinc-900/20 border-border-card/30 text-text-muted' 
                              : 'bg-brand-purple-bg border-brand-purple/20 text-text-primary'
                          }`}
                        >
                          <div className="font-semibold pr-4">{notif.title}</div>
                          <div className="mt-1 leading-normal text-text-muted">{notif.message}</div>
                          
                          <div className="mt-2 flex gap-3 text-[10px]">
                            {!notif.read && (
                              <button 
                                onClick={() => markNotificationRead(notif.id)}
                                className="text-brand-purple hover:underline cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notif.id)}
                              className="text-rose-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl transition-all active:scale-95 min-h-[40px]"
              aria-label="Open profile"
            >
              <div className="w-8 h-8 rounded-full border border-border-card/60 bg-zinc-900 overflow-hidden flex items-center justify-center font-bold text-xs text-brand-purple uppercase bg-brand-purple-bg group-hover:border-brand-purple transition-all shadow-sm">
                {profile?.name ? profile.name.slice(0, 2) : 'ST'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-text-primary leading-tight group-hover:text-brand-purple transition-colors">
                  {profile?.name || 'Student'}
                </div>
                <div className="text-[10px] text-text-muted leading-tight">
                  Sem {profile?.semester || 1} • {profile?.branch ? profile.branch.split(' ')[0] : 'CSE'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet Box (with safe padding above mobile bottom nav) */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-28 md:pb-6 relative max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomNav onOpenMore={() => setShowMoreSheet(true)} />

      {/* Mobile More Features Bottom Sheet */}
      <MobileMoreSheet 
        isOpen={showMoreSheet} 
        onClose={() => setShowMoreSheet(false)}
        settings={settings}
        onToggleMute={toggleMute}
        onLogout={handleLogout}
      />
    </div>
  );
}
