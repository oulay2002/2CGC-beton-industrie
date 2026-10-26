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

// Les jeux de donnees de demonstration (COMMANDES_MOCK, BONS_COMMANDE_MOCK,
// BONS_LIVRAISON_MOCK) ont ete retires : commandes et bons sont desormais lus
// en base via /api/commandes, filtres selon la session. Ils n etaient plus
// references, et leur presence dans un module client les expediait dans le
// bundle de chaque visiteur.

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
  /** Adresse de livraison de reference, reprise par defaut sur les bons. */
  adresse?: string;
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
  adresse?: string | null;
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
    adresse: ligne.adresse ?? undefined,
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

  // Seul le dirigeant peut lister les comptes. On ne vide pas l'état dans un
  // effet : la restriction est portée par getUtilisateurs, qui dérive la valeur
  // du rôle courant. Un effet qui appelle setState déclenche un rendu en
  // cascade pour rien.
  useEffect(() => {
    if (user?.role === 'dirigeant') {
      // set-state-in-effect : faux positif. rafraichirUtilisateurs est
      // asynchrone — le setState survient après résolution du fetch, ce qui
      // est le motif « s'abonner à un système externe » que la règle autorise.
      // L'analyse statique ne distingue pas les deux cas.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void rafraichirUtilisateurs();
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

  // Le cloisonnement est porte ici plutot que par un vidage de l'etat :
  // un non-dirigeant ne voit jamais la liste, meme si un rendu precedent
  // l'avait chargee.
  const getUtilisateurs = useCallback(
    () => (user?.role === 'dirigeant' ? comptes : []),
    [comptes, user]
  );

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
