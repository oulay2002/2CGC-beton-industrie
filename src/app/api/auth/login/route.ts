// src/app/api/auth/login/route.ts — Authentification serveur.
//
// Remplace l'ancien POST /api/auth/session, qui delivrait un cookie signe pour
// n'importe quel couple {email, role} fourni par l'appelant, sans verifier quoi
// que ce soit. Ici, l'identite est prouvee contre l'empreinte scrypt stockee en
// base avant qu'une session ne soit emise.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  createSessionToken,
  isSessionSecretConfigured,
  COOKIE_NAME,
  SessionPayload,
} from '@/lib/session';
import { verifierMotDePasse } from '@/lib/password';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_ECHECS = 8;
const DUREE_VERROU_MS = 15 * 60 * 1000;

/** Message unique : ne jamais reveler si c'est l'email ou le mot de passe qui est faux. */
const ECHEC = 'Identifiants incorrects.';

/** Ligne `profiles` telle que lue pour l'authentification. */
interface LigneCompte {
  email: string;
  nom: string | null;
  entreprise: string | null;
  telephone: string | null;
  role: SessionPayload['role'];
  password_hash: string | null;
  must_change_password: boolean | null;
  points_fidelite: number | null;
  tarif_special: number | null;
  vehicule: string | null;
  permis: string | null;
  failed_login_count: number | null;
  locked_until: string | null;
}

interface LoginPayload {
  email?: unknown;
  motDePasse?: unknown;
  /** 'client' = Espace Client, 'equipe' = Acces Equipe. Cloisonnement des deux portails. */
  mode?: unknown;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Anti-bruteforce par IP, en complement du verrouillage par compte.
  if (!checkRateLimit(`login_${ip}`, { limit: 10, windowMs: 60 * 1000 }).success) {
    return NextResponse.json(
      { error: 'Trop de tentatives de connexion. Veuillez patienter une minute.' },
      { status: 429 }
    );
  }

  if (!isSessionSecretConfigured()) {
    console.error('[login] AUTH_SECRET absent : aucune session ne peut etre emise.');
    return NextResponse.json(
      { error: 'Service d authentification indisponible. Contactez l administrateur.' },
      { status: 503 }
    );
  }

  let body: LoginPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requete invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const motDePasse = typeof body.motDePasse === 'string' ? body.motDePasse : '';
  const mode = body.mode === 'client' || body.mode === 'equipe' ? body.mode : undefined;

  if (!email || !motDePasse) {
    return NextResponse.json({ error: ECHEC }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    console.error('[login] SUPABASE_SERVICE_ROLE_KEY absente.');
    return NextResponse.json(
      { error: 'Service d authentification indisponible. Contactez l administrateur.' },
      { status: 503 }
    );
  }

  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  const compte = data as LigneCompte | null;

  if (error) {
    console.error('[login] lecture profil', error.message);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  // Compte inexistant : on verifie tout de meme un mot de passe factice pour
  // que le temps de reponse ne trahisse pas l'existence du compte.
  if (!compte) {
    await verifierMotDePasse(motDePasse, 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
    return NextResponse.json({ error: ECHEC }, { status: 401 });
  }

  if (compte.locked_until && new Date(compte.locked_until) > new Date()) {
    return NextResponse.json(
      { error: 'Compte temporairement verrouille apres plusieurs echecs. Reessayez dans quelques minutes.' },
      { status: 423 }
    );
  }

  const valide = await verifierMotDePasse(motDePasse, compte.password_hash);

  if (!valide) {
    const echecs = (compte.failed_login_count ?? 0) + 1;
    await admin
      .from('profiles')
      .update({
        failed_login_count: echecs,
        locked_until:
          echecs >= MAX_ECHECS ? new Date(Date.now() + DUREE_VERROU_MS).toISOString() : null,
      })
      .ilike('email', email);

    return NextResponse.json({ error: ECHEC }, { status: 401 });
  }

  // Cloisonnement strict entre Espace Client et Acces Equipe.
  if (mode === 'client' && compte.role !== 'client') {
    return NextResponse.json(
      { error: "Cet identifiant correspond a un profil collaborateur. Utilisez l'Acces Equipe." },
      { status: 403 }
    );
  }
  if (mode === 'equipe' && compte.role === 'client') {
    return NextResponse.json(
      { error: "Cet identifiant correspond a un compte Client B2B. Utilisez l'Espace Client." },
      { status: 403 }
    );
  }

  await admin
    .from('profiles')
    .update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .ilike('email', email);

  const doitChanger = Boolean(compte.must_change_password);

  const token = await createSessionToken({
    email: compte.email,
    role: compte.role as SessionPayload['role'],
    nom: compte.nom ?? '',
    // Le drapeau voyage dans le jeton signe : le proxy le lit a chaque
    // requete et ne peut pas etre contourne cote navigateur.
    mdp: doitChanger || undefined,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({
    success: true,
    doitChangerMotDePasse: doitChanger,
    user: {
      email: compte.email,
      nom: compte.nom,
      entreprise: compte.entreprise,
      telephone: compte.telephone,
      role: compte.role,
      pointsFidelite: compte.points_fidelite ?? undefined,
      tarifSpecial: compte.tarif_special ?? undefined,
      vehicule: compte.vehicule ?? undefined,
      permis: compte.permis ?? undefined,
    },
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 * 7,
  });

  // Cookie non sensible, lisible par le client pour l'affichage uniquement.
  response.cookies.set({
    name: 'beton_session_role',
    value: compte.role,
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 * 7,
  });

  return response;
}
