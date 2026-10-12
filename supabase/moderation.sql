-- =====================================================
-- MODÉRATION — Système complet
-- =====================================================

-- 1. Rôles de modération dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'eleve'
    CHECK (role IN ('eleve', 'ambassadeur', 'moderateur', 'admin', 'super_admin')),
  ADD COLUMN IF NOT EXISTS sanctionne_jusqu_au TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nb_avertissements INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banni BOOLEAN DEFAULT FALSE;

-- 2. Table signalements
CREATE TABLE IF NOT EXISTS signalements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE,
  signale_par   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raison        TEXT NOT NULL CHECK (raison IN ('spam', 'harcelement', 'hors_sujet', 'triche', 'contenu_sexuel', 'autre')),
  description   TEXT CHECK (char_length(description) <= 500),
  statut        TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'rejete')),
  priorite      TEXT DEFAULT 'standard' CHECK (priorite IN ('urgente', 'standard')),
  traite_par    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  traite_le     TIMESTAMPTZ,
  decision      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  -- Un user ne peut signaler le même post qu'une fois
  UNIQUE (post_id, signale_par)
);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

-- Les modérateurs et admins voient tout
CREATE POLICY "signalements_select_mods" ON signalements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('moderateur', 'admin', 'super_admin')
  )
);
-- Un user voit ses propres signalements
CREATE POLICY "signalements_select_own" ON signalements FOR SELECT USING (
  auth.uid() = signale_par
);
-- Tout connecté peut signaler
CREATE POLICY "signalements_insert" ON signalements FOR INSERT WITH CHECK (
  auth.uid() = signale_par
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND banni = TRUE
  )
);
-- Seuls les modérateurs peuvent mettre à jour
CREATE POLICY "signalements_update" ON signalements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('moderateur', 'admin', 'super_admin')
  )
);

-- Priorité automatique selon la raison
CREATE OR REPLACE FUNCTION set_signalement_priorite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raison IN ('harcelement', 'contenu_sexuel') THEN
    NEW.priorite := 'urgente';
  ELSE
    NEW.priorite := 'standard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signalement_priorite ON signalements;
CREATE TRIGGER trg_signalement_priorite
  BEFORE INSERT ON signalements
  FOR EACH ROW EXECUTE FUNCTION set_signalement_priorite();

-- 3. Table sanctions
CREATE TABLE IF NOT EXISTS sanctions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type_sanction TEXT NOT NULL CHECK (type_sanction IN ('avertissement', 'suspension_7j', 'suspension_30j', 'bannissement')),
  raison        TEXT NOT NULL,
  signalement_id UUID REFERENCES signalements(id) ON DELETE SET NULL,
  applique_par  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expire_le     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sanctions_select_mods" ON sanctions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderateur', 'admin', 'super_admin'))
  OR auth.uid() = user_id
);
CREATE POLICY "sanctions_insert" ON sanctions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderateur', 'admin', 'super_admin'))
);

-- Trigger : applique la sanction dans profiles automatiquement
CREATE OR REPLACE FUNCTION appliquer_sanction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type_sanction = 'avertissement' THEN
    UPDATE profiles SET nb_avertissements = nb_avertissements + 1 WHERE id = NEW.user_id;
  ELSIF NEW.type_sanction IN ('suspension_7j', 'suspension_30j') THEN
    UPDATE profiles SET sanctionne_jusqu_au = NEW.expire_le WHERE id = NEW.user_id;
  ELSIF NEW.type_sanction = 'bannissement' THEN
    UPDATE profiles SET banni = TRUE WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_appliquer_sanction ON sanctions;
CREATE TRIGGER trg_appliquer_sanction
  AFTER INSERT ON sanctions
  FOR EACH ROW EXECUTE FUNCTION appliquer_sanction();

-- 4. Journal d'audit
CREATE TABLE IF NOT EXISTS audit_moderation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderateur_id UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,
  cible_type  TEXT CHECK (cible_type IN ('post', 'user', 'groupe', 'signalement')),
  cible_id    UUID,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select" ON audit_moderation FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "audit_insert" ON audit_moderation FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderateur', 'admin', 'super_admin'))
);

-- 5. Bloquer la publication si sanctionné
CREATE OR REPLACE FUNCTION check_user_sanctionne()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
BEGIN
  SELECT banni, sanctionne_jusqu_au INTO user_profile
  FROM profiles WHERE id = NEW.user_id;

  IF user_profile.banni THEN
    RAISE EXCEPTION 'Ton compte a été banni de la communauté';
  END IF;

  IF user_profile.sanctionne_jusqu_au IS NOT NULL
     AND user_profile.sanctionne_jusqu_au > NOW() THEN
    RAISE EXCEPTION 'Tu es suspendu jusqu''au %',
      TO_CHAR(user_profile.sanctionne_jusqu_au AT TIME ZONE 'Africa/Dakar', 'DD/MM/YYYY HH24:MI');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_sanctionne_post ON posts;
CREATE TRIGGER trg_check_sanctionne_post
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION check_user_sanctionne();

DROP TRIGGER IF EXISTS trg_check_sanctionne_groupe ON groupe_membres;
CREATE TRIGGER trg_check_sanctionne_groupe
  BEFORE INSERT ON groupe_membres
  FOR EACH ROW EXECUTE FUNCTION check_user_sanctionne();

-- 6. Promouvoir Francis en super_admin
UPDATE profiles SET role = 'super_admin'
WHERE email = 'francoisdiene306@gmail.com';

-- 7. Realtime sur signalements (pour notif temps réel aux modos)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE signalements;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
