// Server-Side AI API Proxy (Vercel / Node Serverless Function)
// Provider secrets are read strictly from process.env on the server.

const GEMINI_MODEL = 'gemini-2.5-flash';

// Subject-aware academic pedagogical framing
const getSubjectFraming = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('linear algebra') || s.includes('math') || s.includes('calculus') || s.includes('algebra') || s.includes('statistics')) {
    return 'For mathematics: emphasize crisp definitions, visual intuition, LaTeX notation \\( ... \\) and \\[ ... \\], rigorous theorems, and compact calculation examples.';
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
    provider = 'gemini' 
  } = req.body || {};

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Google Gemini Provider
  if (provider === 'gemini' && geminiKey) {
    try {
      const { subject = '', topic = '', taskTitle = '' } = context;

      // Mode-specific structured instructions
      const modeInstructions = {
        EXPLAIN: `Follow this EXACT structure:
### 1. Core Idea
Explain the concept in 2–4 simple, high-impact sentences.

### 2. Intuition
Give one clear mental model, geometric picture, or real-world analogy.

### 3. Formal Definition
Give the mathematically rigorous definition using LaTeX notation:
- Use \\( ... \\) for inline math (e.g. \\( \\mathbf{v} \\in V \\), \\( \\lambda \\)).
- Use \\[ ... \\] for standalone display formulas on their own lines.

### 4. Example
Give ONE concise, concrete worked example with step-by-step calculation or code snippet if coding.

### 5. Common Trap
Mention ONE common misconception or calculation pitfall students make on exams.

### 6. Quick Check
Give ONE short conceptual or numerical question for the student. Do NOT reveal the answer.`,

        QUIZ: `Generate 3 high-yield conceptual and numerical practice questions based on this topic (Progressive difficulty: Foundation, Intermediate, IIT/Olympiad standard).
Provide questions first, and then include detailed solutions with LaTeX derivations under ### Solutions at the end.`,

        SUMMARY: `Provide a concise, high-yield revision cheat-sheet (150–250 words):
- **Core Axioms & Principles**
- **Essential LaTeX Formulas & Equations**
- **Key Theorems & Properties**
- **Must-Know Exam Takeaways**`,

        PRACTICE: `Provide ONE realistic, exam-standard problem:
1. **Problem Statement**
2. **Key Clues & Strategic Approach**
3. **Step-by-Step Solution Breakdown** with LaTeX equations
4. **Key Method Takeaway**`
      };

      const subjectContext = getSubjectFraming(subject);

      const systemPrompt = `You are the StudyFlow AI Scholarly Tutor. You write like a world-class university professor / top IIT coach: CLEAR, SMART, CONCISE, OPTIMISTIC, and RIGOROUS.

CRITICAL RULES:
1. NO GENERIC INTRODUCTIONS: NEVER start with filler like "You've chosen a fundamental concept...", "This is an important topic...", "Let's dive into...", or "Understanding X is key...". Start IMMEDIATELY on line 1 with actual teaching.
2. CONCISE & DENSE: Target 150–400 words total. Quality > Quantity.
3. LATEX NOTATION: Always format mathematical symbols in LaTeX using \\( ... \\) for inline math and \\[ ... \\] for display math.
4. CODE BLOCKS: Use syntax-highlighted code blocks \`\`\`language ... \`\`\` for programming.

${subjectContext}

Academic Context:
- Subject: ${subject || 'General Academic'}
- Topic: ${topic || 'General Topic'}
${taskTitle ? `- Current Task Objective: ${taskTitle}` : ''}
- Mode: ${mode}

Required Format:
${modeInstructions[mode] || modeInstructions.EXPLAIN}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nStudent Question / Topic: ${prompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1200
            }
          })
        }
      );

      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          status: 'rate_limited',
          message: 'AI is temporarily busy. Please try again shortly.'
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        return res.status(502).json({
          success: false,
          status: 'provider_error',
          message: 'The AI provider encountered an issue while generating the response.'
        });
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        return res.status(502).json({
          success: false,
          status: 'empty_response',
          message: 'No response content was generated by the provider.'
        });
      }

      return res.status(200).json({
        success: true,
        status: 'completed',
        message: generatedText,
        mode,
        provider: 'gemini',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Server error executing AI proxy:', err);
      return res.status(500).json({
        success: false,
        status: 'server_error',
        message: 'Could not reach StudyFlow AI. Please check your network connection.'
      });
    }
  }

  // 2. Unconfigured State (Graceful fallback without key exposure)
  return res.status(200).json({
    success: false,
    status: 'unconfigured',
    message: 'AI Assistant is not configured yet. Server-side environment variables (such as GEMINI_API_KEY) must be configured to activate live AI responses.',
    mode,
    provider,
    timestamp: new Date().toISOString()
  });
}
