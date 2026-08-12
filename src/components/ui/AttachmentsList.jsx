import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attachmentService } from '../../services/attachmentService';
import { 
  FileText, Link as LinkIcon, Trash2, Download, Eye, 
  Upload, HelpCircle, FileImage, FileSpreadsheet, Play, ExternalLink, Plus 
} from 'lucide-react';
import { Button } from './Button';

export default function AttachmentsList({ entityType, entityId }) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // States
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Inline Add Link states
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const loadAttachments = async () => {
    if (!user || !entityId) return;
    try {
      setLoading(true);
      const list = await attachmentService.listForEntity(entityType, entityId);
      setAttachments(list);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load attachments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [entityId, entityType]);

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (files) => {
    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Save file blob to IndexedDB
        const savedAttachment = await attachmentService.createFile(user.id, file);
        // Link to the active entity
        await attachmentService.link(savedAttachment.id, entityType, entityId);
      }
      toast.success('File(s) uploaded successfully');
      await loadAttachments();
    } catch (err) {
      toast.error(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Add Link handler
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    try {
      setUploading(true);
      // Clean url prefix if missing
      let cleanUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const savedLink = await attachmentService.createUrl(user.id, linkTitle, cleanUrl);
      await attachmentService.link(savedLink.id, entityType, entityId);
      
      setLinkTitle('');
      setLinkUrl('');
      setShowLinkFields(false);
      toast.success('Link added');
      await loadAttachments();
    } catch (err) {
      toast.error(err.message || 'Failed to save link.');
    } finally {
      setUploading(false);
    }
  };

  // Delete handler
  const handleRemove = async (attachmentId) => {
    try {
      await attachmentService.unlink(attachmentId, entityType, entityId);
      toast.success('Attachment link removed');
      await loadAttachments();
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove attachment.');
    }
  };

  // Open/Preview / Download handler
  const handleOpen = (att) => {
    if (att.source_type === 'url') {
      window.open(att.source_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!att.file_blob) {
      toast.error('File data is missing.');
      return;
    }

    const url = URL.createObjectURL(att.file_blob);
    window.open(url, '_blank');
    // We do not revoke immediately to allow browser tab to load PDF/Image
  };

  const handleDownload = (att) => {
    if (att.source_type === 'url') {
      window.open(att.source_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!att.file_blob) {
      toast.error('File data is missing.');
      return;
    }

    const url = URL.createObjectURL(att.file_blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = att.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Icon Helper based on format
  const getFileIcon = (att) => {
    if (att.source_type === 'url') {
      return <LinkIcon className="w-4 h-4 text-cyan-400" />;
    }

    const mime = att.mime_type.toLowerCase();
    if (mime.includes('image')) {
      return <FileImage className="w-4 h-4 text-emerald-400" />;
    }
    if (mime.includes('pdf')) {
      return <FileText className="w-4 h-4 text-rose-400" />;
    }
    if (mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    }
    if (mime.includes('video') || mime.includes('audio')) {
      return <Play className="w-4 h-4 text-purple-400 fill-purple-400/20" />;
    }
    return <FileText className="w-4 h-4 text-zinc-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-1.5 py-2">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Attachments</span>
        <div className="h-10 bg-zinc-900/30 border border-border-card/20 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          Attachments ({attachments.length})
        </span>
        
        <button
          onClick={() => setShowLinkFields(!showLinkFields)}
          className="text-[9px] font-bold text-brand-purple bg-brand-purple-bg px-2 py-0.5 rounded border border-brand-purple/10 hover:border-brand-purple/35 cursor-pointer"
        >
          {showLinkFields ? 'Cancel' : '+ Add Link'}
        </button>
      </div>

      {/* Add Link Inline Form */}
      {showLinkFields && (
        <form onSubmit={handleAddLink} className="p-3 bg-zinc-950/40 border border-border-card/30 rounded-xl space-y-2 text-left">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Link Title (e.g. YouTube Lecture)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="bg-zinc-900 border border-border-card rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
            <input
              type="text"
              placeholder="URL (e.g. youtube.com/...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-zinc-900 border border-border-card rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="bg-brand-purple text-[10px] font-bold py-1 px-3 rounded"
              disabled={uploading}
            >
              Add Link
            </Button>
          </div>
        </form>
      )}

      {/* List items uploaded */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {attachments.map((att) => (
            <div 
              key={att.id}
              className="p-2.5 rounded-xl border border-border-card/30 bg-zinc-950/20 flex items-center justify-between gap-3 text-xs leading-none"
            >
              <div 
                onClick={() => handleOpen(att)}
                className="flex items-center gap-2 min-w-0 pr-3 cursor-pointer group"
              >
                {getFileIcon(att)}
                <div className="min-w-0 text-left">
                  <span className="font-semibold block truncate text-text-primary group-hover:text-brand-purple-hover transition-colors">
                    {att.file_name}
                  </span>
                  <span className="text-[9px] text-text-muted font-mono block mt-0.5 uppercase">
                    {att.source_type === 'url' ? 'External link' : formatSize(att.size_bytes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Preview / Open */}
                <button
                  onClick={() => handleOpen(att)}
                  className="p-1 rounded bg-zinc-900 border border-border-card hover:border-brand-purple/40 text-text-muted hover:text-brand-purple cursor-pointer transition-all"
                  title="Open / Preview"
                >
                  {att.source_type === 'url' ? <ExternalLink className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>

                {/* Download (if local file) */}
                {att.source_type === 'file' && (
                  <button
                    onClick={() => handleDownload(att)}
                    className="p-1 rounded bg-zinc-900 border border-border-card hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 cursor-pointer transition-all"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemove(att.id)}
                  className="p-1 rounded bg-zinc-900 border border-border-card hover:border-rose-500/40 text-text-muted hover:text-rose-400 cursor-pointer transition-all"
                  title="Remove link"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag & drop upload area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-brand-purple bg-brand-purple-bg/10' 
            : 'border-border-card/40 hover:border-brand-purple/50 bg-zinc-900/10'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          onChange={handleFileSelect} 
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center gap-1.5 text-text-muted">
          <Upload className={`w-5 h-5 ${dragActive ? 'text-brand-purple animate-bounce' : ''}`} />
          <div className="text-[11px] font-semibold text-text-primary">
            {uploading ? 'Processing files...' : 'Drag & drop files here, or click to choose'}
          </div>
          <span className="text-[9px] text-text-muted/60 leading-none">
            PDF, Image, Text or Document up to 20MB
          </span>
        </div>
      </div>
    </div>
  );
}
