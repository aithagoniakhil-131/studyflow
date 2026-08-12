import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check, Code2, Terminal, Lightbulb, AlertTriangle, HelpCircle, BookOpen } from 'lucide-react';

export default function AcademicMarkdown({ content = '' }) {
  if (!content) return null;

  // Render LaTeX math safely
  const renderMath = (mathStr, displayMode = false) => {
    try {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(mathStr, {
              displayMode,
              throwOnError: false,
              output: 'htmlAndMathml'
            })
          }}
        />
      );
    } catch (e) {
      return <code className="text-rose-400 font-mono text-xs">{mathStr}</code>;
    }
  };

  // Split text into display math, code blocks, and regular markdown paragraphs
  const parseBlocks = (text) => {
    const blocks = [];
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];
    let textBuffer = [];

    const flushText = () => {
      if (textBuffer.length > 0) {
        blocks.push({ type: 'text', content: textBuffer.join('\n') });
        textBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          flushText();
          inCodeBlock = true;
          codeLanguage = line.trim().replace(/^```/, '').trim() || 'text';
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

      // Display math \[ ... \]
      if (line.trim().startsWith('\\[') && line.trim().endsWith('\\]')) {
        flushText();
        const mathContent = line.trim().replace(/^\\\[/, '').replace(/\\\]$/, '').trim();
        blocks.push({ type: 'display_math', math: mathContent });
        continue;
      }

      textBuffer.push(line);
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      blocks.push({ type: 'code', language: codeLanguage, code: codeBuffer.join('\n') });
    }
    flushText();

    return blocks;
  };

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-4 text-xs leading-relaxed text-text-primary">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} language={block.language} code={block.code} />;
        }
        if (block.type === 'display_math') {
          return (
            <div
              key={idx}
              className="my-3 py-3 px-4 bg-zinc-900/80 border border-brand-purple/25 rounded-xl flex items-center justify-center overflow-x-auto text-sm text-text-primary shadow-inner"
            >
              {renderMath(block.math, true)}
            </div>
          );
        }
        return <FormattedParagraph key={idx} text={block.content} renderMath={renderMath} />;
      })}
    </div>
  );
}

// Code Block with Copy Action
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-border-card/60 bg-zinc-950/90 overflow-hidden shadow-md">
      <div className="bg-zinc-900/70 px-4 py-2 border-b border-border-card/40 flex items-center justify-between text-[11px] text-text-muted">
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
function FormattedParagraph({ text, renderMath }) {
  const lines = text.split('\n');

  const renderInline = (str) => {
    // 1. Process inline LaTeX \( ... \)
    const parts = [];
    let lastIndex = 0;
    const mathRegex = /\\\((.*?)\\\)/g;
    let match;

    while ((match = mathRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push({ isMath: true, math: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.map((part, i) => {
      if (typeof part === 'object' && part.isMath) {
        return <span key={i} className="inline-block px-0.5">{renderMath(part.math, false)}</span>;
      }

      // 2. Process bold **text** and inline `code`
      const rawText = part;
      const subParts = rawText.split(/(\*\*.*?\*\*|`.*?`)/g);

      return subParts.map((sub, j) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={j} className="font-extrabold text-white">{sub.slice(2, -2)}</strong>;
        }
        if (sub.startsWith('`') && sub.endsWith('`')) {
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
        if (trimmed.startsWith('### ')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          let icon = <BookOpen className="w-4 h-4 text-brand-purple-hover" />;
          let headerClass = 'text-brand-purple-hover border-brand-purple/30 bg-brand-purple-bg/50';

          if (headerText.toLowerCase().includes('core idea') || headerText.toLowerCase().includes('idea')) {
            icon = <Lightbulb className="w-4 h-4 text-cyan-400" />;
            headerClass = 'text-cyan-300 border-cyan-500/30 bg-cyan-950/30';
          } else if (headerText.toLowerCase().includes('intuition')) {
            icon = <Sparkles className="w-4 h-4 text-amber-400" />;
            headerClass = 'text-amber-300 border-amber-500/30 bg-amber-950/30';
          } else if (headerText.toLowerCase().includes('trap') || headerText.toLowerCase().includes('mistake') || headerText.toLowerCase().includes('pitfall')) {
            icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            headerClass = 'text-rose-300 border-rose-500/30 bg-rose-950/30';
          } else if (headerText.toLowerCase().includes('quick check') || headerText.toLowerCase().includes('try this') || headerText.toLowerCase().includes('check')) {
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
