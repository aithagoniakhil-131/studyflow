import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export default function LandingNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path) => {
    setMobileMenuOpen(false);
    if (path.startsWith('#')) {
      const el = document.getElementById(path.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      if (user) {
        navigate(path);
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <header className="w-full h-20 bg-bg-base/70 backdrop-blur-md border-b border-border-card/30 sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-cyan-400 flex items-center justify-center font-bold text-bg-base text-lg font-display">
          S
        </div>
        <span className="font-display font-extrabold text-xl tracking-wide text-text-primary">
          StudyFlow
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
        <button 
          onClick={() => handleNav('#features')} 
          className="hover:text-text-primary transition-colors cursor-pointer"
        >
          Features
        </button>
        <button 
          onClick={() => handleNav('/dashboard')} 
          className="hover:text-text-primary transition-colors cursor-pointer"
        >
          Dashboard
        </button>
        <button 
          onClick={() => handleNav('/analytics')} 
          className="hover:text-text-primary transition-colors cursor-pointer"
        >
          Analytics
        </button>
        <button 
          onClick={() => handleNav('/motivation')} 
          className="hover:text-text-primary transition-colors cursor-pointer"
        >
          Motivation
        </button>
      </nav>

      {/* Desktop Authentication actions */}
      <div className="hidden md:flex items-center gap-4">
        {user ? (
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            Enter Workspace
          </Button>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors pr-2"
            >
              Login
            </Link>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate('/signup')}
              className="bg-brand-purple hover:bg-brand-purple-hover font-semibold"
            >
              Get Started
            </Button>
          </>
        )}
      </div>

      {/* Mobile Toggle Hamburger button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 rounded-lg border border-border-card bg-zinc-900/30 text-text-primary md:hidden cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Dropdown Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-bg-card border-b border-border-card p-6 flex flex-col gap-4 z-40 glass-panel md:hidden animate-fade-in">
          <button 
            onClick={() => handleNav('#features')} 
            className="text-left py-2 font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => handleNav('/dashboard')} 
            className="text-left py-2 font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Dashboard
          </button>
          <button 
            onClick={() => handleNav('/analytics')} 
            className="text-left py-2 font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Analytics
          </button>
          <button 
            onClick={() => handleNav('/motivation')} 
            className="text-left py-2 font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Motivation
          </button>
          
          <div className="h-px bg-border-card/40 my-2" />

          {user ? (
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
            >
              Enter Workspace
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-medium text-text-muted hover:text-text-primary"
              >
                Login
              </Link>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/signup');
                }}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
