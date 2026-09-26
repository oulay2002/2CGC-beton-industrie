-- ============================================================================
-- MIGRATION 002 : RENFORCEMENT DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Protection stricte contre le vol de données et les injections malveillantes
-- ============================================================================

-- 1. Nettoyage des anciennes politiques trop permissives
DROP POLICY IF EXISTS "Allow public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow public select commandes" ON public.commandes;
DROP POLICY IF EXISTS "Allow public insert commandes" ON public.commandes;
DROP POLICY IF EXISTS "Allow public update commandes" ON public.commandes;

DROP POLICY IF EXISTS "Allow public select articles" ON public.commande_articles;
DROP POLICY IF EXISTS "Allow public insert articles" ON public.commande_articles;

DROP POLICY IF EXISTS "Allow public select stocks" ON public.stocks_matieres;
DROP POLICY IF EXISTS "Allow public update stocks" ON public.stocks_matieres;

DROP POLICY IF EXISTS "Allow public select crm" ON public.prospects_crm;
DROP POLICY IF EXISTS "Allow public insert crm" ON public.prospects_crm;
DROP POLICY IF EXISTS "Allow public update crm" ON public.prospects_crm;

DROP POLICY IF EXISTS "Lire son devis" ON public.devis;

-- 2. Activation stricte du RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks_matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks_produits_finis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculs_historique ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. POLITIQUES SÉCURISÉES : PROFILES
-- Seul l'utilisateur peut lire/modifier son propre profil, les dirigeants ont accès complet
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_select_self_or_dirigeant" ON public.profiles
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    email = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email') AND p.role = 'dirigeant'
    )
  );

CREATE POLICY "profiles_update_self_or_dirigeant" ON public.profiles
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    email = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email') AND p.role = 'dirigeant'
    )
  );

-- ----------------------------------------------------------------------------
-- 4. POLITIQUES SÉCURISÉES : COMMANDES
-- Un client ne peut voir QUE ses propres commandes.
-- L'équipe opérationnelle (dirigeant, chef_usine, chauffeur) a accès aux commandes.
-- Les requêtes anonymes n'ont AUCUN accès en lecture directe.
-- ----------------------------------------------------------------------------
CREATE POLICY "commandes_select_policy" ON public.commandes
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    client_email = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email')
      AND p.role IN ('dirigeant', 'chef_usine', 'chauffeur')
    )
  );

CREATE POLICY "commandes_insert_policy" ON public.commandes
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    client_email = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email')
      AND p.role IN ('dirigeant', 'chef_usine')
    )
  );

CREATE POLICY "commandes_update_staff_only" ON public.commandes
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email')
      AND p.role IN ('dirigeant', 'chef_usine', 'chauffeur')
    )
  );

-- ----------------------------------------------------------------------------
-- 5. POLITIQUES SÉCURISÉES : COMMANDE_ARTICLES
-- ----------------------------------------------------------------------------
CREATE POLICY "articles_select_policy" ON public.commande_articles
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.commandes c
      WHERE c.id = commande_articles.commande_id
      AND (
        c.client_email = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.email = (auth.jwt() ->> 'email')
          AND p.role IN ('dirigeant', 'chef_usine', 'chauffeur')
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 6. POLITIQUES SÉCURISÉES : PROSPECTS_CRM (PIPELINE COMMERCIAL STRATÉGIQUE)
-- STRICTEMENT réservé au Dirigeant et au backend. INTERDIT à la lecture anonyme !
-- ----------------------------------------------------------------------------
CREATE POLICY "crm_dirigeant_only" ON public.prospects_crm
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email') AND p.role = 'dirigeant'
    )
  );

-- ----------------------------------------------------------------------------
-- 7. POLITIQUES SÉCURISÉES : STOCKS
-- Lecture autorisée au personnel, modification réservée au chef d'usine & dirigeant
-- ----------------------------------------------------------------------------
CREATE POLICY "stocks_select_staff" ON public.stocks_matieres
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email')
      AND p.role IN ('dirigeant', 'chef_usine')
    )
  );

CREATE POLICY "stocks_update_staff" ON public.stocks_matieres
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email')
      AND p.role IN ('dirigeant', 'chef_usine')
    )
  );

-- ----------------------------------------------------------------------------
-- 8. POLITIQUES SÉCURISÉES : DEVIS
-- Création autorisée, mais consultation restreinte à l'email ou à la référence exacte
-- ----------------------------------------------------------------------------
CREATE POLICY "devis_read_restricted" ON public.devis
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    client_email = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email') AND p.role = 'dirigeant'
    )
  );
