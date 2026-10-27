// src/app/api/auth/session/route.ts — Lecture et fermeture de session.
//
// IMPORTANT : le POST qui existait ici creait un cookie de session signe pour
// n'importe quel couple {email, role} envoye par l'appelant, sans verifier le
// moindre mot de passe. Une simple requete suffisait a obtenir un acces
// dirigeant complet. Il a ete supprime : l'emission d'une session se fait
// desormais uniquement dans /api/auth/login, apres verification des
// identifiants contre l'empreinte stockee en base.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * GET — etat de la session courante, avec le profil complet.
 *
 * Cette route ne renvoyait que ce que porte le jeton : email, role et nom.
 * Or c'est elle qui restaure l'utilisateur a chaque chargement de page, et le
 * contexte d'authentification comblait les manques par des chaines vides.
 * L'ecran chauffeur affichait donc « undefined • undefined » a la place de son
 * vehicule, et l'espace client ne montrait ni l'entreprise ni l'adresse de
 * livraison, pourtant enregistrees.
 *
 * Le jeton reste volontairement minimal — il est signe et voyage a chaque
 * requete. Le profil se lit donc en base, a partir de l'email qu'il porte.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Repli sur le contenu du jeton : une base indisponible ne doit pas
  // deconnecter l'utilisateur, seulement appauvrir son profil.
  const minimal = { email: session.email, role: session.role, nom: session.nom ?? '' };
  // L'ecran de changement a besoin de savoir si le mot de passe provisoire
  // court encore : sans cela il se represente a l'identique une fois le
  // changement fait, et une ressaisie de l'ancien echoue sans explication.
  const doitChanger = session.mdp === true;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ authenticated: true, doitChangerMotDePasse: doitChanger, user: minimal });
  }

  const { data, error } = await admin
    .from('profiles')
    .select('email, nom, entreprise, telephone, adresse, role, points_fidelite, tarif_special, vehicule, permis')
    .eq('email', session.email.toLowerCase())
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[api/auth/session] profil', error.message);
    return NextResponse.json({ authenticated: true, doitChangerMotDePasse: doitChanger, user: minimal });
  }

  return NextResponse.json({
    authenticated: true,
    doitChangerMotDePasse: doitChanger,
    user: {
      email: data.email,
      nom: data.nom ?? session.nom ?? '',
      entreprise: data.entreprise ?? '',
      telephone: data.telephone ?? '',
      adresse: data.adresse ?? undefined,
      // Le role fait foi cote jeton : il est signe, la ligne ne l'est pas.
      role: session.role,
      pointsFidelite: data.points_fidelite ?? undefined,
      tarifSpecial: data.tarif_special ?? undefined,
      vehicule: data.vehicule ?? undefined,
      permis: data.permis ?? undefined,
    },
  });
}

/** DELETE — deconnexion. */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Session terminee' });
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete('beton_session_role');
  return response;
}

/** POST — supprime. Conserve pour repondre explicitement plutot qu'un 405 muet. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Point d entree supprime pour raison de securite. Utilisez POST /api/auth/login.',
    },
    { status: 410 }
  );
}
