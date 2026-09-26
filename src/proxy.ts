// src/proxy.ts — Protection des routes privées, contrôle d'accès par rôle + détection de locale i18n

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// ─── i18n ────────────────────────────────────────────────────────────────────
const locales = ['fr', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'fr';

function getLocale(request: NextRequest): Locale {
  const acceptLang = request.headers.get('accept-language') ?? '';
  // Extrait les tags de langue préférés du navigateur
  const preferred = acceptLang
    .split(',')
    .map((s) => s.split(';')[0].trim().split('-')[0].toLowerCase());
  return (preferred.find((l): l is Locale => locales.includes(l as Locale))) ?? defaultLocale;
}

// ─── Routes protégées par rôle ────────────────────────────────────────────────
const ROLE_PROTECTED = ['/dirigeant', '/usine', '/chauffeur', '/client'];

import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignorer les fichiers statiques et les routes Next.js internes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // fichiers avec extension (.png, .pdf, .ico…)
  ) {
    return NextResponse.next();
  }

  // 2. Routes protégées par rôle (strictement vérifiées par token HMAC inviolable)
  const isProtected = ROLE_PROTECTED.some((r) => pathname.startsWith(r));
  if (isProtected) {
    const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySessionToken(sessionToken);

    // Si aucune session valide et signée n'est présente : REDIRECTION STRICTE
    if (!session) {
      const loginUrl = new URL('/connexion', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = session.role;

    if (pathname.startsWith('/dirigeant') && userRole !== 'dirigeant') {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
    if (pathname.startsWith('/usine') && userRole !== 'chef_usine' && userRole !== 'dirigeant') {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
    if (pathname.startsWith('/chauffeur') && userRole !== 'chauffeur' && userRole !== 'dirigeant') {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
    if (pathname.startsWith('/client') && userRole !== 'client' && userRole !== 'dirigeant') {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }

    return NextResponse.next();
  }

  // 3. Routes d'authentification (non traduites)
  if (pathname.startsWith('/connexion') || pathname.startsWith('/inscription')) {
    return NextResponse.next();
  }

  // 4. i18n — vérifier si la locale est déjà dans le chemin
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // 5. Rediriger vers le chemin avec la locale détectée
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    /*
     * Correspondre à toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
