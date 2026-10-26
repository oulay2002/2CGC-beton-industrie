// src/lib/password.ts — Hachage et verification des mots de passe.
//
// Utilise scrypt (RFC 7914), fourni par le module crypto de Node : resistant au
// materiel dedie, et sans dependance supplementaire a auditer. Les mots de passe
// ne sont jamais stockes ni journalises en clair.
//
// Format stocke : scrypt$N$r$p$<sel base64>$<empreinte base64>
// Le format porte ses propres parametres, ce qui permettra de les durcir plus
// tard sans invalider les empreintes existantes.

import 'server-only';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const N = 16384; // cout CPU/memoire
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

/** Longueur minimale imposee aux nouveaux mots de passe. */
export const LONGUEUR_MIN = 10;

/**
 * Verifie qu'un mot de passe satisfait la politique minimale.
 * Retourne null si valide, sinon le motif du rejet.
 */
export function motifRejetMotDePasse(motDePasse: string): string | null {
  if (typeof motDePasse !== 'string' || motDePasse.length < LONGUEUR_MIN) {
    return `Le mot de passe doit comporter au moins ${LONGUEUR_MIN} caracteres.`;
  }
  if (motDePasse.length > 200) {
    return 'Le mot de passe ne peut exceder 200 caracteres.';
  }
  if (!/[a-zA-Z]/.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins une lettre.';
  }
  if (!/[0-9]/.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins un chiffre.';
  }
  return null;
}

/** Calcule l'empreinte d'un mot de passe. */
export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  const empreinte = await scrypt(motDePasse.normalize('NFKC'), sel, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return `scrypt$${N}$${R}$${P}$${sel.toString('base64')}$${empreinte.toString('base64')}`;
}

/**
 * Verifie un mot de passe contre une empreinte stockee.
 * La comparaison est a temps constant pour ne pas divulguer d'information
 * par le temps de reponse.
 */
export async function verifierMotDePasse(
  motDePasse: string,
  empreinteStockee: string | null | undefined
): Promise<boolean> {
  if (!motDePasse || !empreinteStockee) return false;

  const parties = empreinteStockee.split('$');
  if (parties.length !== 6 || parties[0] !== 'scrypt') return false;

  const n = Number(parties[1]);
  const r = Number(parties[2]);
  const p = Number(parties[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let sel: Buffer;
  let attendue: Buffer;
  try {
    sel = Buffer.from(parties[4], 'base64');
    attendue = Buffer.from(parties[5], 'base64');
  } catch {
    return false;
  }
  if (sel.length === 0 || attendue.length === 0) return false;

  try {
    const calculee = await scrypt(motDePasse.normalize('NFKC'), sel, attendue.length, {
      N: n,
      r,
      p,
      maxmem: MAXMEM,
    });
    if (calculee.length !== attendue.length) return false;
    return timingSafeEqual(calculee, attendue);
  } catch {
    return false;
  }
}

/**
 * Genere un mot de passe initial lisible, conforme a la politique.
 * Il n'est affiche qu'une fois, a la creation du compte : seule l'empreinte
 * est conservee.
 */
export function genererMotDePasseInitial(nom: string): string {
  const initiales =
    nom
      .split(/\s+/)
      .filter(Boolean)
      .map((mot) => mot[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'XX';

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  const aleatoire = Array.from(randomBytes(6))
    .map((octet) => alphabet[octet % alphabet.length])
    .join('');

  return `2CGC-${initiales}${aleatoire}`;
}
