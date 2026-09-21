import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ajouterLeadDepuisWhatsApp } from '@/lib/crm-data';
import { ajouterCommandeDepuisWhatsApp, CommandeArticle } from '@/lib/commandes-store';

// Clé d'API partagée entre le Workflow n8n (Hostinger) et la plateforme 2CGC
const API_KEY_AUTORISEE = process.env.N8N_RELAY_API_KEY || '2cgc_n8n_secret_key_2026';

/**
 * Comparaison sécurisée à temps constant pour prévenir les attaques temporelles
 */
function isKeyValid(providedKey: string | null): boolean {
  if (!providedKey) return false;
  try {
    const a = Buffer.from(providedKey);
    const b = Buffer.from(API_KEY_AUTORISEE);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface N8NRelayPayload {
  action: 'devis' | 'proforma' | 'commande' | 'information';
  client: {
    nom?: string;
    telephone: string;
    adresse?: string;
  };
  articles: CommandeArticle[];
  totalHT: number;
  tva?: number;
  totalTTC: number;
  notesAgentIA?: string;
}

/**
 * POST /api/whatsapp/n8n-relay
 * Reçoit les demandes qualifiées par l'Agent IA Conversationnel de n8n
 * et déclenche automatiquement l'intégration CRM + Chef d'Usine 2CGC.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Vérification sécurisée à temps constant de la clé d'API
    const apiKey = req.headers.get('x-2cgc-api-key') || req.headers.get('authorization')?.replace('Bearer ', '') || null;
    
    if (!isKeyValid(apiKey)) {
      console.warn('⚠️ Tentative d\'accès non autorisée à /api/whatsapp/n8n-relay');
      return NextResponse.json({ error: 'Accès non autorisé. Clé API invalide.' }, { status: 401 });
    }

    const body: N8NRelayPayload = await req.json();

    if (!body.client || !body.client.telephone) {
      return NextResponse.json({ error: 'Le champ client.telephone est requis.' }, { status: 400 });
    }

    const telephone = body.client.telephone;
    const clientNom = body.client.nom || `Client WA (${telephone.slice(-4)})`;
    const action = body.action || 'devis';
    const articles = body.articles || [];
    const totalTTC = body.totalTTC || 0;
    const descriptionProduits = articles.map(a => `${a.quantite}x ${a.nom}`).join(', ') || 'Matériaux BTP';

    let leadId = '';
    let commandeId = '';
    let responseMessage = '';

    if (action === 'commande') {
      // 🏭 1. CREATION DE LA COMMANDE POUR LE CHEF D'USINE
      const nouvelleCommande = ajouterCommandeDepuisWhatsApp({
        clientNom,
        telephone,
        adresse: body.client.adresse,
        total: totalTTC,
        articles,
      });
      commandeId = nouvelleCommande.id;

      // 📊 2. MISE A JOUR DU CRM DIRIGEANT (STATUT: GAGNÉ)
      const lead = ajouterLeadDepuisWhatsApp({
        nom: clientNom,
        telephone,
        valeurEstimee: totalTTC,
        produit: descriptionProduits,
        statut: 'gagne',
        action: `🤖 Agent IA n8n (Hostinger) : Commande directe passée sur WhatsApp (${commandeId}) — Montant : ${totalTTC.toLocaleString('fr-FR')} FCFA. Relayé au Chef d'Usine à Daloa.`,
      });
      leadId = lead.id;

      responseMessage = `Commande ${commandeId} enregistrée avec succès. Relayée au Chef d'Usine pour préparation.`;

    } else {
      // 📝 DEVIS OU PROFORMA (STATUT CRM: DEVIS ENVOYÉ)
      const lead = ajouterLeadDepuisWhatsApp({
        nom: clientNom,
        telephone,
        valeurEstimee: totalTTC,
        produit: descriptionProduits,
        statut: 'devis_envoye',
        action: `📝 Agent IA n8n (Hostinger) : Proforma/Devis WhatsApp transmis au client pour un montant de ${totalTTC.toLocaleString('fr-FR')} FCFA.`,
      });
      leadId = lead.id;

      responseMessage = `Lead CRM mis à jour pour ${clientNom} (${action.toUpperCase()}).`;
    }

    return NextResponse.json({
      success: true,
      actionProcessed: action,
      leadId,
      commandeId: commandeId || null,
      message: responseMessage,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Erreur lors du traitement du relais n8n :', error);
    return NextResponse.json({
      error: 'Erreur interne lors de la prise en compte de la demande n8n',
      details: error.message,
    }, { status: 500 });
  }
}
