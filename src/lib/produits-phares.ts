// src/lib/produits-phares.ts — Les agglos mis en scene dans le hero.
//
// Les cotes, le poids et le prix sont repris a l'identique du catalogue
// (CatalogueClient.tsx, references 2, 4 et 6) : ce sont les memes produits,
// pas une seconde verite. Si le catalogue bouge, ces lignes bougent avec lui.
//
// Le nombre d'alveoles, lui, ne figure nulle part au catalogue. Il est releve
// sur les photos de production (public/images/produits/page_0_img_13.jpeg) :
// l'agglo creux de 2CGC montre trois alveoles traversantes sur une rangee.

export interface FormatAgglo {
  /** Identifiant de la reference au catalogue. */
  id: string;
  nom: string;
  nomEn: string;
  /** Libelle court du selecteur : l'epaisseur en centimetres. */
  epaisseurCm: number;
  /** Cotes en millimetres. Elles pilotent la geometrie, rien n'est arrondi. */
  longueurMm: number;
  hauteurMm: number;
  epaisseurMm: number;
  poidsKg: number;
  prixFcfa: number;
  /** Alveoles traversantes, debouchant sur les faces dessus et dessous. */
  alveoles: number;
  usage: string;
  usageEn: string;
}

export const FORMATS_AGGLO: FormatAgglo[] = [
  {
    id: '2',
    nom: 'Agglo 20 creux',
    nomEn: 'Hollow block 20',
    epaisseurCm: 20,
    longueurMm: 450,
    hauteurMm: 200,
    epaisseurMm: 200,
    poidsKg: 18,
    prixFcfa: 470,
    alveoles: 3,
    usage: 'Murs porteurs et élévations',
    usageEn: 'Load-bearing walls',
  },
  {
    id: '4',
    nom: 'Agglo 15 creux',
    nomEn: 'Hollow block 15',
    epaisseurCm: 15,
    longueurMm: 450,
    hauteurMm: 200,
    epaisseurMm: 150,
    poidsKg: 16,
    prixFcfa: 330,
    alveoles: 3,
    usage: 'Murs de refend et cloisons épaisses',
    usageEn: 'Partition and cross walls',
  },
  {
    id: '6',
    nom: 'Agglo 12 creux',
    nomEn: 'Hollow block 12',
    epaisseurCm: 12,
    longueurMm: 450,
    hauteurMm: 200,
    epaisseurMm: 120,
    poidsKg: 14,
    prixFcfa: 300,
    alveoles: 3,
    usage: 'Cloisons de distribution',
    usageEn: 'Interior partitions',
  },
];
