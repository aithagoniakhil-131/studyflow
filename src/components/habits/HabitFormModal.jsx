import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X, Play } from 'lucide-react';

export default function HabitFormModal({ isOpen, onClose, onSave, habit = null }) {
  const isEditing = !!habit;

  const [title, setTitle] = useState('');
  const [frequencyType, setFrequencyType] = useState('daily');
  const [frequencyInterval, setFrequencyInterval] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate details if editing
  useEffect(() => {
    if (isOpen) {
      if (habit) {
        setTitle(habit.title || '');
        setFrequencyType(habit.frequency_type || 'daily');
        setFrequencyInterval(habit.frequency_interval || 1);
        setFrequencyDays(habit.frequency_days || []);
        setIsActive(habit.is_active !== undefined ? !!habit.is_active : true);
      } else {
        // Reset defaults
        setTitle('');
        setFrequencyType('daily');
        setFrequencyInterval(1);
        setFrequencyDays([]);
        setIsActive(true);
      }
      setError('');
      setSaving(false);
    }
  }, [isOpen, habit]);

  const handleWeekdayToggle = (day) => {
    setFrequencyDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required.');
      return;
    }
    if (frequencyType === 'selected_days' && frequencyDays.length === 0) {
      setError('Please select at least one weekday for selected days frequency.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: title.trim(),
        frequency_type: frequencyType,
        frequency_interval: Number(frequencyInterval) || 1,
        frequency_days: frequencyType === 'selected_days' ? frequencyDays : null,
        is_active: isActive
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save habit.');
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
        className="bg-bg-card border border-border-card w-full max-w-md rounded-2xl p-6 relative shadow-2xl glass-panel space-y-4 my-8"
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

        {/* Modal Title */}
        <h2 className="text-xl font-extrabold font-display text-text-primary">
          {isEditing ? 'Edit Habit' : 'Create New Habit'}
        </h2>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-priority-high-bg/10 border border-priority-high/20 rounded-lg text-xs font-semibold text-priority-high">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Habit Name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study 2h, Gym, Code"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Frequency Option */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Frequency</label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value)}
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Once a week)</option>
              <option value="selected_days">Selected Days</option>
            </select>
          </div>

          {/* Repeat Interval (Daily interval-based) */}
          {frequencyType === 'daily' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Interval (Days)</label>
              <input
                type="number"
                value={frequencyInterval}
                onChange={(e) => setFrequencyInterval(Math.max(1, Number(e.target.value)))}
                min="1"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-mono"
              />
              <span className="text-[10px] text-text-muted leading-none mt-1 block">
                1 = every day, 2 = every other day, etc.
              </span>
            </div>
          )}

          {/* Selected Days checkboxes */}
          {frequencyType === 'selected_days' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Choose Weekdays</label>
              <div className="flex justify-between gap-1">
                {weekdays.map(day => {
                  const isSelected = frequencyDays.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => handleWeekdayToggle(day.value)}
                      className={`w-9 h-9 rounded-full border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-brand-purple border-brand-purple text-bg-base' 
                          : 'bg-zinc-900/60 border-border-card/50 text-text-muted hover:border-brand-purple/40'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit State Pause switch */}
          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-zinc-900/20 border border-border-card/30 rounded-xl">
              <div>
                <span className="text-xs font-bold text-text-primary block">Active Status</span>
                <span className="text-[10px] text-text-muted block mt-0.5">
                  Paused habits do not count as missed occurrences.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border-card text-brand-purple focus:ring-brand-purple cursor-pointer"
              />
            </div>
          )}

          {/* Buttons actions */}
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
              {saving ? 'Saving...' : isEditing ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
