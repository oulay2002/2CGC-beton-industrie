import { supabase, isSupabaseConfigured } from './client';
import { Commande, CommandeArticle } from '../commandes-store';

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

/**
 * Charge les commandes depuis Supabase avec leurs articles associés
 */
export async function fetchCommandesFromSupabase(): Promise<Commande[] | null> {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return null;

  try {
    const { data: rawCmds, error: errCmds } = await client
      .from('commandes')
      .select('*')
      .order('created_at', { ascending: false });

    if (errCmds || !rawCmds) {
      console.error('Erreur fetchCommandesFromSupabase:', errCmds);
      return null;
    }

    const { data: rawArticles } = await client.from('commande_articles').select('*');
    const articlesMap = new Map<string, CommandeArticle[]>();

    if (rawArticles) {
      rawArticles.forEach((art: any) => {
        const list = articlesMap.get(art.commande_id) || [];
        list.push({ nom: art.nom, quantite: art.quantite, prix: Number(art.prix) });
        articlesMap.set(art.commande_id, list);
      });
    }

    return rawCmds.map((c: any) => ({
      id: c.id,
      date: c.date,
      statut: c.statut,
      statutProduction: c.statut_production,
      total: Number(c.total),
      client: {
        nom: c.client_nom,
        entreprise: c.client_entreprise,
        email: c.client_email,
        telephone: c.client_telephone,
        adresse: c.client_adresse,
      },
      chauffeur: c.chauffeur,
      signature: c.signature,
      dateLivraisonEffective: c.date_livraison_effective,
      articles: articlesMap.get(c.id) || [],
    }));
  } catch (err) {
    console.error('Erreur inattendue fetchCommandesFromSupabase:', err);
    return null;
  }
}

/**
 * Charge les stocks de matières premières depuis Supabase
 */
export async function fetchStocksMatieresFromSupabase(): Promise<StockMatiere[] | null> {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return null;

  try {
    const { data, error } = await client.from('stocks_matieres').select('*');
    if (error || !data) return null;

    return data.map((s: any) => ({
      id: s.id,
      nom: s.nom,
      quantiteTonnes: Number(s.quantite_tonnes),
      capaciteMaxTonnes: Number(s.capacite_max_tonnes),
      seuilCritiqueTonnes: Number(s.seuil_critique_tonnes),
      unite: s.unite,
      fournisseur: s.fournisseur,
      consommationMoyenne: s.consommation_moyenne,
    }));
  } catch (err) {
    console.error('Erreur fetchStocksMatieresFromSupabase:', err);
    return null;
  }
}

/**
 * Sauvegarde la mise à jour d'un stock de matière première dans Supabase
 */
export async function updateStockMatiereSupabase(id: string, nouvelleQuantiteTonnes: number): Promise<boolean> {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return false;

  const { error } = await client
    .from('stocks_matieres')
    .update({ quantite_tonnes: nouvelleQuantiteTonnes, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) console.error('Erreur updateStockMatiereSupabase:', error);
  return !error;
}

/**
 * Charge les prospects du CRM depuis Supabase
 */
export async function fetchProspectsCRMFromSupabase(): Promise<ProspectCRM[] | null> {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('prospects_crm')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((p: any) => ({
      id: p.id,
      entreprise: p.entreprise,
      nomContact: p.nom_contact,
      email: p.email,
      telephone: p.telephone,
      statut: p.statut,
      canalOrigine: p.canal_origine,
      valeurEstimee: Number(p.valeur_estimee),
      notes: p.notes,
      dateCreation: p.created_at,
    }));
  } catch (err) {
    console.error('Erreur fetchProspectsCRMFromSupabase:', err);
    return null;
  }
}

/**
 * Enregistre ou met à jour un prospect CRM dans Supabase
 */
export async function saveProspectCRMToSupabase(prospect: ProspectCRM): Promise<boolean> {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return false;

  const payload: any = {
    entreprise: prospect.entreprise,
    nom_contact: prospect.nomContact,
    email: prospect.email,
    telephone: prospect.telephone,
    statut: prospect.statut,
    canal_origine: prospect.canalOrigine || 'Site Web',
    valeur_estimee: prospect.valeurEstimee || 0,
    notes: prospect.notes || '',
  };

  if (prospect.id) payload.id = prospect.id;

  const { error } = await client.from('prospects_crm').upsert(payload);
  if (error) console.error('Erreur saveProspectCRMToSupabase:', error);
  return !error;
}

/**
 * Abonnement Realtime WebSocket global aux tables Supabase
 */
export function subscribeToRealtimeChanges(
  onCommandesChange?: () => void,
  onStocksChange?: () => void,
  onCRMChange?: () => void
) {
  const client = isSupabaseConfigured() ? supabase : null;
  if (!client) return () => {};

  const channel = client
    .channel('2cgc-realtime-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'commandes' },
      () => onCommandesChange && onCommandesChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stocks_matieres' },
      () => onStocksChange && onStocksChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'prospects_crm' },
      () => onCRMChange && onCRMChange()
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
