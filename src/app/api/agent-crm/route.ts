import { NextRequest, NextResponse } from 'next/server';
import { processCopilotPrompt, getPipelineAnalytics, scoreAllLeads, triggerBulkRelancesExpiress } from '@/lib/crm-agent-engine';

/**
 * POST /api/agent-crm
 * Endpoint pour exécuter les instructions de l'Agent IA CRM (Copilot / Actions Autonomes)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, leadId } = body;

    // Action specifique : Scorage global
    if (action === 'score_all') {
      const scoredLeads = scoreAllLeads();
      return NextResponse.json({
        success: true,
        actionProcessed: 'score_all',
        leads: scoredLeads,
        message: 'Ensemble des prospects réévalués avec succès.'
      });
    }

    // Action specifique : Relances automatiques globales
    if (action === 'bulk_relance') {
      const res = await triggerBulkRelancesExpiress();
      return NextResponse.json({
        success: true,
        actionProcessed: 'bulk_relance',
        details: res,
        message: `${res.relancesCount} relances autonomes exécutées par WhatsApp/Email.`
      });
    }

    // Action specifique : Rapport analytique
    if (action === 'analytics') {
      const analytics = getPipelineAnalytics();
      return NextResponse.json({
        success: true,
        actionProcessed: 'analytics',
        analytics,
      });
    }

    // Traitement d'un prompt conversationnel Copilot
    if (prompt) {
      if (typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Format du prompt invalide.' }, { status: 400 });
      }

      // Limiter la taille du prompt (max 2000 car.) pour prévenir la surconsommation de ressources (DoS)
      const cleanPrompt = prompt.slice(0, 2000).trim();
      if (!cleanPrompt) {
        return NextResponse.json({ error: 'Le prompt ne peut pas être vide.' }, { status: 400 });
      }

      const result = await processCopilotPrompt(cleanPrompt);
      return NextResponse.json({
        success: true,
        actionProcessed: result.actionTaken || 'copilot_response',
        reply: result.reply,
        thought: result.thought,
        details: result.dataDetails || null,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Action ou prompt requis.' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Erreur Agent CRM API:', error);
    return NextResponse.json({
      error: 'Erreur lors du traitement de l\'action agentique',
      details: error.message
    }, { status: 500 });
  }
}
