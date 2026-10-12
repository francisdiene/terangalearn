-- =====================================================
-- COMMUNAUTÉ — Tables et RLS
-- =====================================================

-- 1. Table posts (forum)
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL,
  contenu    TEXT NOT NULL,
  matiere    TEXT,
  likes      INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id OR true); -- likes par tous

-- 2. Table groupes
CREATE TABLE IF NOT EXISTS groupes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  description TEXT,
  matiere     TEXT,
  max_membres INT DEFAULT 30,
  createur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupes_select" ON groupes FOR SELECT USING (true);
CREATE POLICY "groupes_insert" ON groupes FOR INSERT WITH CHECK (auth.uid() = createur_id);
CREATE POLICY "groupes_update" ON groupes FOR UPDATE USING (auth.uid() = createur_id);

-- 3. Table groupe_membres
CREATE TABLE IF NOT EXISTS groupe_membres (
  groupe_id  UUID REFERENCES groupes(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (groupe_id, user_id)
);

ALTER TABLE groupe_membres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupe_membres_select" ON groupe_membres FOR SELECT USING (true);
CREATE POLICY "groupe_membres_insert" ON groupe_membres FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groupe_membres_delete" ON groupe_membres FOR DELETE USING (auth.uid() = user_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE groupes;
ALTER PUBLICATION supabase_realtime ADD TABLE groupe_membres;

-- 5. Quelques groupes de départ
INSERT INTO groupes (nom, description, matiere, max_membres, createur_id)
SELECT
  nom, description, matiere, 30, (SELECT id FROM profiles LIMIT 1)
FROM (VALUES
  ('Maths Terminale S', 'Révisions BAC Maths — séries S1, S2, S3', 'MATH'),
  ('Club SVT', 'Entraide en Sciences de la Vie et de la Terre', 'SVT'),
  ('Philo BFEM', 'Dissertation et textes philosophiques', 'PHILO'),
  ('Physique-Chimie BAC', 'Exercices et corrigés PC toutes séries', 'PC')
) AS t(nom, description, matiere)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);
