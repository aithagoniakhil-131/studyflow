import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const STANDARD_ACADEMIC_GOALS = [
  'Improve CGPA',
  'Prepare for exams',
  'Stay consistent',
  'Revise core concepts regularly'
];

const STANDARD_CAREER_GOALS = [
  'Learn coding',
  'Build projects',
  'Prepare for internships',
  'Prepare for placements'
];

export default function Onboarding() {
  const { onboard } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [academicGoals, setAcademicGoals] = useState([]);
  const [careerGoals, setCareerGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleAcademicGoal = (goal) => {
    setAcademicGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleCareerGoal = (goal) => {
    setCareerGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !university || !branch) {
      toast.error('Please fill in Name, University, and Branch');
      return;
    }

    setSubmitting(true);
    try {
      await onboard({
        name,
        university,
        degree,
        branch,
        year: Number(year),
        semester: Number(semester),
        academic_goals: academicGoals,
        career_goals: careerGoals
      });
      toast.success('Onboarding complete! Welcome to StudyFlow.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 px-4 flex justify-center items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-primary tracking-tight">Setup Your Student OS</h2>
          <p className="text-text-muted mt-2">Let's customize StudyFlow for your academic program.</p>
        </div>

        <Card className="glass-panel">
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                    placeholder="Alex Mercer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">University / College</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                    placeholder="National Institute of Technology"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Degree</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                    placeholder="B.Tech"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Branch / Major</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors"
                    placeholder="Computer Science & Engineering"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5].map(y => (
                        <option key={y} value={y} className="bg-bg-card">Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-border-card rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors cursor-pointer"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                        <option key={s} value={s} className="bg-bg-card">Sem {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Academic Goals</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {STANDARD_ACADEMIC_GOALS.map((goal) => {
                    const isSelected = academicGoals.includes(goal);
                    return (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleAcademicGoal(goal)}
                        className={`text-left text-sm p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-purple-bg border-brand-purple text-text-primary'
                            : 'border-border-card bg-zinc-900/20 hover:bg-zinc-800/20 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Career Goals</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {STANDARD_CAREER_GOALS.map((goal) => {
                    const isSelected = careerGoals.includes(goal);
                    return (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleCareerGoal(goal)}
                        className={`text-left text-sm p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-purple-bg border-brand-purple text-text-primary'
                            : 'border-border-card bg-zinc-900/20 hover:bg-zinc-800/20 text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Saving Profile...' : 'Complete Setup & Enter Workspace'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
