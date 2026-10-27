-- 007_usine_stocks_produits_et_bons.sql
--
-- Remet d'aplomb la chaine usine -> chauffeur -> bon de livraison.
--
-- CE QUI CLOCHAIT
--
-- 1. Les stocks de produits finis n'existaient nulle part. L'ecran usine en
--    tenait une copie en memoire, perdue a chaque rechargement, et son test de
--    disponibilite se repliait sur « 1000 unites » des que le nom ne tombait
--    pas dans sa table codee en dur -- ce qui etait le cas de tous les
--    produits du catalogue. Le chef d'usine recevait donc un feu vert
--    systematique, sans verification.
--
-- 2. Les lignes de commande ne portaient que le nom du produit. Rapprocher un
--    stock d'une commande par son libelle est fragile : une refonte du
--    catalogue rompt le lien en silence. D'ou la colonne produit_id.
--
-- 3. Les bons de livraison n'etaient qu'un PDF telecharge. Aucune archive,
--    aucune numerotation serveur : reemettre un bon redonnait le meme numero,
--    et une reedition etait indiscernable de l'original.
--
-- 4. L'affectation d'un chauffeur se faisait par nom affiche, compare au nom
--    du compte connecte. Un renommage rompait le lien sans bruit. La colonne
--    chauffeur_email porte desormais le lien stable, le nom restant pour
--    l'impression.

-- ---------------------------------------------------------------------------
-- 1. Lien stable vers le chauffeur, et identifiant produit sur les lignes
-- ---------------------------------------------------------------------------

ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS chauffeur_email TEXT;

ALTER TABLE public.commande_articles
  ADD COLUMN IF NOT EXISTS produit_id TEXT;

-- ---------------------------------------------------------------------------
-- 2. Stocks de produits finis
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stocks_produits (
  produit_id   TEXT PRIMARY KEY,
  categorie    TEXT NOT NULL,
  nom          TEXT NOT NULL,
  quantite     INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  seuil_alerte INTEGER NOT NULL DEFAULT 0 CHECK (seuil_alerte >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.stocks_produits.quantite IS
  'Unites disponibles. La contrainte >= 0 empeche un decrement de passer sous zero.';

-- Amorce : les 27 references du catalogue, avec leurs identifiants reels.
INSERT INTO public.stocks_produits (produit_id, categorie, nom, quantite, seuil_alerte)
VALUES
  ('1', 'agglos', 'Brique 20 Pleine', 5000, 500),
  ('2', 'agglos', 'Brique 20 Creuse', 8000, 800),
  ('3', 'agglos', 'Brique 15 Pleine', 4000, 400),
  ('4', 'agglos', 'Brique 15 Creuse', 10000, 1000),
  ('5', 'agglos', 'Brique 12 Pleine', 3000, 300),
  ('6', 'agglos', 'Brique 12 Creuse', 6000, 600),
  ('7', 'agglos', 'Brique 10 Creuse', 7000, 700),
  ('27', 'agglos', 'Agglo 20 Double Alvéoles', 8000, 800),
  ('26', 'agglos', 'Agglo 15 Double Alvéoles', 10000, 1000),
  ('25', 'agglos', 'Agglo 12 Double Alvéoles', 6000, 600),
  ('8', 'hourdis', 'Hourdis 15 Français', 3500, 350),
  ('9', 'hourdis', 'Hourdis 12 Français', 4000, 400),
  ('10', 'hourdis', 'Hourdis 16 Américain', 2000, 200),
  ('11', 'hourdis', 'Hourdis 20 Américain', 1500, 200),
  ('12', 'paves', 'Pavé Z-7 Rouge', 500, 200),
  ('13', 'paves', 'Pavé Z-7 Bleu', 400, 200),
  ('14', 'paves', 'Pavé Z-7 Vert', 450, 200),
  ('15', 'paves', 'Pavé Z-7 Jaune', 300, 200),
  ('16', 'paves', 'Pavé Z-7 Gris', 1200, 200),
  ('17', 'paves', 'Pavé Z-13 Bleu', 600, 200),
  ('18', 'paves', 'Pavé Z-13 Gris', 1500, 200),
  ('19', 'paves', 'Pavé Z-14 Gris', 1000, 200),
  ('20', 'paves', 'Pavé Z-14 Jaune', 500, 200),
  ('21', 'paves', 'Pavé Z-13 Mixte', 800, 200),
  ('22', 'paves', 'Pavé Z-6-s Rouge', 700, 200),
  ('23', 'paves', 'Pavé Z-6-s Gris', 2000, 200),
  ('24', 'paves', 'Pavé Z-7 Mixte', 900, 200)
ON CONFLICT (produit_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Archive des bons, avec numerotation attribuee par le serveur
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.bon_livraison_seq;
CREATE SEQUENCE IF NOT EXISTS public.bon_commande_seq;

CREATE TABLE IF NOT EXISTS public.bons (
  numero          TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK (type IN ('commande', 'livraison')),
  commande_id     TEXT NOT NULL,
  emis_par        TEXT NOT NULL,
  emis_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
  client          JSONB NOT NULL,
  articles        JSONB NOT NULL,
  total           NUMERIC,
  chauffeur       TEXT,
  chauffeur_email TEXT,
  immatriculation TEXT,
  signature       TEXT,
  reedition_de    TEXT REFERENCES public.bons(numero)
);

CREATE INDEX IF NOT EXISTS bons_commande_idx ON public.bons (commande_id);
CREATE INDEX IF NOT EXISTS bons_emis_le_idx  ON public.bons (emis_le DESC);

COMMENT ON COLUMN public.bons.reedition_de IS
  'Renseigne quand ce bon rejoue un bon anterieur. Une reedition recoit son
   propre numero : l''original reste consultable, et l''ecart est tracable.';

-- Numero attribue par le serveur : seul moyen d'avoir une suite continue et
-- sans trou, qu'aucun client ne peut deviner ni rejouer.
CREATE OR REPLACE FUNCTION public.prochain_numero_bon(p_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  prefixe TEXT;
  rang    BIGINT;
BEGIN
  IF p_type = 'livraison' THEN
    prefixe := 'BL';
    rang := nextval('public.bon_livraison_seq');
  ELSIF p_type = 'commande' THEN
    prefixe := 'BC';
    rang := nextval('public.bon_commande_seq');
  ELSE
    RAISE EXCEPTION 'Type de bon inconnu : %', p_type;
  END IF;

  RETURN format('%s-%s-%s', prefixe,
                to_char(now(), 'YYYY'),
                lpad(rang::TEXT, 5, '0'));
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Memes verrous que pour les autres tables (cf. migration 003)
--
-- L'application n'utilise pas Supabase Auth : ses sessions sont des jetons
-- HMAC verifies par les routes serveur, qui accedent ensuite avec la cle
-- service_role. Une politique RLS fondee sur auth.jwt() ne pourrait donc
-- jamais correspondre. On ferme tout, et le controle se fait dans les routes.
-- ---------------------------------------------------------------------------

ALTER TABLE public.stocks_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons            ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stocks_produits FROM anon, authenticated;
REVOKE ALL ON public.bons            FROM anon, authenticated;
GRANT  ALL ON public.stocks_produits TO service_role;
GRANT  ALL ON public.bons            TO service_role;

REVOKE ALL ON SEQUENCE public.bon_livraison_seq FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.bon_commande_seq  FROM anon, authenticated;
GRANT  ALL ON SEQUENCE public.bon_livraison_seq TO service_role;
GRANT  ALL ON SEQUENCE public.bon_commande_seq  TO service_role;

REVOKE ALL ON FUNCTION public.prochain_numero_bon(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prochain_numero_bon(TEXT) TO service_role;

-- Horodatage automatique, comme sur prospects_crm (migration 005).
DROP TRIGGER IF EXISTS stocks_produits_touch ON public.stocks_produits;
CREATE TRIGGER stocks_produits_touch
  BEFORE UPDATE ON public.stocks_produits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Decrement atomique du stock a l'emission d'un bon de livraison
--
-- Lire le stock puis l'ecrire en deux temps laisse une fenetre ou deux
-- emissions simultanees voient la meme quantite disponible et la consomment
-- toutes les deux. La contrainte CHECK rattraperait le passage sous zero,
-- mais apres qu'un bon a deja ete emis. Tout se joue donc ici, en une seule
-- transaction : ou toutes les lignes passent, ou aucune.
--
-- Retourne la liste des lignes insuffisantes. Un tableau vide vaut succes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.decrementer_stock(p_lignes JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  ligne      JSONB;
  pid        TEXT;
  demande    INTEGER;
  dispo      INTEGER;
  manquants  JSONB := '[]'::JSONB;
BEGIN
  -- Premier passage : verrouiller et verifier, sans rien ecrire.
  FOR ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    pid := ligne->>'produit_id';
    demande := (ligne->>'quantite')::INTEGER;

    SELECT quantite INTO dispo
      FROM public.stocks_produits
     WHERE produit_id = pid
     FOR UPDATE;

    IF NOT FOUND THEN
      manquants := manquants || jsonb_build_object(
        'produit_id', pid, 'demande', demande, 'disponible', 0, 'motif', 'inconnu');
    ELSIF dispo < demande THEN
      manquants := manquants || jsonb_build_object(
        'produit_id', pid, 'demande', demande, 'disponible', dispo, 'motif', 'insuffisant');
    END IF;
  END LOOP;

  IF jsonb_array_length(manquants) > 0 THEN
    RETURN manquants;
  END IF;

  -- Second passage : les lignes sont verrouillees, l'ecriture est sure.
  FOR ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    UPDATE public.stocks_produits
       SET quantite = quantite - (ligne->>'quantite')::INTEGER
     WHERE produit_id = ligne->>'produit_id';
  END LOOP;

  RETURN '[]'::JSONB;
END;
$$;

REVOKE ALL ON FUNCTION public.decrementer_stock(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrementer_stock(JSONB) TO service_role;
