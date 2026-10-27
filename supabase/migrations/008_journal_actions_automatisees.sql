-- 008_journal_actions_automatisees.sql
--
-- Journal des actions declenchees par les automatisations du CRM.
--
-- CE QUI CLOCHAIT
--
-- 1. Le journal vivait dans le `localStorage` du navigateur. Il etait donc
--    propre a chaque poste : le dirigeant voyait une histoire sur son
--    ordinateur, une autre sur son telephone, et vidait tout en effacant son
--    cache. Pour une trace d'actions commerciales — relances envoyees,
--    prospects convertis — ce n'est pas un support acceptable.
--
-- 2. En l'absence d'entree enregistree, le code en fabriquait deux, portant
--    sur des prospects qui n'ont jamais existe (« M. Kone Drissa »,
--    « M. Coulibaly Jean »), horodatees a l'instant present. Sur un pipeline
--    vide, le dirigeant ouvrait le journal et croyait l'automatisation au
--    travail. Ces entrees sont supprimees du code : un journal vide doit se
--    presenter comme vide.

CREATE TABLE IF NOT EXISTS public.journal_automatisations (
  id           TEXT PRIMARY KEY,
  horodatage   TIMESTAMPTZ NOT NULL DEFAULT now(),
  agent        TEXT NOT NULL,
  lead_id      TEXT,
  lead_nom     TEXT,
  type_action  TEXT NOT NULL,
  raisonnement TEXT NOT NULL,
  outil        TEXT NOT NULL,
  statut       TEXT NOT NULL CHECK (statut IN ('success', 'pending_approval', 'failed')),
  details      JSONB,
  emis_par     TEXT
);

CREATE INDEX IF NOT EXISTS journal_horodatage_idx ON public.journal_automatisations (horodatage DESC);
CREATE INDEX IF NOT EXISTS journal_lead_idx       ON public.journal_automatisations (lead_id);

COMMENT ON TABLE public.journal_automatisations IS
  'Trace des actions declenchees automatiquement : relances, scorages,
   conversions. Conservee en base et non dans le navigateur, pour etre la
   meme d''un poste a l''autre et survivre a un vidage de cache.';

COMMENT ON COLUMN public.journal_automatisations.raisonnement IS
  'Motif de l''action, redige par la regle qui l''a declenchee. Ce n''est pas
   le raisonnement d''un modele de langage : aucun n''intervient ici.';

-- Memes verrous que les autres tables (cf. migration 003) : l'application
-- n'utilise pas Supabase Auth, le controle se fait dans les routes serveur.
ALTER TABLE public.journal_automatisations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.journal_automatisations FROM anon, authenticated;
GRANT  ALL ON public.journal_automatisations TO service_role;
