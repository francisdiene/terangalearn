-- ============================================================
-- Migration : Système Premium TerangaLearn
-- ============================================================

-- 1. Colonnes plan sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'premium', 'school')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS school_id UUID;

-- 2. Table abonnements (historique paiements)
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('premium', 'school')),
  billing_cycle   TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_fcfa     INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'refunded')),
  -- Wave
  wave_ref        TEXT UNIQUE,          -- checkout_id Wave
  wave_session_id TEXT,
  -- Dates
  started_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_wave_ref ON subscriptions(wave_ref);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 3. Table écoles (B2B)
CREATE TABLE IF NOT EXISTS schools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT NOT NULL,
  code            TEXT UNIQUE NOT NULL,   -- ex: "LSNT-2026"
  ville           TEXT,
  email_domain    TEXT,                   -- ex: "lycee-snt.sn"
  nb_licences     INT NOT NULL DEFAULT 0,
  plan_expires_at TIMESTAMPTZ,
  contact_email   TEXT,
  contact_phone   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_school
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

-- 4. RLS subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins see all subscriptions"
  ON subscriptions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- 5. Fonction auto-expiration plan
-- Un cron ou trigger peut appeler cette fonction pour rétrograder
-- les plans expirés en 'free'
CREATE OR REPLACE FUNCTION expire_plans()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET plan = 'free',
      plan_expires_at = NULL
  WHERE plan IN ('premium', 'school')
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < NOW()
    AND school_id IS NULL;  -- ne pas toucher aux licences scolaires
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Mise à jour updated_at auto
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();
