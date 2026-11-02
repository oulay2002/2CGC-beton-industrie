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

import {
  deciderEcritureProfil,
  exigerChangementMotDePasse,
} from '../src/lib/autorisation-profil.ts';
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

// Cette regle a bloque une demonstration devant le client : les comptes
// creees pour l'occasion se connectaient, puis le proxy les renvoyait vers
// l'ecran de changement de mot de passe sans jamais les laisser entrer.
// Le drapeau etait pose des qu'un mot de passe accompagnait la requete —
// y compris celui qu'un visiteur venait de choisir lui-meme.
describe('exigerChangementMotDePasse', () => {
  test("une auto-inscription n'impose pas de changer le mot de passe choisi", () => {
    assert.equal(exigerChangementMotDePasse(null, 'nouveau@btp.ci'), false);
  });

  test('un client qui change le sien ne se le voit pas redemander', () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('moi@btp.ci', 'client'), 'moi@btp.ci'),
      false,
    );
  });

  test('un mot de passe attribue par le dirigeant doit etre change', () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'chauffeur@2cgc.ci'),
      true,
    );
  });

  test('le dirigeant qui change le sien ne se le voit pas redemander', () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'pdg@2cgc.ci'),
      false,
    );
  });

  test("le dirigeant peut lever l'exigence pour un compte de demonstration", () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'demo@2cgc.ci', false),
      false,
    );
  });

  test("le dirigeant peut la reposer sur un compte deja debloque", () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('pdg@2cgc.ci', 'dirigeant'), 'demo@2cgc.ci', true),
      true,
    );
  });

  test("un non-dirigeant ne peut pas se dispenser du changement", () => {
    // Glisser le champ dans sa propre requete ne doit rien changer.
    assert.equal(
      exigerChangementMotDePasse(sessionDe('moi@btp.ci', 'client'), 'autre@btp.ci', false),
      false,
    );
  });

  test("la comparaison d'adresse ignore la casse", () => {
    assert.equal(
      exigerChangementMotDePasse(sessionDe('PDG@2CGC.ci', 'dirigeant'), 'pdg@2cgc.ci'),
      false,
    );
  });
});
