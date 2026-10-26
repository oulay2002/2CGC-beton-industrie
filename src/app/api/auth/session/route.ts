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

/** GET — etat de la session courante. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
      nom: session.nom,
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
