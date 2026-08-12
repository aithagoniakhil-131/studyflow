import React from 'react';
import { Card, CardBody } from '../ui/Card';
import { 
  LayoutDashboard, CheckSquare, Target, 
  CalendarRange, BarChart3, Library 
} from 'lucide-react';

export default function FeatureSection() {
  const features = [
    {
      title: 'Daily Dashboard',
      description: "Your command center. View today's priorities, upcoming classes, and immediate deadlines at a single glance.",
      icon: <LayoutDashboard className="w-5 h-5 text-brand-purple" />,
      colorClass: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20'
    },
    {
      title: 'Smart Task Planning',
      description: "Break massive assignments into manageable sub-tasks. AI assists in estimating time and scheduling focus blocks.",
      icon: <CheckSquare className="w-5 h-5 text-cyan-400" />,
      colorClass: 'text-cyan-400 bg-cyan-950/20 border-cyan-500/10'
    },
    {
      title: 'Discipline Tracker',
      description: "Measure what matters. Track habits, sleep, and study hours to ensure your systems are robust.",
      icon: <Target className="w-5 h-5 text-purple-400" />,
      colorClass: 'text-purple-400 bg-purple-950/20 border-purple-500/10'
    },
    {
      title: 'Exam & Deadline Tracker',
      description: "Visual timelines for midterms and finals. Never be surprised by a creeping deadline again.",
      icon: <CalendarRange className="w-5 h-5 text-rose-400" />,
      colorClass: 'text-rose-400 bg-rose-950/20 border-rose-500/10'
    },
    {
      title: 'Study Analytics',
      description: "Quantify your effort. Beautiful charts showing when you are most productive and where time goes.",
      icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
      colorClass: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/10'
    },
    {
      title: 'Learning Vault',
      description: "Organize notes, resources, and past exams by course. Fully searchable and interlinked.",
      icon: <Library className="w-5 h-5 text-blue-400" />,
      colorClass: 'text-blue-400 bg-blue-950/20 border-blue-500/10'
    }
  ];

  return (
    <section id="features" className="px-6 md:px-12 py-20 bg-bg-base max-w-7xl mx-auto border-t border-border-card/20 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display">
          Everything a student needs.<br />
          <span className="text-brand-purple">One place.</span>
        </h2>
        <p className="text-text-muted text-sm md:text-base leading-relaxed">
          Abandon the chaos of scattered notes and separate apps. We unified the student workflow into a single, cohesive engine.
        </p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => (
          <Card key={feat.title} variant="default" hover className="border border-border-card/50 shadow-md">
            <CardBody className="space-y-4 text-left p-6">
              {/* Icon pill container */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${feat.colorClass}`}>
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold tracking-tight text-text-primary font-display">{feat.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{feat.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
