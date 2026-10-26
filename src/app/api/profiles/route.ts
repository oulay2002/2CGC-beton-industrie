// src/app/api/profiles/route.ts — Persistance serveur des profils utilisateurs.
//
// Remplace les appels Supabase directs qui etaient faits depuis le navigateur
// dans auth-context.tsx. Depuis la migration 003, la cle anonyme n'a plus aucun
// droit sur la table : seul ce handler, via service_role, peut ecrire, et il
// porte lui-meme le controle d'autorisation.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { hacherMotDePasse, motifRejetMotDePasse } from '@/lib/password';

const ROLES_VALIDES = ['client', 'dirigeant', 'chef_usine', 'chauffeur'] as const;
type RoleValide = (typeof ROLES_VALIDES)[number];

interface ProfilPayload {
  email?: unknown;
  nom?: unknown;
  entreprise?: unknown;
  telephone?: unknown;
  role?: unknown;
  motDePasse?: unknown;
  pointsFidelite?: unknown;
  tarifSpecial?: unknown;
  vehicule?: unknown;
  permis?: unknown;
}

function texte(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function nombre(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * POST /api/profiles — cree ou met a jour un profil.
 *
 * Autorisation :
 *   - un dirigeant authentifie peut ecrire n'importe quel profil ;
 *   - une requete anonyme ne peut creer qu'un profil `client` (auto-inscription),
 *     sous limitation de debit.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`profiles_${ip}`, { limit: 10, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  const isDirigeant = session?.role === 'dirigeant';

  let body: ProfilPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const email = texte(body.email).toLowerCase();
  const role = texte(body.role) as RoleValide;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
  }
  if (!ROLES_VALIDES.includes(role)) {
    return NextResponse.json({ error: 'Role invalide.' }, { status: 400 });
  }

  // Elevation de privileges : seul un dirigeant cree des comptes internes.
  if (role !== 'client' && !isDirigeant) {
    return NextResponse.json(
      { error: 'Seul un dirigeant authentifie peut creer un compte collaborateur.' },
      { status: 403 }
    );
  }

  // Un client authentifie ne peut modifier que son propre profil.
  if (session && session.role === 'client' && session.email.toLowerCase() !== email) {
    return NextResponse.json({ error: 'Modification non autorisee.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Persistance indisponible : SUPABASE_SERVICE_ROLE_KEY non configuree.' },
      { status: 503 }
    );
  }

  const enregistrement: Record<string, unknown> = {
    email,
    nom: texte(body.nom),
    entreprise: texte(body.entreprise),
    telephone: texte(body.telephone, 40),
    role,
    points_fidelite: nombre(body.pointsFidelite),
    tarif_special: nombre(body.tarifSpecial),
    vehicule: texte(body.vehicule) || null,
    permis: texte(body.permis, 40) || null,
  };

  // Le mot de passe n'est jamais stocke tel quel : seule son empreinte scrypt
  // est ecrite, et il ne ressort d'aucun point d'entree de l'API.
  const motDePasse = typeof body.motDePasse === 'string' ? body.motDePasse : '';
  if (motDePasse) {
    const motif = motifRejetMotDePasse(motDePasse);
    if (motif) {
      return NextResponse.json({ error: motif }, { status: 400 });
    }
    enregistrement.password_hash = await hacherMotDePasse(motDePasse);
    enregistrement.must_change_password = true;
    enregistrement.failed_login_count = 0;
    enregistrement.locked_until = null;
  }

  const { error } = await admin.from('profiles').upsert(enregistrement, { onConflict: 'email' });

  if (error) {
    console.error('[api/profiles] upsert', error.message);
    return NextResponse.json({ error: 'Echec de l enregistrement du profil.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * GET /api/profiles — liste les profils. Reserve au dirigeant.
 */
export async function GET(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (session?.role !== 'dirigeant') {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('profiles')
    .select('email, nom, entreprise, telephone, role, points_fidelite, tarif_special, vehicule, permis')
    .order('email');

  if (error) {
    console.error('[api/profiles] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture des profils.' }, { status: 500 });
  }

  return NextResponse.json({ profiles: data ?? [] });
}

/**
 * DELETE /api/profiles?email=... — supprime un profil. Reserve au dirigeant.
 */
export async function DELETE(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (session?.role !== 'dirigeant') {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const email = (req.nextUrl.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Parametre email requis.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { error } = await admin.from('profiles').delete().eq('email', email);
  if (error) {
    console.error('[api/profiles] delete', error.message);
    return NextResponse.json({ error: 'Echec de la suppression.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
