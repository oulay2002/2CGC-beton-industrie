-- ============================================================================
-- MIGRATION 006 : ADRESSE DE LIVRAISON PAR CLIENT
-- ----------------------------------------------------------------------------
-- CONTEXTE
--   Les ecrans « Bons de commande », « Bons de livraison » et « Reassort
--   rapide » lisaient `clientActif.adresse` — un champ qui n'existait ni dans
--   le type CompteUtilisateur, ni dans la table profiles. En TypeScript strict
--   l'acces etait donc invalide ; il etait masque par un `any`. En pratique,
--   c'est la valeur de repli qui s'imprimait sur TOUS les bons de livraison :
--   « Chantier Daloa / Abidjan », identique pour chaque client.
--
--   Les commandes, elles, portent bien une adresse (`commandes.client_adresse`),
--   mais saisie au coup par coup lors du devis : rien ne la rattachait au
--   compte client, et le chauffeur n'avait donc pas d'adresse de reference.
--
--   Cette migration donne une adresse de livraison a chaque compte client.
--   Elle sert de valeur par defaut aux bons et aux nouvelles commandes ; une
--   commande conserve toujours l'adresse saisie au moment du devis, qui peut
--   differer (chantier ponctuel).
--
-- A APPLIQUER APRES 005.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS adresse TEXT;

COMMENT ON COLUMN public.profiles.adresse IS
  'Adresse de livraison de reference du client. Reprise par defaut sur les bons et les nouvelles commandes ; une commande peut porter une adresse differente (chantier ponctuel).';

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'adresse';
