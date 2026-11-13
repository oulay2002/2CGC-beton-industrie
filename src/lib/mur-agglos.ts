// src/lib/mur-agglos.ts — Monter un pan de mur en agglos.
//
// Le hero montre un bloc seul, puis le meme bloc appareille en mur. Ce
// module pose l'appareil : des rangs a joints croises, ou un rang sur deux
// demarre par un demi-bloc, comme on les monte sur un chantier. Un mur dont
// les joints seraient alignes se verrait au premier coup d'oeil, et un
// fabricant de prefabriques n'a pas le droit de le montrer.
//
// Le panneau par defaut compte dix agglos, ce qui n'est pas un hasard :
// joints compris, un agglo de 450 x 200 couvre 0,1 m2. Dix agglos font donc
// exactement un metre carre de mur — le seul chiffre qu'un macon demande.

import { JOINT_MM, type GeometrieAgglo } from './catalogue-agglos.ts';

/** Un element pose dans le mur. */
export interface PieceMur {
  /** Coin haut-gauche dans le repere du panneau, en mm, y vers le bas. */
  x: number;
  y: number;
  longueurMm: number;
  /** Demi-bloc de chainage, en bout de rang impair. */
  demi: boolean;
  /** Rang, compte depuis le haut. */
  rang: number;
  /** Bout de rang : le flanc est visible, il faut le dessiner. */
  bordGauche: boolean;
  bordDroit: boolean;
}

export interface Panneau {
  pieces: PieceMur[];
  largeurMm: number;
  hauteurMm: number;
  epaisseurMm: number;
  rangs: number;
  /** Agglos entiers consommes par le panneau. */
  agglos: number;
  /** Mur couvert par ce panneau, joints compris, en metres carres. */
  surfaceM2: number;
}

/**
 * Appareille un panneau a joints croises.
 *
 * @param format  Le format d'agglo, tel qu'il sort du catalogue.
 * @param rangs   Hauteur du panneau, en nombre de rangs.
 * @param parRang Largeur du panneau, en blocs entiers.
 * @param joint   Epaisseur du joint de mortier, en millimetres.
 */
export function monterLeMur(
  format: GeometrieAgglo,
  rangs = 5,
  parRang = 2,
  joint = JOINT_MM,
): Panneau {
  const L = format.longueurMm;
  const H = format.hauteurMm;

  const largeurMm = parRang * L + (parRang - 1) * joint;
  const hauteurMm = rangs * H + (rangs - 1) * joint;

  // Le demi-bloc perd la moitie d'un joint de chaque cote de la coupe, sans
  // quoi le rang croise depasserait le rang droit.
  const demi = (L - joint) / 2;

  const pieces: PieceMur[] = [];

  for (let rang = 0; rang < rangs; rang += 1) {
    const y = rang * (H + joint);
    const croise = rang % 2 === 1;

    const longueurs: number[] = croise
      ? [demi, ...Array.from({ length: parRang - 1 }, () => L), demi]
      : Array.from({ length: parRang }, () => L);

    let x = 0;
    longueurs.forEach((longueurMm, i) => {
      pieces.push({
        x,
        y,
        longueurMm,
        demi: longueurMm !== L,
        rang,
        bordGauche: i === 0,
        bordDroit: i === longueurs.length - 1,
      });
      x += longueurMm + joint;
    });
  }

  return {
    pieces,
    largeurMm,
    hauteurMm,
    epaisseurMm: format.epaisseurMm,
    rangs,
    agglos: rangs * parRang,
    // Chaque agglo emporte son joint : c'est cette surface-la qu'on couvre.
    surfaceM2: (rangs * parRang * (L + joint) * (H + joint)) / 1e6,
  };
}
