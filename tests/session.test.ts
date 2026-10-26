// tests/session.test.ts — Jetons de session signés.
//
// C'est la pièce qui a remplacé le contournement d'authentification : un défaut
// de vérification ici rouvrirait l'accès dirigeant à n'importe qui. Le secret
// est injecté avant l'import, le module le lisant au chargement.

process.env.AUTH_SECRET ??= 'secret-de-test-suffisamment-long-pour-etre-valide-123456';

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { createSessionToken, verifySessionToken, isSessionSecretConfigured } = await import(
  '../src/lib/session.ts'
);

const DIRIGEANT = { email: 'directeur@2cgc-industrie.com', role: 'dirigeant' as const, nom: 'KB' };

describe('createSessionToken / verifySessionToken', () => {
  test('le secret de test est bien pris en compte', () => {
    assert.equal(isSessionSecretConfigured(), true);
  });

  test('un jeton emis est accepte et restitue sa charge utile', async () => {
    const session = await verifySessionToken(await createSessionToken(DIRIGEANT));
    assert.equal(session?.email, DIRIGEANT.email);
    assert.equal(session?.role, 'dirigeant');
    assert.equal(session?.nom, 'KB');
  });

  test('transporte le drapeau de mot de passe provisoire', async () => {
    const avec = await verifySessionToken(await createSessionToken({ ...DIRIGEANT, mdp: true }));
    assert.equal(avec?.mdp, true);
    const sans = await verifySessionToken(await createSessionToken(DIRIGEANT));
    assert.ok(!sans?.mdp);
  });

  test('refuse une charge utile modifiee', async () => {
    const jeton = await createSessionToken({ ...DIRIGEANT, role: 'client' });
    const [charge, signature] = jeton.split('.');

    // Un attaquant remplace « client » par « dirigeant » et reutilise la signature.
    const falsifiee = Buffer.from(
      Buffer.from(charge, 'base64url').toString('utf8').replace('"client"', '"dirigeant"')
    ).toString('base64url');

    assert.equal(await verifySessionToken(`${falsifiee}.${signature}`), null);
  });

  test('refuse une signature modifiee', async () => {
    const [charge, signature] = (await createSessionToken(DIRIGEANT)).split('.');
    const bricolee = signature.slice(0, -2) + (signature.endsWith('AA') ? 'BB' : 'AA');
    assert.equal(await verifySessionToken(`${charge}.${bricolee}`), null);
  });

  test('refuse un jeton signe avec un autre secret', async () => {
    // Reproduit la signature d un attaquant qui ignore AUTH_SECRET.
    const { createHmac } = await import('node:crypto');
    const charge = Buffer.from(
      JSON.stringify({ ...DIRIGEANT, exp: Math.floor(Date.now() / 1000) + 3600 })
    ).toString('base64url');
    const signature = createHmac('sha256', 'mauvais-secret').update(charge).digest('base64url');
    assert.equal(await verifySessionToken(`${charge}.${signature}`), null);
  });

  test('refuse les formes degenerees', async () => {
    for (const entree of [undefined, null, '', 'abc', 'a.b.c', '.', 'a.']) {
      assert.equal(await verifySessionToken(entree as string | null | undefined), null, `accepte : ${entree}`);
    }
  });

  test('refuse un jeton expire', async () => {
    // maxAge negatif : le jeton naît déjà périmé, signature pourtant valide.
    const expire = await createSessionToken(DIRIGEANT, -10);
    assert.equal(await verifySessionToken(expire), null);
  });

  test('accepte un jeton encore valide a la seconde pres', async () => {
    const session = await verifySessionToken(await createSessionToken(DIRIGEANT, 5));
    assert.equal(session?.email, DIRIGEANT.email);
  });
});
