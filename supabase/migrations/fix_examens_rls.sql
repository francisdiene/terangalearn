-- ============================================================
-- Fix RLS : examens_simules, exercices, posts, duels
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── examens_simules ──────────────────────────────────────────
-- Activer RLS si pas encore fait
ALTER TABLE examens_simules ENABLE ROW LEVEL SECURITY;

-- Élève peut insérer ses propres examens
CREATE POLICY "examens_simules_insert_own"
  ON examens_simules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Élève peut lire ses propres examens
CREATE POLICY "examens_simules_select_own"
  ON examens_simules FOR SELECT
  USING (auth.uid() = user_id);

-- Admin peut lire tous les examens
CREATE POLICY "examens_simules_select_admin"
  ON examens_simules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ── exercices ────────────────────────────────────────────────
ALTER TABLE exercices ENABLE ROW LEVEL SECURITY;

-- Tous les élèves authentifiés peuvent lire les exercices
CREATE POLICY "exercices_select_authenticated"
  ON exercices FOR SELECT
  TO authenticated
  USING (true);

-- Admins peuvent insérer / modifier
CREATE POLICY "exercices_insert_admin"
  ON exercices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "exercices_update_admin"
  ON exercices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ── posts ────────────────────────────────────────────────────
-- (si la table existe et que RLS n'est pas configuré)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les élèves authentifiés
CREATE POLICY "posts_select_authenticated"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- Chaque élève peut créer ses propres posts
CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- L'auteur peut modifier/supprimer son post, les admins aussi
CREATE POLICY "posts_update_own_or_admin"
  ON posts FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'moderateur')
    )
  );

CREATE POLICY "posts_delete_own_or_admin"
  ON posts FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'moderateur')
    )
  );

-- ── push_subscriptions ───────────────────────────────────────
-- (créée par add_notifications.sql, mais les policies peuvent manquer)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Admins peuvent lire toutes les subscriptions pour l'envoi push
CREATE POLICY "push_subscriptions_select_admin"
  ON push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
