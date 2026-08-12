// StudyFlow AI Foundation Service (Provider-Independent Abstraction)

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  CLAUDE: 'claude'
};

export const STUDY_MODES = {
  EXPLAIN: 'EXPLAIN',
  QUIZ: 'QUIZ',
  SUMMARY: 'SUMMARY',
  PRACTICE: 'PRACTICE'
};

export const aiService = {
  // Enumerate supported providers without exposing secrets
  getAvailableProviders: () => {
    return [
      { 
        id: AI_PROVIDERS.GEMINI, 
        name: 'Google Gemini', 
        model: 'gemini-2.5-flash', 
        configured: false,
        capabilities: ['Concept Explanations', 'Deep Intuition', 'Formulas']
      },
      { 
        id: AI_PROVIDERS.OPENAI, 
        name: 'OpenAI GPT', 
        model: 'gpt-4o', 
        configured: false,
        capabilities: ['Practice Quizzes', 'Step-by-Step Problem Solving']
      },
      { 
        id: AI_PROVIDERS.CLAUDE, 
        name: 'Anthropic Claude', 
        model: 'claude-3-5-sonnet', 
        configured: false,
        capabilities: ['Revision Summaries', 'Academic Logic Checks']
      }
    ];
  },

  // Preferred provider
  getPreferredProvider: () => {
    return AI_PROVIDERS.GEMINI;
  },

  // Provider-independent invocation endpoint
  generateResponse: async ({ 
    prompt, 
    context = {}, 
    mode = STUDY_MODES.EXPLAIN, 
    provider = AI_PROVIDERS.GEMINI 
  }) => {
    const { subject = '', topic = '', taskTitle = '' } = context;

    // Validate prompt input
    if (!prompt || !prompt.trim()) {
      return {
        success: false,
        status: 'error',
        message: 'Please enter a valid study query or topic.'
      };
    }

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: { subject, topic, taskTitle },
          mode,
          provider
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      // Local development fallback without server proxy
    }

    // Secure fallback:
    return {
      success: false,
      status: 'unconfigured',
      message: 'AI Study Assistant is not configured yet. Server-side environment variables (such as GEMINI_API_KEY) are required to activate live AI generation.',
      mode,
      provider,
      context: { subject, topic, taskTitle },
      timestamp: new Date().toISOString()
    };
  }
};
