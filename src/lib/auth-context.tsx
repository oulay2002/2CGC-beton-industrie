"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

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


// Base de données mockée avec 4 rôles distincts
const UTILISATEURS_MOCK = [
  // 👤 CLIENT B2B 1
  {
    email: 'client@btp-afrique.com',
    password: 'client123',
    nom: 'M. Koné',
    entreprise: 'BTP Afrique SARL',
    telephone: '+225 07 12 34 56',
    role: 'client' as UserRole,
    pointsFidelite: 2450,
    tarifSpecial: 10,
    dateCreation: '2026-01-15',
  },
  // 👤 CLIENT B2B 2
  {
    email: 'fatou.traore@ivoire-promo.ci',
    password: 'client123',
    nom: 'Mme Traoré Fatou',
    entreprise: 'Ivoire Promotion Immobilière',
    telephone: '+225 05 44 33 22',
    role: 'client' as UserRole,
    pointsFidelite: 1800,
    tarifSpecial: 8,
    dateCreation: '2026-02-10',
  },
  // 👤 CLIENT B2B 3
  {
    email: 'mamadou.diop@batir-plus.ci',
    password: 'client123',
    nom: 'M. Diop Mamadou',
    entreprise: 'Bâtir Plus International',
    telephone: '+225 01 23 45 67',
    role: 'client' as UserRole,
    pointsFidelite: 4200,
    tarifSpecial: 12,
    dateCreation: '2026-03-01',
  },
  // 👤 CLIENT B2B 4
  {
    email: 'kouame.yao@gr-ci.com',
    password: 'client123',
    nom: 'M. Yao Kouamé',
    entreprise: 'Génie Route CI',
    telephone: '+225 07 88 99 00',
    role: 'client' as UserRole,
    pointsFidelite: 950,
    tarifSpecial: 5,
    dateCreation: '2026-04-18',
  },
  // 👔 DIRIGEANT — DG
  {
    email: 'directeur@2cgc.ci',
    password: 'directeur123',
    nom: 'KEITA BOUBACAR',
    entreprise: '2CGC — Cheickna Construction & Génie Civil',
    telephone: '+225 07 07 62 17 99',
    role: 'dirigeant' as UserRole,
    dateCreation: '2026-01-01',
  },
  // 🏭 CHEF D'USINE
  {
    email: 'usine@beton-industrie.com',
    password: 'usine123',
    nom: 'M. Diallo',
    entreprise: 'Beton Industrie - Usine',
    telephone: '+225 01 00 00 02',
    role: 'chef_usine' as UserRole,
    dateCreation: '2026-01-01',
  },
  // 🚚 CHAUFFEUR
  {
    email: 'chauffeur@beton-industrie.com',
    password: 'chauffeur123',
    nom: 'M. Kouadio',
    entreprise: 'Beton Industrie - Logistique',
    telephone: '+225 07 99 88 77',
    role: 'chauffeur' as UserRole,
    vehicule: 'Camion Volvo FH16',
    permis: 'AB-1234-CD',
    dateCreation: '2026-01-01',
  },
  // 👔 DIRIGEANT 2 — Keita Dambou
  {
    email: 'keita.dambou@2cgc.ci',
    password: 'directeur123',
    nom: 'Keita Dambou',
    entreprise: '2CGC — Cheickna Construction & Génie Civil',
    telephone: '+225 07 07 85 76 29',
    role: 'dirigeant' as UserRole,
    dateCreation: '2026-01-01',
  },
];

// Commandes mockées avec statuts détaillés
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

// =============================================
// GESTION DYNAMIQUE DES UTILISATEURS
// =============================================
const STORAGE_KEY = 'users_2cgc_v1';

export interface CompteUtilisateur {
  email: string;
  password: string;
  nom: string;
  entreprise: string;
  telephone: string;
  role: UserRole;
  pointsFidelite?: number;
  tarifSpecial?: number;
  vehicule?: string;
  permis?: string;
  dateCreation: string;
  creeParDirigeant?: boolean;
}

function getUtilisateurs(): CompteUtilisateur[] {
  if (typeof window === 'undefined') return UTILISATEURS_MOCK as CompteUtilisateur[];
  const saved = localStorage.getItem(STORAGE_KEY);
  const dynamiques: CompteUtilisateur[] = saved ? JSON.parse(saved) : [];
  // Fusionner les comptes mock statiques + les comptes créés dynamiquement
  const emailsDynamiques = new Set(dynamiques.map(u => u.email));
  const statiques = (UTILISATEURS_MOCK as CompteUtilisateur[]).filter(u => !emailsDynamiques.has(u.email));
  return [...statiques, ...dynamiques];
}

function sauvegarderUtilisateur(compte: CompteUtilisateur) {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem(STORAGE_KEY);
  const dynamiques: CompteUtilisateur[] = saved ? JSON.parse(saved) : [];
  // Ne pas dupliquer
  const filtres = dynamiques.filter(u => u.email !== compte.email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtres, compte]));

  const client = isSupabaseConfigured() ? supabase : null;
  if (client) {
    client.from('profiles').upsert({
      email: compte.email,
      nom: compte.nom,
      entreprise: compte.entreprise,
      telephone: compte.telephone,
      role: compte.role,
      points_fidelite: compte.pointsFidelite || 0,
      tarif_special: compte.tarifSpecial || 0,
      vehicule: compte.vehicule || null,
      permis: compte.permis || null,
    }).then(({ error }) => {
      if (error) console.error('Erreur sync Supabase profile:', error);
    });
  }
}

export function genererMotDePasse(nom: string): string {
  const initiales = nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const chiffres = Math.floor(100 + Math.random() * 900);
  const lettres = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `2CGC-${initiales}${lettres}${chiffres}`;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; role?: UserRole };
  logout: () => void;
  register: (data: Omit<CompteUtilisateur, 'dateCreation'>) => { success: boolean; error?: string };
  creerUtilisateur: (data: Omit<CompteUtilisateur, 'dateCreation' | 'creeParDirigeant'>) => { success: boolean; error?: string };
  importerUtilisateurs: (comptes: CompteUtilisateur[]) => { ajoutes: number; ignores: number };
  getUtilisateurs: () => CompteUtilisateur[];
  supprimerUtilisateur: (email: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_beton');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): { success: boolean; role?: UserRole } => {
    const tous = getUtilisateurs();
    const utilisateur = tous.find(u => u.email === email && u.password === password);
    if (utilisateur) {
      const { password: _, ...userWithoutPassword } = utilisateur;
      setUser(userWithoutPassword);
      localStorage.setItem('user_beton', JSON.stringify(userWithoutPassword));
      // Cookie de session pour le middleware Next.js
      if (typeof document !== 'undefined') {
        document.cookie = `beton_session_role=${utilisateur.role}; path=/; max-age=86400; SameSite=Lax`;
      }
      return { success: true, role: utilisateur.role };
    }
    return { success: false };
  };

  const register = (data: Omit<CompteUtilisateur, 'dateCreation'>): { success: boolean; error?: string } => {
    const tous = getUtilisateurs();
    if (tous.find(u => u.email === data.email)) {
      return { success: false, error: 'Un compte avec cet email existe déjà.' };
    }
    const compte: CompteUtilisateur = { ...data, dateCreation: new Date().toISOString().split('T')[0] };
    sauvegarderUtilisateur(compte);
    return { success: true };
  };

  const creerUtilisateur = (data: Omit<CompteUtilisateur, 'dateCreation' | 'creeParDirigeant'>): { success: boolean; error?: string } => {
    const tous = getUtilisateurs();
    if (tous.find(u => u.email === data.email)) {
      return { success: false, error: 'Un compte avec cet email existe déjà.' };
    }
    const compte: CompteUtilisateur = {
      ...data,
      dateCreation: new Date().toISOString().split('T')[0],
      creeParDirigeant: true,
    };
    sauvegarderUtilisateur(compte);
    return { success: true };
  };

  const importerUtilisateurs = (nouveaux: CompteUtilisateur[]): { ajoutes: number; ignores: number } => {
    if (typeof window === 'undefined') return { ajoutes: 0, ignores: 0 };
    const saved = localStorage.getItem(STORAGE_KEY);
    const dynamiques: CompteUtilisateur[] = saved ? JSON.parse(saved) : [];
    const emailsExistants = new Set([...UTILISATEURS_MOCK.map(u => u.email.toLowerCase()), ...dynamiques.map(u => u.email.toLowerCase())]);

    const aInserer: CompteUtilisateur[] = [];
    let ignores = 0;

    nouveaux.forEach(c => {
      const emailLower = c.email.toLowerCase();
      if (emailsExistants.has(emailLower)) {
        ignores++;
      } else {
        emailsExistants.add(emailLower);
        aInserer.push({
          ...c,
          creeParDirigeant: true,
          dateCreation: c.dateCreation || new Date().toISOString().split('T')[0],
        });
        sauvegarderUtilisateur(c);
      }
    });

    if (aInserer.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...dynamiques, ...aInserer]));
    }

    return { ajoutes: aInserer.length, ignores };
  };

  const supprimerUtilisateur = (email: string) => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    const dynamiques: CompteUtilisateur[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamiques.filter(u => u.email !== email)));

    const client = isSupabaseConfigured() ? supabase : null;
    if (client) {
      client.from('profiles').delete().eq('email', email).then(({ error }) => {
        if (error) console.error('Erreur suppression Supabase profile:', error);
      });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_beton');
    if (typeof document !== 'undefined') {
      document.cookie = 'beton_session_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, register, creerUtilisateur, importerUtilisateurs,
      getUtilisateurs, supprimerUtilisateur, isLoading,
    }}>
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


// ============================================================
// DONNÉES MOCK - Bons de commande (espace client)
// ============================================================
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