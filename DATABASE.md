# Database Schema & RLS Policies — StudyFlow

StudyFlow is designed around a relational database model in PostgreSQL, mirrored locally in memory when in offline mode. Row Level Security (RLS) policies protect user ownership.

---

## Relational Tables

### 1. `profiles`
- `id` (uuid, PK, references `auth.users(id) ON DELETE CASCADE`)
- `name` (text, not null)
- `university` (text, not null)
- `degree` (text, not null)
- `branch` (text, not null)
- `year` (int, not null)
- `semester` (int, not null)
- `career_goals` (text[], default '{}')
- `academic_goals` (text[], default '{}')
- `avatar_url` (text, nullable)
- `xp` (int, default 0)
- `streak` (int, default 0)
- `longest_streak` (int, default 0)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `SELECT`, `INSERT`, `UPDATE`: `id = auth.uid()`

### 2. `user_settings`
- `user_id` (uuid, PK, references `profiles(id) ON DELETE CASCADE`)
- `sound_enabled` (boolean, default true)
- `sound_volume` (numeric, default 0.5)
- `pomodoro_focus` (int, default 25)
- `pomodoro_short_break` (int, default 5)
- `pomodoro_long_break` (int, default 15)
- `pomodoro_sessions_count` (int, default 4)
- `auto_start_breaks` (boolean, default false)
- `auto_start_focus` (boolean, default false)
- `weekly_focus_target` (int, default 10)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 3. `tasks`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `title` (text, not null)
- `description` (text, nullable)
- `subject` (text, not null)
- `category` (text, not null)
- `priority` (text, not null) — 'low', 'medium', 'high'
- `status` (text, not null) — 'pending', 'in_progress', 'completed', 'cancelled'
- `due_date` (date, not null)
- `due_time` (time, nullable)
- `estimated_minutes` (int, default 0)
- `recurring` (boolean, default false)
- `repeat_type` (text, nullable) — 'daily', 'weekly', 'weekdays', 'custom'
- `repeat_interval` (int, default 1)
- `repeat_days` (text[], nullable)
- `repeat_until` (date, nullable)
- `notes` (text, nullable)
- `completed_at` (timestamp, nullable)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 4. `resources`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `title` (text, not null)
- `description` (text, nullable)
- `type` (text, not null) — 'youtube', 'lecture', 'pdf', 'website', 'article', 'course', 'book', 'notes'
- `url` (text, not null)
- `subject` (text, not null)
- `topic` (text, nullable)
- `thumbnail_url` (text, nullable)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 5. `task_resources`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `task_id` (uuid, references `tasks(id) ON DELETE CASCADE`)
- `resource_id` (uuid, references `resources(id) ON DELETE CASCADE`)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies** (Verifies that user owns both task and resource):
  - `ALL`:
    ```sql
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_resources.task_id AND tasks.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM resources WHERE resources.id = task_resources.resource_id AND resources.user_id = auth.uid())
    ```

### 6. `weekly_goals`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `week_start` (date, not null)
- `title` (text, not null)
- `completed` (boolean, default false)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 7. `habits`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `title` (text, not null)
- `frequency_type` (text, not null) — 'daily', 'weekly', 'selected_days'
- `frequency_interval` (int, default 1)
- `frequency_days` (text[], nullable)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 8. `habit_logs`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `habit_id` (uuid, references `habits(id) ON DELETE CASCADE`)
- `date` (date, not null)
- `completed` (boolean, default true)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 9. `exams`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `subject` (text, not null)
- `title` (text, not null)
- `exam_type` (text, not null)
- `date` (date, not null)
- `time` (time, not null)
- `location` (text, nullable)
- `syllabus` (text[], default '{}')
- `syllabus_completed` (text[], default '{}')
- `notes` (text, nullable)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 10. `study_sessions`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `task_id` (uuid, references `tasks(id) ON DELETE SET NULL`, nullable)
- `subject` (text, not null)
- `duration_seconds` (int, not null)
- `session_type` (text, not null) — 'focus', 'short_break', 'long_break', 'custom'
- `completed` (boolean, default false)
- `started_at` (timestamp, not null)
- `ended_at` (timestamp, not null)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 11. `semester_goals`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `title` (text, not null)
- `category` (text, not null)
- `target` (text, not null)
- `current_progress` (numeric, default 0)
- `deadline` (date, not null)
- `status` (text, default 'pending')
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 12. `achievements`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `achievement_key` (text, unique, not null)
- `title` (text, not null)
- `description` (text, not null)
- `xp_reward` (int, default 0)
- `badge_icon` (text, not null)
- `requirement_type` (text, not null)
- `requirement_value` (int, not null)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `SELECT`: All authenticated users
  - `INSERT`, `UPDATE`, `DELETE`: Deny (reserved for administration)

### 13. `user_achievements`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `achievement_id` (uuid, references `achievements(id) ON DELETE CASCADE`)
- `unlocked_at` (timestamp, default `now()`)
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`

### 14. `notifications`
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles(id) ON DELETE CASCADE`)
- `title` (text, not null)
- `message` (text, not null)
- `read` (boolean, default false)
- `type` (text, default 'info') — 'info', 'warning', 'success'
- `created_at` (timestamp, default `now()`)
- `updated_at` (timestamp, default `now()`)
- **RLS Policies**:
  - `ALL`: `user_id = auth.uid()`
