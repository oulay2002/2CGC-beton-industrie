// src/app/api/profiles/password/route.ts — Changement de mot de passe.
//
// Deux usages :
//   - un dirigeant reinitialise le mot de passe d'un collaborateur ;
//   - un utilisateur change le sien, en prouvant l'ancien.
//
// Dans les deux cas, seule l'empreinte scrypt est ecrite. Aucun point d'entree
// de l'API ne permet de relire un mot de passe : une fois remis a son
// destinataire, il n'est plus consultable.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { hacherMotDePasse, verifierMotDePasse, motifRejetMotDePasse } from '@/lib/password';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`pwd_${ip}`, { limit: 10, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  let body: { email?: unknown; nouveauMotDePasse?: unknown; ancienMotDePasse?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requete invalide.' }, { status: 400 });
  }

  const cible = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const nouveau = typeof body.nouveauMotDePasse === 'string' ? body.nouveauMotDePasse : '';
  const ancien = typeof body.ancienMotDePasse === 'string' ? body.ancienMotDePasse : '';

  if (!cible) {
    return NextResponse.json({ error: 'Email cible requis.' }, { status: 400 });
  }

  const estDirigeant = session.role === 'dirigeant';
  const estSoiMeme = session.email.toLowerCase() === cible;

  if (!estDirigeant && !estSoiMeme) {
    return NextResponse.json(
      { error: 'Vous ne pouvez modifier que votre propre mot de passe.' },
      { status: 403 }
    );
  }

  const motif = motifRejetMotDePasse(nouveau);
  if (motif) {
    return NextResponse.json({ error: motif }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
  }

  // Changement de son propre mot de passe : l'ancien doit etre prouve, sinon un
  // cookie vole suffirait a verrouiller le compte de son proprietaire.
  if (estSoiMeme && !estDirigeant) {
    const { data: compte } = await admin
      .from('profiles')
      .select('password_hash')
      .ilike('email', cible)
      .maybeSingle();

    if (!compte || !(await verifierMotDePasse(ancien, compte.password_hash))) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({
      password_hash: await hacherMotDePasse(nouveau),
      // Un mot de passe choisi par l'utilisateur lui-meme n'a pas a etre change ;
      // celui impose par la direction, si.
      must_change_password: estDirigeant && !estSoiMeme,
      failed_login_count: 0,
      locked_until: null,
    })
    .ilike('email', cible);

  if (error) {
    console.error('[api/profiles/password]', error.message);
    return NextResponse.json({ error: 'Echec de la mise a jour.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
