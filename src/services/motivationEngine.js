import { motivationCharacters } from '../data/motivationCharacters';

export const getMotivation = (context = {}, allowRefresh = false) => {
  const {
    overdueCount = 0,
    isFocusTimerActive = false,
    upcomingExamsCount = 0,
    habitStreak = 0,
    completedTasksCount = 0,
    activeSubject = '',
    disciplineScore = null,
    preferredCategory = 'Random'
  } = context;

  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const dateSeed = today.getDate() + today.getMonth();

  let selectedCharacter = null;

  // Rule 1: Respect User's Preferred Category if set (and not 'Random')
  if (preferredCategory && preferredCategory !== 'Random') {
    const matching = motivationCharacters.filter(c => 
      c.categories.includes(preferredCategory.toLowerCase())
    );
    if (matching.length > 0) {
      const idx = allowRefresh 
        ? Math.floor(Math.random() * matching.length)
        : dayOfYear % matching.length;
      selectedCharacter = matching[idx];
    }
  }

  // Rule 2: Contextual Rules (only if no preferredCategory restriction overrides it)
  if (!selectedCharacter) {
    const subjectLower = (activeSubject || '').toLowerCase();

    if (overdueCount > 0) {
      // Sora Fujimoto (Comeback / Resilience)
      selectedCharacter = motivationCharacters.find(c => c.id === 'sora-fujimoto');
    } else if (upcomingExamsCount > 0) {
      // Rei Nakamura (Exams / Strategy)
      selectedCharacter = motivationCharacters.find(c => c.id === 'rei-nakamura');
    } else if (isFocusTimerActive) {
      if (subjectLower.includes('code') || subjectLower.includes('programming') || subjectLower.includes('developer') || subjectLower.includes('cs')) {
        // Haruto Akiyama (Coding Specialist)
        selectedCharacter = motivationCharacters.find(c => c.id === 'haruto-akiyama');
      } else if (subjectLower.includes('engineering') || subjectLower.includes('physics') || subjectLower.includes('circuit')) {
        // Mika Hoshino (Engineering Problem Solver)
        selectedCharacter = motivationCharacters.find(c => c.id === 'mika-hoshino');
      } else {
        // Ren Takahashi (Mathematics / Focus)
        selectedCharacter = motivationCharacters.find(c => c.id === 'ren-takahashi');
      }
    } else if (habitStreak >= 3) {
      // Aoi Mizuno (Consistency Master)
      selectedCharacter = motivationCharacters.find(c => c.id === 'aoi-mizuno');
    } else if (completedTasksCount >= 5) {
      // Kaito Shirogane (Competitive Ranker)
      selectedCharacter = motivationCharacters.find(c => c.id === 'kaito-shirogane');
    } else if (subjectLower.includes('code') || subjectLower.includes('programming') || subjectLower.includes('cs')) {
      selectedCharacter = motivationCharacters.find(c => c.id === 'haruto-akiyama');
    } else if (subjectLower.includes('engineering') || subjectLower.includes('physics')) {
      selectedCharacter = motivationCharacters.find(c => c.id === 'mika-hoshino');
    } else if (disciplineScore !== null && disciplineScore !== undefined) {
      if (disciplineScore >= 90) {
        selectedCharacter = motivationCharacters.find(c => c.id === 'kaito-shirogane');
      } else if (disciplineScore >= 70) {
        selectedCharacter = motivationCharacters.find(c => c.id === 'yuna-kurosawa');
      } else if (disciplineScore >= 40) {
        selectedCharacter = motivationCharacters.find(c => c.id === 'aoi-mizuno');
      } else if (disciplineScore > 0 && disciplineScore < 40) {
        selectedCharacter = motivationCharacters.find(c => c.id === 'sora-fujimoto');
      }
    }
  }

  // Rule 3: Deterministic Daily Rotation Fallback
  if (!selectedCharacter) {
    const index = allowRefresh 
      ? Math.floor(Math.random() * motivationCharacters.length)
      : dayOfYear % motivationCharacters.length;
    selectedCharacter = motivationCharacters[index];
  }

  // Select quote stably
  const quotes = selectedCharacter.quotes;
  const quoteIdx = allowRefresh 
    ? Math.floor(Math.random() * quotes.length)
    : (dayOfYear + dateSeed) % quotes.length;
  
  return {
    character: selectedCharacter,
    quote: quotes[quoteIdx]
  };
};
