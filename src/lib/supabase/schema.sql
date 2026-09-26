-- ============================================================================
-- SCRIPT DDL SUPABASE PHASE 2 — CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)
-- Exécuter ce script dans le SQL Editor de Supabase (https://supabase.com)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLE PROFILES / UTILISATEURS (Dirigeants, Clients, Chefs d'usine, Chauffeurs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  telephone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'dirigeant', 'chef_usine', 'chauffeur')),
  points_fidelite INT DEFAULT 0,
  tarif_special NUMERIC DEFAULT 0,
  vehicule TEXT,
  permis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ----------------------------------------------------------------------------
-- 2. TABLE COMMANDES (Ordres de fabrication et livraisons)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commandes (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL CHECK (statut IN ('nouvelle', 'preparation', 'en_cours', 'livree', 'annulee')),
  statut_production TEXT NOT NULL CHECK (statut_production IN ('a_preparer', 'en_cours', 'prete', 'terminee')),
  total NUMERIC NOT NULL DEFAULT 0,
  client_nom TEXT NOT NULL,
  client_entreprise TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  client_adresse TEXT NOT NULL,
  chauffeur TEXT,
  signature TEXT,
  date_livraison_effective TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commandes_statut ON public.commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_client_email ON public.commandes(client_email);

-- ----------------------------------------------------------------------------
-- 3. TABLE COMMANDE_ARTICLES (Détail des articles par commande)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commande_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id TEXT NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  quantite INT NOT NULL DEFAULT 1,
  prix NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commande_articles_cmd ON public.commande_articles(commande_id);

-- ----------------------------------------------------------------------------
-- 4. TABLE HISTORIQUE_COMMANDES (Audit Trail des changements de statut)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historique_commandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id TEXT NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
  ancien_statut TEXT,
  nouveau_statut TEXT NOT NULL,
  auteur TEXT DEFAULT 'Système 2CGC',
  date_changement TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historique_cmd ON public.historique_commandes(commande_id);

-- ----------------------------------------------------------------------------
-- 5. TABLE STOCKS_MATIERES (Ciment, Sable, Gravier, Adjuvants)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stocks_matieres (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  quantite_tonnes NUMERIC NOT NULL DEFAULT 0,
  capacite_max_tonnes NUMERIC NOT NULL DEFAULT 100,
  seuil_critique_tonnes NUMERIC NOT NULL DEFAULT 20,
  unite TEXT NOT NULL DEFAULT 'Tonnes',
  fournisseur TEXT,
  consommation_moyenne TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. TABLE STOCKS_PRODUITS_FINIS (Parc de préfabrication Daloa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stocks_produits_finis (
  nom TEXT PRIMARY KEY,
  quantite INT NOT NULL DEFAULT 0,
  unite TEXT DEFAULT 'Palettes',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. TABLE PROSPECTS_CRM (Gestion commerciale & pipeline B2B)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prospects_crm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise TEXT NOT NULL,
  nom_contact TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('nouveau', 'contacte', 'devis_envoye', 'negociation', 'gagne', 'perdu')),
  canal_origine TEXT DEFAULT 'Site Web',
  valeur_estimee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ACTIVATION DE LA PUBLICATION REALTIME SUPABASE (WEBSOCKETS)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commandes, public.stocks_matieres, public.prospects_crm, public.profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ----------------------------------------------------------------------------
-- DONNÉES INITIALES MOCK (Seeding initial)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (email, nom, entreprise, telephone, role, points_fidelite, tarif_special, vehicule, permis)
VALUES
  ('client@btp-afrique.com', 'M. Koné', 'BTP Afrique SARL', '+225 07 12 34 56', 'client', 2450, 10, NULL, NULL),
  ('fatou.traore@ivoire-promo.ci', 'Mme Traoré Fatou', 'Ivoire Promotion Immobilière', '+225 05 44 33 22', 'client', 1800, 8, NULL, NULL),
  ('mamadou.diop@batir-plus.ci', 'M. Diop Mamadou', 'Bâtir Plus International', '+225 01 23 45 67', 'client', 4200, 12, NULL, NULL),
  ('kouame.yao@gr-ci.com', 'M. Yao Kouamé', 'Génie Route CI', '+225 07 88 99 00', 'client', 950, 5, NULL, NULL),
  ('directeur@2cgc-industrie.com', 'KEITA BOUBACAR', '2CGC — Cheickna Construction & Génie Civil', '+225 07 07 62 17 99', 'dirigeant', 0, 0, NULL, NULL),
  ('keita.dambou@2cgc-industrie.com', 'Keita Dambou', '2CGC — Cheickna Construction & Génie Civil', '+225 07 07 85 76 29', 'dirigeant', 0, 0, NULL, NULL),
  ('usine@beton-industrie.com', 'M. Diallo', 'Beton Industrie - Usine', '+225 01 00 00 02', 'chef_usine', 0, 0, NULL, NULL),
  ('chauffeur@beton-industrie.com', 'M. Kouadio', 'Beton Industrie - Logistique', '+225 07 99 88 77', 'chauffeur', 0, 0, 'Camion Volvo FH16', 'AB-1234-CD')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.stocks_matieres (id, nom, quantite_tonnes, capacite_max_tonnes, seuil_critique_tonnes, unite, fournisseur, consommation_moyenne)
VALUES
  ('ciment', 'Ciment CPJ 42.5 (Silo Principal)', 18.5, 80, 20, 'Tonnes', 'Cimaf / Dangote San Pedro', '4.2 T / jour'),
  ('sable', 'Sable Fin Silicieux 0/4', 62.0, 120, 25, 'Tonnes', 'Carrière Sassandra Daloa', '8.5 T / jour'),
  ('gravier', 'Gravier Granitique Concassé 4/10', 74.0, 150, 30, 'Tonnes', 'Carrière Granit Haut-Sassandra', '11.0 T / jour'),
  ('adjuvant', 'Adjuvant Plastifiant & Accélérateur', 2.8, 10, 3.0, 'Tonnes (Fûts)', 'Sika Côte d''Ivoire', '0.3 T / jour')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- ACTIVATION DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS RENFORCÉ)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks_matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks_produits_finis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects_crm ENABLE ROW LEVEL SECURITY;

-- 1. Profiles : Seul l'utilisateur peut lire/modifier son profil ; les dirigeants ont accès complet
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

-- 2. Commandes : Un client ne voit QUE ses commandes. Le staff a accès opérationnel.
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

-- 3. Articles : Lié aux commandes accessibles
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

-- 4. CRM : Données stratégiques confidentielles — strictement réservé au Dirigeant
CREATE POLICY "crm_dirigeant_only" ON public.prospects_crm
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = (auth.jwt() ->> 'email') AND p.role = 'dirigeant'
    )
  );

-- 5. Stocks : Consultation par l'équipe, modification réservée usine/dirigeant
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
