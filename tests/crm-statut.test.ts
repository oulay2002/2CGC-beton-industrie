// tests/crm-statut.test.ts — Règle de correction automatique du statut d'un lead.
//
// Cette règle décide dans quelle colonne du pipeline tombe un prospect. Sa
// version précédente basculait tout nouveau lead en « Devis Envoyé » dès qu'une
// activité contenait le mot « Email » : comme la création envoie un email de
// bienvenue, la colonne « Nouveau » restait vide en permanence et le pipeline
// ne reflétait plus la réalité commerciale.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  corrigerStatutIncoherent,
  construireLeadManuel,
  construireLeadDepuisDevis,
  sequencesEnAttente,
} from '../src/lib/crm-types.ts';
import type { CRMLead } from '../src/lib/crm-types.ts';

const jour = (decalage = 0) =>
  new Date(Date.now() + decalage * 86400000).toISOString().split('T')[0];

function lead(partiel: Partial<CRMLead> = {}): CRMLead {
  return {
    id: 'LEAD-TEST',
    nom: 'M. Konan',
    entreprise: 'BTP Test',
    email: 'konan@test.ci',
    telephone: '+225 07 00 00 00',
    statut: 'nouveau',
    valeurEstimee: 100000,
    source: 'site_web',
    activites: [],
    sequences: [],
    dateCreation: jour(),
    ...partiel,
  };
}

describe('corrigerStatutIncoherent', () => {
  test('laisse intact un lead neuf sans aucun contact', () => {
    assert.equal(corrigerStatutIncoherent(lead()), null);
  });

  test('ne touche pas un lead deja sorti de « nouveau »', () => {
    for (const statut of ['contacte', 'devis_envoye', 'negociation', 'gagne', 'perdu'] as const) {
      assert.equal(corrigerStatutIncoherent(lead({ statut })), null, `statut ${statut} modifie`);
    }
  });

  test('un simple email de bienvenue donne « contacte », pas « devis_envoye »', () => {
    // C'est la regression corrigee : auparavant ce cas basculait en devis_envoye.
    const corrige = corrigerStatutIncoherent(
      lead({
        activites: [
          { date: jour(), action: 'Email de bienvenue envoyé', automatique: true, canal: 'email' },
        ],
      })
    );
    assert.equal(corrige?.statut, 'contacte');
  });

  test('un contact WhatsApp donne « contacte »', () => {
    const corrige = corrigerStatutIncoherent(
      lead({
        activites: [
          { date: jour(), action: 'Premier message reçu', automatique: true, canal: 'whatsapp' },
        ],
      })
    );
    assert.equal(corrige?.statut, 'contacte');
  });

  test('une proforma reellement emise donne « devis_envoye »', () => {
    const corrige = corrigerStatutIncoherent(
      lead({
        activites: [
          { date: jour(), action: 'Facture Proforma générée', automatique: true, canal: 'email' },
        ],
      })
    );
    assert.equal(corrige?.statut, 'devis_envoye');
  });

  test('un lead issu du configurateur de devis donne « devis_envoye »', () => {
    assert.equal(corrigerStatutIncoherent(lead({ source: 'devis_auto' }))?.statut, 'devis_envoye');
  });

  test('une sequence proforma envoyee donne « devis_envoye »', () => {
    const corrige = corrigerStatutIncoherent(
      lead({
        sequences: [
          { id: 'S1', nom: 'Proforma', statut: 'envoyee', datePrevu: jour(), canal: 'email', template: 'proforma' },
        ],
      })
    );
    assert.equal(corrige?.statut, 'devis_envoye');
  });

  test('trace le changement en tete d historique, sans perdre l existant', () => {
    const origine = lead({
      activites: [
        { date: jour(-1), action: 'Appel entrant', automatique: false, canal: 'telephone' },
      ],
    });
    const corrige = corrigerStatutIncoherent(origine);
    assert.equal(corrige?.activites.length, 2);
    assert.match(corrige!.activites[0].action, /Statut mis à jour/);
    assert.equal(corrige?.activites[1].action, 'Appel entrant');
  });

  test('ne modifie pas le lead d origine', () => {
    const origine = lead({ source: 'devis_auto' });
    corrigerStatutIncoherent(origine);
    assert.equal(origine.statut, 'nouveau', 'la fonction doit rester pure');
    assert.equal(origine.activites.length, 0);
  });
});

describe('constructeurs de leads', () => {
  test('un lead manuel demarre « nouveau » avec ses 4 relances programmees', () => {
    const l = construireLeadManuel({ nom: 'Mme Bamba', email: 'b@x.ci' });
    assert.equal(l.statut, 'nouveau');
    assert.equal(l.sequences.length, 4);
    assert.equal(l.sequences.every((s) => s.statut === 'en_attente'), true);
    assert.match(l.id, /^LEAD-/);
  });

  test('un lead issu d un devis demarre « devis_envoye », proforma deja envoyee', () => {
    const l = construireLeadDepuisDevis({ nom: 'M. Yao', email: 'y@x.ci', valeur: 500000 });
    assert.equal(l.statut, 'devis_envoye');
    assert.equal(l.source, 'devis_auto');
    assert.equal(l.sequences.find((s) => s.template === 'proforma')?.statut, 'envoyee');
  });

  test('deux leads crees d affilee ont des identifiants distincts', () => {
    const ids = new Set(Array.from({ length: 30 }, () => construireLeadManuel({}).id));
    assert.ok(ids.size > 25, 'collisions d identifiants');
  });
});

describe('sequencesEnAttente', () => {
  test('retient les relances echues, ignore les futures et les envoyees', () => {
    const dues = sequencesEnAttente([
      lead({
        id: 'L1',
        sequences: [
          { id: 'A', nom: 'hier', statut: 'en_attente', datePrevu: jour(-1), canal: 'email', template: 't' },
          { id: 'B', nom: 'demain', statut: 'en_attente', datePrevu: jour(1), canal: 'email', template: 't' },
          { id: 'C', nom: 'deja faite', statut: 'envoyee', datePrevu: jour(-5), canal: 'email', template: 't' },
        ],
      }),
    ]);
    assert.deepEqual(dues.map((d) => d.sequence.id), ['A']);
  });

  test('inclut une relance prevue pour aujourd hui', () => {
    const dues = sequencesEnAttente([
      lead({ sequences: [{ id: 'J', nom: 'J+0', statut: 'en_attente', datePrevu: jour(), canal: 'email', template: 't' }] }),
    ]);
    assert.equal(dues.length, 1);
  });

  test('retourne une liste vide sans lead', () => {
    assert.deepEqual(sequencesEnAttente([]), []);
  });
});
