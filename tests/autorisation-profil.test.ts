// tests/autorisation-profil.test.ts — Qui peut ecrire quel profil.
//
// La route POST /api/profiles se termine par un `upsert` sur une colonne email
// unique : sur une adresse deja prise, elle ecrase la ligne au lieu d'echouer.
// Le controle de propriete ne s'armait que `if (session && ...)`, donc une
// requete anonyme le traversait entierement. Poster l'adresse d'un compte avec
// un mot de passe choisi suffisait a s'en emparer, et poster l'adresse d'un
// dirigeant avec `role: 'client'` le retrogradait.
//
// Ces cas sont donc les premiers du fichier.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { deciderEcritureProfil } from '../src/lib/autorisation-profil.ts';
import type { RoleProfil } from '../src/lib/autorisation-profil.ts';
import type { SessionPayload } from '../src/lib/session.ts';

const sessionDe = (email: string, role: RoleProfil): SessionPayload => ({
  email,
  role,
  exp: Math.floor(Date.now() / 1000) + 3600,
});

describe('deciderEcritureProfil — prise de controle par requete anonyme', () => {
  test("une requete anonyme ne peut que creer, jamais mettre a jour", () => {
    const d = deciderEcritureProfil(null, 'victime@btp.ci', 'client');
    assert.equal(d.verdict, 'autorise');
    assert.equal(d.verdict === 'autorise' && d.peutMettreAJour, false);
  });

  test("une requete anonyme n'ecrit pas les champs commerciaux", () => {
    const d = deciderEcritureProfil(null, 'nouveau@btp.ci', 'client');
    assert.equal(d.verdict === 'autorise' && d.peutEcrireChampsCommerciaux, false);
  });

  test('une requete anonyme ne cree pas de compte interne', () => {
    for (const role of ['dirigeant', 'chef_usine', 'chauffeur'] as const) {
      const d = deciderEcritureProfil(null, 'intrus@btp.ci', role);
      assert.equal(d.verdict, 'refuse', `role ${role} accepte a tort`);
    }
  });
});

describe('deciderEcritureProfil — cloisonnement entre comptes', () => {
  test("un client ne touche pas le profil d'un autre", () => {
    const d = deciderEcritureProfil(sessionDe('moi@btp.ci', 'client'), 'autre@btp.ci', 'client');
    assert.equal(d.verdict, 'refuse');
  });

  test("un chauffeur ne touche pas le profil d'un autre", () => {
    const d = deciderEcritureProfil(sessionDe('chauffeur@2cgc.ci', 'chauffeur'), 'victime@btp.ci', 'client');
    assert.equal(d.verdict, 'refuse');
  });

  test("un chef d'usine ne touche pas le profil d'un autre", () => {
    const d = deciderEcritureProfil(sessionDe('usine@2cgc.ci', 'chef_usine'), 'victime@btp.ci', 'client');
    assert.equal(d.verdict, 'refuse');
  });

  test("la comparaison d'adresse ignore la casse", () => {
    const d = deciderEcritureProfil(sessionDe('Moi@BTP.ci', 'client'), 'moi@btp.ci', 'client');
    assert.equal(d.verdict, 'autorise');
  });
});

describe('deciderEcritureProfil — elevation de privileges', () => {
  test('un client ne se promeut pas dirigeant', () => {
    const d = deciderEcritureProfil(sessionDe('moi@btp.ci', 'client'), 'moi@btp.ci', 'dirigeant');
    assert.equal(d.verdict, 'refuse');
  });

  test('un chauffeur ne change pas son propre role', () => {
    const d = deciderEcritureProfil(sessionDe('ch@2cgc.ci', 'chauffeur'), 'ch@2cgc.ci', 'client');
    assert.equal(d.verdict, 'refuse');
  });
});

describe('deciderEcritureProfil — chemins legitimes', () => {
  test('le dirigeant met a jour un compte existant, champs commerciaux compris', () => {
    const d = deciderEcritureProfil(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'client@btp.ci', 'client');
    assert.equal(d.verdict, 'autorise');
    assert.equal(d.verdict === 'autorise' && d.peutMettreAJour, true);
    assert.equal(d.verdict === 'autorise' && d.peutEcrireChampsCommerciaux, true);
  });

  test('le dirigeant cree un compte collaborateur', () => {
    const d = deciderEcritureProfil(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'usine@2cgc.ci', 'chef_usine');
    assert.equal(d.verdict, 'autorise');
  });

  test('un client met a jour sa propre fiche, sans les champs commerciaux', () => {
    const d = deciderEcritureProfil(sessionDe('moi@btp.ci', 'client'), 'moi@btp.ci', 'client');
    assert.equal(d.verdict, 'autorise');
    assert.equal(d.verdict === 'autorise' && d.peutMettreAJour, true);
    assert.equal(d.verdict === 'autorise' && d.peutEcrireChampsCommerciaux, false);
  });

  test("l'auto-inscription d'un nouveau client reste possible", () => {
    const d = deciderEcritureProfil(null, 'nouveau@btp.ci', 'client');
    assert.equal(d.verdict, 'autorise');
  });
});
