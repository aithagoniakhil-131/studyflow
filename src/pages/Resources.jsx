import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { repo } from '../services/repo';
import { attachmentService } from '../services/attachmentService';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import ResourceFormModal, { RESOURCE_TYPES } from '../components/resources/ResourceFormModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';
import AttachmentsList from '../components/ui/AttachmentsList';

import { 
  Plus, Search, FileText, FileImage, FileSpreadsheet, Play, Link as LinkIcon, 
  Trash2, Edit3, Eye, Download, ExternalLink, ChevronDown, ChevronUp, BookOpen, Library 
} from 'lucide-react';

export default function Resources() {
  const { user } = useAuth();
  const toast = useToast();

  // Core Data States
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, files, links, PDFs, documents, images, videos
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Accordion expanded resource details for attachments lists (keyed by resource.id)
  const [expandedResourceId, setExpandedResourceId] = useState(null);

  // Modals controllers
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeResource, setActiveResource] = useState(null);

  const loadResources = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await repo.resources.list(user.id);
      setResources(list);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Unable to load your resources vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [user]);

  // Form submit handler
  const handleSaveResource = async (formData, fileToUpload) => {
    try {
      if (activeResource) {
        // Edit update
        await repo.resources.update(activeResource.id, formData);
        toast.success('Resource updated successfully');
      } else {
        // Create new resource
        const newResource = await repo.resources.create(user.id, formData);

        // If file selected, save file and link it to the resource
        if (fileToUpload) {
          const savedAtt = await attachmentService.createFile(user.id, fileToUpload);
          await attachmentService.link(savedAtt.id, 'resource', newResource.id);
        } else if (formData.url) {
          // If URL link provided, save url and link it to the resource
          const savedLink = await attachmentService.createUrl(user.id, formData.title, formData.url);
          await attachmentService.link(savedLink.id, 'resource', newResource.id);
        }

        toast.success('Resource saved to vault');
      }
      await loadResources();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save resource.');
      throw err;
    }
  };

  // Delete Resource handler
  const handleDeleteConfirm = async () => {
    if (!activeResource) return;
    try {
      // 1. Delete the resource record itself
      await repo.resources.delete(activeResource.id);
      
      // 2. Fetch linked attachments
      const links = await attachmentService.listForEntity('resource', activeResource.id);
      for (let i = 0; i < links.length; i++) {
        // 3. Unlink attachments (automatically garbage collects if no other links reference them)
        await attachmentService.unlink(links[i].id, 'resource', activeResource.id);
      }

      toast.success('Resource deleted from vault');
      setDeleteOpen(false);
      setActiveResource(null);
      await loadResources();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete resource.');
    }
  };

  // Helper to open/preview/download the primary attachment/link
  const handleOpenPrimary = async (res) => {
    try {
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        return;
      }

      const attachments = await attachmentService.listForEntity('resource', res.id);
      if (attachments.length === 0) {
        toast.info('No files attached to this resource yet. Expand details to upload files.');
        setExpandedResourceId(res.id);
        return;
      }

      const primary = attachments[0];
      if (primary.source_type === 'url') {
        window.open(primary.source_url, '_blank', 'noopener,noreferrer');
      } else {
        const url = URL.createObjectURL(primary.file_blob);
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to open resource.');
    }
  };

  // File Icon helper
  const getResourceIcon = (type) => {
    const t = type.toLowerCase();
    if (['pdf'].includes(t)) {
      return <FileText className="w-8 h-8 text-rose-400" />;
    }
    if (['image'].includes(t)) {
      return <FileImage className="w-8 h-8 text-emerald-400" />;
    }
    if (['spreadsheet'].includes(t)) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    }
    if (['video'].includes(t)) {
      return <Play className="w-8 h-8 text-purple-400 fill-purple-400/20" />;
    }
    if (['website', 'article', 'github', 'link'].includes(t)) {
      return <LinkIcon className="w-8 h-8 text-cyan-400" />;
    }
    return <BookOpen className="w-8 h-8 text-zinc-400" />;
  };

  // Filters math
  const uniqueSubjects = Array.from(new Set(resources.map(r => r.subject))).filter(Boolean);

  const filteredResources = resources.filter(res => {
    // Search
    const searchMatch = !searchTerm.trim() || 
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Subject Filter
    if (subjectFilter !== 'all' && res.subject !== subjectFilter) return false;

    // Type Filter
    if (typeFilter === 'all') return true;
    if (typeFilter === 'files') {
      return ['PDF', 'Document', 'Presentation', 'Spreadsheet', 'Image', 'Text', 'Archive', 'Other'].includes(res.type);
    }
    if (typeFilter === 'links') {
      return ['Website', 'Article', 'GitHub', 'Video', 'Book'].includes(res.type) || !!res.url;
    }
    if (typeFilter === 'pdf') return res.type === 'PDF';
    if (typeFilter === 'documents') return ['Document', 'Presentation', 'Text'].includes(res.type);
    if (typeFilter === 'images') return res.type === 'Image';
    if (typeFilter === 'videos') return res.type === 'Video';

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-32 h-8" />
        </div>
        <Skeleton className="w-full h-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Learning Vault</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Access references, slides, study links, and attachment repositories.</p>
        </div>
        
        <Button 
          variant="primary" 
          onClick={() => {
            setActiveResource(null);
            setFormOpen(true);
          }}
          className="bg-brand-purple hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/20 flex items-center gap-1.5 font-semibold text-xs py-2 px-4 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {/* Toolbar filters and search queries */}
      <Card className="border border-border-card/30 bg-bg-card/30">
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vault by title, subject, description..."
              className="w-full bg-zinc-900/60 border border-border-card/85 rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple placeholder:text-text-muted/60"
            />
          </div>

          {/* Filters selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-zinc-900/60 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Types</option>
                <option value="files">Files Only</option>
                <option value="links">Links Only</option>
                <option value="pdf">PDF Documents</option>
                <option value="documents">Word/Text Slides</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-zinc-900/60 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main vault cards display grid */}
      {filteredResources.length === 0 ? (
        <Card className="border border-border-card/40 bg-bg-card/40 py-20 text-center max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-bold text-text-primary font-display">Your Vault is empty</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Upload course slides, reference formulas, lecture bookmarks, or notes. Associate files directly to tasks or exams to organize revisions.
          </p>
          <Button 
            variant="primary" 
            onClick={() => {
              setActiveResource(null);
              setFormOpen(true);
            }}
            className="bg-brand-purple hover:bg-brand-purple-hover"
          >
            Upload First Resource
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {filteredResources.map((res) => {
            const isExpanded = expandedResourceId === res.id;
            
            return (
              <Card 
                key={res.id}
                className="border border-border-card/30 bg-bg-card/50 hover:border-border-card/75 transition-all flex flex-col rounded-2xl overflow-hidden"
              >
                <CardBody className="p-5 space-y-3.5">
                  {/* Icon details, type, tags */}
                  <div className="flex items-start gap-4 justify-between">
                    <div className="p-3 bg-zinc-900/50 border border-border-card/30 rounded-xl">
                      {getResourceIcon(res.type)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <span className="text-[9px] font-bold text-brand-purple-hover uppercase tracking-wider bg-brand-purple-bg px-2 py-0.5 rounded border border-brand-purple/10">
                        {res.subject}
                      </span>
                      {res.topic && (
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider bg-zinc-900/80 px-2 py-0.5 rounded border border-border-card/40">
                          {res.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and notes summary */}
                  <div className="space-y-1">
                    <h3 
                      onClick={() => handleOpenPrimary(res)}
                      className="font-extrabold text-text-primary text-sm font-display leading-tight truncate hover:text-brand-purple-hover transition-colors cursor-pointer"
                      title={res.title}
                    >
                      {res.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed font-normal min-h-8 line-clamp-2">
                      {res.description || 'No summary notes added.'}
                    </p>
                  </div>

                  {/* Links / File URL detail fields */}
                  {res.url && (
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono truncate bg-zinc-950/20 px-2.5 py-1.5 rounded-lg border border-border-card/20">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                        {res.url}
                      </a>
                    </div>
                  )}

                  {/* Accordion buttons controllers */}
                  <div className="flex items-center justify-between border-t border-border-card/20 pt-3 text-xs font-semibold text-text-muted">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveResource(res);
                          setFormOpen(true);
                        }}
                        className="p-1 rounded bg-zinc-900 hover:border-cyan-500/40 hover:text-cyan-400 border border-border-card/60 cursor-pointer transition-all"
                        title="Edit resource info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveResource(res);
                          setDeleteOpen(true);
                        }}
                        className="p-1 rounded bg-zinc-900 hover:border-rose-500/40 hover:text-rose-400 border border-border-card/60 cursor-pointer transition-all"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedResourceId(isExpanded ? null : res.id)}
                      className="flex items-center gap-1 text-[11px] hover:text-text-primary cursor-pointer"
                    >
                      <span>Vault Files</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expand attachments list picker */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border-card/15 animate-fade-in text-left">
                      <AttachmentsList entityType="resource" entityId={res.id} />
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog for Resource */}
      <ResourceFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setActiveResource(null);
        }}
        onSave={handleSaveResource}
        resource={activeResource}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setActiveResource(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskTitle={activeResource ? activeResource.title : ''}
      />
    </div>
  );
}
