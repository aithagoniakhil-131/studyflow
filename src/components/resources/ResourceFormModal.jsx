import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X, Upload } from 'lucide-react';
import { attachmentService } from '../../services/attachmentService';
import { repo } from '../../services/repo';

export const RESOURCE_TYPES = [
  { value: 'PDF', label: 'PDF Document' },
  { value: 'Document', label: 'Word Document' },
  { value: 'Presentation', label: 'Presentation (PPTX)' },
  { value: 'Spreadsheet', label: 'Spreadsheet (XLSX)' },
  { value: 'Image', label: 'Image File' },
  { value: 'Text', label: 'Text File' },
  { value: 'Archive', label: 'Archive (ZIP)' },
  { value: 'Video', label: 'Video Lecture' },
  { value: 'Website', label: 'Website Link' },
  { value: 'Article', label: 'Article / Reading' },
  { value: 'GitHub', label: 'GitHub Repository' },
  { value: 'Book', label: 'E-Book / Reference' },
  { value: 'Other', label: 'Other' }
];

export default function ResourceFormModal({ isOpen, onClose, onSave, resource = null }) {
  const isEditing = !!resource;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PDF');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

  // File Upload states (only for file-backed resources during creation)
  const [selectedFile, setSelectedFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title || '');
        setDescription(resource.description || '');
        setType(resource.type || 'PDF');
        setSubject(resource.subject || '');
        setTopic(resource.topic || '');
        setUrl(resource.url || '');
        setSelectedFile(null);
      } else {
        setTitle('');
        setDescription('');
        setType('PDF');
        setSubject('');
        setTopic('');
        setUrl('');
        setSelectedFile(null);
      }
      setError('');
      setSaving(false);
    }
  }, [isOpen, resource]);

  const isFileType = ['PDF', 'Document', 'Presentation', 'Spreadsheet', 'Image', 'Text', 'Archive', 'Other'].includes(type) && !url;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Resource title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let payloadUrl = url.trim();
      if (!isFileType && payloadUrl) {
        if (!/^https?:\/\//i.test(payloadUrl)) {
          payloadUrl = 'https://' + payloadUrl;
        }
      }

      const resourcePayload = {
        title: title.trim(),
        description: description.trim(),
        type: type,
        url: isFileType ? '' : payloadUrl,
        subject: subject.trim(),
        topic: topic.trim()
      };

      await onSave(resourcePayload, selectedFile);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save resource.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-bg-card border border-border-card w-full max-w-lg rounded-2xl p-6 relative shadow-2xl glass-panel space-y-4 my-8 max-h-[90vh] overflow-y-auto text-left"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-extrabold font-display text-text-primary">
          {isEditing ? 'Edit Vault Resource' : 'Add Vault Resource'}
        </h2>

        {error && (
          <div className="p-3 bg-priority-high-bg/10 border border-priority-high/20 rounded-lg text-xs font-semibold text-priority-high">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Resource Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 4 Slides - Eigenvalues"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>

          {/* Type dropdown selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Resource Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
            >
              {RESOURCE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Linear Algebra"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Eigenvalues"
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Link URL (if link type) */}
          {!['PDF', 'Document', 'Presentation', 'Spreadsheet', 'Image', 'Text', 'Archive'].includes(type) ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">External Link URL *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. drive.google.com/..."
                className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
                required={!isEditing}
              />
            </div>
          ) : (
            /* File Picker (if file type and not editing) */
            !isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Upload File</label>
                <div 
                  onClick={() => document.getElementById('res-file-picker').click()}
                  className={`border border-dashed border-border-card/85 rounded-lg p-4 text-center cursor-pointer hover:border-brand-purple/50 bg-zinc-900/20 flex flex-col items-center justify-center gap-1.5 transition-colors`}
                >
                  <input
                    id="res-file-picker"
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <Upload className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-primary font-semibold">
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </span>
                  <span className="text-[10px] text-text-muted/65">
                    {selectedFile ? `(${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Max file size is 20MB'}
                  </span>
                </div>
              </div>
            )
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add summary notes or context for this material..."
              rows="3"
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>

          {/* Form Actions */}
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
              disabled={saving}
              className="bg-brand-purple hover:bg-brand-purple-hover text-white shadow-lg shadow-brand-purple/20 px-5 rounded-lg text-xs font-semibold"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Resource' : 'Add Resource'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
