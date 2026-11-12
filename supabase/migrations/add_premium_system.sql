-- ============================================================
-- SYSTÈME PREMIUM TERANGALEARN
-- ============================================================

-- 1. Colonne plan sur profiles (free | premium | school)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'premium', 'school'));

-- 2. Table subscriptions — historique complet des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan             TEXT NOT NULL CHECK (plan IN ('premium', 'school')),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  -- Dates
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  -- Paiement
  payment_method   TEXT CHECK (payment_method IN ('wave', 'orange_money', 'free_trial', 'school', 'manual')),
  payment_ref      TEXT,                        -- référence transaction Wave/OM
  amount_fcfa      INT,                         -- montant payé
  -- Année scolaire (pour les licences school)
  school_year      TEXT,                        -- ex: "2026-2027"
  school_id        UUID REFERENCES schools(id), -- null si premium individuel
  -- Méta
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table schools (établissements partenaires)
CREATE TABLE IF NOT EXISTS schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              TEXT NOT NULL,
  code             TEXT UNIQUE NOT NULL,         -- ex: "LSNT-2026"
  ville            TEXT,
  email_domain     TEXT,                         -- ex: "lycee-snt.sn"
  nb_licences      INT DEFAULT 0,                -- places achetées
  plan_expire_at   TIMESTAMPTZ,                  -- fin du contrat école
  contact_email    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lier profiles → schools
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id),
  ADD COLUMN IF NOT EXISTS school_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 5. Index performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- 6. Vue utile : abonnement actif courant par user
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT DISTINCT ON (user_id)
  user_id,
  plan,
  status,
  started_at,
  expires_at,
  payment_method,
  school_id,
  school_year
FROM subscriptions
WHERE status = 'active'
  AND expires_at > NOW()
ORDER BY user_id, expires_at DESC;

-- 7. Fonction : vérifier et dégrader les plans expirés (à appeler via cron)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- Marquer les subscriptions expirées
  UPDATE subscriptions
    SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  -- Repasser les profiles en 'free' si plus aucun abonnement actif
  UPDATE profiles p
    SET plan = 'free', plan_expires_at = NULL
  WHERE p.plan IN ('premium', 'school')
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = p.id
        AND s.status = 'active'
        AND s.expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 8. RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Un user voit ses propres subscriptions
CREATE POLICY "User can see own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Seuls les admins peuvent insérer/modifier des subscriptions
CREATE POLICY "Admins manage subscriptions"
  ON subscriptions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Les schools sont lisibles par tous les authentifiés
CREATE POLICY "Schools readable by authenticated"
  ON schools FOR SELECT TO authenticated
  USING (true);

-- 9. Quota Coach IA selon le plan (table de référence)
CREATE TABLE IF NOT EXISTS plan_quotas (
  plan            TEXT PRIMARY KEY,
  coach_ia_daily  INT,     -- messages Coach IA / jour (NULL = illimité)
  exams_weekly    INT,     -- examens simulés / semaine (NULL = illimité)
  can_orientation BOOLEAN DEFAULT false,
  can_download    BOOLEAN DEFAULT false,
  can_planif_smart BOOLEAN DEFAULT false
);

INSERT INTO plan_quotas (plan, coach_ia_daily, exams_weekly, can_orientation, can_download, can_planif_smart)
VALUES
  ('free',    3,    2,    false, false, false),
  ('premium', NULL, NULL, true,  true,  true),
  ('school',  NULL, NULL, true,  true,  true)
ON CONFLICT (plan) DO UPDATE SET
  coach_ia_daily   = EXCLUDED.coach_ia_daily,
  exams_weekly     = EXCLUDED.exams_weekly,
  can_orientation  = EXCLUDED.can_orientation,
  can_download     = EXCLUDED.can_download,
  can_planif_smart = EXCLUDED.can_planif_smart;

GRANT SELECT ON plan_quotas TO authenticated;
GRANT SELECT ON active_subscriptions TO authenticated;
