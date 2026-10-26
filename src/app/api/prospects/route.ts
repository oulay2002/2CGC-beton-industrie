// src/app/api/prospects/route.ts — Pipeline commercial.
// Données stratégiques : strictement réservé au dirigeant.
//
// Seul point d'entrée du navigateur vers le CRM. La table prospects_crm est en
// deny-all pour anon (migration 003/005) : l'accès se fait ici, via
// service_role, après vérification du cookie de session.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  listerLeads,
  enregistrerLead,
  enregistrerLeads,
  supprimerLead,
  changerStatut,
  ajouterActivite,
  marquerSequenceEnvoyee,
} from '@/lib/crm-server';
import { CRMLead, CRMActivite } from '@/lib/crm-types';

const STATUTS: CRMLead['statut'][] = [
  'nouveau', 'contacte', 'devis_envoye', 'negociation', 'gagne', 'perdu',
];
const SOURCES: CRMLead['source'][] = [
  'site_web', 'chatbot', 'devis_auto', 'whatsapp', 'telephone', 'scraping_btp',
];

async function exigerDirigeant(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  return session?.role === 'dirigeant' ? session : null;
}

function texte(v: unknown, max = 300): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function dateOuNull(v: unknown): string | undefined {
  const s = texte(v, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
}

/**
 * Normalise un lead reçu du client. Le navigateur est une source non fiable :
 * on reconstruit l'objet champ par champ plutôt que de le transmettre tel quel
 * à la base.
 */
function normaliser(brut: Record<string, unknown>): CRMLead | null {
  const id = texte(brut.id, 60);
  if (!id) return null;

  const statut = texte(brut.statut, 30) as CRMLead['statut'];
  const source = texte(brut.source, 30) as CRMLead['source'];

  const activites = Array.isArray(brut.activites) ? brut.activites : [];
  const sequences = Array.isArray(brut.sequences) ? brut.sequences : [];

  return {
    id,
    nom: texte(brut.nom, 200),
    entreprise: texte(brut.entreprise, 200),
    email: texte(brut.email, 200).toLowerCase(),
    telephone: texte(brut.telephone, 40),
    statut: STATUTS.includes(statut) ? statut : 'nouveau',
    source: SOURCES.includes(source) ? source : 'site_web',
    valeurEstimee: Number(brut.valeurEstimee) || 0,
    produitInteresse: texte(brut.produitInteresse, 400) || undefined,
    ville: texte(brut.ville, 120) || undefined,
    notes: texte(brut.notes, 4000) || undefined,
    activites: activites.slice(0, 200).map((a: Record<string, unknown>) => ({
      date: texte(a?.date, 10),
      action: texte(a?.action, 500),
      automatique: Boolean(a?.automatique),
      canal: texte(a?.canal, 20) as CRMLead['activites'][number]['canal'],
    })),
    sequences: sequences.slice(0, 50).map((s: Record<string, unknown>) => ({
      id: texte(s?.id, 80),
      nom: texte(s?.nom, 200),
      statut: texte(s?.statut, 20) as CRMLead['sequences'][number]['statut'],
      datePrevu: texte(s?.datePrevu, 10),
      canal: texte(s?.canal, 20) as CRMLead['sequences'][number]['canal'],
      template: texte(s?.template, 60),
    })),
    dateCreation: dateOuNull(brut.dateCreation) ?? new Date().toISOString().split('T')[0],
    derniereRelance: dateOuNull(brut.derniereRelance),
    prochainContact: dateOuNull(brut.prochainContact),
  };
}

/** GET — l'intégralité du pipeline. */
export async function GET(req: NextRequest) {
  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  try {
    return NextResponse.json({ leads: await listerLeads() });
  } catch (err) {
    console.error('[api/prospects] GET', err);
    return NextResponse.json({ error: 'Échec de la lecture du pipeline.' }, { status: 503 });
  }
}

/**
 * POST — crée ou met à jour un lead, ou un lot de leads.
 * Corps accepté : { lead } ou { leads: [...] }.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`prospects_${ip}`, { limit: 90, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  }

  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  let body: { lead?: Record<string, unknown>; leads?: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const bruts = Array.isArray(body.leads) ? body.leads : body.lead ? [body.lead] : [];
  if (bruts.length === 0) {
    return NextResponse.json({ error: 'Aucun prospect fourni.' }, { status: 400 });
  }
  if (bruts.length > 500) {
    return NextResponse.json({ error: 'Lot trop volumineux (max 500).' }, { status: 400 });
  }

  const leads = bruts.map(normaliser).filter((l): l is CRMLead => l !== null);
  if (leads.length === 0) {
    return NextResponse.json({ error: 'Aucun prospect exploitable (id manquant).' }, { status: 400 });
  }

  try {
    if (leads.length === 1) {
      await enregistrerLead(leads[0]);
    } else {
      await enregistrerLeads(leads);
    }
    return NextResponse.json({ success: true, enregistres: leads.length });
  } catch (err) {
    console.error('[api/prospects] POST', err);
    return NextResponse.json({ error: 'Échec de l’enregistrement.' }, { status: 503 });
  }
}

/**
 * PATCH — applique une modification ciblee a un seul lead, cote serveur.
 *
 * Sans cette route, le navigateur devait relire TOUT le pipeline pour changer
 * un statut : mesure a 466 ms pour 200 prospects, et la duree croit avec le
 * nombre de fiches. Ici une seule fiche circule, dans les deux sens.
 *
 * Corps accepte :
 *   { id, statut }                              -> changement de statut
 *   { id, activite: { action, canal } }         -> ajout a l historique
 *   { id, sequenceEnvoyee: { sequenceId, canal } } -> relance marquee envoyee
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`prospects_${ip}`, { limit: 120, windowMs: 60 * 1000 }).success) {
    return NextResponse.json({ error: 'Trop de requetes.' }, { status: 429 });
  }

  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Acces non autorise.' }, { status: 403 });
  }

  let body: {
    id?: unknown;
    statut?: unknown;
    activite?: { action?: unknown; canal?: unknown };
    sequenceEnvoyee?: { sequenceId?: unknown; canal?: unknown };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
  }

  const id = texte(body.id, 60);
  if (!id) {
    return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });
  }

  try {
    let lead: CRMLead | null = null;

    if (body.statut !== undefined) {
      const statut = texte(body.statut, 30) as CRMLead['statut'];
      if (!STATUTS.includes(statut)) {
        return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
      }
      lead = await changerStatut(id, statut);
    } else if (body.activite) {
      const action = texte(body.activite.action, 500);
      if (!action) {
        return NextResponse.json({ error: 'Action requise.' }, { status: 400 });
      }
      lead = await ajouterActivite(
        id,
        action,
        (texte(body.activite.canal, 20) || 'systeme') as CRMActivite['canal']
      );
    } else if (body.sequenceEnvoyee) {
      const sequenceId = texte(body.sequenceEnvoyee.sequenceId, 80);
      if (!sequenceId) {
        return NextResponse.json({ error: 'Identifiant de sequence requis.' }, { status: 400 });
      }
      lead = await marquerSequenceEnvoyee(
        id,
        sequenceId,
        (texte(body.sequenceEnvoyee.canal, 20) || 'email') as CRMActivite['canal']
      );
    } else {
      return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Prospect introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, lead });
  } catch (err) {
    console.error('[api/prospects] PATCH', err);
    return NextResponse.json({ error: 'Echec de la modification.' }, { status: 503 });
  }
}

/** DELETE — retire un lead du pipeline. */
export async function DELETE(req: NextRequest) {
  if (!(await exigerDirigeant(req))) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  const id = (req.nextUrl.searchParams.get('id') ?? '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Paramètre id requis.' }, { status: 400 });
  }

  try {
    await supprimerLead(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/prospects] DELETE', err);
    return NextResponse.json({ error: 'Échec de la suppression.' }, { status: 503 });
  }
}
