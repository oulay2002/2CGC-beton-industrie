// src/app/api/crm/relance-whatsapp/route.ts — Relance WhatsApp sortante du CRM.
//
// Le navigateur appelait auparavant /api/whatsapp/n8n-relay en portant lui-meme
// la cle partagee n8n, ce qui publiait ce secret dans le bundle JS. La cle reste
// desormais cote serveur : le navigateur n'envoie que l'intention, authentifiee
// par le cookie de session.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_RELAY_API_KEY = process.env.N8N_RELAY_API_KEY;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_META_ACCESS_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN;

function texte(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`relance_wa_${ip}`, { limit: 30, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de relances. Veuillez patienter.' }, { status: 429 });
  }

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (session?.role !== 'dirigeant') {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: { nom?: unknown; telephone?: unknown; message?: unknown; valeurEstimee?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const nom = texte(body.nom, 120);
  const telephone = texte(body.telephone, 40);
  const message = texte(body.message, 1500);
  const valeur = Number(body.valeurEstimee) || 0;

  if (!telephone) {
    return NextResponse.json({ error: 'Numero de telephone requis.' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Message requis.' }, { status: 400 });
  }

  const telClean = telephone.replace(/\D/g, '');
  const destinataire = telClean.startsWith('225') ? telClean : `225${telClean}`;

  // A) API officielle Meta WhatsApp Cloud, si configuree.
  if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_META_ACCESS_TOKEN) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${WHATSAPP_META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: destinataire,
            type: 'text',
            text: { body: message },
          }),
        }
      );
      if (res.ok) {
        return NextResponse.json({ success: true, mode: 'meta_cloud_api' });
      }
      console.error('[relance-whatsapp] Meta a repondu', res.status);
    } catch (err) {
      console.error('[relance-whatsapp] Meta', err);
    }
  }

  // B) Relais n8n (Hostinger), si configure.
  if (N8N_WEBHOOK_URL && N8N_RELAY_API_KEY) {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-2cgc-api-key': N8N_RELAY_API_KEY,
        },
        body: JSON.stringify({
          action: 'devis',
          client: { nom, telephone },
          articles: [],
          totalHT: valeur,
          totalTTC: valeur,
          notesAgentIA: message,
        }),
      });
      if (res.ok) {
        return NextResponse.json({ success: true, mode: 'n8n_webhook' });
      }
      console.error('[relance-whatsapp] n8n a repondu', res.status);
    } catch (err) {
      console.error('[relance-whatsapp] n8n', err);
    }
  }

  // Aucun canal sortant configure : on le dit, au lieu de pretendre un envoi.
  return NextResponse.json(
    {
      success: false,
      mode: 'non_configure',
      error:
        'Aucun canal WhatsApp sortant configure (WHATSAPP_PHONE_NUMBER_ID / N8N_WEBHOOK_URL).',
    },
    { status: 503 }
  );
}
