-- ============================================================
-- Fix : trigger handle_new_user — mapper raw_user_meta_data
--       vers les colonnes serie, classe, full_name, pays
--       dans la table profiles
--
-- Problème : si le trigger initial ne lisait pas "serie" depuis
-- raw_user_meta_data, les nouveaux comptes avaient serie = NULL
-- même quand l'élève l'avait sélectionnée à l'inscription.
--
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── 1. Recréer le trigger handle_new_user ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    classe,
    serie,
    pays,
    xp,
    niveau,
    streak,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'classe', '3eme'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'serie'), ''),  -- NULL si vide ou absent
    COALESCE(NEW.raw_user_meta_data->>'pays', 'SN'),
    0,
    1,
    0,
    'eleve',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    classe    = EXCLUDED.classe,
    serie     = EXCLUDED.serie,
    pays      = EXCLUDED.pays;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger (au cas où il n'existait pas)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. Corriger les profils existants qui ont serie = NULL ────
-- mais dont l'utilisateur avait une série dans les métadonnées
UPDATE public.profiles p
SET serie = NULLIF(TRIM(u.raw_user_meta_data->>'serie'), '')
FROM auth.users u
WHERE u.id = p.id
  AND p.serie IS NULL
  AND u.raw_user_meta_data->>'serie' IS NOT NULL
  AND TRIM(u.raw_user_meta_data->>'serie') != '';

-- ── 3. Corriger aussi classe si elle était NULL ───────────────
UPDATE public.profiles p
SET classe = COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'classe'), ''), '3eme')
FROM auth.users u
WHERE u.id = p.id
  AND p.classe IS NULL
  AND u.raw_user_meta_data->>'classe' IS NOT NULL;
