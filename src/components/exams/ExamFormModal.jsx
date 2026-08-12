import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

export default function ExamFormModal({ isOpen, onClose, onSave, exam = null }) {
  const isEditing = !!exam;

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Mid Semester');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [syllabusInput, setSyllabusInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (exam) {
        setTitle(exam.title || '');
        setSubject(exam.subject || '');
        setExamType(exam.exam_type || 'Mid Semester');
        setDate(exam.date || '');
        setTime(exam.time || '');
        setLocation(exam.location || '');
        setNotes(exam.notes || '');
        setSyllabusInput(exam.syllabus ? exam.syllabus.join('\n') : '');
      } else {
        // Reset defaults
        setTitle('');
        setSubject('');
        setExamType('Mid Semester');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('');
        setLocation('');
        setNotes('');
        setSyllabusInput('');
      }
      setError('');
      setSaving(false);
    }
  }, [isOpen, exam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Exam title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!date) {
      setError('Exam date is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Split syllabus topics by line
      const syllabusList = syllabusInput
        .split('\n')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);

      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        exam_type: examType,
        date: date,
        time: time,
        location: location.trim(),
        notes: notes.trim(),
        syllabus: syllabusList,
        syllabus_completed: isEditing && exam.syllabus_completed ? exam.syllabus_completed.filter(topic => syllabusList.includes(topic)) : []
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save exam.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-bg-card border border-border-card w-full max-w-lg rounded-2xl p-6 relative shadow-2xl glass-panel space-y-4 my-8 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-extrabold font-display text-text-primary text-left">
          {isEditing ? 'Edit Exam' : 'Add New Exam'}
        </h2>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-priority-high-bg/10 border border-priority-high/20 rounded-lg text-xs font-semibold text-priority-high text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Exam Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Structures Midterm"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Subject & Type Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="Quiz">Quiz</option>
                <option value="Mid Semester">Mid Semester</option>
                <option value="End Semester">End Semester</option>
                <option value="Lab Exam">Lab Exam</option>
                <option value="Viva">Viva</option>
                <option value="Assignment/Submission">Assignment/Submission</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-sans"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-sans"
              />
            </div>
          </div>

          {/* Location Venue */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Venue / Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lecture Hall 102"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Syllabus Topics */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Syllabus Topics (one per line)</label>
            <textarea
              value={syllabusInput}
              onChange={(e) => setSyllabusInput(e.target.value)}
              placeholder="e.g.&#10;Arrays & Linked Lists&#10;Stacks & Queues&#10;Trees & Graphs"
              rows="3"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple resize-none font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Exam Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add extra syllabus details or score weight info..."
              rows="2"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              className="border border-border-card hover:bg-zinc-800/10 px-5 rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="bg-brand-purple hover:bg-brand-purple-hover text-white shadow-lg shadow-brand-purple/20 px-5 rounded-lg text-xs font-semibold"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Exam' : 'Add Exam'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
