import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePomodoro } from '../context/PomodoroContext';
import { repo } from '../services/repo';
import { taskService } from '../services/taskService';
import AttachmentsList from '../components/ui/AttachmentsList';

import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

import { 
  ArrowLeft, CheckCircle2, Clock, Calendar, Tag, Shield, 
  Play, BookOpen, Trash2, Edit3, ChevronUp, ChevronDown, Check, Plus, AlertCircle, Bot
} from 'lucide-react';

export default function TaskDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { startTimer, triggerTaskSound } = usePomodoro();

  // Core Data States
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input editing states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [notesText, setNotesText] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const loadWorkspaceData = async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const [taskItem, subtaskList, examsList] = await Promise.all([
        taskService.get(id),
        repo.subtasks.list(id),
        repo.exams.list(user.id)
      ]);

      if (!taskItem) {
        toast.error('Task not found.');
        navigate('/tasks');
        return;
      }

      setTask(taskItem);
      setSubtasks(subtaskList.sort((a, b) => a.position - b.position));
      setExams(examsList);
      setNotesText(taskItem.notes || '');
    } catch (e) {
      console.error(e);
      toast.error('Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [id, user]);

  // Task Completion Toggle
  const handleToggleTaskComplete = async () => {
    if (!task) return;
    try {
      const isCompleted = task.status === 'completed';
      if (isCompleted) {
        await taskService.uncomplete(task.id);
        toast.success('Task marked incomplete.');
      } else {
        triggerTaskSound();
        await taskService.complete(task.id);
        toast.success('Task completed!');
      }
      // Reload task data
      const updated = await taskService.get(task.id);
      setTask(updated);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task.');
    }
  };

  // Exam Link Handler
  const handleLinkExamChange = async (e) => {
    if (!task) return;
    const examId = e.target.value || null;
    try {
      await taskService.update(task.id, { exam_id: examId });
      toast.success(examId ? 'Task linked to exam' : 'Exam link removed');
      const updated = await taskService.get(task.id);
      setTask(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update exam association.');
    }
  };

  // Notes Saving
  const handleSaveNotes = async () => {
    if (!task) return;
    try {
      await taskService.update(task.id, { notes: notesText });
      toast.success('Notes saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notes.');
    }
  };

  // Focus trigger
  const handleStartFocus = () => {
    if (!task) return;
    startTimer(task.id, task.subject);
    toast.success(`Focus session started for: ${task.title}`);
    navigate('/focus');
  };

  // Subtasks CRUD
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      await repo.subtasks.create(task.id, user.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      // Reload subtasks list
      const subtaskList = await repo.subtasks.list(task.id);
      setSubtasks(subtaskList.sort((a, b) => a.position - b.position));
      toast.success('Subtask added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subtask.');
    }
  };

  const handleToggleSubtask = async (sub) => {
    try {
      await repo.subtasks.update(sub.id, { completed: !sub.completed });
      const subtaskList = await repo.subtasks.list(task.id);
      setSubtasks(subtaskList.sort((a, b) => a.position - b.position));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update subtask.');
    }
  };

  const handleStartEditSubtask = (sub) => {
    setEditingSubtaskId(sub.id);
    setEditingSubtaskTitle(sub.title);
  };

  const handleSaveEditSubtask = async (sub) => {
    if (!editingSubtaskTitle.trim()) return;
    try {
      await repo.subtasks.update(sub.id, { title: editingSubtaskTitle.trim() });
      setEditingSubtaskId(null);
      const subtaskList = await repo.subtasks.list(task.id);
      setSubtasks(subtaskList.sort((a, b) => a.position - b.position));
      toast.success('Subtask updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save subtask.');
    }
  };

  const handleDeleteSubtask = async (subId) => {
    try {
      await repo.subtasks.delete(subId);
      const subtaskList = await repo.subtasks.list(task.id);
      setSubtasks(subtaskList.sort((a, b) => a.position - b.position));
      toast.success('Subtask deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subtask.');
    }
  };

  const handleReorderSubtask = async (idx, direction) => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= subtasks.length) return;

    try {
      const copy = [...subtasks];
      const temp = copy[idx];
      copy[idx] = copy[newIdx];
      copy[newIdx] = temp;

      // Update positions
      await Promise.all(copy.map((sub, i) => repo.subtasks.update(sub.id, { position: i })));
      setSubtasks(copy);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder subtask.');
    }
  };

  // Subtask progress calculations
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskProgress = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-full h-12" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const isTaskCompleted = task.status === 'completed';
  const linkedExam = exams.find(e => e.id === task.exam_id);

  return (
    <div className="space-y-6 text-left">
      {/* Top navbar controls */}
      <div className="flex items-center justify-between border-b border-border-card/25 pb-4">
        <Link 
          to="/tasks" 
          className="text-xs font-semibold text-text-muted hover:text-brand-purple flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleToggleTaskComplete}
            variant={isTaskCompleted ? 'secondary' : 'primary'}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3.5 rounded-lg font-bold border transition-all ${
              isTaskCompleted 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40' 
                : 'bg-zinc-900 border-border-card/60 text-text-muted hover:border-brand-purple/50 hover:text-text-primary'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isTaskCompleted ? 'Completed' : 'Mark Complete'}
          </Button>

          <Link
            to={`/ai-assistant?subject=${encodeURIComponent(task.subject || '')}&topic=${encodeURIComponent(task.title || '')}`}
            className="bg-zinc-900 border border-border-card/60 hover:border-brand-purple/50 text-text-muted hover:text-brand-purple-hover flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-semibold transition-all hover:scale-102 active:scale-98"
            title="Ask AI Study Assistant about this task"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </Link>

          <Button
            onClick={handleStartFocus}
            variant="primary"
            className="bg-brand-purple hover:bg-brand-purple-hover text-white flex items-center gap-1.5 text-xs py-1.5 px-3.5 rounded-lg font-semibold shadow-lg shadow-brand-purple/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Focus
          </Button>
        </div>
      </div>

      {/* Title & Metadata Headers */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-primary leading-tight">
          {task.title}
        </h1>
        
        {/* Badges and due date descriptors */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-text-muted/60" />
            <span>Due {task.due_date} {task.due_time && `at ${task.due_time}`}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-text-muted/60" />
            <span>{task.estimated_minutes ? `${task.estimated_minutes} mins` : 'No duration'}</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          
          <span className="bg-brand-purple-bg text-brand-purple-hover px-2 py-0.5 rounded border border-brand-purple/10 uppercase tracking-wider font-bold text-[9px] leading-none">
            {task.subject}
          </span>

          <span className="bg-zinc-900 text-text-muted px-2 py-0.5 rounded border border-border-card/60 uppercase tracking-wider font-bold text-[9px] leading-none">
            {task.category}
          </span>

          <span className={`px-2 py-0.5 rounded border uppercase tracking-wider font-bold text-[9px] leading-none ${
            task.priority === 'high' 
              ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' 
              : task.priority === 'medium'
                ? 'bg-orange-950/20 border-orange-500/20 text-orange-400'
                : 'bg-zinc-900 border-border-card/60 text-text-muted'
          }`}>
            {task.priority} Priority
          </span>
        </div>
      </div>

      {/* Two-Column Grid layout workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Description, Exam linking, Notes */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Description */}
          <Card className="border border-border-card/30 bg-bg-card/40">
            <CardHeader className="p-4 pb-2 border-b border-border-card/10">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Description</span>
            </CardHeader>
            <CardBody className="p-4 text-xs text-text-muted leading-relaxed font-normal">
              {task.description ? (
                <p className="whitespace-pre-wrap">{task.description}</p>
              ) : (
                <span className="italic text-text-muted/50">No description provided for this task.</span>
              )}
            </CardBody>
          </Card>

          {/* Related Exam link setup */}
          <Card className="border border-border-card/30 bg-bg-card/40">
            <CardHeader className="p-4 pb-2 border-b border-border-card/10">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Exam Association</span>
            </CardHeader>
            <CardBody className="p-4 text-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-text-muted block">Associate to Exam:</span>
                  <span className="text-[10px] text-text-muted/65 block mt-0.5">
                    Link this preparation task to an upcoming exam.
                  </span>
                </div>
                <select
                  value={task.exam_id || ''}
                  onChange={handleLinkExamChange}
                  className="bg-zinc-900 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple min-w-[200px]"
                >
                  <option value="">None / Unlinked</option>
                  {exams.filter(e => e.date >= getTodayDateString()).map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title} ({exam.subject})</option>
                  ))}
                </select>
              </div>

              {linkedExam && (
                <div className="flex items-center gap-2 p-3 bg-zinc-950/20 border border-border-card/25 rounded-xl">
                  <BookOpen className="w-4 h-4 text-brand-purple" />
                  <div className="min-w-0 leading-tight">
                    <span className="text-[10px] text-brand-purple-hover uppercase font-bold tracking-wider block">Associated Exam</span>
                    <Link to="/exams" className="text-xs font-bold text-text-primary hover:underline truncate block mt-0.5">
                      {linkedExam.title} — {linkedExam.subject}
                    </Link>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Task Notes editor */}
          <Card className="border border-border-card/30 bg-bg-card/40">
            <CardHeader className="p-4 pb-2 border-b border-border-card/10 flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Workspace Notes</span>
              <button
                onClick={handleSaveNotes}
                className="text-[10px] font-bold text-brand-purple bg-brand-purple-bg px-2.5 py-1 rounded border border-brand-purple/10 hover:border-brand-purple/35 cursor-pointer"
              >
                Save Notes
              </button>
            </CardHeader>
            <CardBody className="p-4">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Jot down notes, links, codes or draft checklist comments..."
                rows="5"
                className="w-full bg-zinc-900/60 border border-border-card/85 rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple resize-none"
              />
            </CardBody>
          </Card>

          {/* Reusable Attachments System */}
          <AttachmentsList entityType="task" entityId={task.id} />
        </div>

        {/* Right Column: Subtasks checklist tracker */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card className="border border-border-card/30 bg-bg-card/40">
            <CardHeader className="p-4 pb-2 border-b border-border-card/10">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Subtasks Checklist</span>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              {/* Progress bar info */}
              {subtaskProgress !== null && (
                <div className="space-y-1.5 p-3 bg-zinc-900/30 border border-border-card/20 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                    <span>Task Progress</span>
                    <span className="text-brand-purple">{completedSubtasks} / {totalSubtasks} ({subtaskProgress}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div 
                      className="bg-brand-purple h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Add subtask input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-border-card/85 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="submit"
                  className="bg-brand-purple hover:bg-brand-purple-hover p-2 rounded-lg text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* List of subtasks */}
              {subtasks.length === 0 ? (
                <div className="py-8 text-center text-text-muted/50 text-xs">
                  No subtasks added yet. Define breakdown study tasks.
                </div>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((sub, idx) => {
                    const isDone = sub.completed;
                    const isEditing = editingSubtaskId === sub.id;

                    return (
                      <div 
                        key={sub.id}
                        className="p-2.5 rounded-xl border border-border-card/30 bg-zinc-900/10 flex items-center justify-between gap-3 text-xs leading-none"
                      >
                        {/* Checkbox and title */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <button
                            onClick={() => handleToggleSubtask(sub)}
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                : 'border-border-card bg-zinc-900/60 hover:border-brand-purple/50'
                            }`}
                          >
                            {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>

                          {isEditing ? (
                            <input
                              type="text"
                              value={editingSubtaskTitle}
                              onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                              onBlur={() => handleSaveEditSubtask(sub)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEditSubtask(sub)}
                              className="bg-zinc-950 border border-border-card rounded px-2 py-0.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple flex-1 font-sans font-normal"
                              autoFocus
                            />
                          ) : (
                            <span 
                              onClick={() => handleStartEditSubtask(sub)}
                              className={`truncate cursor-pointer hover:text-brand-purple-hover select-none ${
                                isDone ? 'line-through text-text-muted/60' : 'text-text-primary'
                              }`}
                            >
                              {sub.title}
                            </span>
                          )}
                        </div>

                        {/* Arrows reordering and deletion controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Reorder Up */}
                          <button
                            onClick={() => handleReorderSubtask(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-text-muted/50 hover:text-text-primary disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Reorder Down */}
                          <button
                            onClick={() => handleReorderSubtask(idx, 'down')}
                            disabled={idx === subtasks.length - 1}
                            className="p-0.5 text-text-muted/50 hover:text-text-primary disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleStartEditSubtask(sub)}
                            className="p-0.5 text-text-muted/50 hover:text-cyan-400 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSubtask(sub.id)}
                            className="p-0.5 text-text-muted/50 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
