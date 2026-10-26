// src/lib/commandes-store.ts — Gestionnaire centralisé et réactif des commandes 2CGC

import { COMMANDES_MOCK } from './auth-context';

export interface CommandeArticle {
  nom: string;
  quantite: number;
  prix: number;
}

export interface Commande {
  id: string;
  date: string;
  statut: 'nouvelle' | 'preparation' | 'en_cours' | 'livree' | 'annulee';
  statutProduction: 'a_preparer' | 'en_cours' | 'prete' | 'terminee';
  total: number;
  client: {
    nom: string;
    entreprise: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  chauffeur: string | null;
  articles: CommandeArticle[];
  dateLivraisonEffective?: string;
  signature?: string | null;
  notes?: string;
}

const STORAGE_COMMANDES_KEY = 'beton_commandes_2cgc';

export function getCommandes(): Commande[] {
  if (typeof window === 'undefined') return COMMANDES_MOCK as Commande[];
  try {
    const data = localStorage.getItem(STORAGE_COMMANDES_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_COMMANDES_KEY, JSON.stringify(COMMANDES_MOCK));
      return COMMANDES_MOCK as Commande[];
    }
    return JSON.parse(data);
  } catch {
    return COMMANDES_MOCK as Commande[];
  }
}

export function saveCommandes(commandes: Commande[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_COMMANDES_KEY, JSON.stringify(commandes));
    window.dispatchEvent(new Event('commandes_updated'));

    // La persistance passe par le serveur : le navigateur n'a plus aucun droit
    // d'ecriture direct sur Supabase (cf. migration 003).
    void fetch('/api/commandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandes }),
    }).catch((err) => console.error('Erreur persistance commandes', err));
  } catch (err) {
    console.error('Erreur sauvegarde commandes', err);
  }
}

export function ajouterCommandeDepuisDevis(params: {
  id?: string;
  total: number;
  client: { nom: string; entreprise?: string; email: string; telephone: string; adresse: string };
  articles: CommandeArticle[];
}): Commande {
  const commandes = getCommandes();
  const dateAuj = new Date().toISOString().split('T')[0];
  const ref = params.id || `CMD-2026-${Date.now().toString().slice(-4)}`;

  const nouvelleCommande: Commande = {
    id: ref,
    date: dateAuj,
    statut: 'nouvelle',
    statutProduction: 'a_preparer',
    total: params.total,
    client: {
      nom: params.client.nom,
      entreprise: params.client.entreprise || params.client.nom,
      email: params.client.email,
      telephone: params.client.telephone,
      adresse: params.client.adresse,
    },
    chauffeur: null,
    articles: params.articles,
  };

  commandes.unshift(nouvelleCommande);
  saveCommandes(commandes);
  return nouvelleCommande;
}

export function updateStatutCommande(id: string, updates: Partial<Commande>): Commande | null {
  const commandes = getCommandes();
  const idx = commandes.findIndex(c => c.id === id);
  if (idx === -1) return null;

  commandes[idx] = { ...commandes[idx], ...updates };
  saveCommandes(commandes);
  return commandes[idx];
}

export function ajouterCommandeDepuisWhatsApp(params: {
  clientNom?: string;
  telephone: string;
  adresse?: string;
  total: number;
  articles: CommandeArticle[];
}): Commande {
  const commandes = getCommandes();
  const dateAuj = new Date().toISOString().split('T')[0];
  const ref = `CMD-WA-${Date.now().toString().slice(-4)}`;

  const nouvelleCommande: Commande = {
    id: ref,
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

  commandes.unshift(nouvelleCommande);
  saveCommandes(commandes);
  return nouvelleCommande;
}

