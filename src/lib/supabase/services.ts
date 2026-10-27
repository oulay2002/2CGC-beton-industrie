// src/lib/supabase/services.ts — Acces aux donnees metier depuis le navigateur.
//
// Ces fonctions ne parlent plus a Supabase directement : depuis la migration
// 003, la cle anonyme n'a plus aucun droit sur les tables. Tout passe par les
// route handlers Next.js, qui verifient le cookie de session puis utilisent la
// cle service_role cote serveur.

import { Commande } from '../commandes-store';

export interface ProspectCRM {
  id?: string;
  entreprise: string;
  nomContact: string;
  email: string;
  telephone: string;
  statut: 'nouveau' | 'contacte' | 'devis_envoye' | 'negociation' | 'gagne' | 'perdu';
  canalOrigine?: string;
  valeurEstimee?: number;
  notes?: string;
  dateCreation?: string;
}

export interface StockMatiere {
  id: string;
  nom: string;
  quantiteTonnes: number;
  capaciteMaxTonnes: number;
  seuilCritiqueTonnes: number;
  unite: string;
  fournisseur: string;
  consommationMoyenne: string;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      console.error(`[services] ${url} -> HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[services] ${url}`, err);
    return null;
  }
}

async function sendJson(url: string, method: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error(`[services] ${method} ${url} -> HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error(`[services] ${method} ${url}`, err);
    return false;
  }
}

/** Commandes visibles par la session courante (filtrage cote serveur). */
export async function fetchCommandes(): Promise<Commande[] | null> {
  const data = await getJson<{ commandes: Commande[] }>('/api/commandes');
  return data?.commandes ?? null;
}

/** Stocks de matieres premieres. Reserve a l'equipe (chef d'usine, dirigeant). */
export async function fetchStocksMatieres(): Promise<StockMatiere[] | null> {
  const data = await getJson<{ stocks: StockMatiere[] }>('/api/stocks');
  return data?.stocks ?? null;
}

/** Met a jour la quantite d'une matiere premiere. */
export async function updateStockMatiere(
  id: string,
  nouvelleQuantiteTonnes: number
): Promise<boolean> {
  return sendJson('/api/stocks', 'PATCH', { id, quantiteTonnes: nouvelleQuantiteTonnes });
}

/**
 * Ajuste une matiere premiere : quantite apres inventaire, seuil d'alerte,
 * capacite du silo. Chaque champ est facultatif — deplacer un seuil ne doit
 * pas obliger a ressaisir le stock.
 */
export async function ajusterStockMatiere(
  id: string,
  champs: { quantiteTonnes?: number; seuilCritiqueTonnes?: number; capaciteMaxTonnes?: number },
): Promise<boolean> {
  return sendJson('/api/stocks', 'PATCH', { id, ...champs });
}

/** Ajuste un produit fini : quantite absolue et/ou seuil d'alerte. */
export async function ajusterStockProduit(
  produitId: string,
  champs: { quantite?: number; seuilAlerte?: number },
): Promise<boolean> {
  return sendJson('/api/stocks-produits', 'PATCH', { produitId, ...champs });
}

export interface StockProduit {
  produitId: string;
  categorie: string;
  nom: string;
  quantite: number;
  seuilAlerte: number;
}

/** Stocks de produits finis. Reserve a l'equipe de production. */
export async function fetchStocksProduits(): Promise<StockProduit[] | null> {
  const data = await getJson<{ stocks: StockProduit[] }>('/api/stocks-produits');
  return data?.stocks ?? null;
}

/** Ajoute une quantite sortie de presse, sans relire le stock courant. */
export async function ajouterStockProduit(produitId: string, ajout: number): Promise<boolean> {
  return sendJson('/api/stocks-produits', 'PATCH', { produitId, ajout });
}

export interface ChauffeurDisponible {
  email: string;
  nom: string;
  telephone?: string | null;
  vehicule?: string | null;
}

/** Chauffeurs reellement enregistres, pour l'affectation des livraisons. */
export async function fetchChauffeurs(): Promise<ChauffeurDisponible[] | null> {
  const data = await getJson<{ profiles: ChauffeurDisponible[] }>('/api/profiles?role=chauffeur');
  return data?.profiles ?? null;
}

export interface LigneBonEmis {
  produitId?: string;
  nom: string;
  quantite: number;
  prix?: number;
}

export interface ResultatEmission {
  ok: boolean;
  numero?: string;
  erreur?: string;
  manquants?: { produit_id: string; demande: number; disponible: number; motif: string }[];
}

/**
 * Emet un bon : le numero est attribue par le serveur, et le stock est
 * decremente dans la meme transaction que sa verification.
 */
export async function emettreBon(payload: {
  type: 'commande' | 'livraison';
  commandeId: string;
  client: Record<string, unknown>;
  articles: LigneBonEmis[];
  total?: number;
  chauffeur?: string;
  chauffeurEmail?: string;
  immatriculation?: string;
}): Promise<ResultatEmission> {
  try {
    const res = await fetch('/api/bons', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, erreur: data?.error ?? `HTTP ${res.status}`, manquants: data?.manquants };
    }
    return { ok: true, numero: data?.numero };
  } catch (err) {
    console.error('[bons] emission', err);
    return { ok: false, erreur: 'Service injoignable.' };
  }
}

/** Attache la signature du receptionnaire a un bon deja emis. */
export async function signerBon(numero: string, signature: string): Promise<boolean> {
  return sendJson('/api/bons', 'PATCH', { numero, signature });
}

/** Prospects du pipeline commercial. Reserve au dirigeant. */
export async function fetchProspectsCRM(): Promise<ProspectCRM[] | null> {
  const data = await getJson<{ prospects: ProspectCRM[] }>('/api/prospects');
  return data?.prospects ?? null;
}

/** Cree ou met a jour un prospect. Reserve au dirigeant. */
export async function saveProspectCRM(prospect: ProspectCRM): Promise<boolean> {
  return sendJson('/api/prospects', 'POST', prospect);
}
