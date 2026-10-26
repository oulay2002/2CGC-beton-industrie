// src/app/api/prospects/route.ts — Pipeline commercial (table prospects_crm).
// Donnees strategiques : strictement reserve au dirigeant.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const STATUTS = ['nouveau', 'contacte', 'devis_envoye', 'negociation', 'gagne', 'perdu'];

function texte(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function exigerDirigeant(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  return session?.role === 'dirigeant' ? session : null;
}

export async function GET(req: NextRequest) {
  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('prospects_crm')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/prospects] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture du pipeline.' }, { status: 500 });
  }

  return NextResponse.json({
    prospects: (data ?? []).map((p) => ({
      id: p.id,
      entreprise: p.entreprise,
      nomContact: p.nom_contact,
      email: p.email,
      telephone: p.telephone,
      statut: p.statut,
      canalOrigine: p.canal_origine,
      valeurEstimee: Number(p.valeur_estimee),
      notes: p.notes,
      dateCreation: p.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`prospects_${ip}`, { limit: 60, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const statut = texte(body.statut, 30);
  const payload: Record<string, unknown> = {
    entreprise: texte(body.entreprise),
    nom_contact: texte(body.nomContact),
    email: texte(body.email).toLowerCase(),
    telephone: texte(body.telephone, 40),
    statut: STATUTS.includes(statut) ? statut : 'nouveau',
    canal_origine: texte(body.canalOrigine, 60) || 'Site Web',
    valeur_estimee: Number(body.valeurEstimee) || 0,
    notes: texte(body.notes, 4000),
  };

  const id = texte(body.id, 60);
  if (id) payload.id = id;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { error } = await admin.from('prospects_crm').upsert(payload);
  if (error) {
    console.error('[api/prospects] upsert', error.message);
    return NextResponse.json({ error: 'Echec de l enregistrement du prospect.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
