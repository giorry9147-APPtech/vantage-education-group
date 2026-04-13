-- ============================================================
-- FASE 1b: Branding kolommen toevoegen aan schools
-- ============================================================
-- Draai dit in de Supabase SQL Editor.
-- ============================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#16366c',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#0d2552',
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#f59f17';
