import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Signup() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signup(studentId, password);
      toast.success('Account created! Let\'s setup your profile.');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Study<span className="text-brand-purple">Flow</span></h2>
          <p className="text-text-muted mt-2 text-sm">Join your university's workspace. Start your journey.</p>
        </div>

        <Card className="glass-panel">
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Student ID / User ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors font-sans"
                  placeholder="e.g. NIT102, CS304"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                  placeholder="•••••••• (Min 6 chars)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </CardBody>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Registering...' : 'Create Account'}
              </Button>
              <div className="text-center text-xs text-text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-purple hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
