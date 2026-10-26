// src/app/api/commandes/route.ts — Persistance serveur des commandes.
//
// Remplace les upserts Supabase qui etaient emis depuis le navigateur dans
// commandes-store.ts. L'autorisation repose sur le cookie de session verifie.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { Commande } from '@/lib/commandes-store';

const STATUTS = ['nouvelle', 'preparation', 'en_cours', 'livree', 'annulee'];
const STATUTS_PROD = ['a_preparer', 'en_cours', 'prete', 'terminee'];

function texte(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * POST /api/commandes — enregistre un lot de commandes (upsert) et leurs articles.
 *
 * Autorisation : toute session valide. Un client ne peut pousser que des
 * commandes qui lui sont rattachees.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`commandes_${ip}`, { limit: 30, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  let body: { commandes?: Commande[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const commandes = Array.isArray(body.commandes) ? body.commandes : [];
  if (commandes.length === 0) {
    return NextResponse.json({ error: 'Aucune commande fournie.' }, { status: 400 });
  }
  if (commandes.length > 200) {
    return NextResponse.json({ error: 'Lot trop volumineux (max 200).' }, { status: 400 });
  }

  // Un client ne peut pas ecrire les commandes d'un tiers.
  if (session.role === 'client') {
    const intrus = commandes.find(
      (c) => (c.client?.email ?? '').toLowerCase() !== session.email.toLowerCase()
    );
    if (intrus) {
      return NextResponse.json(
        { error: 'Ecriture non autorisee sur une commande d un autre client.' },
        { status: 403 }
      );
    }
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: 'Persistance indisponible : SUPABASE_SERVICE_ROLE_KEY non configuree.' },
      { status: 503 }
    );
  }

  const lignes = commandes
    .filter((c) => texte(c.id))
    .map((c) => ({
      id: texte(c.id, 40),
      date: texte(c.date, 40),
      statut: STATUTS.includes(c.statut) ? c.statut : 'nouvelle',
      statut_production: STATUTS_PROD.includes(c.statutProduction) ? c.statutProduction : 'a_preparer',
      total: Number(c.total) || 0,
      client_nom: texte(c.client?.nom),
      client_entreprise: texte(c.client?.entreprise),
      client_email: texte(c.client?.email).toLowerCase(),
      client_telephone: texte(c.client?.telephone, 40),
      client_adresse: texte(c.client?.adresse, 400),
      chauffeur: texte(c.chauffeur) || null,
      signature: c.signature ?? null,
      date_livraison_effective: c.dateLivraisonEffective || null,
    }));

  const { error: errCmd } = await admin.from('commandes').upsert(lignes, { onConflict: 'id' });
  if (errCmd) {
    console.error('[api/commandes] upsert', errCmd.message);
    return NextResponse.json({ error: 'Echec de l enregistrement des commandes.' }, { status: 500 });
  }

  // Articles : remplacement integral par commande (une commande fait autorite
  // sur sa propre liste d'articles).
  for (const cmd of commandes) {
    const id = texte(cmd.id, 40);
    if (!id || !Array.isArray(cmd.articles) || cmd.articles.length === 0) continue;

    await admin.from('commande_articles').delete().eq('commande_id', id);
    const { error: errArt } = await admin.from('commande_articles').insert(
      cmd.articles.slice(0, 100).map((a) => ({
        commande_id: id,
        nom: texte(a.nom),
        quantite: Number(a.quantite) || 0,
        prix: Number(a.prix) || 0,
      }))
    );
    if (errArt) console.error('[api/commandes] articles', id, errArt.message);
  }

  return NextResponse.json({ success: true, enregistrees: lignes.length });
}

/**
 * GET /api/commandes — liste les commandes visibles par la session courante.
 * Un client ne recoit que les siennes ; l'equipe recoit tout.
 */
export async function GET(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  let requete = admin.from('commandes').select('*').order('date', { ascending: false });
  if (session.role === 'client') {
    requete = requete.eq('client_email', session.email.toLowerCase());
  }

  const { data: cmds, error } = await requete;
  if (error) {
    console.error('[api/commandes] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture des commandes.' }, { status: 500 });
  }

  const ids = (cmds ?? []).map((c) => c.id);
  const articlesParCommande = new Map<string, { nom: string; quantite: number; prix: number }[]>();

  if (ids.length > 0) {
    const { data: arts } = await admin
      .from('commande_articles')
      .select('commande_id, nom, quantite, prix')
      .in('commande_id', ids);

    for (const a of arts ?? []) {
      const liste = articlesParCommande.get(a.commande_id) ?? [];
      liste.push({ nom: a.nom, quantite: a.quantite, prix: Number(a.prix) });
      articlesParCommande.set(a.commande_id, liste);
    }
  }

  const commandes: Commande[] = (cmds ?? []).map((c) => ({
    id: c.id,
    date: c.date,
    statut: c.statut,
    statutProduction: c.statut_production,
    total: Number(c.total),
    client: {
      nom: c.client_nom,
      entreprise: c.client_entreprise,
      email: c.client_email,
      telephone: c.client_telephone,
      adresse: c.client_adresse,
    },
    chauffeur: c.chauffeur,
    signature: c.signature,
    dateLivraisonEffective: c.date_livraison_effective,
    articles: articlesParCommande.get(c.id) ?? [],
  }));

  return NextResponse.json({ commandes });
}
