// src/lib/bot-commercial.ts — Moteur du Bot Commercial 2CGC

import {
  CRMLead, CRMSequence, TEMPLATES_EMAIL, TEMPLATES_WHATSAPP,
  getLeads, saveLeads, getSequencesEnAttente, marquerSequenceEnvoyee,
  genererLienWhatsApp,
} from './crm-data';

// =============================================
// ENVOI EMAIL VIA L'API
// =============================================
export async function envoyerEmail(lead: CRMLead, templateKey: string): Promise<boolean> {
  const template = TEMPLATES_EMAIL[templateKey];
  if (!template) return false;

  const dateExpiration = new Date(Date.now() + 7 * 86400000).toLocaleDateString('fr-FR');

  let sujet = template.sujet
    .replace(/{nom}/g, lead.nom)
    .replace(/{entreprise}/g, lead.entreprise || 'votre entreprise')
    .replace(/{produit}/g, lead.produitInteresse || 'nos produits');

  let corps = template.corps
    .replace(/{nom}/g, lead.nom)
    .replace(/{entreprise}/g, lead.entreprise || 'votre entreprise')
    .replace(/{produit}/g, lead.produitInteresse || 'nos produits')
    .replace(/{montant}/g, (lead.valeurEstimee || 0).toLocaleString('fr-FR'))
    .replace(/{date_expiration}/g, dateExpiration);

  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: lead.email, sujet, corps, nomDestinataire: lead.nom }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error('[BotCommercial] Erreur envoi email:', e);
    return false;
  }
}

// =============================================
// TRAITEMENT DES SÉQUENCES EN ATTENTE
// =============================================
export async function traiterSequencesEnAttente(): Promise<{
  traitees: number;
  emails: number;
  whatsapps: number;
  erreurs: number;
}> {
  const sequencesATraiter = getSequencesEnAttente();
  let emails = 0, whatsapps = 0, erreurs = 0;

  for (const { lead, sequence } of sequencesATraiter) {
    try {
      if (sequence.canal === 'email') {
        const ok = await envoyerEmail(lead, sequence.template);
        if (ok) {
          marquerSequenceEnvoyee(lead.id, sequence.id, 'email');
          emails++;
        } else {
          erreurs++;
        }
      }
      // WhatsApp : on marque comme "à envoyer manuellement" (via le lien)
      if (sequence.canal === 'whatsapp') {
        // Le commercial clique sur le lien — on log juste l'alerte
        whatsapps++;
      }
    } catch (e) {
      console.error('[BotCommercial] Erreur séquence:', sequence.id, e);
      erreurs++;
    }
  }

  return { traitees: sequencesATraiter.length, emails, whatsapps, erreurs };
}

// =============================================
// SÉQUENCES AUTOMATIQUES SELON LE STATUT
// =============================================
export function creerSequencesParStatut(lead: CRMLead): CRMSequence[] {
  const today = new Date().toISOString().split('T')[0];
  const j2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const j5 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const j7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  switch (lead.statut) {
    case 'nouveau':
      return [
        { id: `${lead.id}-auto-1`, nom: 'Email bienvenue J+0', statut: 'en_attente', datePrevu: today, canal: 'email', template: 'bienvenue' },
        { id: `${lead.id}-auto-2`, nom: 'Relance email J+2', statut: 'en_attente', datePrevu: j2, canal: 'email', template: 'relance_j2' },
        { id: `${lead.id}-auto-3`, nom: 'WhatsApp relance J+5', statut: 'en_attente', datePrevu: j5, canal: 'whatsapp', template: 'relance' },
        { id: `${lead.id}-auto-4`, nom: 'Offre spéciale J+7', statut: 'en_attente', datePrevu: j7, canal: 'email', template: 'relance_j7' },
      ];
    case 'devis_envoye':
      return [
        { id: `${lead.id}-auto-5`, nom: 'Relance email J+2', statut: 'en_attente', datePrevu: j2, canal: 'email', template: 'relance_j2' },
        { id: `${lead.id}-auto-6`, nom: 'WhatsApp suivi J+5', statut: 'en_attente', datePrevu: j5, canal: 'whatsapp', template: 'relance' },
      ];
    case 'gagne':
      return [
        { id: `${lead.id}-auto-7`, nom: 'Email confirmation commande', statut: 'en_attente', datePrevu: today, canal: 'email', template: 'gagne' },
      ];
    default:
      return [];
  }
}

// =============================================
// MÉTRIQUES BOT
// =============================================
export interface MetriquesBotCommercial {
  sequencesEnAttente: number;
  emailsEnAttente: number;
  whatsappsEnAttente: number;
  leadsNonContactes: number;
  relancesUrgentes: number; // leads sans contact depuis > 5j
}

export function getMetriquesBotCommercial(): MetriquesBotCommercial {
  const leads = getLeads();
  const today = new Date().toISOString().split('T')[0];
  const sequences = getSequencesEnAttente();

  const emailsEnAttente = sequences.filter(s => s.sequence.canal === 'email').length;
  const whatsappsEnAttente = sequences.filter(s => s.sequence.canal === 'whatsapp').length;

  const leadsNonContactes = leads.filter(
    l => l.statut === 'nouveau' && !l.derniereRelance
  ).length;

  const relancesUrgentes = leads.filter(l => {
    if (l.statut === 'gagne' || l.statut === 'perdu') return false;
    if (!l.derniereRelance) return false;
    const joursDepuis = Math.floor(
      (new Date(today).getTime() - new Date(l.derniereRelance).getTime()) / 86400000
    );
    return joursDepuis >= 5;
  }).length;

  return {
    sequencesEnAttente: sequences.length,
    emailsEnAttente,
    whatsappsEnAttente,
    leadsNonContactes,
    relancesUrgentes,
  };
}
