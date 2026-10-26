// src/lib/crm-server.ts — Accès base du pipeline commercial. SERVEUR UNIQUEMENT.
//
// Source de vérité unique du CRM. Le navigateur ne lit ni n'écrit jamais
// directement : il passe par /api/prospects, qui exige une session dirigeant
// et délègue ici. Les route handlers déclenchés par des systèmes externes
// (webhook WhatsApp, relais n8n) appellent ce module directement.
//
// Remplace l'ancien stockage localStorage['crm_leads_v2'], qui cantonnait le
// pipeline au navigateur du dirigeant et faisait échouer silencieusement toutes
// les écritures émises côté serveur.

import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  CRMLead,
  CRMActivite,
  construireLeadWhatsApp,
  corrigerStatutIncoherent,
} from '@/lib/crm-types';

const TABLE = 'prospects_crm';

/** Ligne telle que stockée en base. */
interface LigneLead {
  id: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  statut: CRMLead['statut'];
  source: CRMLead['source'];
  valeur_estimee: number | string;
  produit_interesse: string | null;
  ville: string | null;
  notes: string | null;
  activites: CRMActivite[] | null;
  sequences: CRMLead['sequences'] | null;
  date_creation: string;
  derniere_relance: string | null;
  prochain_contact: string | null;
}

function versLead(l: LigneLead): CRMLead {
  return {
    id: l.id,
    nom: l.nom,
    entreprise: l.entreprise,
    email: l.email,
    telephone: l.telephone,
    statut: l.statut,
    source: l.source,
    valeurEstimee: Number(l.valeur_estimee) || 0,
    produitInteresse: l.produit_interesse ?? undefined,
    ville: l.ville ?? undefined,
    notes: l.notes ?? undefined,
    activites: Array.isArray(l.activites) ? l.activites : [],
    sequences: Array.isArray(l.sequences) ? l.sequences : [],
    dateCreation: l.date_creation,
    derniereRelance: l.derniere_relance ?? undefined,
    prochainContact: l.prochain_contact ?? undefined,
  };
}

function versLigne(lead: CRMLead): Record<string, unknown> {
  return {
    id: lead.id,
    nom: lead.nom ?? '',
    entreprise: lead.entreprise ?? '',
    email: (lead.email ?? '').toLowerCase(),
    telephone: lead.telephone ?? '',
    statut: lead.statut,
    source: lead.source,
    valeur_estimee: Number(lead.valeurEstimee) || 0,
    produit_interesse: lead.produitInteresse ?? null,
    ville: lead.ville ?? null,
    notes: lead.notes ?? null,
    // On borne les listes : un historique n'a pas vocation à croître sans fin,
    // et une ligne JSONB démesurée ralentirait toutes les lectures du tableau.
    activites: (lead.activites ?? []).slice(0, 200),
    sequences: (lead.sequences ?? []).slice(0, 50),
    date_creation: lead.dateCreation,
    derniere_relance: lead.derniereRelance ?? null,
    prochain_contact: lead.prochainContact ?? null,
  };
}

function client() {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurée : CRM indisponible.');
  }
  return admin;
}

/**
 * Tous les leads, le plus récent en tête.
 * Au passage, corrige les statuts incohérents (lead resté « nouveau » alors
 * qu'un devis est parti) et persiste la correction.
 */
export async function listerLeads(): Promise<CRMLead[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Lecture du pipeline : ${error.message}`);

  const leads = ((data ?? []) as LigneLead[]).map(versLead);

  const corriges = leads.map(corrigerStatutIncoherent).filter((l): l is CRMLead => l !== null);
  if (corriges.length > 0) {
    await enregistrerLeads(corriges);
    const parId = new Map(corriges.map((l) => [l.id, l]));
    return leads.map((l) => parId.get(l.id) ?? l);
  }

  return leads;
}

export async function lireLead(id: string): Promise<CRMLead | null> {
  const { data, error } = await client().from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Lecture du lead ${id} : ${error.message}`);
  return data ? versLead(data as LigneLead) : null;
}

/** Crée ou met à jour un lead. */
export async function enregistrerLead(lead: CRMLead): Promise<CRMLead> {
  const { error } = await client().from(TABLE).upsert(versLigne(lead), { onConflict: 'id' });
  if (error) throw new Error(`Enregistrement du lead ${lead.id} : ${error.message}`);
  return lead;
}

/** Crée ou met à jour un lot de leads en une requête. */
export async function enregistrerLeads(leads: CRMLead[]): Promise<number> {
  if (leads.length === 0) return 0;
  const { error } = await client()
    .from(TABLE)
    .upsert(leads.map(versLigne), { onConflict: 'id' });
  if (error) throw new Error(`Enregistrement du lot : ${error.message}`);
  return leads.length;
}

export async function supprimerLead(id: string): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Suppression du lead ${id} : ${error.message}`);
}

/** Ajoute une entrée à l'historique d'un lead. */
export async function ajouterActivite(
  leadId: string,
  action: string,
  canal: CRMActivite['canal'] = 'systeme',
  automatique = true
): Promise<CRMLead | null> {
  const lead = await lireLead(leadId);
  if (!lead) return null;

  lead.activites.unshift({
    date: new Date().toISOString().split('T')[0],
    action,
    automatique,
    canal,
  });

  return enregistrerLead(lead);
}

/** Change le statut d'un lead et trace le changement. */
export async function changerStatut(
  leadId: string,
  nouveauStatut: CRMLead['statut']
): Promise<CRMLead | null> {
  const lead = await lireLead(leadId);
  if (!lead) return null;

  const ancien = lead.statut;
  lead.statut = nouveauStatut;
  lead.activites.unshift({
    date: new Date().toISOString().split('T')[0],
    action: `🔄 Statut : "${ancien}" → "${nouveauStatut}"`,
    automatique: false,
    canal: 'systeme',
  });

  return enregistrerLead(lead);
}

/** Marque une séquence de relance comme envoyée. */
export async function marquerSequenceEnvoyee(
  leadId: string,
  sequenceId: string,
  canal: CRMActivite['canal']
): Promise<CRMLead | null> {
  const lead = await lireLead(leadId);
  if (!lead) return null;

  const sequence = lead.sequences.find((s) => s.id === sequenceId);
  if (!sequence) return lead;

  sequence.statut = 'envoyee';
  const dateAuj = new Date().toISOString().split('T')[0];
  lead.derniereRelance = dateAuj;
  lead.activites.unshift({
    date: dateAuj,
    action: `✅ Séquence « ${sequence.nom} » envoyée par ${canal}`,
    automatique: true,
    canal,
  });

  return enregistrerLead(lead);
}

/**
 * Enregistre ou enrichit un lead issu de WhatsApp. Si le numéro est déjà connu,
 * on complète le lead existant au lieu d'en créer un doublon — un même client
 * écrivant deux fois ne doit pas apparaître deux fois dans le pipeline.
 */
export async function enregistrerLeadWhatsApp(params: {
  nom?: string;
  telephone: string;
  valeurEstimee?: number;
  produit?: string;
  statut?: CRMLead['statut'];
  action?: string;
}): Promise<CRMLead> {
  const numero = params.telephone.replace(/\D/g, '').slice(-8);

  const { data } = await client()
    .from(TABLE)
    .select('*')
    .ilike('telephone', `%${numero}%`)
    .limit(1);

  const existant = (data ?? [])[0] as LigneLead | undefined;

  if (existant) {
    const lead = versLead(existant);
    lead.activites.unshift({
      date: new Date().toISOString().split('T')[0],
      action: params.action || '💬 Nouveau message reçu sur WhatsApp',
      automatique: true,
      canal: 'whatsapp',
    });
    if (params.statut) lead.statut = params.statut;
    if (params.valeurEstimee) lead.valeurEstimee = params.valeurEstimee;
    if (params.produit) lead.produitInteresse = params.produit;
    return enregistrerLead(lead);
  }

  return enregistrerLead(construireLeadWhatsApp(params));
}
