-- =====================================================
-- DUEL MODE — Tables et RLS
-- =====================================================

-- 1. Table presence (élèves en ligne)
CREATE TABLE IF NOT EXISTS presence (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  full_name   TEXT,
  niveau      INT DEFAULT 1,
  xp          INT DEFAULT 0,
  classe      TEXT,
  serie       TEXT,
  derniere_activite TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presence_select" ON presence FOR SELECT USING (true);
CREATE POLICY "presence_insert" ON presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presence_update" ON presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "presence_delete" ON presence FOR DELETE USING (auth.uid() = user_id);

-- 2. Table duels
CREATE TABLE IF NOT EXISTS duels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  createur_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  createur_nom    TEXT,
  adversaire_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  adversaire_nom  TEXT,
  matiere         TEXT NOT NULL,
  questions       JSONB DEFAULT '[]',
  statut          TEXT DEFAULT 'attente' CHECK (statut IN ('attente', 'invite', 'en_cours', 'termine')),
  score_createur  INT DEFAULT 0,
  score_adversaire INT DEFAULT 0,
  gagnant_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duels_select" ON duels FOR SELECT USING (true);
CREATE POLICY "duels_insert" ON duels FOR INSERT WITH CHECK (auth.uid() = createur_id);
CREATE POLICY "duels_update" ON duels FOR UPDATE USING (
  auth.uid() = createur_id OR auth.uid() = adversaire_id
);

-- 3. Table duel_reponses
CREATE TABLE IF NOT EXISTS duel_reponses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id      UUID REFERENCES duels(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_idx INT NOT NULL,
  reponse      TEXT,
  correct      BOOLEAN DEFAULT FALSE,
  temps_ms     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE duel_reponses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duel_reponses_select" ON duel_reponses FOR SELECT USING (true);
CREATE POLICY "duel_reponses_insert" ON duel_reponses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Activer realtime sur les tables duel
ALTER PUBLICATION supabase_realtime ADD TABLE duels;
ALTER PUBLICATION supabase_realtime ADD TABLE duel_reponses;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;
