// tests/mur-agglos.test.ts — Le mur du hero tient-il debout ?
//
// Deux choses s'y jouent qu'un coup d'oeil ne verifie pas. L'appareil :
// des rangs a joints croises, ou aucun joint vertical ne se superpose a
// celui du rang voisin. Et le compte : le panneau annonce « 10 agglos,
// 1 m2 » en page d'accueil, chiffre sur lequel un client commande.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { monterLeMur } from '../src/lib/mur-agglos.ts';
import {
  AGGLOS_3D,
  JOINT_MM,
  agglosParM2,
  analyserCotes,
  analyserPoids,
} from '../src/lib/catalogue-agglos.ts';

const agglo = (epaisseurCm: number, type: string) => {
  const f = AGGLOS_3D.find((a) => a.epaisseurCm === epaisseurCm && a.type === type);
  assert.ok(f, `format introuvable : ${epaisseurCm} ${type}`);
  return f;
};

describe('le catalogue se relit sans se recopier', () => {
  test('les cotes du catalogue sont analysees, longueur puis epaisseur', () => {
    assert.deepEqual(analyserCotes('450x150x200mm'), {
      longueurMm: 450,
      epaisseurMm: 150,
      hauteurMm: 200,
    });
  });

  test('une cote illisible ne produit pas de bloc', () => {
    assert.equal(analyserCotes('Mixte'), null);
    assert.equal(analyserCotes('450x200mm'), null);
  });

  test('un poids non communique vaut rien, et non zero', () => {
    assert.equal(analyserPoids('18 kg'), 18);
    assert.equal(analyserPoids('NC'), null);
  });

  test('les dix agglos du catalogue ont tous un volume', () => {
    assert.equal(AGGLOS_3D.length, 10);
    for (const a of AGGLOS_3D) {
      assert.ok(a.longueurMm > 0 && a.hauteurMm > 0 && a.epaisseurMm > 0, a.id);
      assert.ok(a.poidsKg > 0, `poids manquant : ${a.id}`);
      assert.ok(a.prixFcfa > 0, `prix manquant : ${a.id}`);
    }
  });

  test('un plein n a pas d alveole, un double en a deux rangees', () => {
    assert.equal(agglo(20, 'plein').alveoles, 0);
    assert.equal(agglo(20, 'creux').rangees, 1);
    assert.equal(agglo(20, 'double').rangees, 2);
  });

  test('le 10 n existe qu en creux', () => {
    const dix = AGGLOS_3D.filter((a) => a.epaisseurCm === 10);
    assert.equal(dix.length, 1);
    assert.equal(dix[0].type, 'creux');
  });
});

describe('agglosParM2 — le chiffre sur lequel on commande', () => {
  test('un agglo de 450 x 200 au joint de 15 mm : dix au metre carre', () => {
    // (0,450 + 0,015) x (0,200 + 0,015) = 0,09998 m2.
    const n = agglosParM2(agglo(20, 'creux'));
    assert.ok(Math.abs(n - 10) < 0.01, `${n.toFixed(3)} au lieu de 10`);
  });

  test("l'epaisseur ne change pas le compte : le parement est le meme", () => {
    const vingt = agglosParM2(agglo(20, 'creux'));
    for (const cm of [15, 12, 10]) {
      const n = agglosParM2(agglo(cm, 'creux'));
      assert.ok(Math.abs(n - vingt) < 1e-9, `le ${cm} donne ${n}, le 20 donne ${vingt}`);
    }
  });

  test('un joint plus epais fait baisser le compte', () => {
    const f = agglo(20, 'creux');
    assert.ok(agglosParM2(f, 25) < agglosParM2(f, 10));
  });
});

describe('monterLeMur — l appareil a joints croises', () => {
  const format = agglo(20, 'creux');

  test('le panneau par defaut vaut dix agglos et un metre carre', () => {
    const mur = monterLeMur(format);
    assert.equal(mur.agglos, 10);
    assert.ok(
      Math.abs(mur.surfaceM2 - 1) < 0.01,
      `${mur.surfaceM2.toFixed(4)} m2 au lieu de 1`,
    );
  });

  test('tous les rangs ont exactement la meme largeur', () => {
    const mur = monterLeMur(format);
    for (let rang = 0; rang < mur.rangs; rang += 1) {
      const dernier = mur.pieces.filter((p) => p.rang === rang).at(-1);
      assert.ok(dernier);
      const bout = dernier.x + dernier.longueurMm;
      assert.ok(
        Math.abs(bout - mur.largeurMm) < 1e-9,
        `le rang ${rang} finit a ${bout}, le mur a ${mur.largeurMm}`,
      );
    }
  });

  test('aucun joint vertical ne se superpose a celui du rang voisin', () => {
    // C'est la definition meme de l'appareil : des joints alignes font un
    // mur qui se fend, et une image qu'un macon ne croira pas.
    const mur = monterLeMur(format);
    const jointsDe = (rang: number) =>
      mur.pieces
        .filter((p) => p.rang === rang && !p.bordDroit)
        .map((p) => Math.round(p.x + p.longueurMm));

    for (let rang = 1; rang < mur.rangs; rang += 1) {
      const dessus = new Set(jointsDe(rang - 1));
      for (const j of jointsDe(rang)) {
        assert.ok(!dessus.has(j), `joint aligne a x=${j} entre les rangs ${rang - 1} et ${rang}`);
      }
    }
  });

  test('un rang sur deux est croise par des demi-blocs', () => {
    const mur = monterLeMur(format);
    const droits = mur.pieces.filter((p) => p.rang === 0);
    const croises = mur.pieces.filter((p) => p.rang === 1);
    assert.equal(droits.filter((p) => p.demi).length, 0);
    assert.equal(croises.filter((p) => p.demi).length, 2);
    assert.ok(croises[0].demi && croises.at(-1)?.demi, 'les demis vont aux deux bouts');
  });

  test('les pieces ne se chevauchent pas et laissent le joint entre elles', () => {
    const mur = monterLeMur(format);
    for (let rang = 0; rang < mur.rangs; rang += 1) {
      const r = mur.pieces.filter((p) => p.rang === rang);
      for (let i = 1; i < r.length; i += 1) {
        const ecart = r[i].x - (r[i - 1].x + r[i - 1].longueurMm);
        assert.ok(
          Math.abs(ecart - JOINT_MM) < 1e-9,
          `rang ${rang}, joint de ${ecart} mm au lieu de ${JOINT_MM}`,
        );
      }
    }
  });

  test('la hauteur compte les joints entre rangs, pas au-dela', () => {
    const mur = monterLeMur(format, 5);
    assert.equal(mur.hauteurMm, 5 * 200 + 4 * JOINT_MM);
  });

  test('un panneau plus large garde le compte juste', () => {
    const mur = monterLeMur(format, 4, 3);
    assert.equal(mur.agglos, 12);
    assert.equal(mur.largeurMm, 3 * 450 + 2 * JOINT_MM);
    const croises = mur.pieces.filter((p) => p.rang === 1);
    assert.equal(croises.length, 4, 'demi, entier, entier, demi');
  });

  test('le mur prend l epaisseur du format pose', () => {
    assert.equal(monterLeMur(agglo(12, 'creux')).epaisseurMm, 120);
    assert.equal(monterLeMur(agglo(20, 'plein')).epaisseurMm, 200);
  });
});
