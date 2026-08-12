// Central Anime Motivation Artwork Registry for StudyFlow

export const motivationArtworks = [
  {
    id: "landing-hero",
    image: "/assets/motivation/landing-hero.png",
    category: "study",
    quote: "Take control of your college life. Build your systems.",
    aspectRatio: "landscape",
    usage: "landing"
  },
  {
    id: "focus-pomodoro",
    image: "/assets/motivation/focus-pomodoro.png",
    category: "focus",
    quote: "One task. Nothing else.",
    aspectRatio: "portrait",
    usage: "focus"
  },
  {
    id: "dashboard-motivation",
    image: "/assets/motivation/dashboard-motivation.png",
    category: "motivation",
    quote: "Consistency beats intensity.",
    aspectRatio: "portrait",
    usage: "motivation"
  }
];

export const getDailyMotivation = () => {
  const gallery = motivationArtworks.filter(art => art.usage === 'motivation' || art.category === 'motivation');
  if (gallery.length === 0) return null;
  
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const year = today.getFullYear();
  const index = (dayOfYear + year) % gallery.length;
  return gallery[index];
};

export const getArtworkById = (id) => {
  return motivationArtworks.find(art => art.id === id) || null;
};
