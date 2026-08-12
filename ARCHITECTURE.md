# Project Architecture — StudyFlow

This document details the architectural layout, data flow patterns, context state synchronizers, and extensions of StudyFlow.

## Codebase Layout
```
studyos/
├── public/                 # Static assets (images, sound clips)
│   ├── assets/
│   │   └── motivation/    # Anime motivation illustration files
│   └── sounds/             # Sound MP3 files (timer-start, etc.)
├── src/
│   ├── assets/             # Scaffold assets
│   ├── components/         # Reusable UI widgets
│   │   ├── ui/             # Shared primitives (Button, Card, Skeleton)
│   │   ├── DashboardShell.jsx # Sidebar layout structure wrapper
│   │   └── ProtectedRoute.jsx # Authentication route guardian
│   ├── context/            # React global state providers
│   │   ├── AuthContext.jsx # Signup, login, onboarding hooks
│   │   ├── PomodoroContext.jsx # Resilient study clock controller
│   │   ├── SettingsContext.jsx # UI configs, volume slider values
│   │   └── ToastContext.jsx # Slide-in toast alerts notifications
│   ├── pages/              # Primary route views (Dashboard, Tasks, Planner)
│   ├── services/           # Abstraction and repository layers
│   │   ├── repo.js         # Abstraction multiplexer
│   │   ├── localStorageDb.js # Offline LocalStorage driver
│   │   └── supabaseDb.js   # Live cloud database driver
│   ├── App.jsx             # Router definition
│   ├── index.css           # Tailwind v4 master stylesheet
│   └── main.jsx            # Application mount root
├── package.json
└── vite.config.js
```

---

## Unified Repository Abstraction

StudyFlow decouples UI rendering from database access. All data operations are initiated via the `repo` service:

```javascript
import { repo } from '../services/repo';

// UI components consume standard async promises
const loadTasks = async () => {
  const list = await repo.tasks.list(userId);
  setTasks(list);
};
```

This makes storage drivers hot-swappable. If environment keys are loaded, the repository maps commands to standard Supabase calls. If keys are absent, it maps to LocalStorage wrappers.

---

## Timestamps Timing Synchronization

Standard browser-based `setInterval` timers drift due to rendering lag, background tab idling, or navigation rerenders. To remain accurate, `PomodoroContext.jsx` calculates time by comparing the device's clock with target endpoints:

$$\text{Remaining Time} = \text{Target End Timestamp} - \text{Current Epoch Time}$$

The timer state is synced to `localStorage` on change. On page reload, navigation, or tab focus, the remaining time is instantly recalculated.

---

## Extensible AI Hooks (Future Scope)

While AI operations are explicitly disabled for V1, the repository layer and schemas are pre-configured to support future AI modules:

- **AI Study Planner**: Ready to read `tasks` and `study_sessions` to output schedule layouts.
- **AI Task Breakdown**: Pre-configured task models can accept subtask extensions.
- **AI Analytics Insights**: Analytics models can accept prompts comparing `study_sessions` against `weekly_goals` and `discipline_score`.
