// src/lib/projection-bloc.ts — Ou tombent, a l'ecran, les aretes du bloc.
//
// Le bloc du hero tourne en CSS 3D. Les cotes qui l'annotent doivent rester
// collees a ses vraies aretes, sinon elles ne cotent rien : une ligne
// « 450 mm » posee a cote de l'objet est un decor, pas une cote.
//
// On refait donc ici, en JavaScript, exactement la transformation que le
// navigateur applique au bloc — meme ordre, meme division perspective — pour
// savoir a chaque image ou se trouve l'arete a annoter. Les formules sont
// celles de CSS : `transform: rotateX(t) rotateY(r)` compose Rx * Ry, donc le
// point subit d'abord rotateY, ensuite rotateX ; l'axe y descend ; et l'oeil
// se tient en z = +perspective.
//
// Tout est pur, et libelle en pixels d'ecran : c'est testable.

/** Point dans le repere du bloc, en pixels, origine au centre du bloc. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Point2 {
  x: number;
  y: number;
}

export interface Vue {
  /** Inclinaison de la scene en radians. Negative, le dessus se devoile. */
  tilt: number;
  /** Rotation courante autour de l'axe vertical, en radians. */
  angle: number;
  /** Propriete CSS `perspective`, en pixels. */
  perspective: number;
}

/** Projete un point du bloc vers l'ecran, origine au centre de la scene. */
export function projeter(p: Vec3, vue: Vue): Vec3 {
  const cy = Math.cos(vue.angle);
  const sy = Math.sin(vue.angle);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;

  const cx = Math.cos(vue.tilt);
  const sx = Math.sin(vue.tilt);
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;

  // Division perspective. Le garde-fou evite la singularite si une arete
  // venait a passer derriere l'oeil : la scene est bien plus petite que la
  // distance focale, mais une cote qui part a l'infini ne pardonne pas.
  const k = vue.perspective / Math.max(vue.perspective - z2, 1);
  return { x: x1 * k, y: y2 * k, z: z2 };
}

/** Une cote prete a poser : la ligne, son etiquette, sa lisibilite. */
export interface Cote {
  /** Extremites de la ligne, deja ecartees du bloc. */
  depart: Point2;
  arrivee: Point2;
  /** Ou poser le nombre, plus loin encore du bloc. */
  etiquette: Point2;
  /** Longueur de la ligne a l'ecran, en pixels. */
  longueur: number;
  /** Inclinaison de la ligne, en degres, pour un `rotate()` CSS. */
  rotation: number;
  /**
   * De 0 a 1. Une arete pointee vers l'oeil se projette en quelques pixels :
   * cotee, elle mentirait sur la grandeur qu'elle annonce. On la laisse
   * disparaitre, et elle revient quand elle redevient lisible.
   */
  opacite: number;
}

export type Arete = [Vec3, Vec3];

/** Comment choisir, parmi plusieurs aretes equivalentes, celle a coter. */
export type Critere = 'plusProche' | 'plusADroite';

// Une arete se cote tant qu'elle reste franche. Deux choses la rendent
// illisible, et il faut les deux garde-fous : elle peut pointer vers l'oeil,
// auquel cas elle se tasse a une fraction d'elle-meme ; et elle peut etre
// simplement courte a l'ecran, sur un petit format ou un petit ecran.
//
// Le premier seuil se mesure donc en proportion de l'arete, non en pixels :
// un seuil absolu effacerait pour toujours la cote d'epaisseur de l'agglo 12,
// qui est pourtant la grandeur qui le distingue des autres.
const RACCOURCIE_DES = 0.33;
const FRANCHE_A = 0.48;
const COURTE_DES = 22;
const LISIBLE_A = 40;

/**
 * Retient une arete parmi les candidates, la projette et l'ecarte du bloc.
 *
 * @param candidates Aretes equivalentes du solide — les quatre aretes
 *                   verticales, par exemple. Toutes mesurent la meme chose ;
 *                   seule change celle qui tombe bien a l'ecran.
 * @param critere    `plusProche` pour une cote posee au premier plan,
 *                   `plusADroite` pour une cote posee sur la silhouette.
 * @param ecart      Distance entre l'arete et sa ligne de cote, en pixels.
 * @param ecartEtiquette Distance supplementaire pour le nombre.
 */
export function coter(
  candidates: Arete[],
  vue: Vue,
  critere: Critere,
  ecart: number,
  ecartEtiquette: number,
): Cote {
  let retenue: { a: Vec3; b: Vec3; modele: number } | null = null;
  let meilleur = -Infinity;

  for (const [p, q] of candidates) {
    const a = projeter(p, vue);
    const b = projeter(q, vue);
    const score = critere === 'plusProche' ? (a.z + b.z) / 2 : Math.max(a.x, b.x);
    if (score > meilleur) {
      meilleur = score;
      retenue = { a, b, modele: Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) };
    }
  }

  // `candidates` n'est jamais vide en pratique : le solide a toujours ses
  // douze aretes. La garde evite d'en dependre.
  if (!retenue) {
    const zero = { x: 0, y: 0 };
    return {
      depart: zero,
      arrivee: zero,
      etiquette: zero,
      longueur: 0,
      rotation: 0,
      opacite: 0,
    };
  }

  const { a, b, modele } = retenue;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueur = Math.hypot(dx, dy);

  const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const normale = normaleExterieure(dx, dy, longueur, milieu);

  const decaler = (p: Point2, d: number): Point2 => ({
    x: p.x + normale.x * d,
    y: p.y + normale.y * d,
  });

  return {
    depart: decaler({ x: a.x, y: a.y }, ecart),
    arrivee: decaler({ x: b.x, y: b.y }, ecart),
    etiquette: decaler(milieu, ecart + ecartEtiquette),
    longueur,
    rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
    opacite: lisibilite(longueur, modele),
  };
}

/**
 * Des deux perpendiculaires a l'arete, celle qui s'eloigne du centre du bloc.
 * C'est ce qui pose la cote dehors plutot que par-dessus la matiere.
 */
function normaleExterieure(
  dx: number,
  dy: number,
  longueur: number,
  milieu: Point2,
): Point2 {
  if (longueur === 0) return { x: 0, y: 1 };

  const n = { x: -dy / longueur, y: dx / longueur };
  const versLExterieur = n.x * milieu.x + n.y * milieu.y;

  // Arete passant par le centre de la scene : aucune des deux normales ne
  // s'eloigne de quoi que ce soit. On tranche vers le bas, ou une cote gene
  // le moins.
  if (Math.abs(versLExterieur) < 1e-9) {
    return n.y >= 0 ? n : { x: -n.x, y: -n.y };
  }

  return versLExterieur > 0 ? n : { x: -n.x, y: -n.y };
}

function lisibilite(projetee: number, modele: number): number {
  const franchise = modele === 0 ? 0 : projetee / modele;
  return (
    palier(franchise, RACCOURCIE_DES, FRANCHE_A) * palier(projetee, COURTE_DES, LISIBLE_A)
  );
}

/** Monte de 0 a 1 entre les deux bornes, et s'y tient au-dela. */
function palier(valeur: number, bas: number, haut: number): number {
  return Math.min(Math.max((valeur - bas) / (haut - bas), 0), 1);
}

export interface CotesBloc {
  longueur: Cote;
  hauteur: Cote;
  epaisseur: Cote;
}

/**
 * Les trois cotes d'un pave droit : sa longueur, sa hauteur, son epaisseur.
 *
 * @param l Longueur a l'ecran, en pixels (l'axe x du bloc).
 * @param h Hauteur a l'ecran, en pixels (l'axe y, oriente vers le bas).
 * @param e Epaisseur a l'ecran, en pixels (l'axe z, vers l'oeil).
 */
export function coterLeBloc(
  l: number,
  h: number,
  e: number,
  vue: Vue,
  ecart = 26,
  ecartEtiquette = 17,
): CotesBloc {
  const dx = l / 2;
  const dy = h / 2;
  const dz = e / 2;

  // La longueur se cote en bas, sur l'arete du premier plan : posee sur
  // l'arete du fond, la ligne passerait derriere le bloc.
  const longueur = coter(
    [
      [
        { x: -dx, y: dy, z: dz },
        { x: dx, y: dy, z: dz },
      ],
      [
        { x: -dx, y: dy, z: -dz },
        { x: dx, y: dy, z: -dz },
      ],
    ],
    vue,
    'plusProche',
    ecart,
    ecartEtiquette,
  );

  // La hauteur se cote sur l'arete verticale la plus a droite, c'est-a-dire
  // sur le bord de la silhouette. L'arete la plus proche, elle, tomberait au
  // milieu de l'objet des que le bloc se presente de trois quarts.
  const hauteur = coter(
    [
      [
        { x: dx, y: -dy, z: dz },
        { x: dx, y: dy, z: dz },
      ],
      [
        { x: dx, y: -dy, z: -dz },
        { x: dx, y: dy, z: -dz },
      ],
      [
        { x: -dx, y: -dy, z: dz },
        { x: -dx, y: dy, z: dz },
      ],
      [
        { x: -dx, y: -dy, z: -dz },
        { x: -dx, y: dy, z: -dz },
      ],
    ],
    vue,
    'plusADroite',
    ecart,
    ecartEtiquette,
  );

  // L'epaisseur se cote en bas egalement, sur l'arete de cote du premier plan.
  const epaisseur = coter(
    [
      [
        { x: dx, y: dy, z: -dz },
        { x: dx, y: dy, z: dz },
      ],
      [
        { x: -dx, y: dy, z: -dz },
        { x: -dx, y: dy, z: dz },
      ],
    ],
    vue,
    'plusProche',
    ecart,
    ecartEtiquette,
  );

  return { longueur, hauteur, epaisseur };
}

/**
 * Ecarte les cotes qui se marchent dessus.
 *
 * Les trois aretes cotees se rapprochent a certains angles — un agglo 12 vu
 * de trois quarts amene sa cote d'epaisseur sous celle de hauteur — et deux
 * nombres superposes ne se lisent ni l'un ni l'autre. On etablit donc un
 * ordre : la hauteur ne bouge jamais et reste toujours lisible, elle prime ;
 * la longueur ensuite ; l'epaisseur, la plus mobile, cede.
 *
 * La gene se mesure du nombre a la *ligne* d'en face autant qu'a son nombre :
 * sur un tour complet, deux etiquettes ne s'approchent jamais a moins de
 * cent pixels, alors qu'une etiquette vient se poser a quarante pixels d'un
 * trait de cote. C'est la ce qui se voyait a l'ecran.
 *
 * Elle ne disparait pas pour autant : le panneau sous le bloc porte les trois
 * cotes en toutes lettres, en permanence.
 *
 * @param distanceMin Ecart en dessous duquel deux etiquettes se genent.
 */
export function ecarterLesCotes(cotes: CotesBloc, distanceMin = 62): CotesBloc {
  // Du plus prioritaire au moins prioritaire.
  const ordre: (keyof CotesBloc)[] = ['hauteur', 'longueur', 'epaisseur'];
  const opacites: Record<string, number> = {
    hauteur: cotes.hauteur.opacite,
    longueur: cotes.longueur.opacite,
    epaisseur: cotes.epaisseur.opacite,
  };

  for (let i = 1; i < ordre.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const faible = cotes[ordre[i]];
      const fort = cotes[ordre[j]];
      // Une cote deja effacee ne gene personne.
      if (opacites[ordre[j]] === 0) continue;

      const d = Math.min(
        distanceAuSegment(faible.etiquette, fort.depart, fort.arrivee),
        Math.hypot(
          faible.etiquette.x - fort.etiquette.x,
          faible.etiquette.y - fort.etiquette.y,
        ),
      );
      if (d >= distanceMin) continue;

      opacites[ordre[i]] = Math.min(opacites[ordre[i]], (d / distanceMin) ** 2);
    }
  }

  return {
    longueur: { ...cotes.longueur, opacite: opacites.longueur },
    hauteur: { ...cotes.hauteur, opacite: opacites.hauteur },
    epaisseur: { ...cotes.epaisseur, opacite: opacites.epaisseur },
  };
}

/** Du point au segment, extremites comprises. */
function distanceAuSegment(p: Point2, a: Point2, b: Point2): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const carre = vx * vx + vy * vy;
  if (carre === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  const t = Math.min(Math.max(((p.x - a.x) * vx + (p.y - a.y) * vy) / carre, 0), 1);
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

/**
 * Emprise au sol du bloc, rapportee a sa longueur.
 *
 * L'ombre portee suit l'emprise reelle : de face le bloc couvre ses 450 mm,
 * de profil il n'en couvre plus que son epaisseur. Une ombre de taille fixe
 * ferait flotter l'objet.
 */
export function empriseRelative(l: number, e: number, angle: number): number {
  if (l === 0) return 0;
  return (l * Math.abs(Math.cos(angle)) + e * Math.abs(Math.sin(angle))) / l;
}
