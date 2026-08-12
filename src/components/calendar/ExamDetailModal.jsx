import React from 'react';
import { X, Calendar, Clock, MapPin, ListChecks, FileText } from 'lucide-react';

export default function ExamDetailModal({ isOpen, onClose, exam = null }) {
  if (!isOpen || !exam) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const syllabus = exam.syllabus || [];
  const syllabusCompleted = exam.syllabus_completed || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-bg-card border border-border-card w-full max-w-md rounded-2xl p-6 relative shadow-2xl glass-panel space-y-4 text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Subject / Title */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/20 border border-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider inline-block">
            {exam.exam_type || 'Academic Exam'}
          </span>
          <h2 className="text-xl font-extrabold font-display text-text-primary mt-1.5 leading-tight">
            {exam.title}
          </h2>
          <p className="text-xs font-semibold text-brand-purple-hover mt-0.5">{exam.subject}</p>
        </div>

        <div className="h-px bg-border-card/20" />

        {/* Time, Date and Location Info Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
          <div className="p-3 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Exam Date</span>
              <span className="font-semibold text-text-primary">{exam.date}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Exam Time</span>
              <span className="font-semibold text-text-primary">{exam.time ? formatTime(exam.time) : 'TBA'}</span>
            </div>
          </div>

          {exam.location && (
            <div className="p-3 rounded-xl bg-zinc-900/30 border border-border-card/30 flex items-center gap-2.5 col-span-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-[9px] block text-text-muted/60 uppercase font-bold">Exam Venue</span>
                <span className="font-semibold text-text-primary">{exam.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Syllabus checklists */}
        {syllabus.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <ListChecks className="w-3.5 h-3.5" />
              Syllabus Coverage
            </span>
            <div className="p-3 rounded-xl bg-zinc-900/20 border border-border-card/20 space-y-1.5 max-h-40 overflow-y-auto">
              {syllabus.map((topic, idx) => {
                const isDone = syllabusCompleted.includes(topic);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                      isDone 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'border-border-card bg-zinc-950/20 text-text-muted/40'
                    }`}>
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <span className={isDone ? 'line-through text-text-muted/60' : 'text-text-primary'}>
                      {topic}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {exam.notes && (
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Exam Notes
            </span>
            <p className="p-3 rounded-xl bg-zinc-900/20 border border-border-card/20 text-text-muted italic leading-relaxed">
              {exam.notes}
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="border border-border-card hover:bg-zinc-800/10 px-5 rounded-lg text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
