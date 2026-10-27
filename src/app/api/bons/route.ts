// src/app/api/bons/route.ts — Emission et archivage des bons.
//
// Auparavant un bon n'etait qu'un PDF telecharge : rien n'en restait. Son
// numero etait derive de la commande, si bien que reemettre un bon redonnait
// le meme numero et qu'une reedition etait indiscernable de l'original. Les
// numeros divergeaient en outre selon l'ecran qui les composait — l'un d'eux
// produisait meme « BL-2026-undefined » sur les commandes issues du
// configurateur de devis.
//
// Desormais : le numero est attribue par la base, en suite continue et par
// annee ; le bon est archive avec ses lignes, son client et son emetteur ; et
// l'emission d'un bon de livraison decremente le stock dans la meme
// transaction que la verification de disponibilite.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const ROLES_EMISSION = ['dirigeant', 'chef_usine'];

interface LigneBon {
  produitId?: string;
  nom: string;
  quantite: number;
  prix?: number;
}

const texte = (v: unknown, max = 200) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** GET /api/bons?commande=CMD-xxx — archive, filtrable par commande. */
export async function GET(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  let requete = admin.from('bons').select('*').order('emis_le', { ascending: false }).limit(500);

  const commande = req.nextUrl.searchParams.get('commande');
  if (commande) requete = requete.eq('commande_id', commande.trim().slice(0, 60));

  // Un client ne voit que ses propres bons ; l'equipe voit tout.
  if (session.role === 'client') {
    requete = requete.eq('client->>email', session.email.toLowerCase());
  }

  const { data, error } = await requete;
  if (error) {
    console.error('[api/bons] select', error.message);
    return NextResponse.json({ error: 'Echec de la lecture des bons.' }, { status: 500 });
  }

  return NextResponse.json({
    bons: (data ?? []).map((b) => ({
      numero: b.numero,
      type: b.type,
      commandeId: b.commande_id,
      emisPar: b.emis_par,
      emisLe: b.emis_le,
      client: b.client,
      articles: b.articles,
      total: b.total === null ? null : Number(b.total),
      chauffeur: b.chauffeur,
      chauffeurEmail: b.chauffeur_email,
      immatriculation: b.immatriculation,
      signature: b.signature,
      reeditionDe: b.reedition_de,
    })),
  });
}

/**
 * POST /api/bons — emet un bon et lui attribue son numero.
 *
 * Pour un bon de livraison, le stock est verifie et decremente par la meme
 * fonction SQL, donc dans une seule transaction : deux emissions simultanees
 * ne peuvent pas consommer deux fois les memes unites.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`bons_${ip}`, { limit: 30, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session || !ROLES_EMISSION.includes(session.role)) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const type = body.type === 'commande' ? 'commande' : 'livraison';
  const commandeId = texte(body.commandeId, 60);
  if (!commandeId) {
    return NextResponse.json({ error: 'Identifiant de commande requis.' }, { status: 400 });
  }

  const articles: LigneBon[] = Array.isArray(body.articles)
    ? (body.articles as LigneBon[]).slice(0, 100).map((a) => ({
        produitId: texte(a?.produitId, 40) || undefined,
        nom: texte(a?.nom),
        quantite: Math.max(0, Math.round(Number(a?.quantite) || 0)),
        prix: Number.isFinite(Number(a?.prix)) ? Number(a.prix) : undefined,
      }))
    : [];

  if (articles.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne a porter sur le bon.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  // Decrement du stock, uniquement pour une livraison et pour les lignes dont
  // on connait l'identifiant produit. Les commandes anterieures a la
  // migration n'en portent pas : leur stock ne bougera pas, plutot que de
  // deviner le produit a partir de son libelle.
  if (type === 'livraison') {
    const lignesStock = articles
      .filter((a) => a.produitId && a.quantite > 0)
      .map((a) => ({ produit_id: a.produitId, quantite: a.quantite }));

    if (lignesStock.length > 0) {
      const { data: manquants, error: errStock } = await admin.rpc('decrementer_stock', {
        p_lignes: lignesStock,
      });

      if (errStock) {
        console.error('[api/bons] decrementer_stock', errStock.message);
        return NextResponse.json({ error: 'Echec de la mise a jour du stock.' }, { status: 500 });
      }
      if (Array.isArray(manquants) && manquants.length > 0) {
        return NextResponse.json(
          { error: 'Stock insuffisant.', manquants },
          { status: 409 },
        );
      }
    }
  }

  const { data: numeroData, error: errNum } = await admin.rpc('prochain_numero_bon', {
    p_type: type,
  });
  if (errNum || !numeroData) {
    console.error('[api/bons] prochain_numero_bon', errNum?.message);
    return NextResponse.json({ error: 'Echec de l attribution du numero.' }, { status: 500 });
  }

  const client = typeof body.client === 'object' && body.client ? body.client : {};
  const reeditionDe = texte(body.reeditionDe, 40) || null;

  const { error } = await admin.from('bons').insert({
    numero: numeroData,
    type,
    commande_id: commandeId,
    emis_par: session.email,
    client,
    articles,
    total: Number.isFinite(Number(body.total)) ? Number(body.total) : null,
    chauffeur: texte(body.chauffeur, 120) || null,
    chauffeur_email: texte(body.chauffeurEmail, 160).toLowerCase() || null,
    immatriculation: texte(body.immatriculation, 40) || null,
    reedition_de: reeditionDe,
  });

  if (error) {
    console.error('[api/bons] insert', error.message);
    return NextResponse.json({ error: 'Echec de l enregistrement du bon.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, numero: numeroData });
}

/**
 * PATCH /api/bons — attache la signature du receptionnaire a un bon emis.
 *
 * Le chauffeur n'emet pas de bon : il complete celui que l'usine a deja
 * numerote. La signature ne peut etre posee qu'une fois.
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`bons_sig_${ip}`, { limit: 30, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!session || !['chauffeur', 'chef_usine', 'dirigeant'].includes(session.role)) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: { numero?: unknown; signature?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const numero = texte(body.numero, 40);
  const signature = typeof body.signature === 'string' ? body.signature : '';

  if (!numero) {
    return NextResponse.json({ error: 'Numero de bon requis.' }, { status: 400 });
  }
  if (!signature.startsWith('data:image/') || signature.length > 400_000) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Persistance indisponible.' }, { status: 503 });
  }

  const { data: bon, error: errLecture } = await admin
    .from('bons')
    .select('numero, signature, chauffeur_email')
    .eq('numero', numero)
    .maybeSingle();

  if (errLecture) {
    console.error('[api/bons] lecture signature', errLecture.message);
    return NextResponse.json({ error: 'Echec de l enregistrement.' }, { status: 500 });
  }
  if (!bon) {
    return NextResponse.json({ error: 'Bon introuvable.' }, { status: 404 });
  }
  if (bon.signature) {
    return NextResponse.json({ error: 'Ce bon porte deja une signature.' }, { status: 409 });
  }
  // Un chauffeur ne signe que ses propres livraisons.
  if (
    session.role === 'chauffeur' &&
    (bon.chauffeur_email ?? '').toLowerCase() !== session.email.toLowerCase()
  ) {
    return NextResponse.json({ error: 'Livraison non affectee a ce compte.' }, { status: 403 });
  }

  const { error } = await admin.from('bons').update({ signature }).eq('numero', numero);
  if (error) {
    console.error('[api/bons] update signature', error.message);
    return NextResponse.json({ error: 'Echec de l enregistrement.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
