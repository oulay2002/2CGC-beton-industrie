"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import posthog from 'posthog-js';

export type UserRole = 'client' | 'dirigeant' | 'chef_usine' | 'chauffeur';

export interface User {
  email: string;
  nom: string;
  entreprise: string;
  telephone: string;
  role: UserRole;
  // Spécifique client
  pointsFidelite?: number;
  tarifSpecial?: number;
  // Spécifique chauffeur
  vehicule?: string;
  permis?: string;
}

// ============================================================
// NOTE DE SÉCURITÉ
// ------------------------------------------------------------
// Ce fichier contenait auparavant UTILISATEURS_MOCK : la liste des comptes
// 2CGC avec leurs mots de passe en clair. Étant dans un module client, elle
// était livrée dans le bundle JS de chaque visiteur du site. La vérification
// du mot de passe se faisait elle aussi ici, côté navigateur, où n'importe qui
// peut la contourner.
//
// Les comptes vivent désormais dans la table `profiles`, le mot de passe n'y
// figure que sous forme d'empreinte scrypt, et toute vérification se fait dans
// /api/auth/login côté serveur. Ce contexte ne fait plus que relayer les
// appels et conserver l'état d'affichage.
// ============================================================

export const COMMANDES_MOCK = [
  {
    id: 'CMD-2026-001',
    date: '2026-09-10',
    statut: 'livree',
    statutProduction: 'terminee',
    total: 485000,
    client: { nom: 'M. Koné', entreprise: 'BTP Afrique SARL', email: 'client@btp-afrique.com', telephone: '+225 07 12 34 56', adresse: 'Zone Industrielle, Abidjan' },
    chauffeur: 'M. Kouadio',
    articles: [
      { nom: 'Agglo 20x20x50 Plein', quantite: 200, prix: 1200 },
      { nom: 'Pavé Autobloquant 20x10x8', quantite: 500, prix: 600 },
    ],
  },
  {
    id: 'CMD-2026-002',
    date: '2026-09-12',
    statut: 'en_cours',
    statutProduction: 'prete',
    total: 1250000,
    client: { nom: 'M. Koné', entreprise: 'BTP Afrique SARL', email: 'client@btp-afrique.com', telephone: '+225 07 12 34 56', adresse: 'Zone Industrielle, Abidjan' },
    chauffeur: 'M. Kouadio',
    articles: [
      { nom: 'Bordure T2 100x25x15', quantite: 100, prix: 5500 },
      { nom: 'Agglo 15x20x50 Creux', quantite: 300, prix: 950 },
    ],
  },
  {
    id: 'CMD-2026-003',
    date: '2026-09-13',
    statut: 'preparation',
    statutProduction: 'en_cours',
    total: 1850000,
    client: { nom: 'Mme Traoré Fatou', entreprise: 'Ivoire Promotion Immobilière', email: 'fatou.traore@ivoire-promo.ci', telephone: '+225 05 44 33 22', adresse: 'Cocody Riviera 3, Abidjan' },
    chauffeur: null,
    articles: [
      { nom: 'Pavé Hollandais 20x10x6', quantite: 2500, prix: 450 },
      { nom: 'Agglo 20x20x50 Plein', quantite: 600, prix: 1200 },
    ],
  },
  {
    id: 'CMD-2026-004',
    date: '2026-09-14',
    statut: 'nouvelle',
    statutProduction: 'a_preparer',
    total: 3200000,
    client: { nom: 'M. Diop Mamadou', entreprise: 'Bâtir Plus International', email: 'mamadou.diop@batir-plus.ci', telephone: '+225 01 23 45 67', adresse: 'Zone Portuaire, San Pedro' },
    chauffeur: null,
    articles: [
      { nom: 'Agglo 20x20x50 Plein', quantite: 1500, prix: 1200 },
      { nom: 'Bordure T2 100x25x15', quantite: 250, prix: 5600 },
    ],
  },
  {
    id: 'CMD-2026-005',
    date: '2026-09-15',
    statut: 'en_cours',
    statutProduction: 'terminee',
    total: 980000,
    client: { nom: 'M. Yao Kouamé', entreprise: 'Génie Route CI', email: 'kouame.yao@gr-ci.com', telephone: '+225 07 88 99 00', adresse: 'Bouaké Quartier Commerce' },
    chauffeur: 'M. Kouadio',
    articles: [
      { nom: 'Pavé Autobloquant 20x10x8', quantite: 1400, prix: 700 },
    ],
  },
  {
    id: 'CMD-2026-006',
    date: '2026-09-15',
    statut: 'livree',
    statutProduction: 'terminee',
    total: 650000,
    client: { nom: 'Mme Traoré Fatou', entreprise: 'Ivoire Promotion Immobilière', email: 'fatou.traore@ivoire-promo.ci', telephone: '+225 05 44 33 22', adresse: 'Cocody Riviera 3, Abidjan' },
    chauffeur: 'M. Kouadio',
    articles: [
      { nom: 'Agglo 15x20x50 Creux', quantite: 500, prix: 950 },
      { nom: 'Hourdis 16x20x57', quantite: 200, prix: 875 },
    ],
  },
];

// Redirection selon le rôle
const ROUTES_PAR_ROLE: Record<UserRole, string> = {
  client: '/client',
  dirigeant: '/dirigeant',
  chef_usine: '/usine',
  chauffeur: '/chauffeur',
};

/**
 * Compte tel que manipulé par l'interface d'administration.
 * Ne porte JAMAIS de mot de passe : le serveur n'en restitue aucun.
 */
export interface CompteUtilisateur {
  email: string;
  nom: string;
  entreprise: string;
  telephone: string;
  role: UserRole;
  pointsFidelite?: number;
  tarifSpecial?: number;
  vehicule?: string;
  permis?: string;
  dateCreation?: string;
  creeParDirigeant?: boolean;
}

/** Données de création d'un compte : le mot de passe ne transite que vers le serveur. */
export interface NouveauCompte extends CompteUtilisateur {
  motDePasse: string;
}

/**
 * Génère un mot de passe initial lisible. Il n'est affiché qu'une seule fois,
 * au moment de la création : le serveur n'en conserve que l'empreinte.
 */
export function genererMotDePasse(nom: string): string {
  const initiales =
    nom
      .split(/\s+/)
      .filter(Boolean)
      .map((mot) => mot[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'XX';

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  const octets = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(octets);
  } else {
    for (let i = 0; i < octets.length; i++) octets[i] = Math.floor(Math.random() * 256);
  }
  const aleatoire = Array.from(octets)
    .map((o) => alphabet[o % alphabet.length])
    .join('');

  return `2CGC-${initiales}${aleatoire}`;
}

export interface ResultatAction {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    requiredMode?: 'client' | 'equipe'
  ) => Promise<{ success: boolean; role?: UserRole; error?: string; doitChangerMotDePasse?: boolean }>;
  logout: () => void;
  register: (data: NouveauCompte) => Promise<ResultatAction>;
  creerUtilisateur: (data: NouveauCompte) => Promise<ResultatAction>;
  importerUtilisateurs: (comptes: NouveauCompte[]) => Promise<{ ajoutes: number; ignores: number }>;
  getUtilisateurs: () => CompteUtilisateur[];
  rafraichirUtilisateurs: () => Promise<void>;
  supprimerUtilisateur: (email: string) => Promise<ResultatAction>;
  mettreAJourMotDePasse: (email: string, nouveauMDP: string) => Promise<ResultatAction>;
  mettreAJourUtilisateur: (email: string, donnees: Partial<CompteUtilisateur>) => Promise<ResultatAction>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST
);

function identifyUser(user: User) {
  const distinctId = user.email.trim().toLowerCase();
  if (!isPostHogConfigured || !distinctId) return;

  posthog.identify(distinctId, {
    email: user.email,
    name: user.nom,
    role: user.role,
    company: user.entreprise,
  });
}

function resetPostHog() {
  if (isPostHogConfigured) {
    posthog.reset();
  }
}

/** Ligne `profiles` telle que renvoyée par l'API. */
interface LigneProfil {
  email: string;
  nom?: string | null;
  entreprise?: string | null;
  telephone?: string | null;
  role: UserRole;
  points_fidelite?: number | null;
  tarif_special?: number | null;
  vehicule?: string | null;
  permis?: string | null;
}

function versCompte(ligne: LigneProfil): CompteUtilisateur {
  return {
    email: ligne.email,
    nom: ligne.nom ?? '',
    entreprise: ligne.entreprise ?? '',
    telephone: ligne.telephone ?? '',
    role: ligne.role,
    pointsFidelite: ligne.points_fidelite ?? undefined,
    tarifSpecial: ligne.tarif_special ?? undefined,
    vehicule: ligne.vehicule ?? undefined,
    permis: ligne.permis ?? undefined,
  };
}

async function lireErreur(res: Response, defaut: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === 'string' ? data.error : defaut;
  } catch {
    return defaut;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [comptes, setComptes] = useState<CompteUtilisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restauration de session : la source de vérité est le cookie HttpOnly
  // vérifié par le serveur, et non plus le localStorage, que l'utilisateur
  // peut éditer à volonté.
  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!annule && res.ok) {
          const data = await res.json();
          if (data?.authenticated && data.user) {
            const restaure: User = {
              email: data.user.email,
              nom: data.user.nom ?? '',
              entreprise: '',
              telephone: '',
              role: data.user.role,
            };
            setUser(restaure);
            identifyUser(restaure);
          }
        }
      } catch {
        // Hors ligne ou service indisponible : on reste déconnecté.
      } finally {
        if (!annule) setIsLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, []);

  const rafraichirUtilisateurs = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles', { credentials: 'same-origin' });
      if (!res.ok) return; // 403 pour un non-dirigeant : comportement attendu
      const data = await res.json();
      if (Array.isArray(data?.profiles)) {
        setComptes(data.profiles.map(versCompte));
      }
    } catch (err) {
      console.error('Erreur chargement des comptes:', err);
    }
  }, []);

  // Seul le dirigeant peut lister les comptes.
  useEffect(() => {
    if (user?.role === 'dirigeant') {
      void rafraichirUtilisateurs();
    } else {
      setComptes([]);
    }
  }, [user, rafraichirUtilisateurs]);

  const login = useCallback(
    async (email: string, password: string, requiredMode?: 'client' | 'equipe') => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, motDePasse: password, mode: requiredMode }),
        });

        if (!res.ok) {
          return { success: false, error: await lireErreur(res, 'Identifiants incorrects.') };
        }

        const data = await res.json();
        const connecte: User = data.user;

        if (user && user.email.toLowerCase() !== connecte.email.toLowerCase()) {
          resetPostHog();
        }

        setUser(connecte);
        identifyUser(connecte);

        return {
          success: true,
          role: connecte.role,
          doitChangerMotDePasse: Boolean(data.doitChangerMotDePasse),
        };
      } catch (err) {
        console.error('Erreur de connexion:', err);
        return { success: false, error: 'Service de connexion injoignable. Vérifiez votre réseau.' };
      }
    },
    [user]
  );

  const enregistrerCompte = useCallback(
    async (data: NouveauCompte): Promise<ResultatAction> => {
      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          return { success: false, error: await lireErreur(res, 'Échec de la création du compte.') };
        }

        await rafraichirUtilisateurs();
        return { success: true };
      } catch (err) {
        console.error('Erreur création compte:', err);
        return { success: false, error: 'Service injoignable.' };
      }
    },
    [rafraichirUtilisateurs]
  );

  const register = useCallback(
    (data: NouveauCompte) => enregistrerCompte(data),
    [enregistrerCompte]
  );

  const creerUtilisateur = useCallback(
    (data: NouveauCompte) => enregistrerCompte(data),
    [enregistrerCompte]
  );

  const importerUtilisateurs = useCallback(
    async (nouveaux: NouveauCompte[]): Promise<{ ajoutes: number; ignores: number }> => {
      let ajoutes = 0;
      let ignores = 0;

      for (const compte of nouveaux) {
        const res = await enregistrerCompte(compte);
        if (res.success) ajoutes++;
        else ignores++;
      }

      await rafraichirUtilisateurs();
      return { ajoutes, ignores };
    },
    [enregistrerCompte, rafraichirUtilisateurs]
  );

  const getUtilisateurs = useCallback(() => comptes, [comptes]);

  const supprimerUtilisateur = useCallback(
    async (email: string): Promise<ResultatAction> => {
      try {
        const res = await fetch(`/api/profiles?email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          return { success: false, error: await lireErreur(res, 'Échec de la suppression.') };
        }
        await rafraichirUtilisateurs();
        return { success: true };
      } catch (err) {
        console.error('Erreur suppression compte:', err);
        return { success: false, error: 'Service injoignable.' };
      }
    },
    [rafraichirUtilisateurs]
  );

  const mettreAJourMotDePasse = useCallback(
    async (email: string, nouveauMDP: string): Promise<ResultatAction> => {
      try {
        const res = await fetch('/api/profiles/password', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nouveauMotDePasse: nouveauMDP }),
        });
        if (!res.ok) {
          return { success: false, error: await lireErreur(res, 'Échec de la réinitialisation.') };
        }
        return { success: true };
      } catch (err) {
        console.error('Erreur réinitialisation mot de passe:', err);
        return { success: false, error: 'Service injoignable.' };
      }
    },
    []
  );

  const mettreAJourUtilisateur = useCallback(
    async (email: string, donnees: Partial<CompteUtilisateur>): Promise<ResultatAction> => {
      const existant = comptes.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (!existant) return { success: false, error: 'Compte introuvable.' };

      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existant, ...donnees, email: existant.email }),
        });
        if (!res.ok) {
          return { success: false, error: await lireErreur(res, 'Échec de la mise à jour.') };
        }
        await rafraichirUtilisateurs();
        return { success: true };
      } catch (err) {
        console.error('Erreur mise à jour compte:', err);
        return { success: false, error: 'Service injoignable.' };
      }
    },
    [comptes, rafraichirUtilisateurs]
  );

  const logout = useCallback(() => {
    if (user) resetPostHog();

    setUser(null);
    setComptes([]);
    if (typeof document !== 'undefined') {
      document.cookie = 'beton_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' }).catch(console.error);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        creerUtilisateur,
        importerUtilisateurs,
        getUtilisateurs,
        rafraichirUtilisateurs,
        supprimerUtilisateur,
        mettreAJourMotDePasse,
        mettreAJourUtilisateur,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { ROUTES_PAR_ROLE };

export const BONS_COMMANDE_MOCK = [
  {
    id: 'BC-2026-001',
    date: '2026-09-10',
    statut: 'confirmee',
    total: 485000,
    articles: [
      { nom: 'Agglo 20x20x50 Plein', quantite: 200, prix: 1200 },
      { nom: 'Pavé Autobloquant 20x10x8', quantite: 500, prix: 600 },
    ],
  },
  {
    id: 'BC-2026-002',
    date: '2026-09-12',
    statut: 'en_cours',
    total: 1250000,
    articles: [
      { nom: 'Bordure T2 100x25x15', quantite: 100, prix: 5500 },
      { nom: 'Agglo 15x20x50 Creux', quantite: 300, prix: 950 },
    ],
  },
  {
    id: 'BC-2026-003',
    date: '2026-09-13',
    statut: 'confirmee',
    total: 780000,
    articles: [
      { nom: 'Pavé Hollandais 20x10x6', quantite: 1000, prix: 450 },
      { nom: 'Agglo 20x20x50 Plein', quantite: 150, prix: 1200 },
    ],
  },
];

// ============================================================
// DONNÉES MOCK - Bons de livraison (espace client)
// ============================================================
export const BONS_LIVRAISON_MOCK = [
  {
    id: 'BL-2026-001',
    date: '2026-09-10',
    dateLivraison: '2026-09-11',
    statut: 'livre',
    chauffeur: 'M. Kouadio',
    immatriculation: 'AB-1234-CD',
    articles: [
      { nom: 'Agglo 20x20x50 Plein', quantite: 200 },
      { nom: 'Pavé Autobloquant 20x10x8', quantite: 500 },
    ],
  },
  {
    id: 'BL-2026-002',
    date: '2026-09-12',
    dateLivraison: '2026-09-13',
    statut: 'en_cours',
    chauffeur: 'M. Kouadio',
    immatriculation: 'AB-1234-CD',
    articles: [
      { nom: 'Bordure T2 100x25x15', quantite: 100 },
      { nom: 'Agglo 15x20x50 Creux', quantite: 300 },
    ],
  },
];
