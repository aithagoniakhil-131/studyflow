// Server-Side AI API Proxy (Vercel / Node Serverless Function)
// Provider secrets are read strictly from process.env on the server.

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';

// Server-side credential manager
let roundRobinIndex = 0;

const getConfiguredKeys = () => {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ];

  // Filter valid, non-empty keys and deduplicate
  const validKeys = [];
  for (const k of candidates) {
    if (k && typeof k === 'string' && k.trim().length > 0 && !validKeys.includes(k.trim())) {
      validKeys.push(k.trim());
    }
  }
  return validKeys;
};

// Delay helper with backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Subject-aware academic pedagogical framing
const getSubjectFraming = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('linear algebra') || s.includes('math') || s.includes('calculus') || s.includes('algebra') || s.includes('statistics')) {
    return 'For mathematics: emphasize crisp definitions, visual geometric intuition, LaTeX notation \\( ... \\) and \\[ ... \\], rigorous theorems, and compact calculation examples.';
  }
  if (s.includes('code') || s.includes('programming') || s.includes('computer') || s.includes('cs') || s.includes('algorithm') || s.includes('data structure')) {
    return 'For computer science: provide concise algorithmic logic, asymptotic complexity, clean code blocks ```language ... ```, and subtle edge-case traps.';
  }
  if (s.includes('physics') || s.includes('electronic') || s.includes('circuit') || s.includes('mechanic') || s.includes('electromagnet')) {
    return 'For physics & engineering: emphasize governing physical laws, circuit/field equations in LaTeX, unit consistency, and step-by-step numerical reasoning.';
  }
  if (s.includes('chemistry') || s.includes('biochem') || s.includes('organic')) {
    return 'For chemistry: emphasize reaction mechanisms, thermodynamic/kinetic driving forces, chemical equilibrium equations, and molecular intuition.';
  }
  return 'Provide clear intuition, structured definitions, realistic examples, and step-by-step academic breakdowns.';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    prompt, 
    context = {}, 
    mode = 'EXPLAIN', 
    provider = 'gemini',
    attachments = []
  } = req.body || {};

  if ((!prompt || !prompt.trim()) && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Prompt or attachment is required' });
  }

  const availableKeys = getConfiguredKeys();

  // If no credentials configured on server
  if (availableKeys.length === 0) {
    return res.status(200).json({
      success: false,
      status: 'unconfigured',
      message: 'AI Assistant is not configured yet. Server-side environment variables (such as GEMINI_API_KEY) must be configured to activate live AI responses.',
      mode,
      provider,
      timestamp: new Date().toISOString()
    });
  }

  const { subject = '', topic = '', taskTitle = '' } = context;

  // Intent-aware structured instructions
  const modeInstructions = {
    EXPLAIN: `Follow this intuitive, high-yield teaching structure:

### 1. Core Idea
Start immediately with a clear, intuitive description of what the concept actually means in 2–4 crisp sentences (e.g. "Think of a vector space as a collection of objects that you can add and scale without leaving the collection.").

### 2. Intuition
Give ONE vivid mental model, geometric picture, or operational analogy (e.g. a "closed playground" where operations keep you inside).

### 3. Formal Definition
Provide the exact mathematical definition using LaTeX notation:
- Use \\( ... \\) for inline math (e.g. \\( \\mathbf{u}+\\mathbf{v} \\in V \\), \\( \\lambda \\mathbf{v} \\in V \\)).
- Use \\[ ... \\] for standalone display formulas on their own lines.
Do NOT mechanically dump all 10 axioms unless specifically requested by the student.

### 4. Example
Provide ONE concrete, worked example with simple numbers (e.g. in \\( \\mathbb{R}^2 \\), \\( \\mathbf{u}=(1,2), \\mathbf{v}=(3,-1) \\implies \\mathbf{u}+\\mathbf{v}=(4,1) \\in \\mathbb{R}^2 \\)).

### 5. Why It Matters
Explain in 2 sentences how this concept connects to higher university topics (e.g. subspaces, span, linear independence, basis, dimension).

### 6. Common Trap
Highlight ONE common misconception students make on exams (e.g. "Closure under addition alone does not make a set a vector space.").

### 7. Quick Check
Give ONE short practice question for the student (e.g. testing closure on a subset). Do NOT reveal the answer.`,

    QUIZ: `Generate 3 high-yield questions with increasing depth:
- **Q1 (Fundamental Understanding)**
- **Q2 (Application & Calculation)**
- **Q3 (IIT / University-Level Thinking)**
Present the questions clearly first, and place the step-by-step LaTeX solutions under ### Solutions at the end.`,

    SUMMARY: `Provide a high-density, compact revision sheet (150–250 words):
- **Core Idea:** Crisp 1-sentence essence.
- **Key Formulas & Notation:**
\\[ ... \\]
- **Must-Remember Checklist:** 3 essential properties.
- **Common Trap:** 1 pitfall to avoid on exams.`,

    PRACTICE: `Provide ONE high-quality exam standard problem:
### Problem Statement
### Strategy & Key Clues
### Step-by-Step Solution Breakdown (with LaTeX equations)
### Core Method Takeaway`
  };

  const subjectContext = getSubjectFraming(subject);

  const systemPrompt = `You are the StudyFlow AI Scholarly Tutor. You teach like a world-class university professor / top IIT coach: INTELLIGENT, INTUITIVE, RIGOROUS, CONCISE, and STUDENT-FRIENDLY.

PRIMARY DESIGN PRINCIPLE:
"Don't tell the student what the textbook says. Make the student understand why the textbook says it."

CRITICAL RULES:
1. ZERO FILLER INTRODUCTIONS: NEVER start with "You've chosen a fundamental concept...", "Let's dive into...", "This is an important topic...", or generic textbook definitions like "A vector space is a fundamental algebraic structure...". Start line 1 with intuitive teaching.
2. CONCISE & HIGH DENSITY: Target 150–400 words. Quality > Length.
3. MATHEMATICAL RIGOR WITH LATEX: Always format mathematical symbols in LaTeX using \\( ... \\) for inline math and \\[ ... \\] for display math.
4. CODE BLOCKS: Use syntax-highlighted code blocks \`\`\`language ... \`\`\` for programming questions.
5. COMPLETE OUTPUT: Complete every section and thought without cutting off.

${subjectContext}

Academic Context:
- Subject: ${subject || 'General Academic'}
- Topic: ${topic || 'General Topic'}
${taskTitle ? `- Current Task Objective: ${taskTitle}` : ''}
- Mode: ${mode}

Required Format:
${modeInstructions[mode] || modeInstructions.EXPLAIN}`;

  // Build multimodal parts array
  const parts = [];

  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.base64Data && att.mimeType) {
        const cleanBase64 = att.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inline_data: {
            mime_type: att.mimeType,
            data: cleanBase64
          }
        });
      }
    }
  }

  const effectivePrompt = prompt && prompt.trim() ? prompt : 'Please analyze and explain the attached academic material.';
  parts.push({ text: `${systemPrompt}\n\nStudent Question / Topic:\n${effectivePrompt}` });

  // Transient retry configuration
  const MAX_RETRIES = 2; // Up to 2 retries (3 total attempts)
  const backoffDelays = [400, 1000];

  let currentKeyIndex = roundRobinIndex % availableKeys.length;
  roundRobinIndex = (roundRobinIndex + 1) % availableKeys.length;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const activeKey = availableKeys[currentKeyIndex];
    // Use fallback model on final retry if 503/500 occurred
    const activeModel = attempt === MAX_RETRIES ? FALLBACK_MODEL : PRIMARY_MODEL;
    const startTime = Date.now();

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.55,
              maxOutputTokens: 2500
            }
          })
        }
      );

      const duration = Date.now() - startTime;
      const status = response.status;

      // Sanitized telemetry logging (NEVER logs keys or sensitive headers)
      console.log(`[AI Proxy] model=${activeModel} status=${status} attempt=${attempt + 1}/${MAX_RETRIES + 1} latency=${duration}ms`);

      // Success
      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
          return res.status(200).json({
            success: true,
            status: 'completed',
            message: generatedText,
            mode,
            provider: 'gemini',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Transient errors eligible for retry: 429, 500, 502, 503, 504
      const isTransient = [429, 500, 502, 503, 504].includes(status);

      if (isTransient && attempt < MAX_RETRIES) {
        // Rotate to next available key for retry attempt
        currentKeyIndex = (currentKeyIndex + 1) % availableKeys.length;
        await sleep(backoffDelays[attempt]);
        continue;
      }

      // If non-transient or retries exhausted, break out to clean fallback
      break;
    } catch (err) {
      console.log(`[AI Proxy Error] attempt=${attempt + 1} error="${err.message}"`);
      if (attempt < MAX_RETRIES) {
        currentKeyIndex = (currentKeyIndex + 1) % availableKeys.length;
        await sleep(backoffDelays[attempt]);
        continue;
      }
      break;
    }
  }

  // Graceful structured user-facing fallback without raw error dumps
  return res.status(200).json({
    success: false,
    status: 'temporary_unavailable',
    message: 'StudyFlow AI is temporarily busy. Please try again in a moment.',
    mode,
    provider: 'gemini',
    timestamp: new Date().toISOString()
  });
}
