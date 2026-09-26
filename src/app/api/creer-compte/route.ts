import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || '2CGC Commercial';

interface PayloadCreationCompte {
  nom: string;
  email: string;
  telephone: string;
  role: string;
  entreprise: string;
  motDePasse: string;
  envoyerEmail?: boolean;
}

function genererHTMLBienvenue(data: PayloadCreationCompte): string {
  const roleLabel: Record<string, string> = {
    client: '👤 Client',
    dirigeant: '👔 Dirigeant',
    chef_usine: '🏭 Chef d\'Usine',
    chauffeur: '🚚 Chauffeur',
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,43,91,0.10)">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#002B5B 0%,#003d80 100%);padding:40px;text-align:center">
      <div style="background:#FFD700;display:inline-block;padding:10px 24px;border-radius:10px;margin-bottom:20px">
        <span style="font-size:24px;font-weight:900;color:#002B5B;letter-spacing:1px">2CGC</span>
      </div>
      <div style="color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px">
        Construction &amp; Génie Civil — Daloa, Côte d'Ivoire
      </div>
      <h1 style="color:white;font-size:24px;font-weight:900;margin:20px 0 0 0;">
        ✅ Votre accès est prêt !
      </h1>
    </div>

    <!-- Contenu -->
    <div style="padding:40px">
      <p style="color:#374151;font-size:16px;margin:0 0 8px 0">Bonjour <strong>${data.nom}</strong>,</p>
      <p style="color:#6B7280;font-size:14px;margin:0 0 32px 0">
        Votre compte a été créé sur le portail professionnel 2CGC. Voici vos identifiants de connexion :
      </p>

      <!-- Badge rôle -->
      <div style="background:#F5F5F0;border-radius:12px;padding:8px 16px;display:inline-block;margin-bottom:24px">
        <span style="font-size:13px;font-weight:700;color:#002B5B">${roleLabel[data.role] || data.role}</span>
      </div>

      <!-- Identifiants -->
      <div style="background:linear-gradient(135deg,#002B5B,#003d80);border-radius:16px;padding:28px;margin-bottom:28px">
        <div style="color:#FFD700;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">
          🔐 Vos identifiants de connexion
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:rgba(255,255,255,0.6);font-size:12px;padding:6px 0;width:40%">Email</td>
            <td style="color:white;font-weight:700;font-size:13px;padding:6px 0">${data.email}</td>
          </tr>
          <tr>
            <td style="color:rgba(255,255,255,0.6);font-size:12px;padding:6px 0">Mot de passe</td>
            <td style="color:#FFD700;font-weight:900;font-size:16px;padding:6px 0;letter-spacing:1px">${data.motDePasse}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/connexion"
           style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FFA500);color:#002B5B;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px">
          🚀 Accéder au portail
        </a>
      </div>

      <div style="background:#FFF9E6;border:2px solid #FFD700;border-radius:12px;padding:16px">
        <p style="margin:0;color:#92400E;font-size:13px">
          <strong>⚠️ Sécurité :</strong> Conservez votre mot de passe en lieu sûr. 
          Ne le partagez avec personne. Vous pouvez le changer après votre première connexion.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="height:4px;background:linear-gradient(90deg,#002B5B,#FFD700,#002B5B)"></div>
      <p style="margin:0 0 6px 0;font-size:13px;color:#002B5B"><strong>CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL (2CGC SARL Unipersonnel)</strong></p>
      <p style="margin:0 0 4px 0;font-size:11px;color:#6B7280">SARL Unipersonnel au capital de 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C</p>
      <p style="margin:0;font-size:11px;color:#9CA3AF">📍 Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa &nbsp;|&nbsp; 📞 Tel : +225 07 07 62 17 99 / +225 07 07 85 76 29</p>

  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting anti-bruteforce (max 5 créations par minute par IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`register_${clientIp}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives de création de compte. Veuillez patienter.' },
        { status: 429 }
      );
    }

    const body: PayloadCreationCompte = await request.json();
    const { nom, email, motDePasse, role = 'client', envoyerEmail = true } = body;

    // 2. Vérification d'élévation de privilèges : seuls les dirigeants peuvent créer des comptes staff
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    const isDirigeant = session && session.role === 'dirigeant';

    if (role !== 'client' && !isDirigeant) {
      return NextResponse.json(
        { error: 'Seul un dirigeant authentifié peut créer un compte membre de l\'équipe (dirigeant, usine, chauffeur).' },
        { status: 403 }
      );
    }

    if (!nom || !email || !motDePasse) {
      return NextResponse.json({ error: 'Paramètres manquants (nom, email, motDePasse requis)' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    if (motDePasse.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 6 caractères' }, { status: 400 });
    }

    const rolesAutorises = ['client', 'dirigeant', 'chef_usine', 'chauffeur'];
    if (!rolesAutorises.includes(role)) {
      return NextResponse.json({ error: 'Rôle spécifié invalide' }, { status: 400 });
    }

    if (!envoyerEmail) {
      return NextResponse.json({ success: true, mode: 'sans_email' });
    }

    // Mode simulation si pas de clé
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_VOTRE_CLE_ICI') {
      console.log('\n📧 [SIMULATION — Identifiants de connexion]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`À      : ${email}`);
      console.log(`Nom    : ${nom}`);
      console.log(`MDP    : ${motDePasse}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return NextResponse.json({ success: true, mode: 'simulation' });
    }

    // Envoi réel via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `✅ Votre accès au portail 2CGC est prêt — ${nom}`,
        html: genererHTMLBienvenue(body),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: 'Erreur Resend', details: err }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, emailId: data.id, mode: 'reel' });

  } catch (err) {
    console.error('[creer-compte API]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
