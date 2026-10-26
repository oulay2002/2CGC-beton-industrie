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

  let body: { id?: unknown; quantiteTonnes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id.trim().slice(0, 80) : '';
  const quantite = Number(body.quantiteTonnes);

  if (!id) {
    return NextResponse.json({ error: 'Identifiant de matiere requis.' }, { status: 400 });
  }
  if (!Number.isFinite(quantite) || quantite < 0) {
    return NextResponse.json({ error: 'Quantite invalide.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { error } = await admin
    .from('stocks_matieres')
    .update({ quantite_tonnes: quantite, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[api/stocks] update', error.message);
    return NextResponse.json({ error: 'Echec de la mise a jour du stock.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
