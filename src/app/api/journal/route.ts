// src/app/api/journal/route.ts — Journal des actions automatisees du CRM.
//
// Ce journal vivait dans le `localStorage` du navigateur : propre a chaque
// poste, perdu au vidage du cache, et different entre l'ordinateur et le
// telephone du dirigeant. Pour une trace de relances envoyees et de prospects
// convertis, ce n'etait pas un support acceptable.
//
// Reserve au dirigeant, comme le reste du CRM.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const STATUTS = ['success', 'pending_approval', 'failed'];

const texte = (v: unknown, max = 400) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

async function exigerDirigeant(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  return session?.role === 'dirigeant' ? session : null;
}

/** GET — les 200 dernieres entrees, de la plus recente a la plus ancienne. */
export async function GET(req: NextRequest) {
  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('journal_automatisations')
    .select('*')
    .order('horodatage', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[api/journal] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture du journal.' }, { status: 500 });
  }

  return NextResponse.json({
    entrees: (data ?? []).map((e) => ({
      id: e.id,
      timestamp: e.horodatage,
      agentName: e.agent,
      leadId: e.lead_id ?? undefined,
      leadNom: e.lead_nom ?? undefined,
      actionType: e.type_action,
      thought: e.raisonnement,
      toolUsed: e.outil,
      status: e.statut,
      details: e.details ?? undefined,
    })),
  });
}

/** POST — enregistre une action. L'horodatage et l'emetteur sont poses ici. */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`journal_${ip}`, { limit: 120, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await exigerDirigeant(req);
  if (!session) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const statut = texte(body.status, 20);
  if (!STATUTS.includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { error } = await admin.from('journal_automatisations').insert({
    id: `LOG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`,
    agent: texte(body.agentName, 80) || 'Automatisation',
    lead_id: texte(body.leadId, 60) || null,
    lead_nom: texte(body.leadNom, 120) || null,
    type_action: texte(body.actionType, 40) || 'inconnu',
    raisonnement: texte(body.thought, 1000),
    outil: texte(body.toolUsed, 80) || 'inconnu',
    statut,
    details: typeof body.details === 'object' && body.details ? body.details : null,
    emis_par: session.email,
  });

  if (error) {
    console.error('[api/journal] insert', error.message);
    return NextResponse.json({ error: 'Echec de l enregistrement.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
