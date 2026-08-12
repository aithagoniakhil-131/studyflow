import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from './ui/Skeleton';

export const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col justify-center items-center p-8 space-y-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="w-1/3 h-8 rounded" />
          <Skeleton className="w-full h-36 rounded-xl" />
          <Skeleton className="w-2/3 h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Save location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine if onboarding is complete
  const onboardingIncomplete = !profile || !profile.university || !profile.degree;

  if (onboardingIncomplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!onboardingIncomplete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
