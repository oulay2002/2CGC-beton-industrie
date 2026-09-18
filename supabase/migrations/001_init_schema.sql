-- ============================================
-- SCHÉMA BDD : ÉCOSYSTÈME DIGITAL BÉTONIER
-- Phase 1 : Site Public & Catalogue
-- ============================================

-- Table Catégories de produits
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table Produits (Agglos, Pavés, Bordures)
CREATE TABLE produits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categorie_id UUID REFERENCES categories(id),
  nom VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  specs_techniques JSONB DEFAULT '{}',
  -- Ex: {"dimensions": "20x20x50cm", "poids": "18kg", "resistance": "B60"}
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  unite_vente VARCHAR(20) DEFAULT 'unité',  -- unité, m², palette
  quantite_par_palette INT,
  stock_actuel INT DEFAULT 0,
  image_url TEXT,
  galerie_urls TEXT[] DEFAULT '{}',
  fiche_technique_url TEXT,  -- FDS / PDF
  empreinte_carbone_kg NUMERIC(8,3),  -- kg CO2 par unité
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table Configurations de devis (sauvegarde)
CREATE TABLE devis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference VARCHAR(20) UNIQUE NOT NULL,
  client_nom VARCHAR(200),
  client_email VARCHAR(200),
  client_telephone VARCHAR(20),
  lignes JSONB NOT NULL DEFAULT '[]',
  -- Ex: [{"produit_id": "uuid", "quantite": 500, "prix_unitaire": 1.20}]
  total_ht NUMERIC(12,2) NOT NULL,
  total_ttc NUMERIC(12,2) NOT NULL,
  estimation_livraison_km NUMERIC(8,2),
  estimation_livraison_eur NUMERIC(10,2),
  empreinte_carbone_totale_kg NUMERIC(10,3),
  statut VARCHAR(20) DEFAULT 'brouillon',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Table Calculateurs (historique des calculs gratuits)
CREATE TABLE calculs_historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_calcul VARCHAR(50) NOT NULL,  -- 'blocs_m2', 'temps_chantier'
  parametres JSONB NOT NULL,
  resultat JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (§10.2 & Clause RLS §13)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;

-- Lecture publique du catalogue
CREATE POLICY "Catalogue public" ON categories FOR SELECT USING (true);
CREATE POLICY "Produits publics" ON produits FOR SELECT USING (actif = true);

-- Devis : insertion anonyme autorisée, lecture par référence uniquement
CREATE POLICY "Créer devis" ON devis FOR INSERT WITH CHECK (true);
CREATE POLICY "Lire son devis" ON devis FOR SELECT USING (true);
-- En production, on ajoutera une vérification par token/email

-- ============================================
-- DONNÉES DE TEST
-- ============================================

INSERT INTO categories (nom, slug, description, ordre) VALUES
  ('Briques & Agglomérés', 'agglos', 'Blocs de béton pleins et creux', 1),
  ('Hourdis', 'hourdis', 'Éléments de plancher en béton', 2),
  ('Pavés', 'paves', 'Pavés autobloquants et décoratifs', 3);

-- Briques
INSERT INTO produits (categorie_id, nom, slug, description, specs_techniques, prix_unitaire_ht, unite_vente, quantite_par_palette, stock_actuel, empreinte_carbone_kg)
SELECT c.id, 'Brique 20 Pleine', 'brique-20-pleine', 'Brique pleine robuste pour murs porteurs.', '{"dimensions": "450x200x200mm", "poids_kg": 36}'::jsonb, 570, 'unité', 40, 5000, 12.5 FROM categories c WHERE c.slug = 'agglos';

INSERT INTO produits (categorie_id, nom, slug, description, specs_techniques, prix_unitaire_ht, unite_vente, quantite_par_palette, stock_actuel, empreinte_carbone_kg)
SELECT c.id, 'Brique 20 Creuse', 'brique-20-creuse', 'Brique creuse pour cloisons et murs.', '{"dimensions": "450x200x200mm", "poids_kg": 18}'::jsonb, 470, 'unité', 60, 8000, 9.2 FROM categories c WHERE c.slug = 'agglos';

-- Hourdis
INSERT INTO produits (categorie_id, nom, slug, description, specs_techniques, prix_unitaire_ht, unite_vente, quantite_par_palette, stock_actuel, empreinte_carbone_kg)
SELECT c.id, 'Hourdis 15 Francais', 'hourdis-15-francais', 'Hourdis standard type français.', '{"dimensions": "500x150x200mm", "poids_kg": 19}'::jsonb, 430, 'unité', 50, 3500, 7.2 FROM categories c WHERE c.slug = 'hourdis';

-- Pavés
INSERT INTO produits (categorie_id, nom, slug, description, specs_techniques, prix_unitaire_ht, unite_vente, quantite_par_palette, stock_actuel, empreinte_carbone_kg)
SELECT c.id, 'Pavé Z-7 Red', 'pave-z-7-red', 'Pavé en Z couleur rouge.', '{"dimensions": "240x240x60mm"}'::jsonb, 7500, 'm²', 10, 500, 15.0 FROM categories c WHERE c.slug = 'paves';