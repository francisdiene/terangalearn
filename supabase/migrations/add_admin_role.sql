-- 1. Ajouter le champ role dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Te donner le rôle admin (remplace par ton user_id Supabase)
-- Va dans Supabase > Authentication > Users, copie ton UUID
-- UPDATE profiles SET role = 'admin' WHERE id = 'TON_USER_ID_ICI';

-- 3. RLS : seuls les admins peuvent lire tous les profiles
-- (la policy existante reste, on ajoute juste la lecture admin)
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Stats view pour l'admin (lecture rapide)
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') AS total_eleves,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') AS nouveaux_7j,
  (SELECT COUNT(*) FROM cours) AS total_cours,
  (SELECT COUNT(*) FROM cours WHERE resume IS NOT NULL AND LENGTH(resume) > 50) AS cours_avec_resume,
  (SELECT COUNT(*) FROM epreuves) AS total_epreuves,
  (SELECT COUNT(*) FROM examens_simules) AS total_examens_passes,
  (SELECT COUNT(DISTINCT user_id) FROM examens_simules WHERE created_at > NOW() - INTERVAL '7 days') AS actifs_7j;

-- Accès à la vue pour les admins uniquement (via RLS sur la vue)
GRANT SELECT ON admin_stats TO authenticated;
