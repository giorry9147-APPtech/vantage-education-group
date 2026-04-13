-- ============================================================
-- FASE 2: Row Level Security policies
-- ============================================================
-- VOER DIT PAS UIT nadat Fase 1 volledig is gedraaid EN getest.
-- Controleer eerst dat ALLE records een school_id hebben.
-- ============================================================

-- Helper: haal school_id op van de ingelogde gebruiker
CREATE OR REPLACE FUNCTION auth.user_school_id()
RETURNS uuid AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check of gebruiker superadmin is
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- SCHOOLS
-- ============================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own school"
  ON schools FOR SELECT
  USING (
    id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Superadmins can manage schools"
  ON schools FOR ALL
  USING (auth.is_superadmin());

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles for own school"
  ON profiles FOR INSERT
  WITH CHECK (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- SUBJECTS
-- ============================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subjects of own school"
  ON subjects FOR SELECT
  USING (
    school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Admins can insert subjects for own school"
  ON subjects FOR INSERT
  WITH CHECK (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete subjects of own school"
  ON subjects FOR DELETE
  USING (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- CATEGORIES
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of own school"
  ON categories FOR SELECT
  USING (
    school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Admins can insert categories for own school"
  ON categories FOR INSERT
  WITH CHECK (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete categories of own school"
  ON categories FOR DELETE
  USING (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- LESSONS
-- ============================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of own school"
  ON lessons FOR SELECT
  USING (
    school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Admins can insert lessons for own school"
  ON lessons FOR INSERT
  WITH CHECK (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete lessons of own school"
  ON lessons FOR DELETE
  USING (
    school_id = auth.user_school_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- LESSON_DOWNLOAD_LOGS
-- ============================================================
ALTER TABLE lesson_download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view download logs of own school"
  ON lesson_download_logs FOR SELECT
  USING (
    school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );

CREATE POLICY "Users can insert download logs for own school"
  ON lesson_download_logs FOR INSERT
  WITH CHECK (
    school_id = auth.user_school_id()
    OR auth.is_superadmin()
  );
