// src/lib/crm-agent-engine.ts — Moteur Agentique Autonome 2CGC CRM
import { 
  CRMLead, 
  getLeads, 
  saveLeads, 
  ajouterActivite, 
  updateLeadStatut,
  TEMPLATES_EMAIL,
  TEMPLATES_WHATSAPP
} from './crm-data';
import { ajouterCommandeDepuisWhatsApp } from './commandes-store';

export interface AgentActionLog {
  id: string;
  timestamp: string;
  agentName: string;
  leadId?: string;
  leadNom?: string;
  actionType: 'score_lead' | 'trigger_relance' | 'send_to_factory' | 'pipeline_analysis' | 'generate_proforma' | 'autonomous_rule';
  thought: string;
  toolUsed: string;
  status: 'success' | 'pending_approval' | 'failed';
  details?: Record<string, any>;
}

export interface LeadAIScore {
  score: number; // 0 - 100
  priorite: 'haute' | 'moyenne' | 'faible';
  probabiliteConversion: number; // 0 - 100%
  recommandation: string;
  dateCalcul: string;
}

// Extension du type CRMLead pour inclure le scorage IA
export interface CRMLeadAgentic extends CRMLead {
  aiScore?: LeadAIScore;
}

const AGENT_LOGS_STORAGE_KEY = 'crm_agentic_logs_v1';

// =============================================
// GESTION DU JOURNAL DES ACTIONS AGENTIQUES
// =============================================
export function getAgentLogs(): AgentActionLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(AGENT_LOGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : getInitialLogs();
  } catch {
    return getInitialLogs();
  }
}

export function saveAgentLogs(logs: AgentActionLog[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AGENT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100))); // Garder les 100 plus récents
  }
}

export function logAgentAction(log: Omit<AgentActionLog, 'id' | 'timestamp'>): AgentActionLog {
  const newLog: AgentActionLog = {
    ...log,
    id: `LOG-AGENT-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
  };
  const logs = getAgentLogs();
  logs.unshift(newLog);
  saveAgentLogs(logs);
  return newLog;
}

function getInitialLogs(): AgentActionLog[] {
  return [
    {
      id: 'LOG-AGENT-001',
      timestamp: new Date().toISOString(),
      agentName: 'Agent Qualification',
      leadId: 'LEAD-001',
      leadNom: 'M. Koné Drissa',
      actionType: 'score_lead',
      thought: 'Le prospect demande un volume important (2000 briques) avec un budget estimé à 2.5M FCFA. Source direct devis auto.',
      toolUsed: 'scoreLead',
      status: 'success',
      details: { score: 92, priorite: 'haute' }
    },
    {
      id: 'LOG-AGENT-002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      agentName: 'Agent Relances Autonomes',
      leadId: 'LEAD-003',
      leadNom: 'M. Coulibaly Jean',
      actionType: 'trigger_relance',
      thought: 'Devis envoyé depuis 5 jours sans réponse. Déclenchement automatique de la relance WhatsApp J+5 avec rappel avantage stock.',
      toolUsed: 'triggerAutonomousRelance',
      status: 'success',
      details: { canal: 'whatsapp' }
    }
  ];
}

// =============================================
// ALGORITHME DE SCORING AGENTIQUE DES LEADS
// =============================================
export function scoreLead(lead: CRMLead): LeadAIScore {
  let score = 50; // Score de départ

  // 1. Valeur financière
  const valeur = lead.valeurEstimee || 0;
  if (valeur >= 5000000) score += 30;
  else if (valeur >= 2000000) score += 20;
  else if (valeur >= 500000) score += 10;

  // 2. Statut dans le funnel
  if (lead.statut === 'negociation') score += 20;
  else if (lead.statut === 'devis_envoye') score += 10;
  else if (lead.statut === 'gagne') score = 100;
  else if (lead.statut === 'perdu') score = 0;

  // 3. Source du lead
  if (lead.source === 'whatsapp' || lead.source === 'devis_auto') score += 10;
  if (lead.source === 'scraping_btp' && (lead.email || lead.telephone)) score += 5;

  // 4. Nombre d'activités récentes (Engagement)
  const activitesRecentes = lead.activites?.length || 0;
  if (activitesRecentes >= 3) score += 10;

  score = Math.min(Math.max(score, 5), 100);

  let priorite: 'haute' | 'moyenne' | 'faible' = 'moyenne';
  if (score >= 75) priorite = 'haute';
  else if (score <= 40) priorite = 'faible';

  let recommandation = 'Relancer par WhatsApp sous 48h';
  if (score >= 80) recommandation = 'Forte probabilité ! Proposer un appel téléphonique avec M. KEITA ou remise de 3%';
  else if (score >= 60) recommandation = 'Envoyer la brochure produits B2B et relancer par Email';
  else if (score < 40) recommandation = 'Maintenir en séquence automatique sans action manuelle urgente';

  return {
    score,
    priorite,
    probabiliteConversion: score,
    recommandation,
    dateCalcul: new Date().toISOString().split('T')[0]
  };
}

export function scoreAllLeads(): CRMLeadAgentic[] {
  const leads = getLeads();
  const leadsScores: CRMLeadAgentic[] = leads.map(lead => {
    const aiScore = scoreLead(lead);
    return {
      ...lead,
      aiScore
    };
  });
  saveLeads(leadsScores);

  logAgentAction({
    agentName: 'Agent Scorage IA',
    actionType: 'score_lead',
    thought: `Calcul du score de priorité effectué pour l'ensemble des ${leads.length} prospects du CRM.`,
    toolUsed: 'scoreAllLeads',
    status: 'success',
    details: { totalLeads: leads.length }
  });

  return leadsScores;
}

// =============================================
// ACTIONS AGENTIQUES AUTONOMES
// =============================================

/**
 * Exécute une relance autonome ciblée
 */
export async function triggerAutonomousRelance(
  leadId: string, 
  canal: 'email' | 'whatsapp' = 'whatsapp',
  messagePersonnalise?: string
): Promise<{ success: boolean; message: string }> {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);

  if (!lead) {
    return { success: false, message: 'Prospect introuvable' };
  }

  const dateAuj = new Date().toISOString().split('T')[0];

  if (canal === 'email' && lead.email && lead.email.includes('@')) {
    const templateKey = lead.statut === 'nouveau' ? 'bienvenue' : 'relance_j2';
    const template = TEMPLATES_EMAIL[templateKey];
    
    let corps = messagePersonnalise || template.corps
      .replace(/{nom}/g, lead.nom)
      .replace(/{entreprise}/g, lead.entreprise || 'votre entreprise')
      .replace(/{produit}/g, lead.produitInteresse || 'nos matériaux')
      .replace(/{montant}/g, (lead.valeurEstimee || 0).toLocaleString('fr-FR'));

    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: lead.email, 
          sujet: template.sujet.replace(/{nom}/g, lead.nom), 
          corps, 
          nomDestinataire: lead.nom 
        })
      });
    } catch (e) {
      console.warn('Erreur envoi email agent:', e);
    }

    ajouterActivite(leadId, `🤖 Agent IA : Relance automatique envoyée par Email (${templateKey})`, 'email', true);
  } else {
    // WhatsApp
    const msg = messagePersonnalise || `Bonjour ${lead.nom} 👋, M. KEITA de 2CGC Daloa vous relance concernant votre projet (${lead.produitInteresse || 'Matériaux BTP'}). Avez-vous des questions sur les stocks ?`;
    ajouterActivite(leadId, `🤖 Agent IA : Relance WhatsApp générée (${msg.slice(0, 60)}...)`, 'whatsapp', true);
  }

  lead.derniereRelance = dateAuj;
  saveLeads(leads);

  logAgentAction({
    agentName: 'Agent Relances Autonomes',
    leadId: lead.id,
    leadNom: lead.nom,
    actionType: 'trigger_relance',
    thought: `Le lead ${lead.nom} (${lead.id}) présentait une opportunité dormante. Envoi de relance autonome via ${canal.toUpperCase()}.`,
    toolUsed: 'triggerAutonomousRelance',
    status: 'success',
    details: { canal, leadId }
  });

  return { 
    success: true, 
    message: `Relance ${canal.toUpperCase()} exécutée pour ${lead.nom}` 
  };
}

/**
 * Exécute une relance globale autonome sur tous les devis expirés (> 48h)
 */
export async function triggerBulkRelancesExpiress(): Promise<{ relancesCount: number; leadsRelances: string[] }> {
  const leads = getLeads();
  const dateAuj = new Date();
  const leadsRelances: string[] = [];

  for (const lead of leads) {
    if (lead.statut === 'devis_envoye' || lead.statut === 'negociation') {
      const dateCreation = new Date(lead.dateCreation);
      const diffJours = Math.floor((dateAuj.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24));

      if (diffJours >= 2) {
        await triggerAutonomousRelance(lead.id, lead.telephone ? 'whatsapp' : 'email');
        leadsRelances.push(lead.nom);
      }
    }
  }

  logAgentAction({
    agentName: 'Agent Relances Autonomes',
    actionType: 'autonomous_rule',
    thought: `Campagne automatique exécutée : ${leadsRelances.length} devis expirés de plus de 48h ont été relancés.`,
    toolUsed: 'triggerBulkRelancesExpiress',
    status: 'success',
    details: { totalRelances: leadsRelances.length, clients: leadsRelances }
  });

  return { relancesCount: leadsRelances.length, leadsRelances };
}

/**
 * Convertit un lead gagné en commande pour le Chef d'Usine à Daloa
 */
export function sendLeadToFactory(leadId: string): { success: boolean; commandeId?: string; message: string } {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);

  if (!lead) {
    return { success: false, message: 'Prospect non trouvé' };
  }

  // 1. Mettre à jour le statut du lead
  updateLeadStatut(leadId, 'gagne');

  // 2. Transférer la commande au Chef d'Usine
  const commande = ajouterCommandeDepuisWhatsApp({
    clientNom: lead.nom,
    telephone: lead.telephone || '+225 07 00 00 00',
    total: lead.valeurEstimee || 1000000,
    articles: [
      {
        nom: lead.produitInteresse || 'Préfabriqués Béton 2CGC',
        quantite: 1000,
        prix: (lead.valeurEstimee || 1000000) / 1000,
      }
    ]
  });

  ajouterActivite(
    leadId,
    `🏭 Agent IA Usine : Opportunité convertie et relayée au Chef d'Usine à Daloa (N° Commande Usine: ${commande.id})`,
    'systeme',
    true
  );

  logAgentAction({
    agentName: 'Agent Usine Dispatch',
    leadId: lead.id,
    leadNom: lead.nom,
    actionType: 'send_to_factory',
    thought: `Lead ${lead.nom} gagné. Création et dispatching direct de la commande usine ${commande.id} pour fabrication/chargement à Daloa.`,
    toolUsed: 'sendLeadToFactory',
    status: 'success',
    details: { commandeId: commande.id, total: lead.valeurEstimee }
  });

  return {
    success: true,
    commandeId: commande.id,
    message: `Opportunité convertie ! Commande usine ${commande.id} transmise à Daloa.`
  };
}

/**
 * Génère des analyses prédictives et recommandations pour le dirigeant
 */
export function getPipelineAnalytics(): {
  chiffreAffairesPotentiel: number;
  tauxConversionPondere: number;
  opportunitesCritiques: CRMLeadAgentic[];
  recommandationsStrategiques: string[];
} {
  const leads = scoreAllLeads();

  const totalPotentiel = leads
    .filter(l => l.statut !== 'perdu')
    .reduce((sum, l) => sum + (l.valeurEstimee || 0), 0);

  const totalPondere = leads
    .filter(l => l.statut !== 'perdu')
    .reduce((sum, l) => {
      const proba = (l.aiScore?.probabiliteConversion || 50) / 100;
      return sum + ((l.valeurEstimee || 0) * proba);
    }, 0);

  const opportunitesCritiques = leads
    .filter(l => (l.aiScore?.score || 0) >= 70 && l.statut !== 'gagne' && l.statut !== 'perdu')
    .sort((a, b) => (b.aiScore?.score || 0) - (a.aiScore?.score || 0));

  const recommandations: string[] = [
    `💎 ${opportunitesCritiques.length} opportunités à très haut potentiel détectées. Concentrer l'effort commercial sur : ${opportunitesCritiques.slice(0, 2).map(o => o.nom).join(', ')}.`,
    `📉 Le chiffre d'affaires pondéré estimé pour ce mois est de ${Math.round(totalPondere).toLocaleString('fr-FR')} FCFA sur un pipeline de ${totalPotentiel.toLocaleString('fr-FR')} FCFA.`,
    `⚡ ${leads.filter(l => l.statut === 'devis_envoye').length} devis sont en attente de relance. Exécuter l'agent de relance autonome.`,
  ];

  return {
    chiffreAffairesPotentiel: totalPotentiel,
    tauxConversionPondere: Math.round(totalPondere),
    opportunitesCritiques,
    recommandationsStrategiques: recommandations,
  };
}

// =============================================
// CO-PILOT ENGINE (TRAITEMENT DU PROMPT UTILISATEUR)
// =============================================
export async function processCopilotPrompt(userPrompt: string): Promise<{
  reply: string;
  thought: string;
  actionTaken?: string;
  dataDetails?: any;
}> {
  const promptLower = userPrompt.toLowerCase();

  // 1. Détection des intentions
  if (promptLower.includes('relanc') || promptLower.includes('expir') || promptLower.includes('devis')) {
    const res = await triggerBulkRelancesExpiress();
    return {
      thought: `Analyse de l'intention utilisateur : Relance autonome de devis. Recherche des opportunités stagnantes de plus de 48h.`,
      reply: `✅ J'ai exécuté la campagne de relance autonome. ${res.relancesCount} prospects ont été relancés par WhatsApp/Email (${res.leadsRelances.join(', ') || 'Aucun devis expiré'}).`,
      actionTaken: 'triggerBulkRelancesExpiress',
      dataDetails: res
    };
  }

  if (promptLower.includes('scor') || promptLower.includes('priorit') || promptLower.includes('analys')) {
    const scoredLeads = scoreAllLeads();
    const tops = scoredLeads.slice(0, 3);
    return {
      thought: `Analyse de l'intention utilisateur : Recalcul et réévaluation des scores de priorité de l'ensemble du CRM.`,
      reply: `📊 J'ai réévalué l'ensemble des prospects. Les 3 meilleures opportunités actuelles sont :\n` +
        tops.map(t => `• **${t.nom}** (${t.entreprise}) — Score IA: **${t.aiScore?.score}%** (${(t.valeurEstimee || 0).toLocaleString('fr-FR')} FCFA)`).join('\n'),
      actionTaken: 'scoreAllLeads',
      dataDetails: tops
    };
  }

  if (promptLower.includes('usine') || promptLower.includes('convert') || promptLower.includes('command')) {
    const leads = getLeads().filter(l => l.statut === 'negociation' || l.statut === 'devis_envoye');
    if (leads.length > 0) {
      const topLead = leads[0];
      const res = sendLeadToFactory(topLead.id);
      return {
        thought: `Conversion de la meilleure opportunité en cours (${topLead.nom}) et envoi automatique au Chef d'Usine à Daloa.`,
        reply: `🏗️ ${res.message} Le statut de ${topLead.nom} est passé à "Gagné".`,
        actionTaken: 'sendLeadToFactory',
        dataDetails: res
      };
    } else {
      return {
        thought: `Tentative de conversion en commande usine mais aucune opportunité éligible trouvée.`,
        reply: `Aucune opportunité en négociation à convertir directement. Toutes les affaires sont déjà qualifiées ou traitées.`,
        actionTaken: 'none'
      };
    }
  }

  if (promptLower.includes('rapport') || promptLower.includes('prévision') || promptLower.includes('chiffre') || promptLower.includes('stat')) {
    const stats = getPipelineAnalytics();
    return {
      thought: `Génération du rapport prédictif et des métriques de vente pondérées par le score IA.`,
      reply: `📈 **Rapport d'Analyse Prédictive 2CGC** :\n\n` +
        `• **Pipeline Total :** ${stats.chiffreAffairesPotentiel.toLocaleString('fr-FR')} FCFA\n` +
        `• **Prévision Réalisable Pondérée :** **${stats.tauxConversionPondere.toLocaleString('fr-FR')} FCFA**\n\n` +
        `💡 **Recommandations Agentiques :**\n` +
        stats.recommandationsStrategiques.map(r => `• ${r}`).join('\n'),
      actionTaken: 'getPipelineAnalytics',
      dataDetails: stats
    };
  }

  // Réponse par défaut
  const stats = getPipelineAnalytics();
  return {
    thought: `Compréhension générale du prompt. Présentation des capacités agentiques CRM 2CGC.`,
    reply: `Bonjour ! Je suis l'Agent IA CRM 2CGC. Voici ce que je peux faire pour vous en autonomie :\n\n` +
      `1️⃣ **Relancer automatiquement les devis expirés** par WhatsApp & Email\n` +
      `2️⃣ **Scorer et prioriser vos prospects** selon leur potentiel réel\n` +
      `3️⃣ **Transférer une opportunité gagnée directement au Chef d'Usine** à Daloa\n` +
      `4️⃣ **Générer des prévisions de chiffre d'affaires** personnalisées.\n\n` +
      `*Que souhaitez-vous exécuter ?*`,
    actionTaken: 'general_assistance',
  };
}
