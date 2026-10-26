// src/app/api/agent-crm/route.ts — Automatisations CRM côté serveur.
//
// Avant : cette route importait le moteur d'agent, dont l'accès aux données
// passait par localStorage. Exécutée sur le serveur, elle travaillait donc sur
// la liste de démonstration figée et ses écritures étaient perdues, tout en
// répondant « succès ». Elle lit et écrit désormais la base via crm-server.
//
// Le copilote conversationnel, lui, reste dans le navigateur
// (components/crm/CRMAgenticCopilot) : c'est une fonction de tableau de bord,
// pas une automatisation. Cette route ne porte que les traitements par lot,
// appelables par un ordonnanceur.

import { SeverityNumber } from '@opentelemetry/api-logs';
import { after, NextRequest, NextResponse } from 'next/server';
import { loggerProvider, posthogLogExporterLogger } from '@/instrumentation';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { listerLeads, enregistrerLead, marquerSequenceEnvoyee } from '@/lib/crm-server';
import { scorerLeads, getPipelineAnalytics } from '@/lib/crm-agent-engine';
import { TEMPLATES_EMAIL, CRMLead } from '@/lib/crm-types';

const SEUIL_RELANCE_JOURS = 2;

function joursDepuis(date?: string): number {
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

/**
 * Relance les devis stagnants. Contrairement à la version précédente, les
 * changements sont réellement persistés et l'envoi est compté honnêtement :
 * un email qui échoue n'est pas comptabilisé comme envoyé.
 */
async function relancerDevisStagnants(req: NextRequest) {
  const leads = await listerLeads();
  const origine = req.nextUrl.origin;

  const candidats = leads.filter(
    (l) =>
      (l.statut === 'devis_envoye' || l.statut === 'negociation') &&
      joursDepuis(l.derniereRelance ?? l.dateCreation) >= SEUIL_RELANCE_JOURS
  );

  const relances: string[] = [];
  const echecs: string[] = [];

  for (const lead of candidats) {
    if (!lead.email || !lead.email.includes('@')) {
      echecs.push(`${lead.nom} (pas d'email)`);
      continue;
    }

    const template = TEMPLATES_EMAIL.relance_j2;
    const corps = template.corps
      .replace(/{nom}/g, lead.nom)
      .replace(/{entreprise}/g, lead.entreprise || 'votre entreprise')
      .replace(/{produit}/g, lead.produitInteresse || 'nos matériaux')
      .replace(/{montant}/g, (lead.valeurEstimee || 0).toLocaleString('fr-FR'));

    try {
      const res = await fetch(`${origine}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          to: lead.email,
          sujet: template.sujet.replace(/{nom}/g, lead.nom),
          corps,
          nomDestinataire: lead.nom,
        }),
      });

      if (!res.ok) {
        echecs.push(`${lead.nom} (HTTP ${res.status})`);
        continue;
      }

      const dateAuj = new Date().toISOString().split('T')[0];
      const majour: CRMLead = {
        ...lead,
        derniereRelance: dateAuj,
        activites: [
          {
            date: dateAuj,
            action: '🤖 Relance automatique envoyée par email (devis stagnant)',
            automatique: true,
            canal: 'email',
          },
          ...lead.activites,
        ],
      };
      await enregistrerLead(majour);

      const seqDue = lead.sequences.find((s) => s.statut === 'en_attente' && s.canal === 'email');
      if (seqDue) await marquerSequenceEnvoyee(lead.id, seqDue.id, 'email');

      relances.push(lead.nom);
    } catch (err) {
      console.error('[agent-crm] relance', lead.id, err);
      echecs.push(`${lead.nom} (erreur réseau)`);
    }
  }

  return { candidats: candidats.length, relances, echecs };
}

export async function POST(req: NextRequest) {
  try {
    // Réservé au dirigeant.
    const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
    if (!session || session.role !== 'dirigeant') {
      return NextResponse.json(
        { error: "Accès non autorisé. Seul le Dirigeant peut piloter l'Agent CRM." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    if (!checkRateLimit(`crm_${clientIp}`, { limit: 30, windowMs: 60 * 1000 }).success) {
      return NextResponse.json({ error: 'Quota de requêtes dépassé.' }, { status: 429 });
    }

    if (posthogLogExporterLogger) {
      posthogLogExporterLogger.emit({
        body: 'CRM agent request accepted',
        severityNumber: SeverityNumber.INFO,
        attributes: { endpoint: '/api/agent-crm' },
      });
      after(async () => {
        await loggerProvider?.forceFlush();
      });
    }

    const { action } = (await req.json()) as { action?: string };

    if (action === 'score_all') {
      const leads = scorerLeads(await listerLeads());
      return NextResponse.json({
        success: true,
        actionProcessed: 'score_all',
        leads,
        message: `${leads.length} prospects réévalués.`,
      });
    }

    if (action === 'analytics') {
      const leads = scorerLeads(await listerLeads());
      return NextResponse.json({
        success: true,
        actionProcessed: 'analytics',
        analytics: getPipelineAnalytics(leads),
      });
    }

    if (action === 'bulk_relance') {
      const res = await relancerDevisStagnants(req);
      return NextResponse.json({
        success: true,
        actionProcessed: 'bulk_relance',
        details: res,
        message:
          `${res.relances.length} relance(s) envoyée(s) sur ${res.candidats} devis stagnant(s)` +
          (res.echecs.length > 0 ? `, ${res.echecs.length} échec(s).` : '.'),
      });
    }

    return NextResponse.json(
      { error: "Action inconnue. Valeurs acceptées : 'score_all', 'analytics', 'bulk_relance'." },
      { status: 400 }
    );
  } catch (error) {
    console.error('[agent-crm]', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la demande.' },
      { status: 500 }
    );
  }
}
