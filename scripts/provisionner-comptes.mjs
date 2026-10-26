#!/usr/bin/env node
/**
 * scripts/provisionner-comptes.mjs
 * ---------------------------------------------------------------------------
 * Provisionne les mots de passe des comptes existants, après la bascule vers
 * l'authentification serveur (migrations 003 + 004).
 *
 * Ce que fait le script :
 *   1. normalise les emails internes vers @2cgc-industrie.com (la table porte
 *      encore les anciens domaines @2cgc.ci et @beton-industrie.com, dont la
 *      conversion vivait dans le code client aujourd'hui supprimé) ;
 *   2. génère un mot de passe fort pour chaque compte qui n'a pas encore
 *      d'empreinte, et enregistre uniquement son empreinte scrypt ;
 *   3. affiche les identifiants UNE SEULE FOIS, à remettre aux intéressés.
 *
 * Le script est idempotent : relancé, il ne touche pas aux comptes qui ont
 * déjà un mot de passe (sauf avec --forcer).
 *
 * Usage :
 *   node scripts/provisionner-comptes.mjs            # comptes sans mot de passe
 *   node scripts/provisionner-comptes.mjs --forcer   # réinitialise TOUT
 *
 * Prérequis : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

import { readFileSync } from 'node:fs';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

// ─── Chargement de .env.local ───────────────────────────────────────────────
try {
  for (const ligne of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  console.error('Impossible de lire .env.local depuis la racine du projet.');
  process.exit(1);
}

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_SUPABASE || !CLE_SERVICE) {
  console.error(`
✗ Configuration incomplète.

  SUPABASE_SERVICE_ROLE_KEY est requise et absente de .env.local.
  Récupérez-la dans : Dashboard Supabase > Project Settings > API > service_role
  puis ajoutez dans .env.local :

      SUPABASE_SERVICE_ROLE_KEY=eyJ...

  Cette clé ne doit JAMAIS être préfixée NEXT_PUBLIC_ ni committée.
`);
  process.exit(1);
}

const FORCER = process.argv.includes('--forcer');

// ─── Hachage, format identique à src/lib/password.ts ────────────────────────
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

async function hacher(motDePasse) {
  const sel = randomBytes(16);
  const empreinte = await scrypt(motDePasse.normalize('NFKC'), sel, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${N}$${R}$${P}$${sel.toString('base64')}$${empreinte.toString('base64')}`;
}

function genererMotDePasse(nom) {
  const initiales =
    (nom || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((mot) => mot[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'XX';

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  const aleatoire = Array.from(randomBytes(8))
    .map((o) => alphabet[o % alphabet.length])
    .join('');

  return `2CGC-${initiales}${aleatoire}`;
}

/** Les comptes internes utilisent le domaine officiel ; les clients gardent le leur. */
function normaliserEmail(email, role) {
  if (role === 'client') return email;
  return email
    .replace(/@2cgc\.ci$/i, '@2cgc-industrie.com')
    .replace(/@beton-industrie\.com$/i, '@2cgc-industrie.com');
}

// ─── Accès REST ─────────────────────────────────────────────────────────────
const enTetes = {
  apikey: CLE_SERVICE,
  Authorization: `Bearer ${CLE_SERVICE}`,
  'Content-Type': 'application/json',
};

async function lireProfils() {
  const res = await fetch(
    `${URL_SUPABASE}/rest/v1/profiles?select=email,nom,role,password_hash&order=role`,
    { headers: enTetes }
  );
  if (!res.ok) {
    throw new Error(`Lecture des profils : HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function majProfil(emailActuel, champs) {
  const res = await fetch(
    `${URL_SUPABASE}/rest/v1/profiles?email=eq.${encodeURIComponent(emailActuel)}`,
    { method: 'PATCH', headers: { ...enTetes, Prefer: 'return=minimal' }, body: JSON.stringify(champs) }
  );
  if (!res.ok) {
    throw new Error(`Mise à jour de ${emailActuel} : HTTP ${res.status} ${await res.text()}`);
  }
}

// ─── Exécution ──────────────────────────────────────────────────────────────
// Les comptes de direction sont la clé de voûte : ce sont les seuls à pouvoir
// créer ensuite les comptes chef d'usine et chauffeur. On les traite et on les
// affiche en premier, pour qu'ils ne se perdent pas dans la liste.
const ORDRE_ROLES = { dirigeant: 0, chef_usine: 1, chauffeur: 2, client: 3 };

const profils = (await lireProfils()).sort(
  (a, b) => (ORDRE_ROLES[a.role] ?? 9) - (ORDRE_ROLES[b.role] ?? 9)
);
console.log(`\n${profils.length} compte(s) trouvé(s).\n`);

const credentials = [];
let ignores = 0;

for (const profil of profils) {
  const emailCible = normaliserEmail(profil.email, profil.role);
  const renomme = emailCible !== profil.email;

  if (profil.password_hash && !FORCER) {
    if (renomme) {
      await majProfil(profil.email, { email: emailCible });
      console.log(`  ↻ ${profil.email} → ${emailCible} (mot de passe conservé)`);
    } else {
      ignores++;
    }
    continue;
  }

  const motDePasse = genererMotDePasse(profil.nom || profil.email);
  await majProfil(profil.email, {
    email: emailCible,
    password_hash: await hacher(motDePasse),
    must_change_password: true,
    failed_login_count: 0,
    locked_until: null,
  });

  credentials.push({ role: profil.role, nom: profil.nom || '—', email: emailCible, motDePasse });
  console.log(`  ✓ ${emailCible}${renomme ? `  (ex-${profil.email})` : ''}`);
}

if (ignores > 0) {
  console.log(`\n  ${ignores} compte(s) déjà provisionné(s), ignoré(s). Utilisez --forcer pour les réinitialiser.`);
}

if (credentials.length > 0) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  IDENTIFIANTS PROVISOIRES — AFFICHÉS UNE SEULE FOIS                        ║
║  Transmettez-les à leurs titulaires, puis effacez cette sortie.            ║
║  Seule l'empreinte est stockée : ces mots de passe ne sont plus relisibles.║
╚════════════════════════════════════════════════════════════════════════════╝
`);
  for (const c of credentials) {
    if (c.role === 'dirigeant') {
      console.log('  ┌─ DIRECTION — accès administrateur, à conserver en priorité');
      console.log(`  │  ${c.nom}`);
      console.log(`  │  ${c.email}`);
      console.log(`  │  ${c.motDePasse}`);
      console.log('  └─ Seuls ces comptes peuvent créer les accès usine et chauffeur.\n');
    } else {
      console.log(`  ${c.role.padEnd(12)} ${c.nom}`);
      console.log(`  ${''.padEnd(12)} ${c.email}`);
      console.log(`  ${''.padEnd(12)} ${c.motDePasse}\n`);
    }
  }
  console.log('  Ces mots de passe sont provisoires : faites-les changer par leurs titulaires.\n');
} else {
  console.log('\nAucun nouveau mot de passe généré.\n');
}
