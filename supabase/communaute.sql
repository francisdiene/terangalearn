-- =====================================================
-- COMMUNAUTÉ — Tables sécurisées
-- =====================================================

-- 1. Table posts
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titre      TEXT NOT NULL CHECK (char_length(titre) BETWEEN 5 AND 200),
  contenu    TEXT NOT NULL CHECK (char_length(contenu) BETWEEN 10 AND 2000),
  matiere    TEXT CHECK (matiere IN ('MATH','PC','SVT','FR','HG','ANG','PHILO','ECO')),
  likes      INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
-- Seul l'auteur crée son post
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Seul l'auteur peut modifier/supprimer son post
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- 2. Table post_likes (1 like par user par post)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)  -- doublon impossible
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Trigger : synchro automatique du compteur likes dans posts
CREATE OR REPLACE FUNCTION sync_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_likes ON post_likes;
CREATE TRIGGER trg_sync_post_likes
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION sync_post_likes();

-- 3. Table groupes
CREATE TABLE IF NOT EXISTS groupes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL CHECK (char_length(nom) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  matiere     TEXT CHECK (matiere IN ('MATH','PC','SVT','FR','HG','ANG','PHILO','ECO')),
  max_membres INT DEFAULT 30 CHECK (max_membres BETWEEN 2 AND 200),
  createur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupes_select" ON groupes FOR SELECT USING (true);
CREATE POLICY "groupes_insert" ON groupes FOR INSERT WITH CHECK (auth.uid() = createur_id);
CREATE POLICY "groupes_update" ON groupes FOR UPDATE USING (auth.uid() = createur_id);
CREATE POLICY "groupes_delete" ON groupes FOR DELETE USING (auth.uid() = createur_id);

-- 4. Table groupe_membres avec vérification de capacité
CREATE TABLE IF NOT EXISTS groupe_membres (
  groupe_id  UUID NOT NULL REFERENCES groupes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (groupe_id, user_id)
);

ALTER TABLE groupe_membres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groupe_membres_select" ON groupe_membres FOR SELECT USING (true);
CREATE POLICY "groupe_membres_delete" ON groupe_membres FOR DELETE USING (auth.uid() = user_id);

-- Insert avec vérification de capacité max
CREATE POLICY "groupe_membres_insert" ON groupe_membres FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    SELECT COUNT(*) FROM groupe_membres gm WHERE gm.groupe_id = groupe_id
  ) < (
    SELECT max_membres FROM groupes g WHERE g.id = groupe_id
  )
);

-- 5. Rate limiting basique : max 10 posts par user par heure
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  post_count INT;
BEGIN
  SELECT COUNT(*) INTO post_count
  FROM posts
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF post_count >= 10 THEN
    RAISE EXCEPTION 'Limite atteinte : maximum 10 posts par heure';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_rate_limit ON posts;
CREATE TRIGGER trg_post_rate_limit
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION check_post_rate_limit();

-- 6. Realtime (ignorer si déjà membre)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE groupes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE groupe_membres;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Groupes de départ
INSERT INTO groupes (nom, description, matiere, max_membres, createur_id)
SELECT nom, description, matiere, 30, (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
FROM (VALUES
  ('Maths Terminale S', 'Révisions BAC Maths — séries S1, S2, S3', 'MATH'),
  ('Club SVT', 'Entraide en Sciences de la Vie et de la Terre', 'SVT'),
  ('Philo BFEM & BAC', 'Dissertation et textes philosophiques', 'PHILO'),
  ('Physique-Chimie BAC', 'Exercices et corrigés PC toutes séries', 'PC')
) AS t(nom, description, matiere)
WHERE NOT EXISTS (SELECT 1 FROM groupes LIMIT 1)
  AND EXISTS (SELECT 1 FROM profiles LIMIT 1);
