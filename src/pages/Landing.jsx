import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import FeatureSection from '../components/landing/FeatureSection';
import LandingFooter from '../components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col overflow-x-hidden font-sans">
      {/* Background glow graphics mapping to cinematic dark styles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[400px] left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <LandingNavbar />
      
      <main className="flex-1 relative z-10 flex flex-col">
        <HeroSection />
        <FeatureSection />
      </main>

      <LandingFooter />
    </div>
  );
}
