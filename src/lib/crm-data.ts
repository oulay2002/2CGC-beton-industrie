// src/lib/crm-data.ts — Accès au pipeline commercial depuis le navigateur.
//
// Avant : tout le CRM vivait dans localStorage['crm_leads_v2']. Les prospects
// n'existaient que sur le poste du dirigeant, disparaissaient avec le cache du
// navigateur, n'étaient pas partagés entre ses appareils, et les écritures
// émises côté serveur (webhook WhatsApp, relais n8n, agent CRM) tombaient dans
// le vide tout en répondant « succès ».
//
// Désormais : la source de vérité est la table prospects_crm, et ce module
// n'est plus qu'une façade sur /api/prospects. Toutes les fonctions sont donc
// asynchrones.

import { CRMLead, CRMActivite } from '@/lib/crm-types';

// Ré-exports pour les modules qui importaient types et gabarits depuis ici.
export type { CRMLead, CRMActivite, CRMSequence } from '@/lib/crm-types';
export {
  TEMPLATES_EMAIL,
  TEMPLATES_WHATSAPP,
  genererLienWhatsApp,
  sequencesEnAttente,
  construireLeadDepuisDevis,
  construireLeadManuel,
} from '@/lib/crm-types';

import {
  construireLeadDepuisDevis,
  construireLeadManuel,
  sequencesEnAttente,
  CRMSequence,
} from '@/lib/crm-types';

const ENDPOINT = '/api/prospects';

async function requete<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin', ...init });
    if (!res.ok) {
      console.error(`[crm] ${init?.method ?? 'GET'} ${url} -> HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[crm] ${init?.method ?? 'GET'} ${url}`, err);
    return null;
  }
}

/** Tous les leads, le plus récent en tête. Retourne [] si le service est indisponible. */
export async function getLeads(): Promise<CRMLead[]> {
  const data = await requete<{ leads: CRMLead[] }>(ENDPOINT);
  return data?.leads ?? [];
}

/** Enregistre un lot de leads. */
export async function saveLeads(leads: CRMLead[]): Promise<boolean> {
  if (leads.length === 0) return true;
  const data = await requete<{ success: boolean }>(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leads }),
  });
  return Boolean(data?.success);
}

/** Enregistre un lead isolé. */
export async function saveLead(lead: CRMLead): Promise<boolean> {
  const data = await requete<{ success: boolean }>(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead }),
  });
  return Boolean(data?.success);
}

export async function supprimerLead(id: string): Promise<boolean> {
  const data = await requete<{ success: boolean }>(`${ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return Boolean(data?.success);
}

/**
 * Applique une transformation à un lead et l'enregistre.
 * Évite de relire tout le pipeline pour modifier une seule fiche.
 */
async function modifierLead(
  leadId: string,
  transformer: (lead: CRMLead) => CRMLead | null
): Promise<CRMLead | null> {
  const leads = await getLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const modifie = transformer(lead);
  if (!modifie) return lead;

  await saveLead(modifie);
  return modifie;
}

/** Ajoute une entrée à l'historique d'un lead. */
export async function ajouterActivite(
  leadId: string,
  action: string,
  canal: CRMActivite['canal'] = 'systeme',
  automatique = true
): Promise<CRMLead | null> {
  return modifierLead(leadId, (lead) => ({
    ...lead,
    activites: [
      { date: new Date().toISOString().split('T')[0], action, automatique, canal },
      ...lead.activites,
    ],
  }));
}

/** Change le statut d'un lead et trace le changement. */
export async function updateLeadStatut(
  leadId: string,
  nouveauStatut: CRMLead['statut']
): Promise<CRMLead | null> {
  return modifierLead(leadId, (lead) => ({
    ...lead,
    statut: nouveauStatut,
    activites: [
      {
        date: new Date().toISOString().split('T')[0],
        action: `🔄 Statut : "${lead.statut}" → "${nouveauStatut}"`,
        automatique: false,
        canal: 'systeme' as const,
      },
      ...lead.activites,
    ],
  }));
}

/** Marque une séquence de relance comme envoyée. */
export async function marquerSequenceEnvoyee(
  leadId: string,
  sequenceId: string,
  canal: CRMActivite['canal']
): Promise<CRMLead | null> {
  return modifierLead(leadId, (lead) => {
    const sequence = lead.sequences.find((s) => s.id === sequenceId);
    if (!sequence) return null;

    const dateAuj = new Date().toISOString().split('T')[0];
    return {
      ...lead,
      derniereRelance: dateAuj,
      sequences: lead.sequences.map((s) =>
        s.id === sequenceId ? { ...s, statut: 'envoyee' as const } : s
      ),
      activites: [
        {
          date: dateAuj,
          action: `✅ Séquence « ${sequence.nom} » envoyée par ${canal}`,
          automatique: true,
          canal,
        },
        ...lead.activites,
      ],
    };
  });
}

/** Crée un lead à partir d'un devis généré en ligne. */
export async function creerLeadDepuisDevis(
  nom: string,
  email: string,
  valeur: number,
  produit?: string,
  telephone?: string
): Promise<CRMLead> {
  const lead = construireLeadDepuisDevis({ nom, email, valeur, produit, telephone });
  await saveLead(lead);
  return lead;
}

/** Crée un lead saisi à la main par un commercial. */
export async function ajouterLeadManuellement(data: Partial<CRMLead>): Promise<CRMLead> {
  const lead = construireLeadManuel(data);
  await saveLead(lead);
  return lead;
}

/** Séquences de relance dues à ce jour. */
export async function getSequencesEnAttente(): Promise<
  { lead: CRMLead; sequence: CRMSequence }[]
> {
  return sequencesEnAttente(await getLeads());
}

/**
 * Importe des prospects issus de la prospection, en ignorant ceux dont le
 * téléphone ou l'email est déjà présent dans le pipeline.
 */
export async function importerLeadsScrapes(
  prospects: Partial<CRMLead>[]
): Promise<CRMLead[]> {
  const existants = await getLeads();
  const telsConnus = new Set(
    existants.map((l) => l.telephone.replace(/\D/g, '').slice(-8)).filter(Boolean)
  );
  const emailsConnus = new Set(
    existants.map((l) => l.email.toLowerCase()).filter(Boolean)
  );

  const nouveaux: CRMLead[] = [];
  for (const p of prospects) {
    const tel = (p.telephone ?? '').replace(/\D/g, '').slice(-8);
    const email = (p.email ?? '').toLowerCase();
    if ((tel && telsConnus.has(tel)) || (email && emailsConnus.has(email))) continue;

    if (tel) telsConnus.add(tel);
    if (email) emailsConnus.add(email);
    nouveaux.push(construireLeadManuel({ ...p, source: 'scraping_btp' }));
  }

  if (nouveaux.length > 0) await saveLeads(nouveaux);
  return nouveaux;
}
