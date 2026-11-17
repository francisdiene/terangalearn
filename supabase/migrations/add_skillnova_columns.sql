-- ============================================================
-- Migration : Colonnes Skill Nova pour la table epreuves
-- Additive uniquement — aucune suppression de colonne/table
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Nouvelles colonnes sur epreuves
ALTER TABLE epreuves
  ADD COLUMN IF NOT EXISTS chapitre            TEXT,
  ADD COLUMN IF NOT EXISTS sha256              TEXT,
  ADD COLUMN IF NOT EXISTS source_externe_id   TEXT,
  ADD COLUMN IF NOT EXISTS has_corrige_externe BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fournisseur_corrige TEXT,
  ADD COLUMN IF NOT EXISTS statut              TEXT NOT NULL DEFAULT 'published'
    CHECK (statut IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS droits              TEXT,
  ADD COLUMN IF NOT EXISTS acces               TEXT NOT NULL DEFAULT 'free'
    CHECK (acces IN ('free', 'premium', 'school')),
  ADD COLUMN IF NOT EXISTS annee_scolaire      TEXT;

-- 2. Index unicité sur sha256 (idempotence import)
CREATE UNIQUE INDEX IF NOT EXISTS idx_epreuves_sha256_unique
  ON epreuves(sha256) WHERE sha256 IS NOT NULL;

-- 3. Index de recherche courants
CREATE INDEX IF NOT EXISTS idx_epreuves_chapitre ON epreuves(chapitre);
CREATE INDEX IF NOT EXISTS idx_epreuves_statut   ON epreuves(statut);
CREATE INDEX IF NOT EXISTS idx_epreuves_acces    ON epreuves(acces);

-- 4. Nouvelles matières PHY et CHIMIE
INSERT INTO matieres (nom, code, icone, couleur, classe)
VALUES
  ('Physique', 'PHY',    '⚡', '#f97316', 'both'),
  ('Chimie',   'CHIMIE', '🧪', '#a855f7', 'both')
ON CONFLICT (code) DO NOTHING;
