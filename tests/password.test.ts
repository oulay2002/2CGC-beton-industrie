// tests/password.test.ts — Hachage et vérification des mots de passe.
//
// Ces fonctions protègent les accès au portail : un défaut ici rend toute la
// chaîne d'authentification inopérante sans que rien ne le signale.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  hacherMotDePasse,
  verifierMotDePasse,
  motifRejetMotDePasse,
  genererMotDePasseInitial,
  LONGUEUR_MIN,
} from '../src/lib/password.ts';

describe('hacherMotDePasse / verifierMotDePasse', () => {
  test('accepte le mot de passe d origine', async () => {
    const empreinte = await hacherMotDePasse('Chantier2026Daloa');
    assert.equal(await verifierMotDePasse('Chantier2026Daloa', empreinte), true);
  });

  test('refuse un mot de passe different', async () => {
    const empreinte = await hacherMotDePasse('Chantier2026Daloa');
    assert.equal(await verifierMotDePasse('Chantier2026Dalo', empreinte), false);
    assert.equal(await verifierMotDePasse('chantier2026daloa', empreinte), false);
    assert.equal(await verifierMotDePasse('', empreinte), false);
  });

  test('produit une empreinte differente a chaque appel (sel aleatoire)', async () => {
    const a = await hacherMotDePasse('MemeMotDePasse1');
    const b = await hacherMotDePasse('MemeMotDePasse1');
    assert.notEqual(a, b, 'deux hachages du meme mot de passe doivent differer');
    // Les deux restent pourtant valides.
    assert.equal(await verifierMotDePasse('MemeMotDePasse1', a), true);
    assert.equal(await verifierMotDePasse('MemeMotDePasse1', b), true);
  });

  test('ne contient jamais le mot de passe en clair', async () => {
    const empreinte = await hacherMotDePasse('SecretTresVisible1');
    assert.equal(empreinte.includes('SecretTresVisible1'), false);
  });

  test('respecte le format scrypt$N$r$p$sel$empreinte', async () => {
    const parties = (await hacherMotDePasse('FormatValide123')).split('$');
    assert.equal(parties.length, 6);
    assert.equal(parties[0], 'scrypt');
    assert.ok(Number(parties[1]) >= 16384, 'cout N insuffisant');
  });

  test('refuse une empreinte absente, vide ou malformee', async () => {
    assert.equal(await verifierMotDePasse('x', null), false);
    assert.equal(await verifierMotDePasse('x', undefined), false);
    assert.equal(await verifierMotDePasse('x', ''), false);
    assert.equal(await verifierMotDePasse('x', 'pas-un-hachage'), false);
    assert.equal(await verifierMotDePasse('x', 'scrypt$1$2$3'), false);
    // Algorithme inconnu : refus, jamais d acceptation par defaut.
    assert.equal(await verifierMotDePasse('x', 'md5$1$1$1$c2Vs$ZW1wcmVpbnRl'), false);
  });

  test('normalise l unicode : deux saisies equivalentes concordent', async () => {
    // « é » composé (e + accent combinant) et « é » précomposé.
    const compose = 'Béton2026CI';
    const precompose = 'Béton2026CI';
    const empreinte = await hacherMotDePasse(precompose);
    assert.equal(await verifierMotDePasse(compose, empreinte), true);
  });
});

describe('motifRejetMotDePasse', () => {
  test('accepte un mot de passe conforme', () => {
    assert.equal(motifRejetMotDePasse('Chantier2026'), null);
  });

  test('refuse trop court, sans lettre, sans chiffre', () => {
    assert.ok(motifRejetMotDePasse('Abc123'));
    assert.ok(motifRejetMotDePasse('1234567890123'));
    assert.ok(motifRejetMotDePasse('AbcdefghijKL'));
  });

  test('refuse une saisie demesuree', () => {
    assert.ok(motifRejetMotDePasse('a1'.repeat(200)));
  });

  test('applique exactement la longueur minimale annoncee', () => {
    const limite = 'a1'.padEnd(LONGUEUR_MIN, 'x');
    assert.equal(limite.length, LONGUEUR_MIN);
    assert.equal(motifRejetMotDePasse(limite), null);
    assert.ok(motifRejetMotDePasse(limite.slice(0, -1)));
  });
});

describe('genererMotDePasseInitial', () => {
  test('produit un mot de passe conforme a la politique', () => {
    for (let i = 0; i < 50; i++) {
      const mdp = genererMotDePasseInitial('Keita Boubacar');
      assert.equal(motifRejetMotDePasse(mdp), null, `rejete : ${mdp}`);
    }
  });

  test('ne se repete pas', () => {
    const tirages = new Set(
      Array.from({ length: 50 }, () => genererMotDePasseInitial('Keita Boubacar'))
    );
    assert.ok(tirages.size > 45, 'generation insuffisamment aleatoire');
  });

  test('evite les caracteres ambigus a la lecture', () => {
    // Le mot de passe est recopie a la main depuis un message WhatsApp :
    // I/O/0/1 se confondent et generent des appels au support.
    for (let i = 0; i < 50; i++) {
      const suffixe = genererMotDePasseInitial('Zoe Xavier').replace('2CGC-', '');
      assert.equal(/[IO01]/.test(suffixe.slice(2)), false, `caractere ambigu : ${suffixe}`);
    }
  });
});
