// src/lib/catalogue-agglos.ts — Les agglos du catalogue, et leur volume.
//
// Ces dix references vivaient en ligne dans CatalogueClient. Le hero les
// montre maintenant en trois dimensions, et deux listes de produits qui
// doivent concorder finissent toujours par diverger : elles sont donc ici,
// lues par le catalogue comme par le hero.
//
// La geometrie 3D se deduit des memes lignes — `specs.dimensions` et
// `specs.poids` sont analyses, non recopies. Seuls les alveoles s'ajoutent :
// ils ne figurent pas au catalogue et sont releves sur les photos de
// production (public/images/produits/).

export interface ProduitCatalogue {
  id: string;
  categorie: string;
  image: string;
  nom: string;
  description: string;
  prix: number;
  unite: string;
  specs: { dimensions: string; poids: string };
}

export const AGGLOS_CATALOGUE: ProduitCatalogue[] = [
  { id: "1", categorie: "agglos", image: "/images/produits/page_0_img_12.jpeg", nom: "Brique 20 Pleine", description: "Brique pleine robuste pour murs porteurs et fondations.", prix: 570, unite: "unité", specs: { dimensions: "450x200x200mm", poids: "36 kg" } },
  { id: "2", categorie: "agglos", image: "/images/produits/page_0_img_13.jpeg", nom: "Brique 20 Creuse", description: "Brique creuse pour cloisons et murs d'élévation.", prix: 470, unite: "unité", specs: { dimensions: "450x200x200mm", poids: "18 kg" } },
  { id: "3", categorie: "agglos", image: "/images/produits/page_0_img_14.jpeg", nom: "Brique 15 Pleine", description: "Brique pleine pour murs intermédiaires renforcés.", prix: 460, unite: "unité", specs: { dimensions: "450x150x200mm", poids: "28 kg" } },
  { id: "4", categorie: "agglos", image: "/images/produits/page_0_img_15.jpeg", nom: "Brique 15 Creuse", description: "Brique creuse légère et polyvalente.", prix: 330, unite: "unité", specs: { dimensions: "450x150x200mm", poids: "16 kg" } },
  { id: "5", categorie: "agglos", image: "/images/produits/page_1_img_12.jpeg", nom: "Brique 12 Pleine", description: "Brique pleine fine pour cloisons phoniques.", prix: 430, unite: "unité", specs: { dimensions: "450x120x200mm", poids: "20 kg" } },
  { id: "6", categorie: "agglos", image: "/images/produits/page_1_img_13.jpeg", nom: "Brique 12 Creuse", description: "Brique creuse fine économique.", prix: 300, unite: "unité", specs: { dimensions: "450x120x200mm", poids: "14 kg" } },
  { id: "7", categorie: "agglos", image: "/images/produits/page_1_img_14.jpeg", nom: "Brique 10 Creuse", description: "Brique creuse très fine pour doublages.", prix: 260, unite: "unité", specs: { dimensions: "450x100x200mm", poids: "12 kg" } },

  // Agglos double alvéoles — relevé client du 27/10/2026 (Keita Briques).
  // Dimensions, prix et poids communiqués par le client.
  { id: "27", categorie: "agglos", image: "/images/produits/agglo-double-20.jpg", nom: "Agglo 20 Double Alvéoles", description: "Agglo à double rangée d'alvéoles, format porteur.", prix: 485, unite: "unité", specs: { dimensions: "450x200x200mm", poids: "20 kg" } },
  { id: "26", categorie: "agglos", image: "/images/produits/agglo-double-15.jpg", nom: "Agglo 15 Double Alvéoles", description: "Agglo à double rangée d'alvéoles pour murs d'élévation.", prix: 320, unite: "unité", specs: { dimensions: "450x150x200mm", poids: "16 kg" } },
  { id: "25", categorie: "agglos", image: "/images/produits/agglo-double-12.jpg", nom: "Agglo 12 Double Alvéoles", description: "Agglo à double rangée d'alvéoles, format mince pour cloisons.", prix: 285, unite: "unité", specs: { dimensions: "450x120x200mm", poids: "14 kg" } },
];

/**
 * Epaisseur du joint de mortier, en millimetres.
 *
 * Un centimetre et demi, usage courant en Cote d'Ivoire. C'est ce joint qui
 * fait qu'un agglo de 450 x 200 couvre 0,1 m2 de mur, et donc qu'il en faut
 * dix au metre carre.
 */
export const JOINT_MM = 15;

export type TypeAgglo = 'creux' | 'plein' | 'double';

export interface GeometrieAgglo {
  id: string;
  nom: string;
  nomEn: string;
  type: TypeAgglo;
  /** Libelle du selecteur : l'epaisseur en centimetres. */
  epaisseurCm: number;
  /** Cotes en millimetres, analysees depuis le catalogue. */
  longueurMm: number;
  hauteurMm: number;
  epaisseurMm: number;
  poidsKg: number;
  prixFcfa: number;
  /** Alveoles traversantes par rangee, et nombre de rangees. */
  alveoles: number;
  rangees: number;
  usage: string;
  usageEn: string;
}

/**
 * Analyse une cote du catalogue, ecrite « 450x200x200mm ».
 *
 * L'ordre du catalogue est longueur, epaisseur, hauteur : un « agglo 15 »
 * porte 450x150x200, et c'est bien son epaisseur qui vaut 150.
 */
export function analyserCotes(
  dimensions: string,
): { longueurMm: number; epaisseurMm: number; hauteurMm: number } | null {
  const m = /^(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*mm$/i.exec(dimensions.trim());
  if (!m) return null;
  return {
    longueurMm: Number(m[1]),
    epaisseurMm: Number(m[2]),
    hauteurMm: Number(m[3]),
  };
}

/** Analyse un poids du catalogue, ecrit « 18 kg ». `NC` ne vaut rien. */
export function analyserPoids(poids: string): number | null {
  const m = /^([\d.,]+)\s*kg$/i.exec(poids.trim());
  if (!m) return null;
  const v = Number(m[1].replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

/**
 * Ce que le catalogue ne dit pas : la forme interieure du bloc.
 *
 * Un agglo creux de 2CGC montre trois alveoles sur une rangee ; le double
 * alveoles, trois sur deux rangees ; le plein, aucune. Releve sur les photos
 * de production, et sur rien d'autre.
 */
const FORMES: Record<string, { type: TypeAgglo; alveoles: number; rangees: number }> = {
  '1': { type: 'plein', alveoles: 0, rangees: 0 },
  '2': { type: 'creux', alveoles: 3, rangees: 1 },
  '3': { type: 'plein', alveoles: 0, rangees: 0 },
  '4': { type: 'creux', alveoles: 3, rangees: 1 },
  '5': { type: 'plein', alveoles: 0, rangees: 0 },
  '6': { type: 'creux', alveoles: 3, rangees: 1 },
  '7': { type: 'creux', alveoles: 3, rangees: 1 },
  '25': { type: 'double', alveoles: 3, rangees: 2 },
  '26': { type: 'double', alveoles: 3, rangees: 2 },
  '27': { type: 'double', alveoles: 3, rangees: 2 },
};

// Ces libelles sont lus par le client, pas par un developpeur : ils portent
// leurs accents, a la difference des commentaires de ce depot.
const USAGES: Record<string, { fr: string; en: string }> = {
  plein: { fr: 'Murs porteurs et fondations', en: 'Load-bearing walls and foundations' },
  creux: { fr: "Murs d'élévation et cloisons", en: 'Elevation walls and partitions' },
  double: { fr: 'Double rangée, meilleure isolation', en: 'Double cell row, better insulation' },
};

const NOMS_EN: Record<TypeAgglo, string> = {
  plein: 'Solid block',
  creux: 'Hollow block',
  double: 'Double-cell block',
};

/**
 * Les agglos pris sous l'angle du volume, tries du plus epais au plus mince.
 *
 * Une reference dont la cote ou le poids ne s'analysent pas est ecartee :
 * mieux vaut un format de moins qu'un bloc faux.
 */
export const AGGLOS_3D: GeometrieAgglo[] = AGGLOS_CATALOGUE.flatMap((p) => {
  const forme = FORMES[p.id];
  const cotes = analyserCotes(p.specs.dimensions);
  const poids = analyserPoids(p.specs.poids);
  if (!forme || !cotes || poids === null) return [];

  return [
    {
      id: p.id,
      nom: `Agglo ${Math.round(cotes.epaisseurMm / 10)} ${
        forme.type === 'double' ? 'double alvéoles' : forme.type
      }`,
      nomEn: `${NOMS_EN[forme.type]} ${Math.round(cotes.epaisseurMm / 10)}`,
      type: forme.type,
      epaisseurCm: Math.round(cotes.epaisseurMm / 10),
      ...cotes,
      poidsKg: poids,
      prixFcfa: p.prix,
      alveoles: forme.alveoles,
      rangees: forme.rangees,
      usage: USAGES[forme.type].fr,
      usageEn: USAGES[forme.type].en,
    },
  ];
}).sort((a, b) => b.epaisseurMm - a.epaisseurMm || a.type.localeCompare(b.type));

/** Combien d'agglos couvrent un metre carre de mur, joints compris. */
export function agglosParM2(format: GeometrieAgglo, joint = JOINT_MM): number {
  const surface = ((format.longueurMm + joint) * (format.hauteurMm + joint)) / 1e6;
  return surface > 0 ? 1 / surface : 0;
}
