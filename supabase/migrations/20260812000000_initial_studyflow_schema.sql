-- Initial StudyFlow Schema migration
-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    university text NOT NULL,
    degree text NOT NULL,
    branch text NOT NULL,
    year integer NOT NULL,
    semester integer NOT NULL,
    career_goals text[] DEFAULT '{}'::text[],
    academic_goals text[] DEFAULT '{}'::text[],
    avatar_url text,
    xp integer DEFAULT 0,
    streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    student_id text UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    sound_enabled boolean DEFAULT true,
    sound_volume numeric DEFAULT 0.5,
    pomodoro_focus integer DEFAULT 25,
    pomodoro_short_break integer DEFAULT 5,
    pomodoro_long_break integer DEFAULT 15,
    pomodoro_sessions_count integer DEFAULT 4,
    auto_start_breaks boolean DEFAULT false,
    auto_start_focus boolean DEFAULT false,
    weekly_focus_target integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Exams
CREATE TABLE IF NOT EXISTS public.exams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject text NOT NULL,
    title text NOT NULL,
    exam_type text NOT NULL,
    date date NOT NULL,
    time time without time zone,
    location text,
    syllabus text[] DEFAULT '{}'::text[],
    syllabus_completed text[] DEFAULT '{}'::text[],
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    subject text NOT NULL,
    category text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date date NOT NULL,
    due_time time without time zone,
    estimated_minutes integer DEFAULT 0,
    recurring boolean DEFAULT false,
    repeat_type text CHECK (repeat_type IN ('daily', 'weekly', 'weekdays', 'selected_days', 'custom') OR repeat_type IS NULL),
    repeat_interval integer DEFAULT 1,
    repeat_days text[],
    repeat_until date,
    notes text,
    completed_at timestamp with time zone,
    video_url text,
    resource_url text,
    exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Resources
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text NOT NULL,
    url text NOT NULL,
    subject text NOT NULL,
    topic text,
    thumbnail_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Task Resources (Many to Many task/resource links)
CREATE TABLE IF NOT EXISTS public.task_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. Weekly Goals
CREATE TABLE IF NOT EXISTS public.weekly_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    title text NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 8. Habits
CREATE TABLE IF NOT EXISTS public.habits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    frequency_type text NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'selected_days')),
    frequency_interval integer DEFAULT 1,
    frequency_days text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. Habit Logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    date date NOT NULL,
    completed boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_user_habit_date UNIQUE (user_id, habit_id, date)
);

-- 10. Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
    subject text NOT NULL,
    duration_seconds integer NOT NULL,
    session_type text NOT NULL,
    completed boolean DEFAULT false,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 11. Semester Goals
CREATE TABLE IF NOT EXISTS public.semester_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text NOT NULL,
    target text NOT NULL,
    current_progress numeric DEFAULT 0,
    deadline date NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 12. Achievements (Static Master Definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_key text UNIQUE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    xp_reward integer DEFAULT 0,
    badge_icon text NOT NULL,
    requirement_type text NOT NULL,
    requirement_value integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 13. User Achievements (Unlocked ones)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    type text DEFAULT 'info',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 15. Subtasks
CREATE TABLE IF NOT EXISTS public.subtasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    completed boolean DEFAULT false,
    position integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 16. Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint DEFAULT 0,
    storage_path text,
    source_type text DEFAULT 'file' CHECK (source_type IN ('file', 'url', 'youtube', 'website', 'github', 'external_link')),
    source_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 17. Attachment Links (Many-to-many link connections)
CREATE TABLE IF NOT EXISTS public.attachment_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attachment_id uuid NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    entity_type text NOT NULL CHECK (entity_type IN ('task', 'exam', 'resource', 'subtask', 'workspace')),
    entity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_links ENABLE ROW LEVEL SECURITY;

-- Creating policies
-- Profiles: owner all
CREATE POLICY profiles_owner_policy ON public.profiles
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- User Settings: owner all
CREATE POLICY user_settings_owner_policy ON public.user_settings
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Tasks: owner all
CREATE POLICY tasks_owner_policy ON public.tasks
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Resources: owner all
CREATE POLICY resources_owner_policy ON public.resources
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Task Resources: verified via owning tasks & resources
CREATE POLICY task_resources_owner_policy ON public.task_resources
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_resources.task_id AND tasks.user_id = auth.uid())
        AND
        EXISTS (SELECT 1 FROM public.resources WHERE resources.id = task_resources.resource_id AND resources.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_resources.task_id AND tasks.user_id = auth.uid())
        AND
        EXISTS (SELECT 1 FROM public.resources WHERE resources.id = task_resources.resource_id AND resources.user_id = auth.uid())
    );

-- Weekly Goals: owner all
CREATE POLICY weekly_goals_owner_policy ON public.weekly_goals
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Habits: owner all
CREATE POLICY habits_owner_policy ON public.habits
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Habit Logs: owner all
CREATE POLICY habit_logs_owner_policy ON public.habit_logs
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Exams: owner all
CREATE POLICY exams_owner_policy ON public.exams
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Study Sessions: owner all
CREATE POLICY study_sessions_owner_policy ON public.study_sessions
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Semester Goals: owner all
CREATE POLICY semester_goals_owner_policy ON public.semester_goals
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Achievements: select public, write admin
CREATE POLICY achievements_select_policy ON public.achievements
    FOR SELECT TO authenticated USING (true);

-- User Achievements: owner all
CREATE POLICY user_achievements_owner_policy ON public.user_achievements
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications: owner all
CREATE POLICY notifications_owner_policy ON public.notifications
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Subtasks: owner all
CREATE POLICY subtasks_owner_policy ON public.subtasks
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Attachments: owner all
CREATE POLICY attachments_owner_policy ON public.attachments
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Attachment Links: owner all
CREATE POLICY attachment_links_owner_policy ON public.attachment_links
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON public.weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week_start ON public.weekly_goals(week_start);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(date);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_semester_goals_user_id ON public.semester_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachment_links_entity ON public.attachment_links(entity_type, entity_id);

-- Storage bucket configurations (private bucket student-files)
-- Insert the bucket record if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('student-files', 'student-files', false, 20971520, NULL) -- 20MB
ON CONFLICT (id) DO NOTHING;

-- Storage object RLS policies
-- 1. SELECT owner only
CREATE POLICY select_files_policy ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'student-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. INSERT owner only
CREATE POLICY insert_files_policy ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'student-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. UPDATE owner only
CREATE POLICY update_files_policy ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'student-files' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'student-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. DELETE owner only
CREATE POLICY delete_files_policy ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'student-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Seeding achievements
INSERT INTO public.achievements (id, achievement_key, title, description, xp_reward, badge_icon, requirement_type, requirement_value)
VALUES 
    ('3b6d4c51-5b72-4b2a-8c76-92c1c3f2d011', 'first_task', 'First Step', 'Complete your first task', 50, 'CheckCircle', 'tasks_completed', 1),
    ('3b6d4c51-5b72-4b2a-8c76-92c1c3f2d012', 'first_focus', 'Laser Focus', 'Complete your first Pomodoro focus session', 100, 'Flame', 'focus_sessions', 1),
    ('3b6d4c51-5b72-4b2a-8c76-92c1c3f2d013', 'streak_7', 'Week of Fire', 'Maintain a 7-day study streak', 250, 'Zap', 'streak_days', 7),
    ('3b6d4c51-5b72-4b2a-8c76-92c1c3f2d014', 'focus_25', 'Pomodoro Master', 'Complete 25 focus sessions', 500, 'Award', 'focus_sessions', 25),
    ('3b6d4c51-5b72-4b2a-8c76-92c1c3f2d015', 'tasks_100', 'Task Destroyer', 'Complete 100 tasks', 1000, 'ShieldAlert', 'tasks_completed', 100)
ON CONFLICT (achievement_key) DO UPDATE
SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    xp_reward = EXCLUDED.xp_reward,
    badge_icon = EXCLUDED.badge_icon,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value;
