// src/lib/crm-data.ts — CRM enrichi avec WhatsApp & séquences

export interface CRMLead {
  id: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  statut: 'nouveau' | 'contacte' | 'devis_envoye' | 'negociation' | 'gagne' | 'perdu';
  valeurEstimee: number;
  source: 'site_web' | 'chatbot' | 'devis_auto' | 'whatsapp' | 'telephone' | 'scraping_btp';
  produitInteresse?: string;
  ville?: string;
  notes?: string;
  activites: CRMActivite[];
  sequences: CRMSequence[];
  dateCreation: string;
  derniereRelance?: string;
  prochainContact?: string;
}

export interface CRMActivite {
  date: string;
  action: string;
  automatique: boolean;
  canal?: 'email' | 'whatsapp' | 'telephone' | 'systeme';
}

export interface CRMSequence {
  id: string;
  nom: string;
  statut: 'en_attente' | 'envoyee' | 'annulee';
  datePrevu: string;
  canal: 'email' | 'whatsapp';
  template: string;
}

// =============================================
// TEMPLATES DE MESSAGES
// =============================================
export const TEMPLATES_EMAIL: Record<string, { sujet: string; corps: string }> = {
  proforma: {
    sujet: '📄 Votre Facture Proforma Officielle — 2CGC Béton Industrie Daloa',
    corps: `Bonjour {nom},

Nous vous remercions de votre confiance en 2CGC (Cheickna Construction & Génie Civil).
Votre facture proforma a été générée avec succès pour votre projet : {produit}.

💰 Montant Net à Payer TTC : {montant} FCFA
⏱️ Validité de l'offre : 30 jours calendaires
🚚 Livraison : Flotte 2CGC avec déchargement grue (Livraison intra-muros Daloa offerte)

💳 Modalités de règlement :
• Acompte de 50% à la commande (réservation des stocks d'usine)
• Solde avant déchargement de la marchandise
• Banque : BSIC Daloa — RIB : CI154 08521 029041500015 04
• Mobile Money (Wave / Orange / Moov / MTN) : +225 07 07 62 17 99

📞 Vos contacts directs :
Tél Direction Générale : +225 07 07 62 17 99 / +225 07 07 85 76 29
Email : cheicknaconstruction@gmail.com
Usine & Siège : Quartier Commerce (Réf. Pharmacie Appaul), BP 129 Daloa

Cordialement,
L'équipe commerciale 2CGC`,
  },
  bienvenue: {
    sujet: 'Bienvenue chez 2CGC — Vos préfabriqués béton de qualité',
    corps: `Bonjour {nom},

Merci de votre intérêt pour 2CGC (Cheickna Construction & Génie Civil) !

Nous avons bien enregistré votre demande concernant : {produit}.
Un conseiller commercial va vous recontacter dans les plus brefs délais.

🔗 Consultez notre catalogue complet : https://2cgc-industrie.com/catalogue

En attendant, voici nos tarifs indicatifs :
• Briques : à partir de 260 FCFA/unité
• Hourdis : à partir de 380 FCFA/unité  
• Pavés autobloquants : à partir de 6 500 FCFA/m²

📞 Besoin d'une réponse urgente ?
Tél : +225 07 07 62 17 99 / +225 07 07 85 76 29

Cordialement,
L'équipe commerciale 2CGC
Quartier Commerce (non loin de la Pharmacie Appaul), BP 129 Daloa (Côte d'Ivoire)
Email : cheicknaconstruction@gmail.com`,
  },
  relance_j2: {
    sujet: '🔔 Suite à votre demande — Avez-vous des questions ?',
    corps: `Bonjour {nom},

Je me permets de vous relancer suite à votre demande de devis il y a 2 jours.

Avez-vous eu l'occasion d'examiner notre proposition ? 
Avez-vous des questions sur nos produits ou nos conditions de livraison ?

💡 Nous pouvons vous proposer :
• Une visite de notre site de production à Daloa
• Des échantillons gratuits de nos briques et pavés
• Un délai de livraison garanti sous 48h

📞 Répondez à cet email ou appelez le +225 07 07 62 17 99 / +225 07 07 85 76 29

Cordialement,
KEITA BOUBACAR — Directeur Général
2CGC SARL, Quartier Commerce (Réf. Pharmacie Appaul), BP 129 Daloa`,
  },
  relance_j7: {
    sujet: '🏗️ Offre spéciale valable 7 jours — {nom}',
    corps: `Bonjour {nom},

Nous espérons que votre projet avance bien.

Pour vous aider à démarrer, nous vous proposons une **offre spéciale** 
valable 7 jours : -5% sur votre première commande supérieure à 500 000 FCFA.

Pour en bénéficier, contactez-nous avant le {date_expiration} :
📞 +225 07 07 62 17 99 / +225 07 07 85 76 29
📧 cheicknaconstruction@gmail.com

Cette offre est réservée aux nouveaux clients. 

Cordialement,
L'équipe 2CGC
Quartier Commerce BP 129 Daloa`,
  },
  gagne: {
    sujet: '✅ Confirmation de votre commande — 2CGC',
    corps: `Bonjour {nom},

Nous avons le plaisir de confirmer votre commande 2CGC !

📦 Récapitulatif :
• Produits : {produit}
• Montant TTC : {montant} FCFA
• Délai de livraison : 48-72h

Votre livraison sera effectuée à l'adresse convenue.
Vous recevrez un SMS de suivi dès l'expédition.

Merci de votre confiance.

Cordialement,
2CGC — Quartier Commerce (Réf. Pharmacie Appaul), BP 129 Daloa`,
  },
  promo_mensuelle: {
    sujet: '🎁 Offre du mois — Spécial Pavés Autobloquants',
    corps: `Bonjour {nom},

Ce mois-ci, 2CGC vous propose des tarifs exceptionnels sur les pavés autobloquants :

🛣️ **Pavés Z-7 Colorés** : 7 000 FCFA/m² (au lieu de 7 500)
🛣️ **Pavés Z-13 & Z-14** : 6 000 FCFA/m² (au lieu de 6 500)

Offre valable jusqu'à fin du mois, dans la limite des stocks disponibles.

📞 Commandez maintenant : +225 07 07 62 17 99 / +225 07 07 85 76 29
🌐 Ou via notre site : https://2cgc-industrie.com/catalogue

2CGC — Votre partenaire BTP de confiance à Daloa`,
  },
  prospection_b2b: {
    sujet: '🏗️ Partenariat Fourniture Béton & Préfabriqués — 2CGC Daloa',
    corps: `Bonjour {nom},

Je suis M. KEITA BOUBACAR, Directeur Général de 2CGC (Cheickna Construction & Génie Civil) à Daloa.

Nous avons identifié vos réalisations et chantiers avec {entreprise}. En tant qu'unité industrielle de référence dans la région du Haut-Sassandra et en Côte d'Ivoire, nous souhaitons vous proposer un partenariat direct pour la fourniture de vos préfabriqués béton :

🧱 Notre gamme certifiée haute résistance :
• Agglos pleins et creux (15x20x50, 20x20x50) vibrés à haute densité
• Pavés autobloquants et pavés hollandais pour parkings, cours et voiries
• Bordures de trottoir T2, caniveaux et dallettes
• Hourdis de plancher normalisés

🚚 Nos garanties chantiers :
• Contrôle qualité systématique des agrégats et essais à la rupture
• Capacité de production industrielle continue (pas de rupture de stock)
• Flotte logistique dédiée avec camions-grues et déchargement direct sur vos chantiers
• Tarifs préférentiels B2B et facilités de règlement pour nos partenaires

🔗 Consultez notre catalogue en ligne : https://2cgc-industrie.com/catalogue

Pouvons-nous convenir d'un court échange ou vous transmettre notre grille tarifaire réservée aux professionnels ?

📞 Contact direct : +225 07 07 62 17 99 / +225 07 07 85 76 29
📧 cheicknaconstruction@gmail.com

Bien cordialement,
KEITA BOUBACAR — Directeur Général
2CGC SARL Unipersonnel — Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa (Côte d'Ivoire)`,

  },
};

export const TEMPLATES_WHATSAPP: Record<string, string> = {
  prospection_b2b: `Bonjour {nom} ({entreprise}) 👋

Je suis M. KEITA de *2CGC Daloa* (Cheickna Construction & Génie Civil).

Nous accompagnons les professionnels et entrepreneurs du BTP en Côte d'Ivoire dans l'approvisionnement en préfabriqués béton haute résistance :

🧱 *Nos produits certifiés en stock :*
• Agglos 15 et 20 (creux & pleins)
• Pavés autobloquants et pavés décoratifs
• Bordures de trottoir T2 et caniveaux
• Hourdis de plancher

🚚 *Livraison directe et déchargement sur vos chantiers.*

Souhaitez-vous recevoir notre catalogue B2B avec tarifs professionnels 2026 ?

_KEITA BOUBACAR — DG 2CGC Daloa_
📞 +225 07 07 62 17 99`,
  bienvenue: `Bonjour {nom} 👋

Merci pour votre intérêt pour nos produits 2CGC !

Nous avons bien reçu votre demande concernant *{produit}*. 

Notre équipe vous prépare un devis personnalisé. Avez-vous des questions ? Je suis à votre disposition 🏗️

_KEITA BOUBACAR — Directeur Général, 2CGC Daloa_`,

  relance: `Bonjour {nom} 👋

Je me permets de vous relancer concernant votre demande de devis chez *2CGC*.

Avez-vous eu l'occasion d'y réfléchir ? 

💡 Nous pouvons organiser une visite de notre site de production gratuitement.

📦 Stock disponible immédiatement. Livraison sous 48h à Daloa et environs.

Cordialement 🤝`,

  promo: `🎁 Offre spéciale *2CGC* réservée à nos prospects !

Bonjour {nom},

Cette semaine : *-5% sur toute commande* supérieure à 500 000 FCFA.

• Briques, Hourdis, Pavés — tout est disponible
• Livraison sur chantier incluse (Daloa & environs)

Dites-moi si vous êtes intéressé 👇`,

  confirmation: `✅ *Confirmation de commande — 2CGC*

Bonjour {nom},

Votre commande est confirmée ! 🎉

Nos équipes préparent votre livraison. Vous recevrez un message dès l'expédition.

Merci de votre confiance 🤝
_2CGC — Quartier Commerce, Daloa_`,
};

// =============================================
// DONNÉES INITIALES MOCK
// =============================================
export const INITIAL_LEADS: CRMLead[] = [
  {
    id: 'LEAD-001',
    nom: 'M. Koné Drissa',
    entreprise: 'BTP Afrique SARL',
    email: 'contact@btp-afrique.com',
    telephone: '+225 07 12 34 56',
    statut: 'negociation',
    valeurEstimee: 2500000,
    source: 'devis_auto',
    produitInteresse: 'Briques 20 Creuse × 2000',
    dateCreation: '2026-09-10',
    derniereRelance: '2026-09-12',
    prochainContact: '2026-09-16',
    sequences: [
      { id: 'SEQ-001-1', nom: 'Email bienvenue', statut: 'envoyee', datePrevu: '2026-09-10', canal: 'email', template: 'bienvenue' },
      { id: 'SEQ-001-2', nom: 'Relance J+2', statut: 'envoyee', datePrevu: '2026-09-12', canal: 'email', template: 'relance_j2' },
      { id: 'SEQ-001-3', nom: 'Relance WhatsApp J+5', statut: 'en_attente', datePrevu: '2026-09-15', canal: 'whatsapp', template: 'relance' },
    ],
    activites: [
      { date: '2026-09-12', action: '📧 Email de relance J+2 envoyé automatiquement', automatique: true, canal: 'email' },
      { date: '2026-09-10', action: '📄 Devis DEV-2026-002 généré — 2 500 000 FCFA', automatique: true, canal: 'systeme' },
      { date: '2026-09-10', action: '🤖 Lead qualifié automatiquement (Briques 20 Creuse)', automatique: true, canal: 'systeme' },
    ],
  },
  {
    id: 'LEAD-002',
    nom: 'Mme. Traoré Aminata',
    entreprise: 'Architecte & Design CI',
    email: 'traore@archi.ci',
    telephone: '+225 05 98 76 54',
    statut: 'nouveau',
    valeurEstimee: 850000,
    source: 'chatbot',
    produitInteresse: 'Pavés autobloquants Z-7',
    dateCreation: '2026-09-14',
    sequences: [
      { id: 'SEQ-002-1', nom: 'Email bienvenue', statut: 'en_attente', datePrevu: '2026-09-15', canal: 'email', template: 'bienvenue' },
      { id: 'SEQ-002-2', nom: 'WhatsApp bienvenue', statut: 'en_attente', datePrevu: '2026-09-15', canal: 'whatsapp', template: 'bienvenue' },
    ],
    activites: [
      { date: '2026-09-14', action: '🤖 Conversation via BetoBot — Question: Prix pavés Z-7', automatique: true, canal: 'systeme' },
    ],
  },
  {
    id: 'LEAD-003',
    nom: 'M. Coulibaly Jean',
    entreprise: 'Résidence Les Palmiers',
    email: 'j.coulibaly@gmail.com',
    telephone: '+225 07 45 67 89',
    statut: 'devis_envoye',
    valeurEstimee: 1200000,
    source: 'site_web',
    produitInteresse: 'Hourdis 15 Français × 500',
    dateCreation: '2026-09-08',
    derniereRelance: '2026-09-13',
    sequences: [
      { id: 'SEQ-003-1', nom: 'Email bienvenue', statut: 'envoyee', datePrevu: '2026-09-08', canal: 'email', template: 'bienvenue' },
      { id: 'SEQ-003-2', nom: 'Relance J+2', statut: 'envoyee', datePrevu: '2026-09-10', canal: 'email', template: 'relance_j2' },
      { id: 'SEQ-003-3', nom: 'Relance J+7', statut: 'en_attente', datePrevu: '2026-09-15', canal: 'email', template: 'relance_j7' },
    ],
    activites: [
      { date: '2026-09-13', action: '📧 Relance J+5 email envoyée', automatique: true, canal: 'email' },
      { date: '2026-09-10', action: '📧 Email de relance J+2 envoyé', automatique: true, canal: 'email' },
      { date: '2026-09-08', action: '📧 Email bienvenue + catalogue envoyé', automatique: true, canal: 'email' },
      { date: '2026-09-08', action: '📄 Devis formulaire contact reçu — 1 200 000 FCFA', automatique: false, canal: 'systeme' },
    ],
  },
  {
    id: 'LEAD-004',
    nom: 'SOGECI Bâtiment',
    entreprise: 'SOGECI',
    email: 'direction@sogeci.ci',
    telephone: '+225 22 00 11 22',
    statut: 'gagne',
    valeurEstimee: 8500000,
    source: 'telephone',
    produitInteresse: 'Briques 15 Creuse × 10 000 + Hourdis',
    dateCreation: '2026-09-01',
    sequences: [],
    activites: [
      { date: '2026-09-09', action: '🎉 Commande confirmée — 8 500 000 FCFA', automatique: false, canal: 'systeme' },
      { date: '2026-09-09', action: '📧 Email confirmation de commande envoyé', automatique: true, canal: 'email' },
      { date: '2026-09-05', action: '📞 Appel téléphonique — négociation tarif volume', automatique: false, canal: 'telephone' },
    ],
  },
];

// =============================================
// FONCTIONS CRM
// =============================================
export function getLeads(): CRMLead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  const saved = localStorage.getItem('crm_leads_v2');
  const leads: CRMLead[] = saved ? JSON.parse(saved) : INITIAL_LEADS;

  // ✅ Auto-migration & auto-correction de statut :
  // Si un lead est en 'nouveau' mais qu'un email ou devis a déjà été émis, passer automatiquement en 'devis_envoye'
  let modifie = false;
  leads.forEach(l => {
    if (l.statut === 'nouveau') {
      const aSequenceEnvoyee = l.sequences.some(s => s.statut === 'envoyee' && s.canal === 'email');
      const aActiviteEmail = l.activites.some(
        a => a.canal === 'email' || a.action.includes('Email') || a.action.includes('Devis')
      );
      if (aSequenceEnvoyee || aActiviteEmail || l.source === 'devis_auto') {
        l.statut = 'devis_envoye';
        l.activites.unshift({
          date: new Date().toISOString().split('T')[0],
          action: '🔄 Statut mis à jour automatiquement : "Nouveau" → "Devis Envoyé"',
          automatique: true,
          canal: 'systeme',
        });
        modifie = true;
      }
    }
  });

  if (modifie && typeof window !== 'undefined') {
    localStorage.setItem('crm_leads_v2', JSON.stringify(leads));
  }

  return leads;
}

export function saveLeads(leads: CRMLead[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('crm_leads_v2', JSON.stringify(leads));
  }
}

export function ajouterActivite(leadId: string, action: string, canal: CRMActivite['canal'] = 'systeme', automatique = true) {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
    lead.activites.unshift({ date: new Date().toISOString().split('T')[0], action, automatique, canal });
    saveLeads(leads);
  }
}

export function updateLeadStatut(leadId: string, nouveauStatut: CRMLead['statut']) {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
    const ancienStatut = lead.statut;
    lead.statut = nouveauStatut;
    lead.activites.unshift({
      date: new Date().toISOString().split('T')[0],
      action: `🔄 Statut : "${ancienStatut}" → "${nouveauStatut}"`,
      automatique: false,
      canal: 'systeme',
    });
    saveLeads(leads);
  }
}

export function creerLeadDepuisDevis(nom: string, email: string, valeur: number, produit?: string, telephone?: string) {
  const leads = getLeads();
  const dateAuj = new Date().toISOString().split('T')[0];
  const dateRelance = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const dateWhatsapp = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const id = `LEAD-${Date.now().toString().slice(-5)}`;

  // ✅ Lorsqu'un devis est généré sur le site, le lead démarre directement en 'devis_envoye'
  const nouveauLead: CRMLead = {
    id,
    nom,
    entreprise: 'Prospect Web',
    email,
    telephone: telephone || 'Non renseigné',
    statut: 'devis_envoye',
    valeurEstimee: valeur,
    source: 'devis_auto',
    produitInteresse: produit || 'Devis en ligne',
    dateCreation: dateAuj,
    prochainContact: dateRelance,
    sequences: [
      { id: `${id}-S1`, nom: 'Email proforma J+0', statut: 'envoyee', datePrevu: dateAuj, canal: 'email', template: 'proforma' },
      { id: `${id}-S2`, nom: 'Relance email J+2', statut: 'en_attente', datePrevu: dateRelance, canal: 'email', template: 'relance_j2' },
      { id: `${id}-S3`, nom: 'Relance WhatsApp J+5', statut: 'en_attente', datePrevu: dateWhatsapp, canal: 'whatsapp', template: 'relance' },
    ],
    activites: [
      { date: dateAuj, action: `📄 Facture Proforma générée (${valeur.toLocaleString('fr-FR')} FCFA) — statut "Devis Envoyé"`, automatique: true, canal: 'systeme' },
      { date: dateAuj, action: `📧 Facture proforma envoyée automatiquement par Email à ${email}`, automatique: true, canal: 'email' },
      ...(telephone && telephone !== 'Non renseigné'
        ? [{ date: dateAuj, action: `💬 Notification automatique WhatsApp transmise au ${telephone}`, automatique: true, canal: 'whatsapp' as const }]
        : []),
      { date: dateAuj, action: '🤖 Séquences de relances automatiques CRM activées (J+2 Email · J+5 WhatsApp)', automatique: true, canal: 'systeme' },
    ],
  };
  leads.unshift(nouveauLead);
  saveLeads(leads);

  return nouveauLead;
}

export function ajouterLeadManuellement(data: Partial<CRMLead>): CRMLead {
  const leads = getLeads();
  const dateAuj = new Date().toISOString().split('T')[0];
  const dateJ2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const dateJ5 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const dateJ7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const id = `LEAD-${Date.now().toString().slice(-5)}`;

  const lead: CRMLead = {
    id,
    nom: data.nom || '',
    entreprise: data.entreprise || '',
    email: data.email || '',
    telephone: data.telephone || '',
    statut: 'nouveau',
    valeurEstimee: data.valeurEstimee || 0,
    source: data.source || 'site_web',
    produitInteresse: data.produitInteresse || '',
    notes: data.notes || '',
    dateCreation: dateAuj,
    prochainContact: dateJ2,
    // ✅ Séquences automatiques programmées dès la création
    sequences: [
      { id: `${id}-S1`, nom: 'Email bienvenue J+0', statut: 'en_attente', datePrevu: dateAuj, canal: 'email', template: 'bienvenue' },
      { id: `${id}-S2`, nom: 'Relance email J+2', statut: 'en_attente', datePrevu: dateJ2, canal: 'email', template: 'relance_j2' },
      { id: `${id}-S3`, nom: 'WhatsApp relance J+5', statut: 'en_attente', datePrevu: dateJ5, canal: 'whatsapp', template: 'relance' },
      { id: `${id}-S4`, nom: 'Offre spéciale J+7', statut: 'en_attente', datePrevu: dateJ7, canal: 'email', template: 'relance_j7' },
    ],
    activites: [
      { date: dateAuj, action: '👤 Lead créé manuellement par le commercial', automatique: false, canal: 'systeme' },
      { date: dateAuj, action: '📧 Séquences automatiques programmées : bienvenue J+0 · relance J+2 · WhatsApp J+5 · offre J+7', automatique: true, canal: 'systeme' },
    ],
  };
  leads.unshift(lead);
  saveLeads(leads);
  return lead;
}


// =============================================
// WHATSAPP HELPERS
// =============================================
export function genererLienWhatsApp(telephone: string, template: string, variables: Record<string, string>): string {
  let message = TEMPLATES_WHATSAPP[template] || TEMPLATES_WHATSAPP.bienvenue;
  Object.entries(variables).forEach(([key, val]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), val);
  });
  const tel = telephone.replace(/[\s\+\-]/g, '');
  const telFinal = tel.startsWith('225') ? tel : `225${tel}`;
  return `https://wa.me/${telFinal}?text=${encodeURIComponent(message)}`;
}

export function getSequencesEnAttente(): { lead: CRMLead; sequence: CRMSequence }[] {
  const leads = getLeads();
  const today = new Date().toISOString().split('T')[0];
  const resultats: { lead: CRMLead; sequence: CRMSequence }[] = [];
  leads.forEach(lead => {
    lead.sequences
      .filter(s => s.statut === 'en_attente' && s.datePrevu <= today)
      .forEach(seq => resultats.push({ lead, sequence: seq }));
  });
  return resultats;
}

export function marquerSequenceEnvoyee(leadId: string, sequenceId: string, canal: CRMActivite['canal']) {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;
  const seq = lead.sequences.find(s => s.id === sequenceId);
  if (seq) {
    seq.statut = 'envoyee';
    lead.derniereRelance = new Date().toISOString().split('T')[0];
    lead.activites.unshift({
      date: new Date().toISOString().split('T')[0],
      action: `${canal === 'email' ? '📧' : '💬'} ${seq.nom} envoyé${canal === 'whatsapp' ? ' (WhatsApp)' : ' (Email)'}`,
      automatique: true,
      canal,
    });

    // ✅ Passer automatiquement de "nouveau" à "devis_envoye" quand un email est envoyé
    if (lead.statut === 'nouveau') {
      lead.statut = 'devis_envoye';
      lead.activites.unshift({
        date: new Date().toISOString().split('T')[0],
        action: '🔄 Statut mis à jour automatiquement : "Nouveau" → "Devis Envoyé"',
        automatique: true,
        canal: 'systeme',
      });
    }

    saveLeads(leads);
  }
}

// =============================================
// IMPORTATION DES PROSPECTS ISSUS DU SCRAPING
// =============================================
export function importerLeadsScrapes(prospects: Partial<CRMLead>[]): CRMLead[] {
  const leads = getLeads();
  const dateAuj = new Date().toISOString().split('T')[0];
  const ajoutes: CRMLead[] = [];

  prospects.forEach((p, index) => {
    // Éviter les doublons par email ou téléphone
    const existant = leads.find(l => 
      (p.email && l.email.toLowerCase() === p.email.toLowerCase()) ||
      (p.telephone && l.telephone.replace(/\D/g, '') === p.telephone.replace(/\D/g, ''))
    );
    if (existant) return;

    const id = `LEAD-SCRAP-${Date.now().toString().slice(-4)}${index}`;
    const nouveau: CRMLead = {
      id,
      nom: p.nom || 'Directeur Général / Gérant',
      entreprise: p.entreprise || 'Entreprise BTP',
      email: p.email || '',
      telephone: p.telephone || '',
      statut: 'nouveau',
      valeurEstimee: p.valeurEstimee || 2000000,
      source: 'scraping_btp',
      produitInteresse: p.produitInteresse || 'Préfabriqués Béton 2CGC',
      ville: p.ville || 'Côte d\'Ivoire',
      notes: p.notes || `Prospect qualifié extrait via scraping BTP (${p.ville || 'Côte d\'Ivoire'}).`,
      dateCreation: dateAuj,
      sequences: [
        {
          id: `seq-j0-${id}`,
          nom: 'Prise de contact B2B',
          statut: 'en_attente',
          datePrevu: dateAuj,
          canal: p.telephone ? 'whatsapp' : 'email',
          template: 'prospection_b2b',
        },
        {
          id: `seq-j3-${id}`,
          nom: 'Relance catalogue & tarifs B2B',
          statut: 'en_attente',
          datePrevu: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          canal: 'email',
          template: 'relance_j2',
        },
      ],
      activites: [
        {
          date: dateAuj,
          action: `🔍 Prospect BTP extrait et importé dans le CRM (${p.ville || 'CI'})`,
          automatique: true,
          canal: 'systeme',
        },
      ],
    };
    leads.unshift(nouveau);
    ajoutes.push(nouveau);
  });

  if (ajoutes.length > 0) {
    saveLeads(leads);
  }
  return ajoutes;
}

// =============================================
// ENREGISTREMENT OU MISE À JOUR LEAD WHATSAPP
// =============================================
export function ajouterLeadDepuisWhatsApp(params: {
  nom?: string;
  telephone: string;
  entreprise?: string;
  email?: string;
  action: string;
  produit?: string;
  valeurEstimee?: number;
  statut?: 'nouveau' | 'contacte' | 'devis_envoye' | 'negociation' | 'gagne' | 'perdu';
}): CRMLead {
  const leads = getLeads();
  const dateAuj = new Date().toISOString().split('T')[0];
  const telClean = params.telephone.replace(/\D/g, '');

  let lead = leads.find(l => l.telephone && l.telephone.replace(/\D/g, '') === telClean);

  if (!lead) {
    const id = `LEAD-WA-${Date.now().toString().slice(-4)}`;
    lead = {
      id,
      nom: params.nom || `Client WA (${params.telephone.slice(-4)})`,
      entreprise: params.entreprise || 'Chantier BTP (WhatsApp)',
      email: params.email || '',
      telephone: params.telephone,
      statut: params.statut || 'devis_envoye',
      valeurEstimee: params.valeurEstimee || 500000,
      source: 'whatsapp',
      produitInteresse: params.produit || 'Préfabriqués Béton 2CGC',
      dateCreation: dateAuj,
      activites: [],
      sequences: [],
    };
    leads.unshift(lead);
  } else {
    if (params.statut) lead.statut = params.statut;
    if (params.valeurEstimee) lead.valeurEstimee = (lead.valeurEstimee || 0) + params.valeurEstimee;
    if (params.produit) lead.produitInteresse = params.produit;
  }

  lead.activites.unshift({
    date: dateAuj,
    action: params.action,
    automatique: true,
    canal: 'whatsapp',
  });

  saveLeads(leads);
  return lead;
}