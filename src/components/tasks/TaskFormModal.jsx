import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { TASK_CATEGORIES } from '../../services/taskService';

export default function TaskFormModal({ isOpen, onClose, onSave, task = null }) {
  const isEditing = !!task;

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Study');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  // Recurrence Fields
  const [recurring, setRecurring] = useState(false);
  const [repeatType, setRepeatType] = useState('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatUntil, setRepeatUntil] = useState('');

  // UI States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setSubject(task.subject || '');
        setCategory(task.category || 'Study');
        setPriority(task.priority || 'medium');
        setDueDate(task.due_date || '');
        setDueTime(task.due_time || '');
        setEstimatedMinutes(task.estimated_minutes !== undefined ? task.estimated_minutes : 25);
        setNotes(task.notes || '');
        setVideoUrl(task.video_url || '');
        setResourceUrl(task.resource_url || '');
        setRecurring(!!task.recurring);
        setRepeatType(task.repeat_type || 'daily');
        setRepeatInterval(task.repeat_interval || 1);
        setRepeatDays(task.repeat_days || []);
        setRepeatUntil(task.repeat_until || '');
      } else {
        // Reset to defaults
        setTitle('');
        setDescription('');
        setSubject('');
        setCategory('Study');
        setPriority('medium');
        setDueDate(new Date().toISOString().split('T')[0]);
        setDueTime('');
        setEstimatedMinutes(25);
        setNotes('');
        setVideoUrl('');
        setResourceUrl('');
        setRecurring(false);
        setRepeatType('daily');
        setRepeatInterval(1);
        setRepeatDays([]);
        setRepeatUntil('');
      }
      setError('');
      setSaving(false);
    }
  }, [isOpen, task]);

  const handleWeekdayToggle = (day) => {
    setRepeatDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (Number(estimatedMinutes) < 0) {
      setError('Estimated duration must be greater than or equal to 0.');
      return;
    }

    // Validate URLs if filled
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (videoUrl && !urlPattern.test(videoUrl)) {
      setError('Please enter a valid YouTube video URL.');
      return;
    }
    if (resourceUrl && !urlPattern.test(resourceUrl)) {
      setError('Please enter a valid resource URL.');
      return;
    }

    if (recurring && repeatType === 'selected_days' && repeatDays.length === 0) {
      setError('Please select at least one weekday for recurrence.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const payload = {
        title: title.trim(),
        description,
        subject: subject.trim() || 'General',
        category,
        priority,
        due_date: dueDate,
        due_time: dueTime,
        estimated_minutes: Number(estimatedMinutes) || 0,
        notes,
        video_url: videoUrl.trim(),
        resource_url: resourceUrl.trim(),
        recurring,
        repeat_type: recurring ? repeatType : null,
        repeat_interval: recurring ? Number(repeatInterval) : 1,
        repeat_days: recurring && repeatType === 'selected_days' ? repeatDays : null,
        repeat_until: recurring && repeatUntil ? repeatUntil : null
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const weekdays = [
    { label: 'M', value: 'mon' },
    { label: 'T', value: 'tue' },
    { label: 'W', value: 'wed' },
    { label: 'T', value: 'thu' },
    { label: 'F', value: 'fri' },
    { label: 'S', value: 'sat' },
    { label: 'S', value: 'sun' }
  ];

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

        {/* Modal Header */}
        <h2 className="text-xl font-extrabold font-display text-text-primary">
          {isEditing ? 'Edit Task' : 'Add New Task'}
        </h2>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-priority-high-bg/10 border border-priority-high/20 rounded-lg text-xs font-semibold text-priority-high">
            {error}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Title input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Algebra — Eigenvalues"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows="2"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          {/* Subject & Category Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              >
                {TASK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-bg-card">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Duration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="low" className="bg-bg-card">Low</option>
                <option value="medium" className="bg-bg-card">Medium</option>
                <option value="high" className="bg-bg-card">High</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Estimated Mins</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                min="0"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-sans"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-sans"
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 p-3 bg-zinc-900/20 border border-border-card/40 rounded-xl">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Attachment Links</span>
            
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube URL (optional)"
                className="w-full bg-zinc-950/60 border border-border-card/60 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
              <input
                type="text"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="Reference PDF or Web URL (optional)"
                className="w-full bg-zinc-950/60 border border-border-card/60 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Recurrence System controls */}
          <div className="space-y-3 p-3 bg-zinc-900/20 border border-border-card/40 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider cursor-pointer select-none" htmlFor="rec-toggle">
                Recurring Task
              </label>
              <input
                type="checkbox"
                id="rec-toggle"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-border-card text-brand-purple focus:ring-brand-purple cursor-pointer"
              />
            </div>

            {recurring && (
              <div className="space-y-3 pt-2 border-t border-border-card/30 animate-fade-in text-xs">
                {/* Repeat Type & Interval */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Repeat Type</label>
                    <select
                      value={repeatType}
                      onChange={(e) => setRepeatType(e.target.value)}
                      className="w-full bg-zinc-950/60 border border-border-card/60 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="selected_days">Specific Days</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Interval</label>
                    <input
                      type="number"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(e.target.value)}
                      min="1"
                      className="w-full bg-zinc-950/60 border border-border-card/60 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>

                {/* Weekday checkboxes for Selected Days */}
                {repeatType === 'selected_days' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-muted uppercase block">Select Days</label>
                    <div className="flex justify-between gap-1">
                      {weekdays.map(day => {
                        const isSelected = repeatDays.includes(day.value);
                        return (
                          <button
                            type="button"
                            key={day.value}
                            onClick={() => handleWeekdayToggle(day.value)}
                            className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                : 'bg-zinc-950/60 border-border-card/50 text-text-muted hover:border-brand-purple/40'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Repeat Until limit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Repeat Until (Optional)</label>
                  <input
                    type="date"
                    value={repeatUntil}
                    onChange={(e) => setRepeatUntil(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-border-card/60 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
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
              {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Save Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
