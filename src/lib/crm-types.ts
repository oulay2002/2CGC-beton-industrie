// src/lib/crm-types.ts — Modèle du pipeline commercial et gabarits de messages.
//
// Ce module est pur : aucun accès réseau, aucun accès base, aucun `window`.
// Il est donc importable indifféremment depuis le navigateur et depuis les
// route handlers. Les accès aux données vivent dans :
//   - src/lib/crm-server.ts : lecture/écriture base (service_role, serveur)
//   - src/lib/crm-data.ts   : appels à /api/prospects (navigateur)

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
// HELPERS PURS
// =============================================

/**
 * Identifiant métier lisible, repris dans les emails et les échanges WhatsApp.
 *
 * La version précédente concaténait 5 chiffres d'horodatage et UN chiffre
 * aléatoire : deux leads créés dans la même milliseconde n'avaient que dix
 * identifiants possibles. Comme cet identifiant est la clé primaire de
 * `prospects_crm`, une collision ne levait aucune erreur — l'upsert écrasait
 * le lead existant. L'import en masse depuis l'annuaire, qui crée les leads en
 * boucle, perdait donc des prospects en silence.
 *
 * On garde un préfixe temporel pour l'ordre de lecture, suivi de cinq
 * caractères tirés au sort dans un alphabet sans I, O, 0 ni 1 : l'identifiant
 * est dicté au téléphone et recopié à la main.
 */
export function genererIdLead(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const octets = new Uint8Array(5);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(octets);
  } else {
    for (let i = 0; i < octets.length; i++) octets[i] = Math.floor(Math.random() * 256);
  }

  const suffixe = Array.from(octets)
    .map((o) => alphabet[o % alphabet.length])
    .join('');

  // Base 36 sur l'horodatage : compact, et les identifiants restent triables.
  const horodatage = Date.now().toString(36).toUpperCase().slice(-4);

  return `LEAD-${horodatage}${suffixe}`;
}

function jourISO(decalageJours = 0): string {
  return new Date(Date.now() + decalageJours * 86400000).toISOString().split('T')[0];
}

/** Lien WhatsApp pré-rempli à partir d'un gabarit et de ses variables. */
export function genererLienWhatsApp(
  telephone: string,
  template: string,
  variables: Record<string, string>
): string {
  let message = TEMPLATES_WHATSAPP[template] || TEMPLATES_WHATSAPP.bienvenue;
  Object.entries(variables).forEach(([key, val]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), val);
  });
  const tel = telephone.replace(/[\s+\-]/g, '');
  const telFinal = tel.startsWith('225') ? tel : `225${tel}`;
  return `https://wa.me/${telFinal}?text=${encodeURIComponent(message)}`;
}

/**
 * Construit un lead issu d'un devis généré en ligne, séquences de relance
 * comprises. Fonction pure : l'enregistrement est à la charge de l'appelant.
 */
export function construireLeadDepuisDevis(params: {
  nom: string;
  email: string;
  valeur: number;
  produit?: string;
  telephone?: string;
}): CRMLead {
  const { nom, email, valeur, produit, telephone } = params;
  const id = genererIdLead();
  const dateAuj = jourISO();
  const dateJ2 = jourISO(2);
  const dateJ5 = jourISO(5);

  return {
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
    prochainContact: dateJ2,
    sequences: [
      { id: `${id}-S1`, nom: 'Email proforma J+0', statut: 'envoyee', datePrevu: dateAuj, canal: 'email', template: 'proforma' },
      { id: `${id}-S2`, nom: 'Relance email J+2', statut: 'en_attente', datePrevu: dateJ2, canal: 'email', template: 'relance_j2' },
      { id: `${id}-S3`, nom: 'Relance WhatsApp J+5', statut: 'en_attente', datePrevu: dateJ5, canal: 'whatsapp', template: 'relance' },
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
}

/** Construit un lead saisi à la main par un commercial, séquences comprises. */
export function construireLeadManuel(data: Partial<CRMLead>): CRMLead {
  const id = genererIdLead();
  const dateAuj = jourISO();
  const dateJ2 = jourISO(2);
  const dateJ5 = jourISO(5);
  const dateJ7 = jourISO(7);

  return {
    id,
    nom: data.nom || '',
    entreprise: data.entreprise || '',
    email: data.email || '',
    telephone: data.telephone || '',
    statut: data.statut || 'nouveau',
    valeurEstimee: data.valeurEstimee || 0,
    source: data.source || 'site_web',
    produitInteresse: data.produitInteresse || '',
    ville: data.ville,
    notes: data.notes || '',
    dateCreation: dateAuj,
    prochainContact: dateJ2,
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
}

/** Construit un lead issu d'une conversation WhatsApp. */
export function construireLeadWhatsApp(params: {
  nom?: string;
  telephone: string;
  valeurEstimee?: number;
  produit?: string;
  statut?: CRMLead['statut'];
  action?: string;
}): CRMLead {
  const id = genererIdLead();
  const dateAuj = jourISO();

  return {
    id,
    nom: params.nom || `Client WA (${params.telephone.slice(-4)})`,
    entreprise: 'Client WhatsApp',
    email: '',
    telephone: params.telephone,
    statut: params.statut || 'contacte',
    valeurEstimee: params.valeurEstimee || 0,
    source: 'whatsapp',
    produitInteresse: params.produit || 'Matériaux BTP',
    dateCreation: dateAuj,
    sequences: [],
    activites: [
      {
        date: dateAuj,
        action: params.action || '💬 Premier contact établi sur WhatsApp',
        automatique: true,
        canal: 'whatsapp',
      },
    ],
  };
}

/** Séquences dues à ce jour, tous leads confondus. */
export function sequencesEnAttente(
  leads: CRMLead[]
): { lead: CRMLead; sequence: CRMSequence }[] {
  const today = jourISO();
  const resultats: { lead: CRMLead; sequence: CRMSequence }[] = [];

  for (const lead of leads) {
    for (const sequence of lead.sequences) {
      if (sequence.statut === 'en_attente' && sequence.datePrevu <= today) {
        resultats.push({ lead, sequence });
      }
    }
  }

  return resultats;
}

/**
 * Corrige le statut d'un lead resté à « nouveau » alors que la réalité du
 * dossier a déjà avancé. Retourne le lead corrigé, ou null s'il était déjà
 * cohérent — ce qui permet à l'appelant de n'écrire que les leads modifiés.
 *
 * L'ancienne règle basculait en « Devis Envoyé » dès qu'une activité contenait
 * le mot « Email ». Comme la création d'un lead programme et envoie un email de
 * bienvenue, tout nouveau prospect y basculait aussitôt : la colonne « Nouveau »
 * restait vide en permanence, et « Devis Envoyé » comptait des prospects à qui
 * rien n'avait été chiffré. On distingue désormais les deux faits :
 *   - un devis ou une proforma réellement émis  → devis_envoye
 *   - un simple contact (bienvenue, relance)    → contacte
 */
export function corrigerStatutIncoherent(lead: CRMLead): CRMLead | null {
  if (lead.statut !== 'nouveau') return null;

  const aRecuUnDevis =
    lead.source === 'devis_auto' ||
    lead.sequences.some((s) => s.statut === 'envoyee' && s.template === 'proforma') ||
    lead.activites.some((a) => /proforma|facture|devis/i.test(a.action));

  const aEteContacte =
    lead.activites.some((a) => a.canal === 'email' || a.canal === 'whatsapp' || a.canal === 'telephone') ||
    lead.sequences.some((s) => s.statut === 'envoyee');

  const nouveauStatut: CRMLead['statut'] | null = aRecuUnDevis
    ? 'devis_envoye'
    : aEteContacte
      ? 'contacte'
      : null;

  if (!nouveauStatut) return null;

  const libelle = nouveauStatut === 'devis_envoye' ? 'Devis Envoyé' : 'Contacté';

  return {
    ...lead,
    statut: nouveauStatut,
    activites: [
      {
        date: new Date().toISOString().split('T')[0],
        action: `🔄 Statut mis à jour automatiquement : "Nouveau" → "${libelle}"`,
        automatique: true,
        canal: 'systeme',
      },
      ...lead.activites,
    ],
  };
}
