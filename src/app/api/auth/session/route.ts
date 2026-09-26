import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken, COOKIE_NAME, SessionPayload } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, nom } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Données de session incomplètes' }, { status: 400 });
    }

    const validRoles = ['client', 'dirigeant', 'chef_usine', 'chauffeur'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    const token = await createSessionToken({
      email,
      role: role as SessionPayload['role'],
      nom: nom || '',
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true, role });

    // Cookie cryptographique HttpOnly
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7, // 7 jours
    });

    // Cookie non-sensible pour le confort d'affichage client (non utilisé pour la sécurité serveur)
    response.cookies.set({
      name: 'beton_session_role',
      value: role,
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Session terminée' });
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete('beton_session_role');
  return response;
}

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
