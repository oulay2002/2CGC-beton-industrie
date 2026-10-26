// src/lib/commandes-server.ts — Écriture des commandes en base. SERVEUR UNIQUEMENT.
//
// Les commandes créées par des systèmes externes (WhatsApp Business, relais
// n8n) passaient par commandes-store.ts, qui écrit dans localStorage : côté
// serveur, l'appel ne faisait rien et la route répondait quand même « succès ».
// Une commande passée par WhatsApp n'arrivait donc jamais au chef d'usine.

import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import type { Commande, CommandeArticle } from '@/lib/commandes-store';

function client() {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurée : commandes indisponibles.');
  }
  return admin;
}

/** Crée ou met à jour une commande et ses articles. */
export async function enregistrerCommande(commande: Commande): Promise<Commande> {
  const admin = client();

  const { error } = await admin.from('commandes').upsert(
    {
      id: commande.id,
      date: commande.date,
      statut: commande.statut,
      statut_production: commande.statutProduction,
      total: commande.total,
      client_nom: commande.client.nom,
      client_entreprise: commande.client.entreprise,
      client_email: commande.client.email,
      client_telephone: commande.client.telephone,
      client_adresse: commande.client.adresse,
      chauffeur: commande.chauffeur,
      signature: commande.signature ?? null,
      date_livraison_effective: commande.dateLivraisonEffective ?? null,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Enregistrement de ${commande.id} : ${error.message}`);

  if (commande.articles?.length) {
    await admin.from('commande_articles').delete().eq('commande_id', commande.id);
    const { error: errArt } = await admin.from('commande_articles').insert(
      commande.articles.slice(0, 100).map((a) => ({
        commande_id: commande.id,
        nom: a.nom,
        quantite: a.quantite,
        prix: a.prix,
      }))
    );
    if (errArt) throw new Error(`Articles de ${commande.id} : ${errArt.message}`);
  }

  return commande;
}

/**
 * Crée une commande issue d'une conversation WhatsApp et la transmet à l'usine.
 */
export async function enregistrerCommandeWhatsApp(params: {
  clientNom?: string;
  telephone: string;
  adresse?: string;
  total: number;
  articles: CommandeArticle[];
}): Promise<Commande> {
  const dateAuj = new Date().toISOString().split('T')[0];

  const commande: Commande = {
    id: `CMD-WA-${Date.now().toString().slice(-6)}`,
    date: dateAuj,
    statut: 'nouvelle',
    statutProduction: 'a_preparer',
    total: params.total,
    client: {
      nom: params.clientNom || `Client WA (${params.telephone.slice(-4)})`,
      entreprise: 'Commande Directe WhatsApp',
      email: `${params.telephone.replace(/\D/g, '')}@whatsapp.2cgc.ci`,
      telephone: params.telephone,
      adresse: params.adresse || 'Livraison Daloa & Région',
    },
    chauffeur: null,
    articles: params.articles,
    notes: 'Commande passée en direct via WhatsApp Business',
  };

  return enregistrerCommande(commande);
}
