import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { aiService, AI_PROVIDERS, STUDY_MODES } from '../services/aiService';
import { getMotivation } from '../services/motivationEngine';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Bot, Sparkles, BookOpen, HelpCircle, FileText, 
  Send, AlertCircle, ArrowRight, Layers, Timer, User, 
  RotateCcw, Copy, Check, Lightbulb, Zap, ShieldAlert,
  Paperclip, Image as ImageIcon, File, X, Film, FileCode
} from 'lucide-react';
import AcademicMarkdown from '../components/ai/AcademicMarkdown';
import AIErrorBoundary from '../components/ai/AIErrorBoundary';

export default function AIAssistant() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill query parameters if navigating from a Task or Focus session
  const initialSubject = searchParams.get('subject') || '';
  const initialTopic = searchParams.get('topic') || '';
  const initialTask = searchParams.get('task') || '';

  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [currentTaskTitle, setCurrentTaskTitle] = useState(initialTask);
  const [mode, setMode] = useState(STUDY_MODES.EXPLAIN);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialSubject && !subject) setSubject(initialSubject);
    if (initialTopic && !topic) setTopic(initialTopic);
    if (initialTask && !currentTaskTitle) setCurrentTaskTitle(initialTask);
  }, [initialSubject, initialTopic, initialTask]);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Contextual anime character selector based on subject
  const motivationContext = getMotivation({
    activeSubject: subject,
    preferredCategory: settings?.motivation_style
  });

  const promptShortcuts = [
    { label: 'Explain from first principles', template: 'Explain this concept from absolute first principles with intuition and proofs.' },
    { label: 'Give an intuitive example', template: 'Give me a relatable real-world intuitive example to deeply understand this.' },
    { label: 'Quiz me', template: 'Quiz me with 3 high-yield conceptual practice questions on this topic.', forcedMode: STUDY_MODES.QUIZ },
    { label: 'Find common mistakes', template: 'What are the most common pitfalls, misconceptions, and calculation mistakes students make in this topic?' },
    { label: 'Summarize key formulas', template: 'Provide a concise summary of the key formulas, definitions, and theorems for quick revision.', forcedMode: STUDY_MODES.SUMMARY },
    { label: 'Give IIT-level practice', template: 'Give me a challenging, competitive exam level practice problem on this topic with step-by-step guidance.', forcedMode: STUDY_MODES.PRACTICE }
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      // 10MB limit per file
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = () => {
        const base64Data = reader.result;
        setAttachments(prev => [
          ...prev,
          {
            id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
            isImage
          }
        ]);
        toast.success(`Attached ${file.name}`);
      };

      reader.onerror = () => {
        toast.error(`Failed to read file "${file.name}"`);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async (overridePrompt, overrideMode) => {
    const queryText = (overridePrompt || prompt).trim();
    if (!queryText && attachments.length === 0) {
      toast.error('Please enter a question or attach study material.');
      return;
    }

    const activeSelectedMode = overrideMode || mode;
    const currentAttachments = [...attachments];
    const userMsgId = Date.now().toString();

    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: queryText,
      mode: activeSelectedMode,
      subject,
      topic,
      attachments: currentAttachments,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setAttachments([]);
    setLoading(true);

    try {
      const response = await aiService.generateResponse({
        prompt: queryText,
        context: { subject, topic, taskTitle: currentTaskTitle },
        mode: activeSelectedMode,
        provider: AI_PROVIDERS.GEMINI,
        attachments: currentAttachments
      });

      // Play audio feedback if sound enabled
      if (settings?.sound_enabled) {
        try {
          const audio = new Audio('/sounds/timer-complete.mp3');
          audio.volume = settings.sound_volume !== undefined ? settings.sound_volume : 0.4;
          audio.play().catch(() => {});
        } catch (e) {}
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        status: response.status,
        success: response.success,
        mode: response.mode || activeSelectedMode,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI assistant query failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Could not reach StudyFlow AI. Please verify your connection or server configuration.',
          status: 'network_error',
          success: false,
          mode: activeSelectedMode,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleCopy = (text, id) => {
    try {
      const plainText = typeof text === 'string' ? text : JSON.stringify(text);
      navigator.clipboard.writeText(plainText);
      setCopiedId(id);
      toast.success('Answer copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {}
  };

  const handleClearSession = () => {
    setMessages([]);
    setAttachments([]);
    toast.info('Session cleared');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Header Banner with Contextual Anime Scholarly Guide */}
      <div className="bg-zinc-950/80 border border-border-card/45 p-4 md:p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20 relative overflow-hidden">
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute inset-0 bg-radial-gradient from-brand-purple/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Character Avatar */}
          <div className="w-13 h-13 rounded-2xl overflow-hidden border border-brand-purple/40 bg-zinc-900 flex-shrink-0 shadow-md shadow-brand-purple/15 relative">
            <img
              src={motivationContext.character.image || '/assets/motivation/characters/coding-specialist.png'}
              alt={motivationContext.character.name}
              className={`w-full h-full object-cover select-none pointer-events-none ${motivationContext.character.objectPosition || 'object-top'}`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white">
                AI STUDY ASSISTANT
              </h1>
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-purple-hover bg-brand-purple-bg px-2 py-0.5 rounded-full border border-brand-purple/30">
                {motivationContext.character.name}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Understand difficult topics. Practice smarter. Study with clarity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {subject && (
            <Link
              to={`/focus?subject=${encodeURIComponent(subject)}&task=${encodeURIComponent(topic || currentTaskTitle || '')}`}
              className="bg-zinc-900/90 border border-border-card/60 hover:border-brand-purple/50 text-text-muted hover:text-brand-purple-hover px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
              title="Enter deep work for this topic"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Study in Focus</span>
            </Link>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearSession}
              className="p-2 text-text-muted hover:text-rose-400 bg-zinc-900 border border-border-card/40 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Academic Context & Study Mode Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Context Fields */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 border border-border-card/40 p-3.5 rounded-2xl">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Linear Algebra"
              className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
              Topic / Chapter
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Vector Spaces"
              className="w-full bg-zinc-900 border border-border-card/60 rounded-xl px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {currentTaskTitle && (
            <div className="col-span-1 sm:col-span-2 pt-1 border-t border-border-card/20 flex items-center justify-between text-[10px] text-text-muted">
              <span className="truncate">Task Objective: <strong className="text-text-primary">{currentTaskTitle}</strong></span>
              <button 
                onClick={() => setCurrentTaskTitle('')} 
                className="text-text-muted hover:text-text-primary ml-2 underline text-[9px] cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Study Mode Selector (2x2 grid on mobile, 4 columns on sm+) */}
        <div className="md:col-span-6 space-y-1 bg-zinc-950/60 border border-border-card/40 p-3.5 rounded-2xl flex flex-col justify-between">
          <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
            Response Mode
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: STUDY_MODES.EXPLAIN, label: 'Explain', icon: BookOpen },
              { id: STUDY_MODES.QUIZ, label: 'Quiz', icon: HelpCircle },
              { id: STUDY_MODES.SUMMARY, label: 'Summary', icon: FileText },
              { id: STUDY_MODES.PRACTICE, label: 'Practice', icon: Layers }
            ].map(m => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer min-h-[48px] justify-center hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none ${
                    isSelected
                      ? 'bg-brand-purple-bg border-brand-purple/70 text-brand-purple-hover shadow-md shadow-brand-purple/20 ring-1 ring-brand-purple/40'
                      : 'bg-zinc-900/80 border-border-card/40 text-text-muted hover:border-border-card hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversation Stream (if messages exist) */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-xl bg-brand-purple-bg/80 border border-brand-purple/40 text-white rounded-2xl p-4 shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-brand-purple-hover gap-3">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> You ({msg.mode})</span>
                    {msg.subject && <span className="opacity-80 font-mono">{msg.subject}</span>}
                  </div>

                  {/* Render attached files in user bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-1">
                      {msg.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-1.5 bg-zinc-900/90 border border-brand-purple/30 rounded-lg px-2 py-1 text-[10px]">
                          {att.isImage ? (
                            <img src={att.base64Data} alt={att.name} className="w-4 h-4 object-cover rounded" />
                          ) : (
                            <File className="w-3 h-3 text-brand-purple-hover" />
                          )}
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.content && <p className="text-xs font-medium whitespace-pre-wrap">{msg.content}</p>}
                </div>
              ) : (
                <AIErrorBoundary>
                  <Card className="w-full border border-border-card/40 bg-zinc-950/80 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-zinc-900/50 border-b border-border-card/25 p-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-purple-hover" />
                        <span className="text-xs font-black uppercase tracking-wider text-text-primary font-display">
                          StudyFlow Tutor
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold text-text-muted bg-zinc-900 px-2 py-0.5 rounded border border-border-card/30 uppercase tracking-wider">
                          {msg.mode}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-border-card/60 hover:border-brand-purple/40 text-text-muted hover:text-text-primary text-[10px] font-bold transition-all cursor-pointer hover:scale-102 active:scale-98"
                          title="Copy complete answer text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-extrabold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    </CardHeader>
                    <CardBody className="p-5 text-xs text-text-primary leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.status === 'unconfigured' ? (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-amber-200 space-y-2.5">
                          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>AI Provider Configuration Required</span>
                          </div>
                          <p className="text-[11px] text-amber-200/90">
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                          </p>
                        </div>
                      ) : msg.status === 'temporary_unavailable' ? (
                        <div className="bg-zinc-900/80 border border-brand-purple/30 rounded-xl p-4 text-text-primary space-y-2">
                          <div className="flex items-center gap-2 text-brand-purple-hover font-extrabold text-xs">
                            <Sparkles className="w-4 h-4" />
                            <span>StudyFlow AI is temporarily busy</span>
                          </div>
                          <p className="text-[11px] text-text-muted">
                            {typeof msg.content === 'string' ? msg.content : 'Please try again in a moment.'}
                          </p>
                        </div>
                      ) : (
                        <AcademicMarkdown content={msg.content} />
                      )}
                    </CardBody>
                  </Card>
                </AIErrorBoundary>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Card className="w-full border border-brand-purple/30 bg-zinc-950/60 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-3 text-brand-purple-hover text-xs font-bold">
            <div className="w-4 h-4 rounded-full border-2 border-brand-purple-hover border-t-transparent animate-spin" />
            <span>StudyFlow AI is analyzing material & formulating structured breakdown...</span>
          </div>
        </Card>
      )}

      {/* Query Input Box, File Attachments & Shortcuts */}
      <Card className="border border-border-card/50 bg-zinc-950/90 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        <CardBody className="p-4 space-y-3">
          {/* File Attachment Strip */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-zinc-900/60 border border-border-card/40 rounded-xl">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-1.5 bg-zinc-950 border border-brand-purple/40 rounded-lg p-1.5 pr-2 text-xs">
                  {att.isImage ? (
                    <img src={att.base64Data} alt={att.name} className="w-6 h-6 object-cover rounded border border-border-card/60" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-brand-purple-hover">
                      <File className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="leading-tight max-w-[140px]">
                    <div className="text-[10px] font-bold text-text-primary truncate">{att.name}</div>
                    <div className="text-[8px] text-text-muted">{(att.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1 hover:text-rose-400 text-text-muted rounded cursor-pointer transition-colors ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={loading}
            placeholder="Ask anything about your topic or attach notes/diagrams... (Enter to send, Shift+Enter for new line)"
            className="w-full bg-zinc-900/70 border border-border-card/60 rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-purple resize-none disabled:opacity-50"
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,text/*,.py,.js,.cpp,.c,.java,.txt,.md"
            className="hidden"
          />

          <div className="space-y-2.5 pt-1">
            {/* Quick Action Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3 text-amber-400" /> Prompts:
              </span>
              {promptShortcuts.map((ps, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => {
                    if (ps.forcedMode) setMode(ps.forcedMode);
                    handleSend(ps.template, ps.forcedMode);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-border-card/50 hover:border-brand-purple/50 text-text-muted hover:text-text-primary px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  {ps.label}
                </button>
              ))}
            </div>

            {/* Bottom Actions Row: Attachments + Send */}
            <div className="flex items-center justify-between border-t border-border-card/25 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-border-card/50 hover:border-brand-purple/50 text-text-muted hover:text-text-primary text-[10px] font-bold transition-all cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-50"
                  title="Attach diagrams, images, notes or code"
                >
                  <Paperclip className="w-3.5 h-3.5 text-brand-purple-hover" />
                  <span>Attach Media / Files</span>
                </button>

                <div className="text-[10px] text-text-muted hidden sm:block">
                  Mode: <strong className="text-brand-purple-hover font-mono">{mode}</strong>
                </div>
              </div>

              <Button
                onClick={() => handleSend()}
                disabled={loading || (!prompt.trim() && attachments.length === 0)}
                className="bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-extrabold py-2 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/25 cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="animate-pulse">Thinking...</span>
                ) : (
                  <>
                    <span>Send Query</span>
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
