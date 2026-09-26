import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || '2CGC Commercial';
const ENTREPRISE_OFFICIAL_EMAIL = 'cheicknaconstruction@gmail.com';

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_META_ACCESS_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_RELAY_API_KEY = process.env.N8N_RELAY_API_KEY || '2cgc_n8n_secret_key_2026';

export interface DevisAutoDispatchPayload {
  reference: string;
  typeDoc?: 'devis' | 'proforma';
  date?: string;
  client: {
    nom: string;
    entreprise?: string;
    telephone: string;
    email: string;
    codePostal?: string;
    adresse?: string;
  };
  lignes: Array<{
    nom: string;
    quantite: number;
    prix: number;
    specification?: string;
  }>;
  recap: {
    totalHT: number;
    tva: number;
    totalTTC: number;
    totalCO2?: number;
  };
  conditions?: {
    validiteJours?: number;
    delaiLivraison?: string;
    modalitePaiement?: string;
  };
  optionLivraison?: boolean;
  zoneNom?: string;
  fraisTransport?: number;
  camionsNecessaires?: number;
  poidsTotalTonnes?: number;
  lang?: string;
}

/**
 * Génère le gabarit HTML premium pour la facture proforma officielle transmise par email
 */
function genererHTMLProforma(data: DevisAutoDispatchPayload): string {
  const isEn = data.lang === 'en';
  const { reference, client, lignes, recap, conditions, optionLivraison, zoneNom, fraisTransport, camionsNecessaires } = data;
  const dateStr = new Date().toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const validiteJours = conditions?.validiteJours || 30;

  const lignesHTML = lignes
    .map(
      (l, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};border-bottom:1px solid #E5E7EB">
      <td style="padding:12px 14px;color:#111827;font-weight:600;font-size:13px">${l.nom}</td>
      <td style="padding:12px 14px;color:#6B7280;font-size:12px">${l.specification || 'Certifié B50/B60'}</td>
      <td style="padding:12px 14px;color:#111827;text-align:center;font-weight:600;font-size:13px">${l.quantite.toLocaleString('fr-FR')}</td>
      <td style="padding:12px 14px;color:#374151;text-align:right;font-size:13px">${Math.round(l.prix).toLocaleString('fr-FR')} FCFA</td>
      <td style="padding:12px 14px;color:#002B5B;text-align:right;font-weight:bold;font-size:13px">${Math.round(l.quantite * l.prix).toLocaleString('fr-FR')} FCFA</td>
    </tr>`
    )
    .join('');

  const transportHTML = optionLivraison
    ? `
    <tr style="background:#EFF6FF;border-bottom:1px solid #BFDBFE">
      <td style="padding:12px 14px;color:#1E40AF;font-weight:700;font-size:13px">
        🚚 ${isEn ? 'Site Freight & Crane Unloading' : 'Fret Chantier & Déchargement Grue'}
      </td>
      <td style="padding:12px 14px;color:#1D4ED8;font-size:12px">
        ${zoneNom || 'Daloa'} (${camionsNecessaires || 1} ${isEn ? 'truck(s) 15T' : 'camion(s) 15T'})
      </td>
      <td style="padding:12px 14px;color:#1E40AF;text-align:center;font-weight:600;font-size:13px">${camionsNecessaires || 1}</td>
      <td style="padding:12px 14px;color:#1E40AF;text-align:right;font-size:13px">
        ${(fraisTransport || 0) === 0 ? (isEn ? 'FREE' : 'OFFERT') : `${Math.round((fraisTransport || 0) / (camionsNecessaires || 1)).toLocaleString('fr-FR')} FCFA`}
      </td>
      <td style="padding:12px 14px;color:#1E40AF;text-align:right;font-weight:bold;font-size:13px">
        ${(fraisTransport || 0) === 0 ? (isEn ? '0 FCFA (FREE)' : '0 FCFA (OFFERTE)') : `${Math.round(fraisTransport || 0).toLocaleString('fr-FR')} FCFA`}
      </td>
    </tr>`
    : '';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;color:#1F2937">
      
      <!-- En-tête de Proforma -->
      <div style="border-bottom:2px solid #002B5B;padding-bottom:18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span style="background:#002B5B;color:#FFD700;font-size:11px;font-weight:bold;letter-spacing:1px;padding:4px 10px;border-radius:4px;text-transform:uppercase">
            ${isEn ? 'Official Proforma Invoice' : 'Facture Proforma Officielle'}
          </span>
          <h2 style="margin:10px 0 4px 0;color:#002B5B;font-size:22px;font-weight:900">
            N° ${reference}
          </h2>
          <p style="margin:0;font-size:12px;color:#6B7280">
            ${isEn ? 'Date of issue' : 'Date d\'émission'} : <strong>${dateStr}</strong> • ${isEn ? 'Validity' : 'Validité'} : <strong>${validiteJours} ${isEn ? 'days' : 'jours'}</strong>
          </p>
        </div>
      </div>

      <!-- Coordonnées Client & Chantier -->
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;color:#002B5B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
          ${isEn ? 'Client & Destination Information' : 'Destinataire & Chantier'}
        </div>
        <table style="width:100%;font-size:13px;color:#374151">
          <tr>
            <td style="padding:3px 0;width:30%;color:#6B7280">${isEn ? 'Client Name' : 'Client / Entreprise'} :</td>
            <td style="padding:3px 0;font-weight:bold;color:#111827">${client.nom} ${client.entreprise && client.entreprise !== client.nom ? `(${client.entreprise})` : ''}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#6B7280">${isEn ? 'Phone / WhatsApp' : 'Téléphone / WhatsApp'} :</td>
            <td style="padding:3px 0;font-weight:bold;color:#002B5B">${client.telephone}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#6B7280">Email :</td>
            <td style="padding:3px 0">${client.email}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#6B7280">${isEn ? 'Site destination' : 'Destination / Ville'} :</td>
            <td style="padding:3px 0;font-weight:600;color:#111827">
              ${client.adresse || client.codePostal || (optionLivraison ? zoneNom : isEn ? '2CGC Daloa Plant Pickup' : 'Retrait Usine Daloa')}
            </td>
          </tr>
        </table>
      </div>

      <!-- Tableau des Lignes du Devis -->
      <div style="overflow-x:auto;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#002B5B;color:#FFFFFF">
              <th style="padding:10px 14px;text-align:left;border-top-left-radius:6px">${isEn ? 'Product' : 'Désignation'}</th>
              <th style="padding:10px 14px;text-align:left">${isEn ? 'Specification' : 'Spécification'}</th>
              <th style="padding:10px 14px;text-align:center">${isEn ? 'Qty' : 'Qté'}</th>
              <th style="padding:10px 14px;text-align:right">${isEn ? 'Unit Price HT' : 'P.U. HT'}</th>
              <th style="padding:10px 14px;text-align:right;border-top-right-radius:6px">${isEn ? 'Total HT' : 'Total HT'}</th>
            </tr>
          </thead>
          <tbody>
            ${lignesHTML}
            ${transportHTML}
          </tbody>
        </table>
      </div>

      <!-- Récapitulatif Financier (HT / TVA / TTC) -->
      <div style="margin-left:auto;max-width:320px;background:#F9FAFB;border:1px solid #D1D5DB;border-radius:10px;padding:16px 20px;margin-bottom:28px">
        <table style="width:100%;font-size:13px">
          <tr>
            <td style="padding:4px 0;color:#4B5563">${isEn ? 'Total excl. VAT (HT)' : 'Total HT'} :</td>
            <td style="padding:4px 0;text-align:right;font-weight:bold;color:#111827">${Math.round(recap.totalHT).toLocaleString('fr-FR')} FCFA</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#4B5563">TVA (18%) :</td>
            <td style="padding:4px 0;text-align:right;color:#4B5563">${Math.round(recap.tva).toLocaleString('fr-FR')} FCFA</td>
          </tr>
          <tr style="border-top:2px solid #002B5B">
            <td style="padding:10px 0 4px 0;font-size:15px;font-weight:900;color:#002B5B">${isEn ? 'Total incl. VAT (TTC)' : 'Net à Payer TTC'} :</td>
            <td style="padding:10px 0 4px 0;text-align:right;font-size:17px;font-weight:900;color:#002B5B">${Math.round(recap.totalTTC).toLocaleString('fr-FR')} FCFA</td>
          </tr>
        </table>
      </div>

      <!-- Modalités de Paiement & RIB Officiel -->
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:18px 20px;margin-bottom:24px">
        <h4 style="margin:0 0 8px 0;color:#92400E;font-size:13px;font-weight:bold">
          💳 ${isEn ? 'Payment Terms & Bank Details' : 'Modalités de Paiement & Coordonnées Bancaires'}
        </h4>
        <p style="margin:0 0 8px 0;font-size:12px;color:#78350F;line-height:1.5">
          ${isEn 
            ? '• 50% deposit upon order confirmation to reserve factory stock.<br>• Remaining balance paid before truck site unloading.'
            : '• <strong>Acompte de 50%</strong> à la commande pour réservation des stocks d\'usine.<br>• <strong>Solde</strong> avant déchargement de la marchandise sur chantier.'}
        </p>
        <p style="margin:0 0 4px 0;font-size:12px;color:#78350F">
          🏦 <strong>BSIC Daloa :</strong> <code style="background:#FEF3C7;padding:2px 6px;border-radius:4px;font-weight:bold">CI154 08521 029041500015 04</code>
        </p>
        <p style="margin:0;font-size:12px;color:#78350F">
          📱 <strong>Mobile Money (Wave / Orange / Moov / MTN) :</strong> <code style="background:#FEF3C7;padding:2px 6px;border-radius:4px;font-weight:bold">+225 07 07 62 17 99</code>
        </p>
      </div>

      <!-- Action WhatsApp Directe -->
      <div style="text-align:center;padding:12px 0 16px 0">
        <a href="https://wa.me/2250707621799?text=${encodeURIComponent(`Bonjour 2CGC, je confirme la réception de ma Proforma ${reference} (${Math.round(recap.totalTTC).toLocaleString('fr-FR')} FCFA). Pouvons-nous valider la commande ?`)}"
           style="background:#25D366;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;font-size:13px;display:inline-block">
          💬 ${isEn ? 'Confirm & Chat with 2CGC on WhatsApp' : 'Confirmer ma Commande sur WhatsApp'}
        </a>
      </div>

    </div>
  `;
}

/**
 * Génère le message texte pour WhatsApp
 */
function genererTexteWhatsApp(data: DevisAutoDispatchPayload): string {
  const isEn = data.lang === 'en';
  const { reference, client, lignes, recap, optionLivraison, zoneNom, fraisTransport, camionsNecessaires } = data;

  const recapArticles = lignes
    .map(l => `• *${l.nom}* × ${l.quantite} = ${Math.round(l.quantite * l.prix).toLocaleString('fr-FR')} FCFA`)
    .join('\n');

  const transportStr = optionLivraison
    ? (fraisTransport || 0) === 0
      ? `\n🚚 *Livraison Chantier :* ${zoneNom || 'Daloa'} (OFFERTE < 24h)`
      : `\n🚚 *Fret Flotte :* ${camionsNecessaires || 1} camion(s) vers ${zoneNom} (${Math.round(fraisTransport || 0).toLocaleString('fr-FR')} FCFA)`
    : `\n🏭 *Retrait :* Enlèvement direct à l'usine 2CGC Daloa`;

  return `📄 *FACTURE PROFORMA N° ${reference} — 2CGC DALOA*

Bonjour ${client.nom} 👋
Votre demande de devis a bien été prise en compte par notre système automatisé :

👤 *Client :* ${client.nom}
📞 *Téléphone :* ${client.telephone}
📍 *Lieu :* ${client.adresse || client.codePostal || zoneNom || 'Daloa'}

📦 *Matériaux sélectionnés :*
${recapArticles}${transportStr}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Total HT :* ${Math.round(recap.totalHT).toLocaleString('fr-FR')} FCFA
🧾 *TVA (18%) :* ${Math.round(recap.tva).toLocaleString('fr-FR')} FCFA
⭐️ *NET À PAYER TTC :* *${Math.round(recap.totalTTC).toLocaleString('fr-FR')} FCFA*
━━━━━━━━━━━━━━━━━━━━━━━━

💳 *Règlement :* Acompte 50% à la commande (BSIC Daloa / Mobile Money)
⏱️ *Délai :* 48h à 72h ouvrées avec déchargement grue
📞 *Direction 2CGC :* +225 07 07 62 17 99 / +225 07 07 85 76 29

_Répondez à ce message pour valider votre commande ou poser vos questions techniques._`;
}

/**
 * POST /api/devis/auto-dispatch
 * Déclenche automatiquement :
 * 1. L'envoi de la facture proforma par Email au client
 * 2. L'envoi de l'alerte commerciale détaillée à l'équipe dirigeante (cheicknaconstruction@gmail.com)
 * 3. L'envoi automatique WhatsApp (via Meta Cloud API ou relais n8n)
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`devis_dispatch_${clientIp}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Trop de requêtes de génération de devis. Veuillez patienter.' }, { status: 429 });
    }

    const body: DevisAutoDispatchPayload = await req.json();
    const { reference, client, lignes, recap } = body;

    if (!reference || !client || !client.email || !client.telephone || !lignes || lignes.length === 0) {
      return NextResponse.json({ error: 'Données de devis incomplètes (reference, client, lignes requis)' }, { status: 400 });
    }

    const isEn = body.lang === 'en';
    const totalTTCFormate = Math.round(recap.totalTTC).toLocaleString('fr-FR');
    const sujetClient = isEn
      ? `📄 Proforma Invoice No. ${reference} — 2CGC Precast Concrete`
      : `📄 Facture Proforma N° ${reference} — 2CGC Béton Industrie Daloa`;

    const htmlContent = genererHTMLProforma(body);
    const whatsappText = genererTexteWhatsApp(body);

    let emailClientEnvoye = false;
    let emailDirectionEnvoye = false;
    let whatsappEnvoye = false;
    let whatsappMode = 'simulation';

    // ─────────────────────────────────────────────────────────────
    // 1. ENVOI AUTOMATIQUE EMAIL AU CLIENT
    // ─────────────────────────────────────────────────────────────
    try {
      if (RESEND_API_KEY && RESEND_API_KEY !== 're_VOTRE_CLE_ICI') {
        const adminEmail = process.env.RESEND_ADMIN_EMAIL || '';
        const fromEmail = FROM_EMAIL || 'onboarding@resend.dev';
        const isTestMode = fromEmail === 'onboarding@resend.dev';
        const realTo = isTestMode && adminEmail ? adminEmail : client.email;
        const finalSujet = isTestMode && adminEmail && client.email !== adminEmail
          ? `[Pour: ${client.email}] ${sujetClient}`
          : sujetClient;

        const resEmail = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${fromEmail}>`,
            to: [realTo],
            subject: finalSujet,
            html: htmlContent,
            text: whatsappText,
          }),
        });

        emailClientEnvoye = resEmail.ok;
      } else {
        console.log(`\n📧 [SIMULATION EMAIL PROFORMA CLIENT] Vers : ${client.email} | Réf : ${reference}`);
        emailClientEnvoye = true;
      }
    } catch (e) {
      console.error('Erreur lors de l\'envoi email client proforma:', e);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ENVOI AUTOMATIQUE EMAIL À LA DIRECTION / SERVICE COMMERCIAL
    // ─────────────────────────────────────────────────────────────
    try {
      const sujetDirection = `🚨 [NOUVEAU DEVIS CRM] ${reference} — ${client.nom} (${totalTTCFormate} FCFA)`;
      const telClean = client.telephone.replace(/\D/g, '');
      const linkWhatsApp = `https://wa.me/${telClean.startsWith('225') ? telClean : `225${telClean}`}?text=${encodeURIComponent(
        `Bonjour ${client.nom}, je suis le Directeur Commercial de 2CGC. J'ai bien reçu votre demande de proforma ${reference} de ${totalTTCFormate} FCFA. Vos matériaux sont disponibles à notre usine de Daloa.`
      )}`;

      const htmlDirection = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;color:#1F2937">
          <div style="background:#002B5B;color:#FFFFFF;padding:16px;border-radius:8px;margin-bottom:20px">
            <h3 style="margin:0;color:#FFD700">🚨 Nouvelle Demande de Devis / Proforma</h3>
            <p style="margin:4px 0 0 0;font-size:13px">Générée en ligne sur la plateforme 2CGC</p>
          </div>

          <table style="width:100%;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:20px">
            <tr><td><strong>Référence :</strong></td><td>${reference}</td></tr>
            <tr><td><strong>Client :</strong></td><td>${client.nom}</td></tr>
            <tr><td><strong>Téléphone :</strong></td><td><a href="tel:${client.telephone}">${client.telephone}</a></td></tr>
            <tr><td><strong>Email :</strong></td><td><a href="mailto:${client.email}">${client.email}</a></td></tr>
            <tr><td><strong>Destination :</strong></td><td>${client.adresse || client.codePostal || body.zoneNom || 'Daloa'}</td></tr>
            <tr><td><strong>Montant Total TTC :</strong></td><td><span style="font-size:16px;color:#002B5B;font-weight:bold">${totalTTCFormate} FCFA</span></td></tr>
          </table>

          <div style="margin-bottom:20px">
            <a href="${linkWhatsApp}" style="background:#25D366;color:#FFF;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:10px">
              💬 Relancer le client sur WhatsApp
            </a>
            <a href="https://2cgc-industries.com/fr/crm" style="background:#002B5B;color:#FFF;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">
              📊 Ouvrir le CRM Dirigeant
            </a>
          </div>

          <div style="border-top:1px solid #E5E7EB;padding-top:14px">
            ${htmlContent}
          </div>
        </div>
      `;

      if (RESEND_API_KEY && RESEND_API_KEY !== 're_VOTRE_CLE_ICI') {
        const fromEmail = FROM_EMAIL || 'onboarding@resend.dev';
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${fromEmail}>`,
            to: [ENTREPRISE_OFFICIAL_EMAIL],
            subject: sujetDirection,
            html: htmlDirection,
            text: `Nouveau devis ${reference} : Client ${client.nom}, Tél: ${client.telephone}, Total TTC: ${totalTTCFormate} FCFA`,
          }),
        });
        emailDirectionEnvoye = true;
      } else {
        console.log(`\n📧 [SIMULATION EMAIL DIRECTION] Vers : ${ENTREPRISE_OFFICIAL_EMAIL} | Sujet : ${sujetDirection}`);
        emailDirectionEnvoye = true;
      }
    } catch (e) {
      console.error('Erreur lors de l\'envoi email direction proforma:', e);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ENVOI / RELAIS AUTOMATIQUE WHATSAPP
    // ─────────────────────────────────────────────────────────────
    const telClean = client.telephone.replace(/\D/g, '');
    const formattedPhone = telClean.startsWith('225') ? telClean : `225${telClean}`;

    // A) Meta WhatsApp Cloud API officiel (si configuré)
    if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_META_ACCESS_TOKEN) {
      try {
        const resWA = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: whatsappText },
          }),
        });

        if (resWA.ok) {
          whatsappEnvoye = true;
          whatsappMode = 'meta_cloud_api';
        }
      } catch (waErr) {
        console.warn('Erreur envoi direct Meta WhatsApp Cloud API:', waErr);
      }
    }

    // B) Webhook n8n (Hostinger) si configuré
    if (!whatsappEnvoye && N8N_WEBHOOK_URL) {
      try {
        const resN8n = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-2cgc-api-key': N8N_RELAY_API_KEY,
          },
          body: JSON.stringify({
            action: 'proforma',
            reference,
            client,
            articles: lignes,
            totalHT: recap.totalHT,
            tva: recap.tva,
            totalTTC: recap.totalTTC,
            whatsappText,
          }),
        });

        if (resN8n.ok) {
          whatsappEnvoye = true;
          whatsappMode = 'n8n_webhook';
        }
      } catch (n8nErr) {
        console.warn('Erreur relais n8n WhatsApp:', n8nErr);
      }
    }

    // Si ni Meta ni n8n ne sont activés en production, on log la simulation
    if (!whatsappEnvoye) {
      console.log(`\n💬 [SIMULATION WHATSAPP AUTOMATIQUE] Vers : +${formattedPhone}`);
      console.log(whatsappText.slice(0, 200) + '...\n');
      whatsappEnvoye = true;
      whatsappMode = 'simulation_directe';
    }

    const whatsappDirectUrl = `https://wa.me/2250707621799?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      reference,
      emailClientEnvoye,
      emailDirectionEnvoye,
      whatsappEnvoye,
      whatsappMode,
      whatsappDirectUrl,
      message: isEn
        ? `Proforma invoice ${reference} automatically dispatched via email and WhatsApp.`
        : `Facture proforma ${reference} transmise automatiquement par email et enregistrée sur WhatsApp.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur dans /api/devis/auto-dispatch:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement automatique du devis', details: error.message }, { status: 500 });
  }
}
