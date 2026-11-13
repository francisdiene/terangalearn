-- ============================================================
-- Push Subscriptions — stocke les endpoints VAPID par utilisateur
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut gérer ses propres subscriptions
CREATE POLICY "push_subscriptions_own" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Service role peut lire toutes (pour l'envoi en masse)
CREATE POLICY "push_subscriptions_service_read" ON push_subscriptions
  FOR SELECT USING (true);

-- Index pour les envois en masse
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

-- ============================================================
-- Notifications in-app — bannière dans le dashboard élève
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  cible       TEXT DEFAULT 'tous' CHECK (cible IN ('tous', 'troisieme', 'terminale', 'premiere')),
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tous les élèves peuvent lire les notifications actives
CREATE POLICY "notifications_read_all" ON notifications
  FOR SELECT USING (
    expires_at > now()
    AND (cible = 'tous' OR cible = (
      SELECT classe FROM profiles WHERE id = auth.uid()
    ))
  );

-- Seul le service role peut créer (via API admin)
-- (pas de policy INSERT pour les users normaux)

-- ============================================================
-- Notifications lues — éviter de reafficher ce que l'élève a déjà vu
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications_read (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

ALTER TABLE notifications_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON notifications_read
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Vue pratique : notifications non lues pour l'utilisateur courant
-- ============================================================
CREATE OR REPLACE VIEW notifications_unread AS
  SELECT n.*
  FROM notifications n
  WHERE n.expires_at > now()
    AND NOT EXISTS (
      SELECT 1 FROM notifications_read nr
      WHERE nr.notification_id = n.id
        AND nr.user_id = auth.uid()
    );
