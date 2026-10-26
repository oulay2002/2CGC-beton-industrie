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

/** Prospects du pipeline commercial. Reserve au dirigeant. */
export async function fetchProspectsCRM(): Promise<ProspectCRM[] | null> {
  const data = await getJson<{ prospects: ProspectCRM[] }>('/api/prospects');
  return data?.prospects ?? null;
}

/** Cree ou met a jour un prospect. Reserve au dirigeant. */
export async function saveProspectCRM(prospect: ProspectCRM): Promise<boolean> {
  return sendJson('/api/prospects', 'POST', prospect);
}
