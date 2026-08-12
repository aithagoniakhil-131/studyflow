import React from 'react';
import { Timer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Action 1: Focus Session */}
      <button
        onClick={() => navigate('/focus')}
        className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-border-card/40 bg-bg-card/50 hover:bg-zinc-900/40 hover:border-brand-purple/40 text-text-primary hover:text-brand-purple transition-all cursor-pointer group"
      >
        <Timer className="w-5 h-5 text-brand-purple group-hover:scale-105 transition-transform" />
        <span className="text-sm font-semibold tracking-tight">Focus Session</span>
      </button>

      {/* Action 2: Add Exam */}
      <button
        onClick={() => navigate('/exams')}
        className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-border-card/40 bg-bg-card/50 hover:bg-zinc-900/40 hover:border-cyan-500/40 text-text-primary hover:text-cyan-400 transition-all cursor-pointer group"
      >
        <FileText className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
        <span className="text-sm font-semibold tracking-tight">Add Exam</span>
      </button>
    </div>
  );
}
