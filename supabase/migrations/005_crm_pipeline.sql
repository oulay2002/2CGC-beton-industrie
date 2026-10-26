-- ============================================================================
-- MIGRATION 005 : PIPELINE CRM PERSISTANT
-- ----------------------------------------------------------------------------
-- CONTEXTE
--   Le CRM vivait integralement dans localStorage['crm_leads_v2'], cote
--   navigateur. Consequences : les prospects n'existaient que sur le poste du
--   dirigeant, disparaissaient avec le cache, n'etaient pas partages entre ses
--   appareils, et les routes serveur (/api/whatsapp/n8n-relay, /api/agent-crm)
--   ecrivaient dans le vide tout en repondant « succes ».
--
--   La table prospects_crm existante ne pouvait pas accueillir le modele reel :
--   elle etait plate (entreprise, nom_contact, email, telephone, statut...) la
--   ou un lead porte aussi son historique d'activites et ses sequences de
--   relance programmees. Elle etait vide (0 ligne, verifie le 2026-10-26), on
--   la recree donc au bon modele plutot que de l'empiler de colonnes.
--
-- CHOIX DE MODELISATION
--   activites et sequences sont stockees en JSONB plutot qu'en tables filles.
--   Ce sont des listes toujours lues et ecrites avec leur lead, jamais
--   interrogees seules, et le volume est celui d'une PME (quelques centaines de
--   leads). Les champs reellement filtres — statut, valeur, dates — restent des
--   colonnes a part entiere et sont indexes.
--
-- A APPLIQUER APRES 003 ET 004.
-- ============================================================================

DROP TABLE IF EXISTS public.prospects_crm CASCADE;

CREATE TABLE public.prospects_crm (
  -- Identifiant metier lisible genere par l'application ('LEAD-00123'),
  -- et non un uuid : il apparait dans les emails et les echanges WhatsApp.
  id                 TEXT PRIMARY KEY,

  nom                TEXT NOT NULL DEFAULT '',
  entreprise         TEXT NOT NULL DEFAULT '',
  email              TEXT NOT NULL DEFAULT '',
  telephone          TEXT NOT NULL DEFAULT '',

  statut             TEXT NOT NULL DEFAULT 'nouveau'
                     CHECK (statut IN ('nouveau', 'contacte', 'devis_envoye',
                                       'negociation', 'gagne', 'perdu')),
  source             TEXT NOT NULL DEFAULT 'site_web'
                     CHECK (source IN ('site_web', 'chatbot', 'devis_auto',
                                       'whatsapp', 'telephone', 'scraping_btp')),

  valeur_estimee     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  produit_interesse  TEXT,
  ville              TEXT,
  notes              TEXT,

  -- [{ date, action, automatique, canal }]
  activites          JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{ id, nom, statut, datePrevu, canal, template }]
  sequences          JSONB NOT NULL DEFAULT '[]'::jsonb,

  date_creation      DATE NOT NULL DEFAULT CURRENT_DATE,
  derniere_relance   DATE,
  prochain_contact   DATE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT prospects_crm_activites_est_liste CHECK (jsonb_typeof(activites) = 'array'),
  CONSTRAINT prospects_crm_sequences_est_liste CHECK (jsonb_typeof(sequences) = 'array')
);

COMMENT ON TABLE public.prospects_crm IS
  'Pipeline commercial. Donnees strategiques : accessible uniquement au role service_role, via /api/prospects qui exige une session dirigeant.';
COMMENT ON COLUMN public.prospects_crm.activites IS
  'Historique du lead, le plus recent en tete. JSONB : toujours lu et ecrit avec son lead.';
COMMENT ON COLUMN public.prospects_crm.sequences IS
  'Relances programmees (email / WhatsApp) et leur etat d envoi.';

-- Index des acces reels : tableau par statut, et relances dues du jour.
CREATE INDEX prospects_crm_statut_idx          ON public.prospects_crm (statut);
CREATE INDEX prospects_crm_prochain_contact_idx ON public.prospects_crm (prochain_contact)
  WHERE prochain_contact IS NOT NULL;
CREATE INDEX prospects_crm_created_at_idx      ON public.prospects_crm (created_at DESC);

-- updated_at tenu par la base : l'application ne peut pas l'oublier.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER prospects_crm_touch_updated_at
  BEFORE UPDATE ON public.prospects_crm
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Securite : meme regime que la migration 003 — deny-all pour anon et
-- authenticated, acces reserve a service_role (donc au serveur uniquement).
-- Le CASCADE du DROP a supprime les policies et les GRANT precedents.
-- ----------------------------------------------------------------------------
ALTER TABLE public.prospects_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects_crm FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.prospects_crm FROM anon;
REVOKE ALL ON public.prospects_crm FROM authenticated;
GRANT ALL ON public.prospects_crm TO service_role;

-- ----------------------------------------------------------------------------
-- Verification. Attendu : rls_active = true, nb_policies = 0,
-- anon_peut_lire = false, et 0 ligne.
-- ----------------------------------------------------------------------------
SELECT
  c.relname                                    AS table_name,
  c.relrowsecurity                             AS rls_active,
  c.relforcerowsecurity                        AS rls_forcee,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'prospects_crm') AS nb_policies,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_peut_lire,
  (SELECT count(*) FROM public.prospects_crm)  AS nb_lignes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'prospects_crm';
