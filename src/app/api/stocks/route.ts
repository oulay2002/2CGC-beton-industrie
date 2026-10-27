// src/app/api/stocks/route.ts — Lecture et mise a jour des stocks.
// Reserve a l'equipe de production (chef d'usine, dirigeant).

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const ROLES_PRODUCTION = ['dirigeant', 'chef_usine'];

export async function GET(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session || !ROLES_PRODUCTION.includes(session.role)) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data, error } = await admin.from('stocks_matieres').select('*').order('nom');
  if (error) {
    console.error('[api/stocks] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture des stocks.' }, { status: 500 });
  }

  return NextResponse.json({
    stocks: (data ?? []).map((s) => ({
      id: s.id,
      nom: s.nom,
      quantiteTonnes: Number(s.quantite_tonnes),
      capaciteMaxTonnes: Number(s.capacite_max_tonnes),
      seuilCritiqueTonnes: Number(s.seuil_critique_tonnes),
      unite: s.unite,
      fournisseur: s.fournisseur,
      consommationMoyenne: s.consommation_moyenne,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`stocks_${ip}`, { limit: 60, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session || !ROLES_PRODUCTION.includes(session.role)) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: {
    id?: unknown;
    quantiteTonnes?: unknown;
    seuilCritiqueTonnes?: unknown;
    capaciteMaxTonnes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id.trim().slice(0, 80) : '';
  if (!id) {
    return NextResponse.json({ error: 'Identifiant de matiere requis.' }, { status: 400 });
  }

  // Trois gestes distincts, et non un seul : livrer un appoint, corriger
  // apres un inventaire physique, ou deplacer le seuil d'alerte. Seul le
  // premier etait possible, ce qui obligeait a tout recalculer de tete.
  const champs: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.quantiteTonnes !== undefined) {
    const quantite = Number(body.quantiteTonnes);
    if (!Number.isFinite(quantite) || quantite < 0 || quantite > 100_000) {
      return NextResponse.json({ error: 'Quantite invalide.' }, { status: 400 });
    }
    champs.quantite_tonnes = quantite;
  }

  if (body.seuilCritiqueTonnes !== undefined) {
    const seuil = Number(body.seuilCritiqueTonnes);
    if (!Number.isFinite(seuil) || seuil < 0 || seuil > 100_000) {
      return NextResponse.json({ error: 'Seuil invalide.' }, { status: 400 });
    }
    champs.seuil_critique_tonnes = seuil;
  }

  if (body.capaciteMaxTonnes !== undefined) {
    const capacite = Number(body.capaciteMaxTonnes);
    if (!Number.isFinite(capacite) || capacite <= 0 || capacite > 100_000) {
      return NextResponse.json({ error: 'Capacite invalide.' }, { status: 400 });
    }
    champs.capacite_max_tonnes = capacite;
  }

  if (Object.keys(champs).length === 1) {
    return NextResponse.json({ error: 'Rien a mettre a jour.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { error } = await admin.from('stocks_matieres').update(champs).eq('id', id);

  if (error) {
    console.error('[api/stocks] update', error.message);
    return NextResponse.json({ error: 'Echec de la mise a jour du stock.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
