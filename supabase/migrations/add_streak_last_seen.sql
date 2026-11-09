-- Colonne pour tracker la dernière visite (calcul du streak)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_date DATE;

-- Réinitialiser les streaks à 0 pour les anciens comptes
-- (facultatif, ils repartiront à 1 à la prochaine connexion)
-- UPDATE profiles SET streak = 0 WHERE last_seen_date IS NULL;
