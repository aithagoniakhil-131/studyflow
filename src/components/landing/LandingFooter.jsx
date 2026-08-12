import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const handleScrollToFeatures = (e) => {
    e.preventDefault();
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-bg-sidebar border-t border-border-card/30 px-6 md:px-12 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-cyan-400 flex items-center justify-center font-bold text-bg-base text-lg font-display">
            S
          </div>
          <span className="font-display font-extrabold text-xl tracking-wide text-text-primary">
            StudyFlow
          </span>
        </div>

        {/* Footer links */}
        <nav className="flex flex-wrap justify-center gap-6 text-xs text-text-muted">
          <a 
            href="#features" 
            onClick={handleScrollToFeatures} 
            className="hover:text-text-primary transition-colors"
          >
            Features
          </a>
          <Link to="#" className="hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link to="#" className="hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <Link to="#" className="hover:text-text-primary transition-colors">
            Contact
          </Link>
          <Link to="#" className="hover:text-text-primary transition-colors">
            API Documentation
          </Link>
        </nav>

        {/* Copyright notice */}
        <div className="text-xs text-text-muted">
          &copy; {currentYear} StudyFlow. Built for high-achievers.
        </div>
      </div>
    </footer>
  );
}
