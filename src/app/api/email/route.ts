// src/app/api/email/route.ts — API d'envoi d'emails via Resend

import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || '2CGC Commercial';

interface EmailPayload {
  to: string;
  sujet: string;
  corps: string;
  nomDestinataire: string;
}

// Templates HTML email brandés 2CGC
function genererHTML(corps: string, nomDestinataire: string): string {
  const paragraphes = corps
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
      ${paragraphes}
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
    const body: EmailPayload = await request.json();
    const { to, sujet, corps, nomDestinataire } = body;

    if (!to || !sujet || !corps) {
      return NextResponse.json({ error: 'Paramètres manquants (to, sujet, corps requis)' }, { status: 400 });
    }

    // Validation basique de format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return NextResponse.json({ error: 'Adresse email destinataire invalide' }, { status: 400 });
    }

    // Limites de taille pour éviter les abus / buffer overflow
    if (sujet.length > 200) {
      return NextResponse.json({ error: 'Le sujet ne peut excéder 200 caractères' }, { status: 400 });
    }
    if (corps.length > 10000) {
      return NextResponse.json({ error: 'Le corps du message ne peut excéder 10 000 caractères' }, { status: 400 });
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
        html: genererHTML(corps, nomDestinataire),
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
