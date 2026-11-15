-- ============================================================
-- Table ai_logs : traçabilité des appels Groq API
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  feature      text        NOT NULL,   -- 'coach' | 'exam' | 'correction' | 'resume' | 'exercise' | 'bulletin'
  model        text        NOT NULL,   -- ex: 'openai/gpt-oss-120b'
  tokens_in    integer     DEFAULT 0,  -- prompt tokens
  tokens_out   integer     DEFAULT 0,  -- completion tokens
  duration_ms  integer     DEFAULT 0,  -- temps de réponse Groq
  success      boolean     NOT NULL DEFAULT true,
  error_code   text,                   -- code d'erreur si success=false
  created_at   timestamptz DEFAULT now()
);

-- Index pour les requêtes analytiques
CREATE INDEX IF NOT EXISTS ai_logs_created_at_idx ON ai_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_logs_feature_idx    ON ai_logs (feature);
CREATE INDEX IF NOT EXISTS ai_logs_user_id_idx    ON ai_logs (user_id);

-- RLS : seuls les super_admin peuvent lire
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_insert_service"
  ON ai_logs FOR INSERT
  WITH CHECK (true);  -- insertion depuis le serveur (service role ou anon côté API)

CREATE POLICY "ai_logs_select_admin"
  ON ai_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
