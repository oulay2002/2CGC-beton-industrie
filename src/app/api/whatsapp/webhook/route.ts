import { NextRequest, NextResponse } from 'next/server';
import { traiterMessageWhatsAppEntrant, WhatsAppIncomingMessage } from '@/lib/whatsapp-service';

// Token de vérification configuré dans Meta Developer Portal
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '2cgc_whatsapp_secret_token_2026';

/**
 * GET - Vérification Webhook Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
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
    const body = await req.json();

    // Verification si c'est un appel direct (simulateur ou API standard)
    if (body.from && body.text) {
      const payload: WhatsAppIncomingMessage = {
        from: body.from,
        senderName: body.senderName || 'Client WhatsApp',
        text: body.text,
      };

      const result = await traiterMessageWhatsAppEntrant(payload);
      return NextResponse.json(result, { status: 200 });
    }

    // Traitement du format standard Meta WhatsApp Cloud API Webhook
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message && message.type === 'text') {
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
