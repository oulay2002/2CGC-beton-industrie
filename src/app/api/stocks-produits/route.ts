// src/app/api/stocks-produits/route.ts — Stocks de produits finis.
//
// Jusqu'ici ces stocks n'existaient que dans l'etat React de l'ecran usine :
// perdus au rechargement, invisibles d'un poste a l'autre, et le test de
// disponibilite se repliait sur « 1000 unites » des qu'un nom manquait a sa
// table codee en dur. Ils vivent desormais en base, indexes par identifiant
// de produit et non par libelle.
//
// Reserve a l'equipe de production, comme les matieres premieres.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const ROLES_PRODUCTION = ['dirigeant', 'chef_usine'];

async function exigerProduction(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  return session && ROLES_PRODUCTION.includes(session.role) ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await exigerProduction(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('stocks_produits')
    .select('*')
    .order('categorie')
    .order('nom');

  if (error) {
    console.error('[api/stocks-produits] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture des stocks.' }, { status: 500 });
  }

  return NextResponse.json({
    stocks: (data ?? []).map((s) => ({
      produitId: s.produit_id,
      categorie: s.categorie,
      nom: s.nom,
      quantite: Number(s.quantite),
      seuilAlerte: Number(s.seuil_alerte),
      updatedAt: s.updated_at,
    })),
  });
}

/**
 * PATCH — fixe la quantite d'un produit, ou l'augmente d'un appoint.
 *
 * `quantite` remplace la valeur ; `ajout` s'y additionne. L'appoint sert la
 * production : le chef d'usine declare ce qui sort de presse sans avoir a
 * relire le stock courant, donc sans ecraser ce qu'un autre poste vient
 * d'enregistrer.
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`stocks_produits_${ip}`, { limit: 60, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  if (!(await exigerProduction(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: {
    produitId?: unknown;
    quantite?: unknown;
    ajout?: unknown;
    seuilAlerte?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const produitId = typeof body.produitId === 'string' ? body.produitId.trim().slice(0, 40) : '';
  if (!produitId) {
    return NextResponse.json({ error: 'Identifiant de produit requis.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  // Le seuil se regle independamment de la quantite : deplacer une alerte ne
  // doit pas obliger a ressaisir le stock, ni l'inverse.
  const champs: Record<string, unknown> = {};

  if (body.seuilAlerte !== undefined) {
    const seuil = Number(body.seuilAlerte);
    if (!Number.isFinite(seuil) || seuil < 0 || seuil > 10_000_000) {
      return NextResponse.json({ error: 'Seuil invalide.' }, { status: 400 });
    }
    champs.seuil_alerte = Math.round(seuil);
  }

  let nouvelle: number | null = null;

  if (body.ajout !== undefined) {
    const ajout = Number(body.ajout);
    if (!Number.isFinite(ajout) || ajout <= 0 || ajout > 1_000_000) {
      return NextResponse.json({ error: 'Appoint invalide.' }, { status: 400 });
    }
    const { data: actuel, error: errLecture } = await admin
      .from('stocks_produits')
      .select('quantite')
      .eq('produit_id', produitId)
      .maybeSingle();

    if (errLecture) {
      console.error('[api/stocks-produits] lecture', errLecture.message);
      return NextResponse.json({ error: 'Echec de la mise a jour.' }, { status: 500 });
    }
    if (!actuel) {
      return NextResponse.json({ error: 'Produit inconnu.' }, { status: 404 });
    }
    nouvelle = Number(actuel.quantite) + Math.round(ajout);
  } else if (body.quantite !== undefined) {
    const q = Number(body.quantite);
    if (!Number.isFinite(q) || q < 0 || q > 10_000_000) {
      return NextResponse.json({ error: 'Quantite invalide.' }, { status: 400 });
    }
    nouvelle = Math.round(q);
  }

  if (nouvelle !== null) champs.quantite = nouvelle;

  if (Object.keys(champs).length === 0) {
    return NextResponse.json({ error: 'Rien a mettre a jour.' }, { status: 400 });
  }

  const { error } = await admin
    .from('stocks_produits')
    .update(champs)
    .eq('produit_id', produitId);

  if (error) {
    console.error('[api/stocks-produits] update', error.message);
    return NextResponse.json({ error: 'Echec de la mise a jour du stock.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, quantite: nouvelle ?? undefined });
}
