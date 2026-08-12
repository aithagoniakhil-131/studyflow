import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { PomodoroProvider } from './context/PomodoroContext';

// Protected Route Guardian
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardShell from './components/DashboardShell';
import GamificationOverlay from './components/gamification/GamificationOverlay';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Planner from './pages/Planner';
import Calendar from './pages/Calendar';
import Habits from './pages/Habits';
import Exams from './pages/Exams';
import Resources from './pages/Resources';
import Analytics from './pages/Analytics';
import Motivation from './pages/Motivation';
import Focus from './pages/Focus';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';

// Layout wrapper for authenticated dashboard pages
function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <PomodoroProvider>
            <BrowserRouter>
              <GamificationOverlay />
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Onboarding - Protected but full-screen (outside dashboard shell) */}
                <Route 
                  path="/onboarding" 
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } 
                />

                {/* Authenticated Dashboard Pages */}
                <Route 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/tasks/:id" element={<TaskDetails />} />
                  <Route path="/planner" element={<Planner />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/habits" element={<Habits />} />
                  <Route path="/exams" element={<Exams />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/motivation" element={<Motivation />} />
                  <Route path="/focus" element={<Focus />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                </Route>

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </PomodoroProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
