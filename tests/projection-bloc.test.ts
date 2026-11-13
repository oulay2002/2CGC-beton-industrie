// tests/projection-bloc.test.ts — Les cotes tombent-elles sur les aretes ?
//
// Le bloc du hero porte trois cotes qui doivent suivre sa rotation. Rien ne
// le verifie a l'oeil : une cote decalee de dix degres reste credible sur une
// capture, et ne se trahit qu'en mouvement. On verifie donc la geometrie ici,
// la ou elle est encore des nombres.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  projeter,
  coterLeBloc,
  ecarterLesCotes,
  empriseRelative,
} from '../src/lib/projection-bloc.ts';
import type { Vue } from '../src/lib/projection-bloc.ts';

const DEG = Math.PI / 180;

/** La vue du hero : legerement plongeante, bloc de face. */
const vueDeFace: Vue = { tilt: -16 * DEG, angle: 0, perspective: 1400 };

const proche = (obtenu: number, attendu: number, marge: number, quoi: string) =>
  assert.ok(
    Math.abs(obtenu - attendu) <= marge,
    `${quoi} : ${obtenu.toFixed(2)} attendu autour de ${attendu} (+/- ${marge})`,
  );

describe('projeter — la transformation du navigateur, refaite a la main', () => {
  test('sans rotation ni perspective, le point ne bouge pas', () => {
    const p = projeter({ x: 120, y: -40, z: 0 }, { tilt: 0, angle: 0, perspective: 1400 });
    proche(p.x, 120, 0.001, 'abscisse');
    proche(p.y, -40, 0.001, 'ordonnee');
    proche(p.z, 0, 0.001, 'profondeur');
  });

  test('une rotation positive eloigne le cote droit du bloc', () => {
    // C'est la convention de CSS : rotateY positif enfonce la droite dans
    // l'ecran. Si cette ligne tombe, les cotes se posent du mauvais cote.
    const p = projeter({ x: 100, y: 0, z: 0 }, { tilt: 0, angle: 45 * DEG, perspective: 1400 });
    assert.ok(p.z < 0, `le cote droit devrait s'eloigner, profondeur ${p.z.toFixed(2)}`);
  });

  test('une inclinaison negative amene le dessus vers l oeil', () => {
    // Le dessus du bloc est en y negatif : l'axe des ordonnees descend.
    const dessus = projeter({ x: 0, y: -100, z: 0 }, vueDeFace);
    assert.ok(dessus.z > 0, `le dessus devrait avancer, profondeur ${dessus.z.toFixed(2)}`);
  });

  test('ce qui est plus pres de l oeil se projette plus grand', () => {
    const vue: Vue = { tilt: 0, angle: 0, perspective: 1400 };
    const loin = projeter({ x: 100, y: 0, z: -200 }, vue);
    const pres = projeter({ x: 100, y: 0, z: 200 }, vue);
    assert.ok(pres.x > 100 && loin.x < 100, 'la division perspective ne joue pas');
  });
});

describe('coterLeBloc — ou se posent les trois cotes', () => {
  // Les proportions de l'agglo 20, a l'echelle du hero.
  const L = 270;
  const H = 120;
  const E = 120;

  test('de face, la cote de longueur est horizontale et sous le bloc', () => {
    const { longueur } = coterLeBloc(L, H, E, vueDeFace);
    proche(longueur.rotation, 0, 0.5, 'inclinaison de la cote de longueur');
    assert.ok(
      longueur.etiquette.y > H / 2,
      'le nombre devrait tomber sous le bloc',
    );
    assert.equal(longueur.opacite, 1, 'une arete pleinement de face doit etre cotee');
  });

  test('la cote de longueur mesure bien la longueur du bloc', () => {
    const { longueur } = coterLeBloc(L, H, E, vueDeFace);
    // A la perspective pres : l'arete retenue est celle du premier plan,
    // donc legerement grossie.
    proche(longueur.longueur, L, L * 0.12, 'longueur projetee');
  });

  test('la cote de hauteur se pose sur le bord droit de la silhouette', () => {
    const { hauteur } = coterLeBloc(L, H, E, vueDeFace);
    assert.ok(hauteur.etiquette.x > L / 2, 'le nombre devrait tomber a droite du bloc');
    proche(Math.abs(hauteur.rotation), 90, 3, 'inclinaison de la cote de hauteur');
  });

  test('de face, l epaisseur pointe vers l oeil : elle ne se cote pas', () => {
    // L'arete d'epaisseur se projette en quelques pixels. La coter
    // afficherait « 200 mm » sur un trait de dix pixels.
    const { epaisseur } = coterLeBloc(L, H, E, vueDeFace);
    assert.equal(epaisseur.opacite, 0, 'la cote devrait s effacer');
  });

  test('de profil, longueur et epaisseur echangent leurs roles', () => {
    const deProfil: Vue = { ...vueDeFace, angle: 90 * DEG };
    const { longueur, epaisseur } = coterLeBloc(L, H, E, deProfil);
    assert.equal(longueur.opacite, 0, 'la longueur devrait s effacer de profil');
    assert.ok(epaisseur.opacite > 0, "l'epaisseur devrait reapparaitre de profil");
    proche(epaisseur.longueur, E, E * 0.15, 'epaisseur projetee');
  });

  test('la cote reste a droite tout au long du tour', () => {
    // La hauteur est la seule cote toujours lisible : elle ne doit jamais
    // traverser le bloc, a aucun angle.
    for (let deg = 0; deg < 360; deg += 5) {
      const { hauteur } = coterLeBloc(L, H, E, { ...vueDeFace, angle: deg * DEG });
      assert.ok(
        hauteur.etiquette.x > 0,
        `a ${deg} degres, le nombre passe a gauche (${hauteur.etiquette.x.toFixed(1)})`,
      );
    }
  });

  test('aucune cote ne vient se poser sur la matiere', () => {
    // Chaque etiquette doit sortir de la boite englobante du bloc, sinon le
    // nombre se lit par-dessus le beton.
    const rayon = Math.hypot(L, H, E) / 2;
    for (let deg = 0; deg < 360; deg += 15) {
      const cotes = coterLeBloc(L, H, E, { ...vueDeFace, angle: deg * DEG });
      for (const [nom, cote] of Object.entries(cotes)) {
        if (cote.opacite === 0) continue;
        const d = Math.hypot(cote.etiquette.x, cote.etiquette.y);
        assert.ok(d > 0, `${nom} a ${deg} degres : etiquette au centre`);
        assert.ok(
          d < rayon * 3,
          `${nom} a ${deg} degres : etiquette perdue au loin (${d.toFixed(0)})`,
        );
      }
    }
  });

  test('le nombre se tient plus loin du bloc que sa ligne', () => {
    const { longueur } = coterLeBloc(L, H, E, vueDeFace, 26, 17);
    // Les deux se comparent sur la meme normale : le milieu de la ligne et
    // le nombre, et non un coin de la ligne, qui est forcement plus loin du
    // centre que son propre milieu.
    const milieu = {
      x: (longueur.depart.x + longueur.arrivee.x) / 2,
      y: (longueur.depart.y + longueur.arrivee.y) / 2,
    };
    const ecartement = Math.hypot(
      longueur.etiquette.x - milieu.x,
      longueur.etiquette.y - milieu.y,
    );
    proche(ecartement, 17, 0.001, 'ecartement du nombre');
  });
});

describe('ecarterLesCotes — deux nombres ne se lisent pas superposes', () => {
  // Les cotes reelles du hero sur grand ecran : 450 x 200 x 120 mm a
  // 0,56 pixel par millimetre. C'est l'agglo 12, format ou les cotes se
  // serrent le plus.
  const L = 252;
  const H = 112;
  const E_MINCE = 67.2;

  test("l'epaisseur cede, jamais la hauteur", () => {
    let aCede = false;
    for (let deg = 0; deg < 360; deg += 2) {
      const vue = { ...vueDeFace, angle: deg * DEG };
      const brutes = coterLeBloc(L, H, E_MINCE, vue);
      const ecartees = ecarterLesCotes(brutes);

      assert.equal(
        ecartees.hauteur.opacite,
        brutes.hauteur.opacite,
        `a ${deg} degres, la hauteur a cede`,
      );
      if (ecartees.epaisseur.opacite < brutes.epaisseur.opacite) aCede = true;
    }
    assert.ok(aCede, 'aucune collision rencontree : le test ne prouve rien');
  });

  test('deux etiquettes visibles ne se touchent jamais', () => {
    const SEUIL = 62;
    for (let deg = 0; deg < 360; deg += 2) {
      const c = ecarterLesCotes(coterLeBloc(L, H, E_MINCE, { ...vueDeFace, angle: deg * DEG }));
      const paires: [keyof typeof c, keyof typeof c][] = [
        ['longueur', 'hauteur'],
        ['epaisseur', 'hauteur'],
        ['epaisseur', 'longueur'],
      ];
      for (const [a, b] of paires) {
        // On ne reproche rien a une cote deja presque effacee.
        if (c[a].opacite < 0.35 || c[b].opacite < 0.35) continue;
        const d = Math.hypot(
          c[a].etiquette.x - c[b].etiquette.x,
          c[a].etiquette.y - c[b].etiquette.y,
        );
        assert.ok(
          d >= SEUIL * 0.59,
          `a ${deg} degres, ${a} et ${b} se chevauchent (${d.toFixed(1)} px)`,
        );
      }
    }
  });

  test('sans collision, aucune cote n est touchee', () => {
    const brutes = coterLeBloc(L, H, 112, vueDeFace);
    const ecartees = ecarterLesCotes(brutes, 1);
    for (const cle of ['longueur', 'hauteur', 'epaisseur'] as const) {
      assert.equal(ecartees[cle].opacite, brutes[cle].opacite, cle);
    }
  });
});

describe('empriseRelative — la largeur de l ombre portee', () => {
  test('de face, le bloc couvre toute sa longueur', () => {
    proche(empriseRelative(450, 200, 0), 1, 0.001, 'emprise de face');
  });

  test('de profil, il ne couvre plus que son epaisseur', () => {
    proche(empriseRelative(450, 200, Math.PI / 2), 200 / 450, 0.001, 'emprise de profil');
  });

  test('de trois quarts, il couvre davantage que de face', () => {
    // La diagonale est plus large que le cote : l'ombre doit s'etaler.
    assert.ok(empriseRelative(450, 200, 45 * DEG) > 1);
  });

  test('un bloc sans longueur ne porte pas d ombre', () => {
    assert.equal(empriseRelative(0, 200, 0), 0);
  });
});
