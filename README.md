# StudyFlow — Student Operating System

StudyFlow is a student productivity and academic management platform ("Student Operating System") designed primarily for university and B.Tech students. It consolidates daily schedules, weekly plans, habit tracking, exams syllabus tracking, and study resources into an immersive, premium, anime-inspired dark workspace.

## Core Features
1. **Student Dashboard**: Replicates the primary visual design screens showing today's focus tasks, progress meters, weekly study analytics, overdue items, upcoming schedules, and discipline matrices.
2. **Task & Recurrence System**: Dynamic task groupings ("Today's Focus", "Overdue", and "Upcoming") with multiple resource links support and weekdays-specific repeat intervals.
3. **Habit & Discipline Tracking**: Tracks streak logs, weekly habit checks, and calculates a transparent weekly **Discipline Score** (weighted consistency across tasks, habits, focus, and on-time completions).
4. **Pomodoro Focus Timer**: Timestamp-based countdown clock inside a React Context to prevent drift across pages/navigation, connected with local audio and specific tasks study logging.
5. **Learning Vault**: Vault for categorizing bookmarks, websites, lecture notes, and YouTube embeds with an optional inline player or fallback click triggers.
6. **Academic Analytics**: Accessible charts tracking weekly study time, task completion distribution, and subject focus ratios.

## System Architecture

```
                       +-----------------------+
                       |   React 19 Frontend   |
                       +-----------+-----------+
                                   |
                                   v
                       +-----------------------+
                       |  Repository (repo.js) |
                       +-----+-----------+-----+
                             |           |
             +---------------+           +---------------+
             | (If VITE_SUPABASE_URL set)| (Otherwise)   |
             v                           v
+------------------------+   +------------------------+
| Supabase Driver (db)   |   | LocalStorage Driver    |
+-----------+------------+   +-----------+------------+
            |                            |
            v                            v
+------------------------+   +------------------------+
| Supabase PostgreSQL DB |   | Browser LocalStorage   |
+------------------------+   +------------------------+
```

## Running the Project
Refer to [SETUP.md](./SETUP.md) for local installation instructions.
For details about structural patterns, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For database schema specifications, see [DATABASE.md](./DATABASE.md).
For styling guidelines and tokens, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
