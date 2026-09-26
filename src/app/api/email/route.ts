import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || '2CGC Commercial';
const ENTREPRISE_OFFICIAL_EMAIL = 'cheicknaconstruction@gmail.com';

interface EmailPayload {
  to: string;
  sujet: string;
  corps: string;
  html?: string;
  nomDestinataire?: string;
  hp?: string;           // Honeypot anti-bot
  website_url?: string;  // Honeypot anti-bot secondaire
  timestamp?: number;    // Anti-soumission instantanée
}

// Templates HTML email brandés 2CGC
function genererHTML(corps: string, nomDestinataire?: string, htmlContent?: string): string {
  const content = htmlContent
    ? htmlContent
    : corps
        .split('\n')
        .map(l => l.trim())
        .map(l => l ? `<p style="margin:0 0 12px 0;color:#374151;line-height:1.6">${l}</p>` : '<br>')
        .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,43,91,0.10)">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#002B5B 0%,#003d80 100%);padding:32px 40px;text-align:center">
      <div style="background:#FFD700;display:inline-block;padding:8px 20px;border-radius:8px;margin-bottom:16px">
        <span style="font-size:22px;font-weight:900;color:#002B5B;letter-spacing:1px">2CGC</span>
      </div>
      <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:2px">
        Construction &amp; Génie Civil — Daloa, Côte d'Ivoire
      </div>
    </div>

    <!-- Contenu -->
    <div style="padding:36px 40px">
      ${content}
    </div>

    <!-- Séparateur -->
    <div style="height:4px;background:linear-gradient(90deg,#002B5B,#FFD700,#002B5B)"></div>

    <!-- Footer -->
    <div style="background:#F9FAFB;padding:24px 40px;text-align:center">
      <p style="margin:0 0 6px 0;font-size:13px;color:#002B5B">
        <strong>CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL (2CGC SARL Unipersonnel)</strong>
      </p>
      <p style="margin:0 0 4px 0;font-size:11px;color:#6B7280">
        Capital : 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C
      </p>
      <p style="margin:0 0 4px 0;font-size:11px;color:#9CA3AF">
        📍 Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa (Côte d'Ivoire)
      </p>
      <p style="margin:0;font-size:11px;color:#9CA3AF">
        📞 Tel : +225 07 07 62 17 99 / +225 07 07 85 76 29 &nbsp;|&nbsp; 
        📧 <a href="mailto:cheicknaconstruction@gmail.com" style="color:#002B5B;font-weight:bold">cheicknaconstruction@gmail.com</a>
      </p>

      <p style="margin:12px 0 0 0;font-size:11px;color:#D1D5DB">
        Vous recevez cet email car vous avez interagi avec notre site web.
        <a href="#" style="color:#D1D5DB">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Protection Anti-Brute-Force & Rate Limiting par IP (max 5 requêtes par minute)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`email_${clientIp}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter une minute avant de réessayer.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body: EmailPayload = await request.json();
    const { to, sujet, corps, html, nomDestinataire, hp, website_url, timestamp } = body;

    // 2. Détection Honeypot (piège à robots : si le champ caché est rempli, rejeter silencieusement)
    if (hp || website_url) {
      console.warn(`[Anti-Bot] Soumission rejetée (Honeypot détecté) depuis IP : ${clientIp}`);
      return NextResponse.json({ success: true, mode: 'bot_blocked' });
    }

    // 3. Détection de soumission instantanée par robot (< 1.5 seconde après chargement)
    if (timestamp && typeof timestamp === 'number') {
      const elapsed = Date.now() - timestamp;
      if (elapsed < 1500) {
        console.warn(`[Anti-Bot] Soumission trop rapide (${elapsed}ms) rejetée depuis IP : ${clientIp}`);
        return NextResponse.json({ success: true, mode: 'bot_too_fast' });
      }
    }

    if (!to || !sujet || !corps) {
      return NextResponse.json({ error: 'Paramètres manquants (to, sujet, corps requis)' }, { status: 400 });
    }

    // Validation basique de format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return NextResponse.json({ error: 'Adresse email destinataire invalide' }, { status: 400 });
    }

    // 4. Protection contre le relais de spam ouvert (Anti-Open Mail Relay)
    // Seul un dirigeant authentifié peut envoyer à une adresse quelconque.
    // Les requêtes anonymes ne peuvent envoyer qu'à l'entreprise ou recevoir un accusé de réception légitime.
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    const isDirigeant = session && session.role === 'dirigeant';

    const cleanTo = to.trim().toLowerCase();
    const isToCompany = cleanTo === ENTREPRISE_OFFICIAL_EMAIL;
    const sujetLower = sujet.toLowerCase();
    const isReceipt =
      sujetLower.includes('confirmation') ||
      sujetLower.includes('reçu') ||
      sujetLower.includes('receipt') ||
      sujetLower.includes('devis') ||
      sujetLower.includes('proforma') ||
      sujetLower.includes('facture') ||
      sujetLower.includes('bienvenue');

    if (!isDirigeant && !isToCompany && !isReceipt) {
      console.warn(`[Anti-Spam] Tentative d'envoi non autorisé vers : ${to} depuis IP : ${clientIp}`);
      return NextResponse.json({
        error: 'Destination non autorisée. Les messages publics doivent être adressés au service client officiel.',
      }, { status: 403 });
    }

    // Limites de taille pour éviter les abus / buffer overflow
    if (sujet.length > 250) {
      return NextResponse.json({ error: 'Le sujet ne peut excéder 250 caractères' }, { status: 400 });
    }
    if (corps.length > 50000) {
      return NextResponse.json({ error: 'Le corps du message ne peut excéder 50 000 caractères' }, { status: 400 });
    }

    // Mode simulation si pas de clé Resend
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_VOTRE_CLE_ICI') {
      console.log('\n📧 [SIMULATION EMAIL — configurez RESEND_API_KEY pour l\'envoi réel]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`À      : ${to}`);
      console.log(`Sujet  : ${sujet}`);
      console.log(`Corps  :\n${corps.slice(0, 300)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return NextResponse.json({
        success: true,
        mode: 'simulation',
        message: 'Email simulé (configurez RESEND_API_KEY pour l\'envoi réel)',
        emailId: `sim_${Date.now()}`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // MODE PRODUCTION : envoi via Resend
    // Si le domaine FROM n'est pas vérifié, on redirige vers
    // l'adresse admin enregistrée sur Resend (seule autorisée en test)
    // ─────────────────────────────────────────────────────────────
    const adminEmail = process.env.RESEND_ADMIN_EMAIL || '';
    const fromEmail = FROM_EMAIL || 'onboarding@resend.dev';

    // Déterminer le vrai destinataire :
    // Si domaine non vérifié (onboarding@resend.dev), on redirige vers l'admin
    // et on encode le destinataire réel dans le sujet
    const isTestMode = fromEmail === 'onboarding@resend.dev';
    const realTo = isTestMode && adminEmail ? adminEmail : to;
    const finalSujet = isTestMode && adminEmail && to !== adminEmail
      ? `[Pour: ${to}] ${sujet}`
      : sujet;

    console.log(`\n📧 Envoi email Resend → ${realTo} (original: ${to})`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${fromEmail}>`,
        to: [realTo],
        subject: finalSujet,
        html: genererHTML(corps, nomDestinataire, html),
        text: corps,
      }),
    });

    if (!res.ok) {
      const erreur = await res.json();
      console.error('[Resend erreur]', erreur);
      return NextResponse.json({ error: 'Erreur Resend', details: erreur }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      emailId: data.id,
      mode: isTestMode ? 'test_redirect' : 'reel',
      redirectedTo: isTestMode ? realTo : undefined,
    });

  } catch (err) {
    console.error('[Email API erreur]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


// GET — Statut de l'API email
export async function GET() {
  const configured = RESEND_API_KEY && RESEND_API_KEY !== 're_VOTRE_CLE_ICI';
  return NextResponse.json({
    status: 'ok',
    mode: configured ? 'reel' : 'simulation',
    from: configured ? FROM_EMAIL : 'simulation (pas de clé Resend)',
    instructions: configured ? null : 'Ajoutez RESEND_API_KEY dans .env.local pour activer les envois réels',
  });
}
