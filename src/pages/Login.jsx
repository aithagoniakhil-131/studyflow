import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await login(studentId, password);
      toast.success('Logged in successfully!');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Study<span className="text-brand-purple">Flow</span></h2>
          <p className="text-text-muted mt-2 text-sm">Welcome back. Enter your credentials to study.</p>
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
                  placeholder="••••••••"
                  required
                />
              </div>
            </CardBody>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
              <div className="text-center text-xs text-text-muted">
                Don't have an account?{' '}
                <Link to="/signup" className="text-brand-purple hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
