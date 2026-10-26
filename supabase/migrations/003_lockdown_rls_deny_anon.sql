-- ============================================================================
-- MIGRATION 003 : VERROUILLAGE D'URGENCE DE LA BASE DE PRODUCTION
-- ----------------------------------------------------------------------------
-- CONTEXTE
--   La migration 002 n'a jamais pu s'appliquer : elle fait des ALTER TABLE sur
--   des tables (profiles, commandes, commande_articles, stocks_matieres,
--   stocks_produits_finis, prospects_crm) qui ont ete creees a la main dans le
--   dashboard et n'existent dans aucune migration. Les anciennes policies
--   permissives "Allow public ..." sont donc restees actives.
--
--   Consequence verifiee en production le 2026-10-26 : la cle anonyme publique
--   (livree dans le bundle JS de chaque page) dispose de SELECT / INSERT /
--   UPDATE / DELETE sur l'integralite des donnees clients.
--
-- STRATEGIE RETENUE
--   L'application n'utilise pas Supabase Auth : elle gere ses propres sessions
--   signees (HMAC, cf. src/lib/session.ts). Les policies de la migration 002,
--   basees sur auth.jwt(), ne peuvent donc jamais correspondre a un utilisateur.
--   On bascule sur le modele adapte a cette architecture :
--
--     - navigateur  -> AUCUN acces direct a Supabase
--     - serveur     -> acces via SUPABASE_SERVICE_ROLE_KEY (contourne la RLS),
--                      l'autorisation etant portee par le cookie de session
--                      verifie dans les route handlers Next.js
--     - RLS         -> deny-all pour anon et authenticated (defense en
--                      profondeur : meme en cas de fuite de la cle anon,
--                      aucune donnee n'est accessible)
--
-- APPLICATION
--   Dashboard Supabase > SQL Editor > coller ce fichier > Run.
--   (ou `supabase db push` une fois le projet lie)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Suppression de TOUTES les policies existantes sur les tables metier.
--    On passe par un DO block car les policies ont ete creees via le dashboard
--    et leurs noms ne sont pas connus du depot.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  cible TEXT[] := ARRAY[
    'profiles',
    'commandes',
    'commande_articles',
    'stocks_matieres',
    'stocks_produits_finis',
    'prospects_crm'
  ];
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(cible)
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename
    );
    RAISE NOTICE 'Policy supprimee : %.% -> %', pol.schemaname, pol.tablename, pol.policyname;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Activation stricte de la RLS.
--    Sans aucune policy, PostgreSQL refuse par defaut toute ligne aux roles
--    soumis a la RLS (anon, authenticated). Le role service_role, utilise
--    uniquement cote serveur, contourne la RLS par construction (BYPASSRLS).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  cible TEXT[] := ARRAY[
    'profiles',
    'commandes',
    'commande_articles',
    'stocks_matieres',
    'stocks_produits_finis',
    'prospects_crm'
  ];
BEGIN
  FOREACH t IN ARRAY cible LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS activee sur public.%', t;
    ELSE
      RAISE NOTICE 'Table absente, ignoree : public.%', t;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Retrait des privileges tables accordes par defaut a anon / authenticated.
--    PostgREST verifie les GRANT avant la RLS : sans GRANT, la requete est
--    rejetee plus tot et le message d'erreur ne divulgue pas le schema.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  cible TEXT[] := ARRAY[
    'profiles',
    'commandes',
    'commande_articles',
    'stocks_matieres',
    'stocks_produits_finis',
    'prospects_crm'
  ];
BEGIN
  FOREACH t IN ARRAY cible LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;

-- Empeche que de futures tables du schema public soient exposees par defaut.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

-- ----------------------------------------------------------------------------
-- 4. Contrainte d'unicite sur profiles.email.
--    La table a pour cle primaire un uuid `id`, mais l'application identifie
--    les comptes par email. Sans index unique, l'upsert par email est
--    impossible et des doublons peuvent apparaitre.
--    Les eventuels doublons deja presents sont resorbes avant creation.
-- ----------------------------------------------------------------------------
DELETE FROM public.profiles a
USING public.profiles b
WHERE a.ctid < b.ctid
  AND lower(a.email) = lower(b.email);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON public.profiles (lower(email));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- ----------------------------------------------------------------------------
-- 5. Verification. Doit retourner rls_active = true et 0 policy pour chaque
--    table : c'est l'etat "deny-all" attendu.
-- ----------------------------------------------------------------------------
SELECT
  c.relname                                   AS table_name,
  c.relrowsecurity                            AS rls_active,
  c.relforcerowsecurity                       AS rls_forcee,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS nb_policies,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_peut_lire
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'commandes', 'commande_articles',
    'stocks_matieres', 'stocks_produits_finis', 'prospects_crm'
  )
ORDER BY c.relname;
