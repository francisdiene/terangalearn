-- ══════════════════════════════════════════════════════════════════
-- Mise à jour des icônes et couleurs des matières
-- À coller dans Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

UPDATE matieres SET icone = '📐', couleur = '#3B82F6' WHERE code = 'MATH';
UPDATE matieres SET icone = '⚗️',  couleur = '#8B5CF6' WHERE code = 'PC';
UPDATE matieres SET icone = '🌿', couleur = '#10B981' WHERE code = 'SVT';
UPDATE matieres SET icone = '📖', couleur = '#F97316' WHERE code = 'FR';
UPDATE matieres SET icone = '🗺️',  couleur = '#F59E0B' WHERE code = 'HG';
UPDATE matieres SET icone = '🌍', couleur = '#06B6D4' WHERE code = 'EN';
UPDATE matieres SET icone = '🧠', couleur = '#EC4899' WHERE code = 'PHILO';
UPDATE matieres SET icone = '💹', couleur = '#059669' WHERE code = 'ECO';
UPDATE matieres SET icone = '💻', couleur = '#6366F1' WHERE code = 'INFO';
UPDATE matieres SET icone = '✏️',  couleur = '#64748B' WHERE code IS NOT NULL AND icone IS NULL;

-- Vérification
SELECT code, nom, icone, couleur FROM matieres ORDER BY nom;
