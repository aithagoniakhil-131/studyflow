import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, Terminal, Lightbulb, AlertTriangle, HelpCircle, BookOpen, Sparkles } from 'lucide-react';

export default function AcademicMarkdown({ content = '' }) {
  // Safe string coercion
  const textContent = typeof content === 'string' ? content : String(content || '');
  if (!textContent.trim()) return null;

  // Render LaTeX math safely without throwing exceptions
  const renderMath = (mathStr, displayMode = false) => {
    if (!mathStr || typeof mathStr !== 'string') return null;
    const cleanMath = mathStr.trim();
    if (!cleanMath) return null;

    try {
      const html = katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
        output: 'html' // Use pure HTML for maximum stability across all browsers
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (err) {
      console.warn('KaTeX rendering fallback for:', cleanMath, err);
      return <code className="text-brand-purple-hover font-mono text-[11px] px-1 bg-zinc-900 rounded">{cleanMath}</code>;
    }
  };

  // Robust block parser handling code blocks, multiline display math, and text
  const parseBlocks = (text) => {
    const blocks = [];
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];

    let inDisplayMath = false;
    let mathBuffer = [];

    let textBuffer = [];

    const flushText = () => {
      if (textBuffer.length > 0) {
        blocks.push({ type: 'text', content: textBuffer.join('\n') });
        textBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code block delimiter ```
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          flushText();
          inCodeBlock = true;
          codeLanguage = trimmed.replace(/^```/, '').trim() || 'code';
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          blocks.push({
            type: 'code',
            language: codeLanguage,
            code: codeBuffer.join('\n')
          });
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // 2. Display math start \[ or $$ on its own line
      if (trimmed === '\\[' || trimmed === '$$') {
        if (!inDisplayMath) {
          flushText();
          inDisplayMath = true;
          mathBuffer = [];
          continue;
        }
      }

      // Display math end \] or $$ on its own line
      if (inDisplayMath && (trimmed === '\\]' || trimmed === '$$')) {
        inDisplayMath = false;
        blocks.push({
          type: 'display_math',
          math: mathBuffer.join('\n')
        });
        mathBuffer = [];
        continue;
      }

      if (inDisplayMath) {
        mathBuffer.push(line);
        continue;
      }

      // 3. Single-line display math \[ ... \] or $$ ... $$
      if ((trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) || 
          (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4)) {
        flushText();
        const clean = trimmed
          .replace(/^\\\[/, '').replace(/\\\]$/, '')
          .replace(/^\$\$/, '').replace(/\$\$$/, '')
          .trim();
        blocks.push({ type: 'display_math', math: clean });
        continue;
      }

      // Regular line
      textBuffer.push(line);
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      blocks.push({ type: 'code', language: codeLanguage, code: codeBuffer.join('\n') });
    }
    if (inDisplayMath && mathBuffer.length > 0) {
      blocks.push({ type: 'display_math', math: mathBuffer.join('\n') });
    }
    flushText();

    return blocks;
  };

  try {
    const blocks = parseBlocks(textContent);

    return (
      <div className="space-y-3.5 text-xs leading-relaxed text-text-primary">
        {blocks.map((block, idx) => {
          if (block.type === 'code') {
            return <CodeBlock key={idx} language={block.language} code={block.code} />;
          }
          if (block.type === 'display_math') {
            return (
              <div
                key={idx}
                className="my-3 py-3 px-4 bg-zinc-900/90 border border-brand-purple/30 rounded-xl flex items-center justify-center overflow-x-auto text-sm text-text-primary shadow-inner"
              >
                {renderMath(block.math, true)}
              </div>
            );
          }
          return <FormattedParagraph key={idx} text={block.content} renderMath={renderMath} />;
        })}
      </div>
    );
  } catch (err) {
    console.error('AcademicMarkdown parser error:', err);
    return <p className="whitespace-pre-wrap font-sans text-xs text-text-primary">{textContent}</p>;
  }
}

// Code Block with Copy Action
function CodeBlock({ language = 'code', code = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="my-3 rounded-2xl border border-border-card/60 bg-zinc-950/90 overflow-hidden shadow-md">
      <div className="bg-zinc-900/80 px-4 py-2 border-b border-border-card/40 flex items-center justify-between text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand-purple-hover">
          <Terminal className="w-3.5 h-3.5" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white text-[10px] font-medium transition-colors cursor-pointer bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-border-card/40"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-emerald-300">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

// Formatted Paragraph with inline LaTeX and Academic Section Badges
function FormattedParagraph({ text = '', renderMath }) {
  if (!text) return null;
  const lines = text.split('\n');

  const renderInline = (str) => {
    if (!str || typeof str !== 'string') return null;

    // 1. Process inline LaTeX \( ... \) or $ ... $
    const parts = [];
    let lastIndex = 0;
    
    // Match \(...\) or $...$
    const mathRegex = /(\\\((.*?)\\\)|\$([^\$]+?)\$)/g;
    let match;

    while ((match = mathRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const mathContent = match[2] || match[3] || '';
      parts.push({ isMath: true, math: mathContent });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.map((part, i) => {
      if (typeof part === 'object' && part?.isMath) {
        return <span key={i} className="inline-block px-0.5">{renderMath(part.math, false)}</span>;
      }

      if (typeof part !== 'string') return null;

      // 2. Process bold **text** and inline `code`
      const subParts = part.split(/(\*\*.*?\*\*|`.*?`)/g);

      return subParts.map((sub, j) => {
        if (!sub) return null;
        if (sub.startsWith('**') && sub.endsWith('**') && sub.length >= 4) {
          return <strong key={j} className="font-extrabold text-white">{sub.slice(2, -2)}</strong>;
        }
        if (sub.startsWith('`') && sub.endsWith('`') && sub.length >= 2) {
          return (
            <code key={j} className="bg-zinc-900 border border-border-card/40 text-brand-purple-hover font-mono px-1.5 py-0.5 rounded text-[11px]">
              {sub.slice(1, -1)}
            </code>
          );
        }
        return sub;
      });
    });
  };

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Structured Academic Section Headers
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^###?\s*/, '');
          let icon = <BookOpen className="w-4 h-4 text-brand-purple-hover" />;
          let headerClass = 'text-brand-purple-hover border-brand-purple/30 bg-brand-purple-bg/50';

          const lower = headerText.toLowerCase();
          if (lower.includes('core idea') || lower.includes('idea')) {
            icon = <Lightbulb className="w-4 h-4 text-cyan-400" />;
            headerClass = 'text-cyan-300 border-cyan-500/30 bg-cyan-950/30';
          } else if (lower.includes('intuition')) {
            icon = <Sparkles className="w-4 h-4 text-amber-400" />;
            headerClass = 'text-amber-300 border-amber-500/30 bg-amber-950/30';
          } else if (lower.includes('formal') || lower.includes('definition') || lower.includes('claim')) {
            icon = <BookOpen className="w-4 h-4 text-indigo-400" />;
            headerClass = 'text-indigo-300 border-indigo-500/30 bg-indigo-950/30';
          } else if (lower.includes('why it matters') || lower.includes('matters') || lower.includes('insight')) {
            icon = <Sparkles className="w-4 h-4 text-purple-400" />;
            headerClass = 'text-purple-300 border-purple-500/30 bg-purple-950/30';
          } else if (lower.includes('trap') || lower.includes('mistake') || lower.includes('pitfall')) {
            icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            headerClass = 'text-rose-300 border-rose-500/30 bg-rose-950/30';
          } else if (lower.includes('quick check') || lower.includes('try this') || lower.includes('check') || lower.includes('question')) {
            icon = <HelpCircle className="w-4 h-4 text-emerald-400" />;
            headerClass = 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30';
          }

          return (
            <div key={idx} className={`pt-2.5 pb-1 flex items-center gap-2 border-b ${headerClass} px-3 py-1.5 rounded-xl font-extrabold text-xs tracking-wide`}>
              {icon}
              <span>{headerText}</span>
            </div>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-1.5 flex-shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-brand-purple-hover flex-shrink-0">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx} className="leading-relaxed">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}
