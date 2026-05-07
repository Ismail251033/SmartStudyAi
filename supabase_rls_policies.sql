-- ============================================================
-- SmartStudyAI — Complete RLS Policy Setup
-- Run this AFTER supabase_schema.sql in the SQL Editor
-- Safe to re-run: uses DROP IF EXISTS before each CREATE
-- ============================================================


-- ============================================================
-- SECTION 1 — ENABLE RLS ON ALL TABLES
-- (idempotent — safe to run multiple times)
-- ============================================================

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 2 — DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================

-- users
DROP POLICY IF EXISTS "users_select_own"            ON public.users;
DROP POLICY IF EXISTS "users_insert_own"            ON public.users;
DROP POLICY IF EXISTS "users_update_own"            ON public.users;
DROP POLICY IF EXISTS "users_delete_own"            ON public.users;
DROP POLICY IF EXISTS "users_service_role_all"      ON public.users;

-- activities
DROP POLICY IF EXISTS "activities_select_own"       ON public.activities;
DROP POLICY IF EXISTS "activities_insert_own"       ON public.activities;
DROP POLICY IF EXISTS "activities_update_own"       ON public.activities;
DROP POLICY IF EXISTS "activities_delete_own"       ON public.activities;
DROP POLICY IF EXISTS "activities_service_role_all" ON public.activities;

-- flashcards
DROP POLICY IF EXISTS "flashcards_select_own"       ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_insert_own"       ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_update_own"       ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_delete_own"       ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_service_role_all" ON public.flashcards;

-- quizzes
DROP POLICY IF EXISTS "quizzes_select_own"          ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_insert_own"          ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_update_own"          ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_delete_own"          ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_service_role_all"    ON public.quizzes;


-- ============================================================
-- SECTION 3 — users TABLE POLICIES
-- ============================================================

-- Service role (backend) can do everything — bypasses RLS checks
-- This is required because the backend uses the service_role key
-- to write XP, level, and streak updates on behalf of users.
CREATE POLICY "users_service_role_all"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own profile row only
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Authenticated users can insert their own profile row only
-- (called during signup — id must match their auth uid)
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Authenticated users can update only their own row
-- and cannot change their id or email via this path
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can delete their own account row
-- (cascades to all child tables via FK ON DELETE CASCADE)
CREATE POLICY "users_delete_own"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);


-- ============================================================
-- SECTION 4 — activities TABLE POLICIES
-- ============================================================

-- Service role full access (backend writes XP activity logs)
CREATE POLICY "activities_service_role_all"
  ON public.activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own activity history
CREATE POLICY "activities_select_own"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert activities only for themselves
CREATE POLICY "activities_insert_own"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activity records
-- (e.g. marking a quiz attempt as reviewed)
CREATE POLICY "activities_update_own"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activity entries
CREATE POLICY "activities_delete_own"
  ON public.activities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- SECTION 5 — flashcards TABLE POLICIES
-- ============================================================

-- Service role full access (backend saves generated sets)
CREATE POLICY "flashcards_service_role_all"
  ON public.flashcards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read only their own flashcard sets
CREATE POLICY "flashcards_select_own"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert flashcard sets only under their own user_id
CREATE POLICY "flashcards_insert_own"
  ON public.flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can rename or edit their own flashcard sets
CREATE POLICY "flashcards_update_own"
  ON public.flashcards
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own flashcard sets
CREATE POLICY "flashcards_delete_own"
  ON public.flashcards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- SECTION 6 — quizzes TABLE POLICIES
-- ============================================================

-- Service role full access (backend saves generated quizzes)
CREATE POLICY "quizzes_service_role_all"
  ON public.quizzes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read only their own saved quizzes
CREATE POLICY "quizzes_select_own"
  ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can save quizzes only under their own user_id
CREATE POLICY "quizzes_insert_own"
  ON public.quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can edit their own quiz records
CREATE POLICY "quizzes_update_own"
  ON public.quizzes
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quiz records
CREATE POLICY "quizzes_delete_own"
  ON public.quizzes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- SECTION 7 — GRANT PERMISSIONS TO ROLES
-- ============================================================

-- Grant usage on schema to authenticated and service_role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- users table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users      TO authenticated;
GRANT ALL                             ON public.users      TO service_role;

-- activities table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL                             ON public.activities TO service_role;

-- flashcards table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL                             ON public.flashcards TO service_role;

-- quizzes table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes    TO authenticated;
GRANT ALL                             ON public.quizzes    TO service_role;


-- ============================================================
-- SECTION 8 — VERIFICATION QUERIES
-- Run these after applying to confirm everything is set up.
-- ============================================================

-- View all active RLS policies across all app tables:
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd         AS operation,
  qual        AS using_expression,
  with_check  AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'activities', 'flashcards', 'quizzes')
ORDER BY tablename, policyname;

-- Confirm RLS is enabled on all tables:
SELECT
  relname        AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('users', 'activities', 'flashcards', 'quizzes')
  AND relnamespace = 'public'::regnamespace
ORDER BY relname;
