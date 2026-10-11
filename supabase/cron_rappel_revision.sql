-- 1. Ajouter la colonne notif_email dans profiles (si pas déjà là)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;

-- 2. Activer l'extension pg_cron (à faire une seule fois dans Supabase)
-- Va dans Database → Extensions → cherche "pg_cron" → Enable

-- 3. Programmer le cron à 18h00 WAT (18h Dakar = 18h UTC en hiver, 17h UTC en été)
-- On met 17h UTC pour couvrir les deux saisons
SELECT cron.schedule(
  'rappel-revision-quotidien',     -- nom du job
  '0 17 * * *',                     -- chaque jour à 17h UTC = 18h Dakar (WAT)
  $$
  SELECT net.http_post(
    url := 'https://<TON_PROJECT_REF>.supabase.co/functions/v1/rappel-revision',
    headers := '{"Authorization": "Bearer <TON_CRON_SECRET>", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Pour vérifier les jobs programmés :
-- SELECT * FROM cron.job;

-- Pour supprimer le job :
-- SELECT cron.unschedule('rappel-revision-quotidien');

-- 4. Mettre à jour last_activity_date quand un user fait un exercice
-- (à ajouter dans ta logique d'exercice côté serveur, ou via trigger)
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_activity_date = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur la table des progressions/résultats d'exercices
-- (adapte le nom de table selon ta DB)
DROP TRIGGER IF EXISTS trg_update_last_activity ON resultats_exercices;
CREATE TRIGGER trg_update_last_activity
  AFTER INSERT ON resultats_exercices
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();
