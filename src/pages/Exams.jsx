import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePomodoro } from '../context/PomodoroContext';
import { repo } from '../services/repo';
import { taskService } from '../services/taskService';
import { getTodayDateString, formatLocalDateString } from '../services/habitService';

import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import ExamFormModal from '../components/exams/ExamFormModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';
import TaskFormModal from '../components/tasks/TaskFormModal';
import AttachmentsList from '../components/ui/AttachmentsList';

import { 
  Plus, Calendar, Clock, MapPin, ListChecks, FileText, 
  Trash2, Edit3, Search, AlertCircle, CheckCircle2, ChevronDown, 
  ChevronUp, Check, Play, BookOpen, AlertTriangle, Link as LinkIcon 
} from 'lucide-react';

export default function Exams() {
  const { user } = useAuth();
  const toast = useToast();
  const { startTimer, triggerTaskSound } = usePomodoro();

  // Core Data States
  const [exams, setExams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, Quiz, Mid Semester, End Semester, Lab Exam, Viva, Assignment/Submission, Other

  // Accordion/Expanded states for syllabus & prep tasks (keyed by exam.id)
  const [expandedExamId, setExpandedExamId] = useState(null);

  // Modals controllers
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  
  const [activeExam, setActiveExam] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const loadExamsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [examsList, tasksList] = await Promise.all([
        repo.exams.list(user.id),
        taskService.list(user.id)
      ]);
      setExams(examsList);
      setTasks(tasksList);
      setError(null);
    } catch (err) {
      console.error('Failed to load exams data:', err);
      setError('Unable to load your exams and preparation plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamsData();
  }, [user]);

  // Exam Actions
  const handleSaveExam = async (formData) => {
    try {
      if (activeExam) {
        await repo.exams.update(activeExam.id, formData);
        toast.success('Exam updated successfully');
      } else {
        await repo.exams.create(user.id, formData);
        toast.success('Exam scheduled successfully');
      }
      await loadExamsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save exam details.');
      throw e;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeExam) return;
    try {
      await repo.exams.delete(activeExam.id);
      toast.success('Exam deleted');
      setDeleteModalOpen(false);
      setActiveExam(null);
      await loadExamsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete exam.');
    }
  };

  // Toggle individual syllabus topic completeness
  const handleToggleSyllabusTopic = async (exam, topic, isCurrentlyCompleted) => {
    try {
      let completedList = exam.syllabus_completed || [];
      if (isCurrentlyCompleted) {
        completedList = completedList.filter(t => t !== topic);
      } else {
        completedList = [...completedList, topic];
      }

      await repo.exams.update(exam.id, { syllabus_completed: completedList });
      await loadExamsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update preparation status.');
    }
  };

  // Prep Task Actions (Creates linked tasks using exam_id field)
  const handleSavePrepTask = async (formData) => {
    try {
      if (activeTask) {
        await taskService.update(activeTask.id, formData);
        toast.success('Preparation task updated');
      } else {
        // Automatically inject exam_id to link it
        await taskService.create(user.id, {
          ...formData,
          category: 'Revision',
          exam_id: activeExam.id
        });
        toast.success('Preparation task added');
      }
      await loadExamsData();
    } catch (e) {
      toast.error(e.message || 'Failed to save task.');
      throw e;
    }
  };

  const handleToggleTaskComplete = async (taskId, isCurrentlyCompleted) => {
    try {
      if (isCurrentlyCompleted) {
        await taskService.uncomplete(taskId);
        toast.success('Task marked incomplete.');
      } else {
        triggerTaskSound();
        await taskService.complete(taskId);
        toast.success('Task completed!');
      }
      await loadExamsData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task.');
    }
  };

  // Calculations for dates and countdowns
  const todayStr = getTodayDateString();
  const getDaysRemaining = (examDateStr) => {
    const examDate = new Date(examDateStr + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffTime = examDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter & Search
  const filteredExams = exams.filter(exam => {
    const searchMatch = !searchTerm.trim() || 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    if (typeFilter !== 'all' && exam.exam_type !== typeFilter) return false;

    return true;
  });

  // Sort upcoming and past
  const upcomingExams = filteredExams
    .filter(exam => exam.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastExams = filteredExams
    .filter(exam => exam.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Urgency Classification
  const getUrgencySettings = (days) => {
    if (days <= 2) {
      return {
        label: 'Urgent ⚠️',
        borderClass: 'border-rose-500/40 bg-rose-950/5 hover:border-rose-500/60',
        textClass: 'text-rose-400 bg-rose-950/20'
      };
    }
    if (days <= 7) {
      return {
        label: 'High Attention',
        borderClass: 'border-orange-500/30 hover:border-orange-500/50',
        textClass: 'text-orange-400 bg-orange-950/20'
      };
    }
    if (days <= 14) {
      return {
        label: 'Upcoming',
        borderClass: 'border-cyan-500/25 hover:border-cyan-500/45 bg-cyan-950/5',
        textClass: 'text-cyan-400 bg-cyan-950/20'
      };
    }
    return {
      label: 'Normal',
      borderClass: 'border-border-card/30 hover:border-border-card/60 bg-bg-card/50',
      textClass: 'text-text-muted bg-zinc-900/60'
    };
  };

  const formatTimeDisplay = (timeStr) => {
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="flex items-center justify-between">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-32 h-8" />
        </div>
        <Skeleton className="w-full h-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-text-primary">Exams & Syllabus</h1>
          <p className="text-xs text-text-muted mt-1 leading-none">Track syllabus coverage, approaching countdowns, and preparatory revisions.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setActiveExam(null);
            setExamModalOpen(true);
          }}
          className="bg-brand-purple hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/20 flex items-center gap-1.5 font-semibold text-xs py-2 px-4 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Exam
        </Button>
      </div>

      {/* Searching / Filtering Toolbar */}
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
              placeholder="Search exams by title, subject, notes..."
              className="w-full bg-zinc-900/60 border border-border-card/80 rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-purple placeholder:text-text-muted/60"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-900/60 border border-border-card rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Types</option>
              <option value="Quiz">Quiz</option>
              <option value="Mid Semester">Mid Sem</option>
              <option value="End Semester">End Sem</option>
              <option value="Lab Exam">Lab Exam</option>
              <option value="Viva">Viva</option>
              <option value="Assignment/Submission">Assignment</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Main upcoming grid */}
      {filteredExams.length === 0 ? (
        <Card className="border border-border-card/40 bg-bg-card/40 py-20 text-center max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-bold text-text-primary font-display">No exams scheduled</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Create your first exam. Track syllabus details, room venues, and map preparation tasks to secure your goals.
          </p>
          <Button 
            variant="primary" 
            onClick={() => {
              setActiveExam(null);
              setExamModalOpen(true);
            }}
            className="bg-brand-purple hover:bg-brand-purple-hover"
          >
            + Schedule Exam
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Section */}
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold font-display text-text-primary border-l-2 border-brand-purple pl-2.5 leading-none">
                Upcoming Exams
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {upcomingExams.map((exam) => {
                  const daysLeft = getDaysRemaining(exam.date);
                  const urgency = getUrgencySettings(daysLeft);

                  // Prep tasks
                  const prepTasks = tasks.filter(t => t.exam_id === exam.id && t.status !== 'cancelled');
                  const completedPrep = prepTasks.filter(t => t.status === 'completed');

                  // Syllabus math
                  const syllabus = exam.syllabus || [];
                  const syllabusCompleted = exam.syllabus_completed || [];
                  const prepPercentage = syllabus.length > 0
                    ? Math.round((syllabusCompleted.length / syllabus.length) * 100)
                    : null;

                  const isExpanded = expandedExamId === exam.id;

                  // Label days remaining
                  let countdownText = 'Today';
                  if (daysLeft === 1) countdownText = 'Tomorrow';
                  else if (daysLeft > 1) countdownText = `${daysLeft} Days Left`;

                  return (
                    <Card 
                      key={exam.id}
                      className={`border transition-all flex flex-col rounded-2xl overflow-hidden ${urgency.borderClass}`}
                    >
                      <CardBody className="p-5 space-y-4">
                        {/* Type, Days remaining, and title */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold text-brand-purple-hover uppercase tracking-wider">
                                {exam.subject}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border leading-none ${urgency.textClass}`}>
                                {exam.exam_type}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-text-primary font-display mt-1">
                              {exam.title}
                            </h3>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-black font-display px-2.5 py-1 rounded-lg uppercase tracking-wide inline-block ${
                              daysLeft <= 2 
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                                : daysLeft <= 7
                                  ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                                  : 'bg-zinc-900/60 text-text-muted border border-border-card/30'
                            }`}>
                              {countdownText}
                            </span>
                          </div>
                        </div>

                        {/* Location, date, details row */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3.5 h-3.5 text-text-muted/60" />
                            <span>{exam.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-text-muted/60" />
                            <span>{exam.time ? formatTimeDisplay(exam.time) : 'TBA'}</span>
                          </div>
                          {exam.location && (
                            <div className="flex items-center gap-1.5 col-span-2 truncate">
                              <MapPin className="w-3.5 h-3.5 text-text-muted/60" />
                              <span>{exam.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Prep Consistency progress bar */}
                        <div className="space-y-1.5 p-3 bg-zinc-900/20 border border-border-card/25 rounded-xl text-xs">
                          <div className="flex justify-between items-center font-semibold text-text-muted">
                            <span>Syllabus Prep Progress</span>
                            <span className="text-brand-purple font-bold">
                              {prepPercentage !== null ? `${prepPercentage}%` : 'No syllabus'}
                            </span>
                          </div>
                          {prepPercentage !== null ? (
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                              <div 
                                className="bg-brand-purple h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${prepPercentage}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted/60 italic block mt-0.5">
                              Add syllabus topics to track preparation.
                            </span>
                          )}
                        </div>

                        {/* Notes snippet */}
                        {exam.notes && (
                          <p className="text-xs text-text-muted italic bg-zinc-950/10 p-2.5 rounded-lg border border-border-card/20 leading-relaxed font-normal">
                            {exam.notes}
                          </p>
                        )}

                        {/* Expand checklists accordion buttons */}
                        <div className="flex items-center justify-between border-t border-border-card/20 pt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveExam(exam);
                                setExamModalOpen(true);
                              }}
                              className="p-1.5 rounded bg-zinc-900 hover:border-cyan-500/40 text-text-muted hover:text-cyan-400 cursor-pointer transition-all border border-border-card/60"
                              title="Edit exam settings"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveExam(exam);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded bg-zinc-900 hover:border-rose-500/40 text-text-muted hover:text-rose-400 cursor-pointer transition-all border border-border-card/60"
                              title="Delete exam"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary cursor-pointer font-semibold"
                          >
                            <span>Preparation Details</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded Area: Syllabus Checklist & linked Prep Tasks */}
                        {isExpanded && (
                          <div className="space-y-4 pt-3 border-t border-border-card/20 animate-fade-in">
                            {/* Syllabus tracker */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                                <ListChecks className="w-3.5 h-3.5" />
                                Syllabus Checklist ({syllabusCompleted.length} / {syllabus.length})
                              </span>
                              
                              {syllabus.length === 0 ? (
                                <span className="text-[10px] text-text-muted/60 italic block pl-1">
                                  No syllabus topics added yet. Click edit to define.
                                </span>
                              ) : (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-zinc-950/20 border border-border-card/25 rounded-xl">
                                  {syllabus.map(topic => {
                                    const isDone = syllabusCompleted.includes(topic);
                                    return (
                                      <div key={topic} className="flex items-center gap-2 text-xs leading-none">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSyllabusTopic(exam, topic, isDone)}
                                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                            isDone 
                                              ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                              : 'border-border-card bg-zinc-950/40 hover:border-brand-purple/40'
                                          }`}
                                        >
                                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </button>
                                        <span className={isDone ? 'line-through text-text-muted/65' : 'text-text-primary'}>
                                          {topic}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Linked Revisions Tasks lists */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Preparation Tasks ({completedPrep.length} / {prepTasks.length})
                                </span>
                                
                                <button
                                  onClick={() => {
                                    setActiveExam(exam);
                                    setActiveTask(null);
                                    setTaskModalOpen(true);
                                  }}
                                  className="flex items-center gap-0.5 text-[9px] font-bold text-brand-purple bg-brand-purple-bg px-2 py-0.5 rounded border border-brand-purple/10 hover:border-brand-purple/35 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Task
                                </button>
                              </div>

                              {prepTasks.length === 0 ? (
                                <span className="text-[10px] text-text-muted/60 italic block pl-1">
                                  No prep tasks created yet. Create one to organize schedules.
                                </span>
                              ) : (
                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                  {prepTasks.map(task => {
                                    const isDone = task.status === 'completed';
                                    return (
                                      <div 
                                        key={task.id}
                                        className="p-2.5 rounded-xl border border-border-card/30 bg-zinc-950/20 flex items-center justify-between gap-3 text-xs leading-none"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                          <button
                                            onClick={() => handleToggleTaskComplete(task.id, isDone)}
                                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                                              isDone 
                                                ? 'bg-brand-purple border-brand-purple text-bg-base' 
                                                : 'border-border-card bg-zinc-900/60 hover:border-brand-purple/50'
                                            }`}
                                          >
                                            {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                          </button>
                                          <span className={`truncate ${isDone ? 'line-through text-text-muted/60' : 'text-text-primary'}`}>
                                            {task.title}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {task.due_date && (
                                            <span className="text-[8px] font-mono text-text-muted">{task.due_date}</span>
                                          )}
                                          
                                          {/* Focus Play triggers */}
                                          {!isDone && (
                                            <button
                                              onClick={() => {
                                                startTimer(task.id, task.subject);
                                                toast.success(`Focus timer started for: ${task.title}`);
                                                window.location.hash = '#/focus';
                                              }}
                                              className="p-0.5 rounded bg-zinc-900 hover:border-brand-purple/35 text-text-muted hover:text-brand-purple cursor-pointer transition-all border border-border-card/50"
                                              title="Start focus study timer"
                                            >
                                              <Play className="w-3 h-3 fill-current" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Reusable Attachments Section */}
                            <AttachmentsList entityType="exam" entityId={exam.id} />
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Section */}
          {pastExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold font-display text-text-primary border-l-2 border-zinc-700 pl-2.5 leading-none">
                Past Exams
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastExams.map((exam) => {
                  const daysAgo = Math.abs(getDaysRemaining(exam.date));

                  return (
                    <Card key={exam.id} className="border border-border-card/25 bg-bg-card/20 opacity-60 flex flex-col rounded-xl">
                      <CardBody className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
                              {exam.subject} • {exam.exam_type}
                            </span>
                            <h3 className="text-sm font-bold text-text-primary font-display mt-0.5">
                              {exam.title}
                            </h3>
                          </div>

                          <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-800 text-text-muted border border-border-card/20 rounded">
                            {daysAgo === 0 ? 'Today' : `${daysAgo} Days Ago`}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{exam.date}</span>
                          </div>
                          {exam.location && (
                            <div className="flex items-center gap-1 text-text-muted/80">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{exam.location}</span>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Dialog for Exams */}
      <ExamFormModal 
        isOpen={examModalOpen}
        onClose={() => {
          setExamModalOpen(false);
          setActiveExam(null);
        }}
        onSave={handleSaveExam}
        exam={activeExam}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setActiveExam(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskTitle={activeExam ? activeExam.title : ''}
      />

      {/* Form Dialog for linked Preparation Tasks */}
      <TaskFormModal 
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setActiveExam(null);
        }}
        onSave={handleSavePrepTask}
      />
    </div>
  );
}
