// src/lib/commandes-store.ts — Accès aux commandes depuis le navigateur.
//
// Avant : les commandes étaient lues dans localStorage, amorcées avec un jeu de
// données de démonstration. Chaque poste voyait donc ses propres commandes, et
// un client connecté depuis un autre appareil ne retrouvait rien.
//
// Désormais : la source de vérité est la table `commandes`, et ce module n'est
// qu'une façade sur /api/commandes, qui filtre selon la session (un client ne
// reçoit que les siennes, l'équipe reçoit tout). Toutes les fonctions sont donc
// asynchrones.
//
// L'écriture côté serveur (webhook WhatsApp, relais n8n) passe par
// src/lib/commandes-server.ts, pas par ce module.

export interface CommandeArticle {
  /**
   * Identifiant du produit au catalogue. Rapprocher une ligne du stock par
   * son libelle etait fragile : la moindre refonte des noms rompait le lien
   * en silence, et c'est precisement ce qui s'etait produit — aucun des sept
   * libelles du stock usine ne correspondait a un produit du catalogue.
   * Optionnel : les commandes anterieures a ce changement n'en portent pas.
   */
  produitId?: string;
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
  /** Nom affiche sur le bon de livraison. */
  chauffeur: string | null;
  /** Lien stable vers le compte : un renommage ne doit pas rompre l'affectation. */
  chauffeurEmail?: string | null;
  articles: CommandeArticle[];
  dateLivraisonEffective?: string;
  signature?: string | null;
  notes?: string;
}

const ENDPOINT = '/api/commandes';

/** Prévient les autres composants montés qu'une commande a changé. */
function notifierChangement(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('commandes_updated'));
  }
}

/**
 * Commandes visibles par la session courante.
 * Retourne [] si le service est injoignable — à l'appelant d'afficher un état
 * vide plutôt que des données inventées.
 */
export async function getCommandes(): Promise<Commande[]> {
  try {
    const res = await fetch(ENDPOINT, { credentials: 'same-origin' });
    if (!res.ok) {
      console.error(`[commandes] GET -> HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { commandes?: Commande[] };
    return data.commandes ?? [];
  } catch (err) {
    console.error('[commandes] GET', err);
    return [];
  }
}

/** Enregistre un lot de commandes. */
/**
 * Enregistre une seule commande.
 *
 * `saveCommandes` renvoyait toute la liste a chaque geste : deux postes
 * agissant en meme temps se reecrivaient mutuellement, et les signatures
 * deja enregistrees repartaient a chaque fois sur le reseau. La route faisant
 * un `upsert` par identifiant, n'envoyer que la ligne touchee suffit.
 */
export async function saveCommande(commande: Commande): Promise<boolean> {
  return saveCommandes([commande]);
}

export async function saveCommandes(commandes: Commande[]): Promise<boolean> {
  if (commandes.length === 0) return true;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandes }),
    });
    if (!res.ok) {
      console.error(`[commandes] POST -> HTTP ${res.status}`);
      return false;
    }
    notifierChangement();
    return true;
  } catch (err) {
    console.error('[commandes] POST', err);
    return false;
  }
}

/** Met à jour une commande (statut, chauffeur, signature, livraison…). */
export async function updateStatutCommande(
  id: string,
  updates: Partial<Commande>
): Promise<Commande | null> {
  const commandes = await getCommandes();
  const existante = commandes.find((c) => c.id === id);
  if (!existante) return null;

  const majour = { ...existante, ...updates };
  const ok = await saveCommandes([majour]);
  return ok ? majour : null;
}

/** Crée une commande issue d'un devis accepté. */
export async function ajouterCommandeDepuisDevis(params: {
  id?: string;
  total: number;
  client: { nom: string; entreprise?: string; email: string; telephone: string; adresse: string };
  articles: CommandeArticle[];
}): Promise<Commande> {
  const commande: Commande = {
    id: params.id || `CMD-2026-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
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

  await saveCommandes([commande]);
  return commande;
}

/**
 * Crée une commande issue d'une conversation WhatsApp, depuis le navigateur
 * (conversion d'un lead par le dirigeant). Le pendant serveur, déclenché par
 * le webhook, vit dans commandes-server.ts.
 */
export async function ajouterCommandeDepuisWhatsApp(params: {
  clientNom?: string;
  telephone: string;
  adresse?: string;
  total: number;
  articles: CommandeArticle[];
}): Promise<Commande> {
  const commande: Commande = {
    id: `CMD-WA-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
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

  await saveCommandes([commande]);
  return commande;
}
