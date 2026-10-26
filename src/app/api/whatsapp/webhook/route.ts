import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { traiterMessageWhatsAppEntrant, WhatsAppIncomingMessage } from '@/lib/whatsapp-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

// Token de vérification configuré dans Meta Developer Portal.
// Aucun repli en dur : un token publié dans le dépôt ne prouve rien.
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

// Secret applicatif Meta, utilisé pour valider X-Hub-Signature-256.
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

/**
 * Valide la signature HMAC-SHA256 que Meta appose sur chaque webhook.
 * Sans cette vérification, n'importe qui peut injecter de faux messages
 * entrants et déclencher des envois sortants facturés.
 */
function signatureMetaValide(rawBody: string, header: string | null): boolean {
  if (!APP_SECRET) {
    console.error('[wa-webhook] WHATSAPP_APP_SECRET non configuré : requête refusée.');
    return false;
  }
  if (!header || !header.startsWith('sha256=')) return false;

  const attendue = crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');

  const fournie = header.slice('sha256='.length);
  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(fournie, 'utf8');
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * GET - Vérification Webhook Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (!VERIFY_TOKEN) {
      console.error('[wa-webhook] WHATSAPP_VERIFY_TOKEN non configuré.');
      return new NextResponse('Forbidden', { status: 403 });
    }
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook WhatsApp Meta vérifié avec succès !');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.json({
    status: 'online',
    service: '2CGC WhatsApp Business API Webhook',
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST - Réception et traitement automatique des messages WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Protection Anti-DDoS & Rate Limiting (max 60 requêtes par minute)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`wa_webhook_${clientIp}`, { limit: 60, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Trop de requêtes webhook' }, { status: 429 });
    }

    // On lit le corps brut : la signature Meta porte sur les octets exacts,
    // un re-encodage JSON invaliderait le HMAC.
    const rawBody = await req.text();

    let body: {
      from?: string;
      text?: string;
      senderName?: string;
      object?: string;
      entry?: Array<{
        changes?: Array<{
          value?: {
            contacts?: Array<{ profile?: { name?: string } }>;
            messages?: Array<{
              from?: string;
              type?: string;
              text?: { body?: string };
            }>;
          };
        }>;
      }>;
    };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    // Chemin « appel direct » : utilisé par le simulateur interne. Ce n'est pas
    // un webhook Meta, il n'est donc pas signé — il exige une session dirigeant.
    if (body.from && body.text) {
      const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
      if (session?.role !== 'dirigeant') {
        return NextResponse.json(
          { error: 'Injection directe réservée au simulateur interne authentifié.' },
          { status: 403 }
        );
      }

      const payload: WhatsAppIncomingMessage = {
        from: String(body.from).slice(0, 40),
        senderName: String(body.senderName || 'Client WhatsApp').slice(0, 120),
        text: String(body.text).slice(0, 4000),
      };

      const result = await traiterMessageWhatsAppEntrant(payload);
      return NextResponse.json(result, { status: 200 });
    }

    // Traitement du format standard Meta WhatsApp Cloud API Webhook : signé.
    if (body.object === 'whatsapp_business_account') {
      if (!signatureMetaValide(rawBody, req.headers.get('x-hub-signature-256'))) {
        console.warn(`[wa-webhook] Signature Meta invalide depuis ${clientIp}`);
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message && message.type === 'text' && message.from) {
        const from = message.from;
        const senderName = value?.contacts?.[0]?.profile?.name || `Client (${from})`;
        const text = message.text?.body || '';

        const result = await traiterMessageWhatsAppEntrant({
          from,
          senderName,
          text,
        });

        return NextResponse.json({ status: 'success', data: result }, { status: 200 });
      }
    }

    return NextResponse.json({ status: 'ignored', message: 'Aucun message texte à traiter' }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors du traitement du Webhook WhatsApp:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
