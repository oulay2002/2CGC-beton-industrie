-- ============================================================================
-- MIGRATION 004 : AUTHENTIFICATION SERVEUR
-- ----------------------------------------------------------------------------
-- Avant : les comptes et leurs mots de passe en clair vivaient dans
--   src/lib/auth-context.tsx (donc dans le bundle JS de chaque visiteur) et
--   dans le localStorage du navigateur. La verification du mot de passe se
--   faisait cote client, et /api/auth/session delivrait un cookie signe a
--   quiconque le demandait, sans aucune preuve d'identite.
--
-- Apres : les comptes vivent dans public.profiles, le mot de passe n'y figure
--   que sous forme d'empreinte scrypt, et la verification se fait exclusivement
--   dans /api/auth/login cote serveur.
--
-- A APPLIQUER APRES 003.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.password_hash IS
  'Empreinte scrypt au format scrypt$N$r$p$sel$empreinte. Jamais de mot de passe en clair.';
COMMENT ON COLUMN public.profiles.must_change_password IS
  'Vrai tant que le compte utilise encore le mot de passe initial remis par la direction.';
COMMENT ON COLUMN public.profiles.locked_until IS
  'Verrouillage temporaire apres une serie d echecs de connexion (anti-bruteforce).';

-- Index de recherche par email insensible a la casse (chemin de connexion).
CREATE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email));

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'password_hash', 'must_change_password', 'last_login_at',
    'failed_login_count', 'locked_until'
  )
ORDER BY column_name;
