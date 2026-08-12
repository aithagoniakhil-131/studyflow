// Central Anime Motivation Characters Registry for StudyFlow

export const motivationCharacters = [
  {
    id: "ren-takahashi",
    name: "Ren Takahashi",
    role: "Mathematics Prodigy",
    image: "/assets/motivation/characters/mathematics-prodigy.png",
    categories: ["mathematics", "focus", "discipline"],
    objectPosition: "object-[75%_center]",
    quoteAlignment: "left",
    quotes: [
      "One **focused hour** beats three distracted ones.",
      "Equations don't solve themselves; they yield to **structured focus**.",
      "**Discipline** is the constant factor that scales your intelligence.",
      "Complex proofs require simple, **uninterrupted attention**.",
      "Break the problem down to its axioms. **Solve** each layer.",
      "Mathematics is not about logic; it's about **persistent logic**.",
      "Keep your workspace clear and your mind **focused** on the variables.",
      "**Consistency** is the derivative of your daily effort."
    ]
  },
  {
    id: "aoi-mizuno",
    name: "Aoi Mizuno",
    role: "Consistency Master",
    image: "/assets/motivation/characters/consistency-master.png",
    categories: ["consistency", "habits", "discipline"],
    objectPosition: "object-[25%_center]",
    quoteAlignment: "right",
    quotes: [
      "**Consistency** turns ordinary effort into extraordinary results.",
      "**Small daily wins** compound into massive academic breakthroughs.",
      "Your habits today build the **foundation** for who you will be tomorrow.",
      "Motivations get you started; **discipline** keeps you moving.",
      "Don't break the streak. **Even a small step** counts.",
      "A perfect habit tracker is built **one checked box** at a time.",
      "Great achievements are just **small habits** done consistently.",
      "Rain or shine, the consistency master **never skips** a day."
    ]
  },
  {
    id: "kaito-shirogane",
    name: "Kaito Shirogane",
    role: "Competitive Ranker",
    image: "/assets/motivation/characters/competitive-ranker.png",
    categories: ["achievement", "focus", "discipline"],
    objectPosition: "object-[80%_center]",
    quoteAlignment: "left",
    quotes: [
      "Aim for the **top of the curve**. Leave no doubts behind.",
      "Every solved task is a step toward **outperforming** your past self.",
      "Excellence is not an accident; it is a **competitive standard**.",
      "Let your results speak for the **hours you spent** in silence.",
      "Winning is the result of details **others chose** to ignore.",
      "Push beyond the grade boundary; build **true mastery**.",
      "Set **ambitious targets**. Work until they look easy.",
      "Competition isn't about others; it's about **pushing your limits**."
    ]
  },
  {
    id: "mika-hoshino",
    name: "Mika Hoshino",
    role: "Engineering Problem Solver",
    image: "/assets/motivation/characters/engineering-problem-solver.png",
    categories: ["engineering", "productivity", "resilience"],
    objectPosition: "object-[20%_center]",
    quoteAlignment: "right",
    quotes: [
      "Design systems that work, and **optimize** them when they break.",
      "Engineering is the art of solving problems you **haven't seen** before.",
      "Keep building, keep iterating, and **never stop optimizing**.",
      "A system is only as good as its **weakest constraint**. Find it.",
      "Success is just **iteration** under control.",
      "Don't just write down formulas; **understand the mechanics**.",
      "Every bug is a lesson; every structural failure is an **upgrade path**.",
      "Deconstruct complexity into clean, **manageable modules**."
    ]
  },
  {
    id: "yuna-kurosawa",
    name: "Yuna Kurosawa",
    role: "Calm High Achiever",
    image: "/assets/motivation/characters/calm-high-achiever.png",
    categories: ["productivity", "planning", "focus"],
    objectPosition: "object-[70%_center]",
    quoteAlignment: "left",
    quotes: [
      "A **quiet mind** organizes complex studies with ease.",
      "**Calm productivity** is the ultimate academic superpower.",
      "True excellence is **quiet, organized**, and steady.",
      "Organize your semester so that **stress** becomes obsolete.",
      "Success belongs to those who prepare in **tranquility**.",
      "Plan with absolute clarity; execute with **peaceful focus**.",
      "**Declutter your mind**, check off your goals, and study in peace.",
      "A **balanced schedule** is the secret to high performance."
    ]
  },
  {
    id: "haruto-akiyama",
    name: "Haruto Akiyama",
    role: "Coding Specialist",
    image: "/assets/motivation/characters/coding-specialist.png",
    categories: ["coding", "focus", "productivity"],
    objectPosition: "object-[30%_center]",
    quoteAlignment: "right",
    quotes: [
      "Code is built statement by statement. Focus on the **current block**.",
      "Debugging is twice as hard as writing the code. **Stay patient**.",
      "Deep work is the **compile time** of your intelligence.",
      "Commit your daily progress. Let the commits **compound**.",
      "One clear **logic loop** solves a thousand messy lines.",
      "Write clean code, build clean habits, **stay focused**.",
      "**Automate** your distractions out of existence.",
      "The best compiler is a **focused mind**."
    ]
  },
  {
    id: "sora-fujimoto",
    name: "Sora Fujimoto",
    role: "Comeback Student",
    image: "/assets/motivation/characters/comeback-student.png",
    categories: ["comeback", "resilience", "productivity"],
    objectPosition: "object-[75%_center]",
    quoteAlignment: "left",
    quotes: [
      "One bad result does **not** define your semester.",
      "The **comeback** is always stronger than the setback.",
      "Yesterday is finished. Start today with a **clean slate**.",
      "Resilience isn't never falling; it's **getting back to work** immediately.",
      "Failures are just **data points** on your way to success.",
      "Forgive your past slips. **Focus entirely** on your next action.",
      "It doesn't matter where you started, only where you are **headed now**.",
      "Turn your academic setbacks into your **greatest motivators**."
    ]
  },
  {
    id: "rei-nakamura",
    name: "Rei Nakamura",
    role: "Exam Strategist",
    image: "/assets/motivation/characters/exam-strategist.png",
    categories: ["exams", "planning", "strategy"],
    objectPosition: "object-[25%_center]",
    quoteAlignment: "right",
    quotes: [
      "Don't panic. **Prioritize**.",
      "Study smart: map the syllabus to the **highest leverage** topics.",
      "An exam is not a memory test; it's a **strategic execution**.",
      "Manage your prep time like a **limited resource**.",
      "Mock papers and review cycles are the path to **confidence**.",
      "Don't study harder; study with a **strategic target** in mind.",
      "Master the **foundational concepts** first. The rest will follow.",
      "Sleep is a vital part of your **exam strategy**. Protect it."
    ]
  }
];

export const getMotivationCategories = () => {
  return [
    "discipline",
    "focus",
    "consistency",
    "comeback",
    "exams",
    "productivity",
    "coding",
    "mathematics",
    "engineering",
    "achievement",
    "planning",
    "resilience"
  ];
};
