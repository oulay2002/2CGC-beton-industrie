// src/lib/whatsapp-service.ts — Service de traitement automatique WhatsApp 2CGC

import { ajouterLeadDepuisWhatsApp } from './crm-data';
import { ajouterCommandeDepuisWhatsApp, CommandeArticle } from './commandes-store';

export interface WhatsAppIncomingMessage {
  from: string; // Ex: "+225 07 07 12 34 56" ou "2250707123456"
  senderName?: string;
  text: string;
}

export interface WhatsAppResponsePayload {
  success: boolean;
  intent: 'devis' | 'proforma' | 'commande' | 'information';
  replyText: string;
  leadId?: string;
  commandeId?: string;
  proformaUrl?: string;
  totalTTC?: number;
}

// Catalogue des tarifs de référence 2CGC (HT)
const TARIFS_PREFABRIQUES: Record<string, { nom: string; prix: number; unite: string }> = {
  'brique_15': { nom: 'Brique de 15 Creuse (15x20x50)', prix: 300, unite: 'unité' },
  'brique_20': { nom: 'Brique de 20 Creuse (20x20x50)', prix: 400, unite: 'unité' },
  'brique_12': { nom: 'Brique de 12 Creuse (12x20x50)', prix: 260, unite: 'unité' },
  'brique_10': { nom: 'Brique de 10 Creuse (10x20x50)', prix: 240, unite: 'unité' },
  'hourdis_15': { nom: 'Hourdis de 15 Français', prix: 450, unite: 'unité' },
  'hourdis_12': { nom: 'Hourdis de 12 Français', prix: 380, unite: 'unité' },
  'paves_z7': { nom: 'Pavés Z-7 (240x240x60)', prix: 7000, unite: 'm²' },
  'paves_z13': { nom: 'Pavés Z-13 (130x130x60)', prix: 6000, unite: 'm²' },
  'bordure_t2': { nom: 'Bordure T2 Routière', prix: 3500, unite: 'unité' },
};

/**
 * Analyse le texte du message et extrait les articles et quantités
 */
function extraireArticlesEtQuantites(text: string): { articles: CommandeArticle[]; totalHT: number } {
  const textLower = text.toLowerCase();
  const articles: CommandeArticle[] = [];
  let totalHT = 0;

  // Détection des nombres dans le texte
  const matches = textLower.matchAll(/(\d+)\s*(brique|agglo|hourdis|pavé|pave|bordure)?\s*(10|12|15|20|z7|z-7|z13|z-13|t2)?/g);

  for (const match of matches) {
    const qte = parseInt(match[1], 10);
    if (isNaN(qte) || qte <= 0) continue;

    const typeStr = match[2] || '';
    const dimStr = (match[3] || '').replace('-', '');

    let key = 'brique_15'; // Produit par défaut si non spécifié
    if (typeStr.includes('hourdis') || textLower.includes('hourdis')) {
      key = dimStr === '12' ? 'hourdis_12' : 'hourdis_15';
    } else if (typeStr.includes('pav') || textLower.includes('pave') || textLower.includes('pavé')) {
      key = dimStr === 'z13' ? 'paves_z13' : 'paves_z7';
    } else if (typeStr.includes('bordure') || textLower.includes('bordure')) {
      key = 'bordure_t2';
    } else {
      if (dimStr === '20') key = 'brique_20';
      else if (dimStr === '12') key = 'brique_12';
      else if (dimStr === '10') key = 'brique_10';
      else key = 'brique_15';
    }

    const refProd = TARIFS_PREFABRIQUES[key];
    const sousTotal = qte * refProd.prix;

    // Éviter d'ajouter plusieurs fois le même produit si la regex match plusieurs patterns
    const existant = articles.find(a => a.nom === refProd.nom);
    if (!existant) {
      articles.push({
        nom: refProd.nom,
        quantite: qte,
        prix: refProd.prix,
      });
      totalHT += sousTotal;
    }
  }

  // Si aucun nombre spécifique n'a été extrait, mettre un forfait d'exemple par défaut
  if (articles.length === 0) {
    const qteParDefaut = 1000;
    const refDefault = TARIFS_PREFABRIQUES['brique_15'];
    articles.push({
      nom: refDefault.nom,
      quantite: qteParDefaut,
      prix: refDefault.prix,
    });
    totalHT = qteParDefaut * refDefault.prix;
  }

  return { articles, totalHT };
}

/**
 * Traite un message WhatsApp entrant et déclenche l'automatisation CRM + Chef d'Usine
 */
export async function traiterMessageWhatsAppEntrant(
  payload: WhatsAppIncomingMessage
): Promise<WhatsAppResponsePayload> {
  const textLower = payload.text.toLowerCase();
  const dateAuj = new Date().toLocaleDateString('fr-FR');
  const telephone = payload.from;

  // Détection de l'intention
  const isCommande = textLower.includes('commander') || textLower.includes('valider') || textLower.includes('achat') || textLower.includes('passer commande');
  const isProforma = textLower.includes('proforma') || textLower.includes('facture proforma') || textLower.includes('bon proforma');
  const isDevis = textLower.includes('devis') || textLower.includes('prix') || textLower.includes('tarif') || textLower.includes('combien');

  const intent = isCommande ? 'commande' : (isProforma ? 'proforma' : (isDevis ? 'devis' : 'information'));

  const { articles, totalHT } = extraireArticlesEtQuantites(payload.text);
  const tva = Math.round(totalHT * 0.18);
  const totalTTC = totalHT + tva;

  let replyText = '';
  let leadId = '';
  let commandeId = '';

  if (isCommande) {
    // 🚚 PASSATION DE COMMANDE DIRECTE
    const commande = ajouterCommandeDepuisWhatsApp({
      clientNom: payload.senderName || `Client WA (${telephone.slice(-4)})`,
      telephone,
      total: totalTTC,
      articles,
    });
    commandeId = commande.id;

    // Enregistrement dans le CRM
    const lead = ajouterLeadDepuisWhatsApp({
      nom: payload.senderName,
      telephone,
      valeurEstimee: totalTTC,
      produit: articles.map(a => `${a.quantite}x ${a.nom}`).join(', '),
      statut: 'gagne',
      action: `🎉 Commande validée en direct via WhatsApp (${commande.id}) — Montant : ${totalTTC.toLocaleString('fr-FR')} FCFA. Transmise au Chef d'Usine !`,
    });
    leadId = lead.id;

    replyText = `✅ *COMMANDE CONFIRMÉE — 2CGC DALOA*
    
Bonjour ${payload.senderName || 'cher client'} 👋

Votre commande a été enregistrée avec succès !
🆔 *Réf Commande :* \`${commande.id}\`
📅 *Date :* ${dateAuj}

📋 *Articles réservés :*
${articles.map(a => `• ${a.quantite.toLocaleString('fr-FR')} ${a.nom} à ${(a.prix * a.quantite).toLocaleString('fr-FR')} FCFA HT`).join('\n')}

💰 *Montant HT :* ${totalHT.toLocaleString('fr-FR')} FCFA
🧾 *TVA (18%) :* ${tva.toLocaleString('fr-FR')} FCFA
💵 *TOTAL TTC :* *${totalTTC.toLocaleString('fr-FR')} FCFA*

🏭 *STATUT PRODUCTION :* Transmis au Chef d'Usine à Daloa. Vos produits sont en cours de chargement / préparation.

📞 Pour la livraison ou toute précision :
Tél Direction : +225 07 07 62 17 99 / +225 07 07 85 76 29
_Merci de votre confiance en 2CGC !_`;

  } else if (isProforma || isDevis) {
    // 📝 GÉNÉRATION DE DEVIS / PROFORMA AUTOMATIQUE
    const lead = ajouterLeadDepuisWhatsApp({
      nom: payload.senderName,
      telephone,
      valeurEstimee: totalTTC,
      produit: articles.map(a => `${a.quantite}x ${a.nom}`).join(', '),
      statut: 'devis_envoye',
      action: `📝 Devis / Proforma automatique généré et transmis sur WhatsApp — Total : ${totalTTC.toLocaleString('fr-FR')} FCFA`,
    });
    leadId = lead.id;

    const refProforma = `PRO-WA-${Date.now().toString().slice(-4)}`;

    replyText = `📄 *PROFORMA AUTOMATIQUE — 2CGC CHEICKNA*
    
Bonjour ${payload.senderName || 'cher bâtisseur'} 👋
Voici votre estimation instantanée pour vos travaux BTP à Daloa :

🆔 *N° Proforma :* \`${refProforma}\`
📅 *Valable jusqu'au :* ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('fr-FR')}

📋 *Détail des matériaux :*
${articles.map(a => `• ${a.quantite.toLocaleString('fr-FR')} ${a.nom} : ${(a.prix * a.quantite).toLocaleString('fr-FR')} FCFA HT`).join('\n')}

----------------------------------
💰 *Total HT :* ${totalHT.toLocaleString('fr-FR')} FCFA
🧾 *TVA (18%) :* ${tva.toLocaleString('fr-FR')} FCFA
⭐️ *NET À PAYER TTC :* *${totalTTC.toLocaleString('fr-FR')} FCFA*
----------------------------------

✨ *Avantages 2CGC inclus :*
✓ Résistance mécanique certifiée B50 / B60
✓ Arêtes nettes & calibrage robotisé
✓ Facture officielle avec mentions fiscales (RCCM & CC N° 8104005 C)

💬 *Pour confirmer votre commande :*
Répondez simplement *"Commander ${refProforma}"* ou contactez nos dirigeants au +225 07 07 62 17 99.`;

  } else {
    // ℹ️ ASSISTANCE GÉNÉRALE & INFORMATION
    replyText = `👋 *BIENVENUE CHEZ 2CGC BTP DALOA*
    
Je suis le service automatisé 2CGC. Comment puis-je vous aider ?

Vous pouvez me demander directement :
1️⃣ *"Un devis pour 2000 briques de 15"*
2️⃣ *"Une proforma pour 300m² de pavés Z-7"*
3️⃣ *"Commander 500 hourdis de 15"*

📞 *Assistance directe Direction :*
+225 07 07 62 17 99 / +225 07 07 85 76 29
📍 Usine & Siège : Quartier Commerce (Réf. Pharmacie Appaul), Daloa`;
  }

  return {
    success: true,
    intent,
    replyText,
    leadId,
    commandeId,
    totalTTC,
  };
}
