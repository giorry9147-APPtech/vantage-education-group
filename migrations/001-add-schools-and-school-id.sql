-- ============================================================
-- FASE 1: Multi-tenant migratie — Veilige uitbreiding
-- ============================================================
-- Dit script breekt NIETS aan de bestaande data of structuur.
-- Het voegt alleen nieuwe tabellen en kolommen toe.
-- Draai dit in de Supabase SQL Editor.
-- ============================================================

-- STAP 1: Schools tabel aanmaken
CREATE TABLE IF NOT EXISTS schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  domain text,
  created_at timestamptz DEFAULT now()
);

-- STAP 2: Default school aanmaken voor alle bestaande data
INSERT INTO schools (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Vantage Education Group',
  'vantage'
)
ON CONFLICT (id) DO NOTHING;

-- STAP 3: school_id toevoegen aan bestaande tabellen (nullable zodat niets breekt)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

ALTER TABLE lesson_download_logs
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

-- STAP 4: Backfill — koppel alle bestaande records aan de default school
UPDATE profiles
SET school_id = '00000000-0000-0000-0000-000000000001'
WHERE school_id IS NULL;

UPDATE subjects
SET school_id = '00000000-0000-0000-0000-000000000001'
WHERE school_id IS NULL;

UPDATE categories
SET school_id = '00000000-0000-0000-0000-000000000001'
WHERE school_id IS NULL;

UPDATE lessons
SET school_id = '00000000-0000-0000-0000-000000000001'
WHERE school_id IS NULL;

UPDATE lesson_download_logs
SET school_id = '00000000-0000-0000-0000-000000000001'
WHERE school_id IS NULL;

-- STAP 5: Indexes voor performance bij filteren op school_id
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_categories_school_id ON categories(school_id);
CREATE INDEX IF NOT EXISTS idx_lessons_school_id ON lessons(school_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_school_id ON lesson_download_logs(school_id);
