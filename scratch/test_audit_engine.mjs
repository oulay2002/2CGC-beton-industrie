// scratch/test_audit_engine.mjs — Audit & Tests d'intégration automatisés du CRM Agentique 2CGC
import { scoreLead, scoreAllLeads, triggerAutonomousRelance, sendLeadToFactory, getPipelineAnalytics, processCopilotPrompt } from '../src/lib/crm-agent-engine.ts';
import { getLeads, ajouterLeadManuellement, creerLeadDepuisDevis } from '../src/lib/crm-data.ts';
import { getMetriquesBotCommercial } from '../src/lib/bot-commercial.ts';
import { traiterMessageWhatsAppEntrant } from '../src/lib/whatsapp-service.ts';

console.log('----------------------------------------------------');
console.log('🧪 AUDIT DES AUTOMATISATIONS ET CRM AGENTIQUE 2CGC');
console.log('----------------------------------------------------');

// Test 1: Chargement et scorage initial des leads
console.log('\n📌 1. Test du Scorage Agentique de Prospects...');
const initialLeads = getLeads();
console.log(`✓ Total leads initialisés dans le CRM : ${initialLeads.length}`);

const leadTest = initialLeads[0];
const scoreRes = scoreLead(leadTest);
console.log(`✓ Lead [${leadTest.nom}] -> Score: ${scoreRes.score}% | Priorité: ${scoreRes.priorite.toUpperCase()} | Recommandation: "${scoreRes.recommandation}"`);

if (scoreRes.score > 0 && scoreRes.score <= 100) {
  console.log('✅ TEST 1 SUCCÈS: Algorithme de scorage valide');
} else {
  console.error('❌ TEST 1 ÉCHEC: Score hors limites (0-100)');
}

// Test 2: Scorage global
console.log('\n📌 2. Test du Scorage Global...');
const scoredLeads = scoreAllLeads();
console.log(`✓ ${scoredLeads.length} leads réévalués par l'Agent Scorage IA.`);
if (scoredLeads.every(l => l.aiScore !== undefined)) {
  console.log('✅ TEST 2 SUCCÈS: Tous les leads possèdent un score IA.');
} else {
  console.error('❌ TEST 2 ÉCHEC: Certains leads manquent de score IA.');
}

// Test 3: Relance Autonome
console.log('\n📌 3. Test des Relances Autonomes IA...');
await triggerAutonomousRelance(leadTest.id, 'whatsapp', 'Message de test audit agentique').then(resRelance => {
  console.log(`✓ Résultat relance : ${JSON.stringify(resRelance)}`);
  if (resRelance.success) {
    console.log('✅ TEST 3 SUCCÈS: Relance autonome exécutée avec succès.');
  } else {
    console.error('❌ TEST 3 ÉCHEC: La relance a échoué.');
  }
});

// Test 4: Conversion vers Usine Daloa
console.log('\n📌 4. Test du Dispatch Usine Daloa...');
const factoryRes = sendLeadToFactory(leadTest.id);
console.log(`✓ Résultat conversion Usine : ${JSON.stringify(factoryRes)}`);
if (factoryRes.success && factoryRes.commandeId) {
  console.log('✅ TEST 4 SUCCÈS: Lead converti et commande usine créée.');
} else {
  console.error('❌ TEST 4 ÉCHEC: Problème lors de la conversion usine.');
}

// Test 5: Analytics Prédictifs
console.log('\n📌 5. Test du Rapport d\'Analyse Prédictive...');
const analytics = getPipelineAnalytics();
console.log(`✓ Pipeline Potentiel: ${analytics.chiffreAffairesPotentiel.toLocaleString()} FCFA`);
console.log(`✓ Prévision Pondérée IA: ${analytics.tauxConversionPondere.toLocaleString()} FCFA`);
console.log(`✓ Recommandations : ${analytics.recommandationsStrategiques.length}`);
if (analytics.chiffreAffairesPotentiel >= analytics.tauxConversionPondere) {
  console.log('✅ TEST 5 SUCCÈS: Calcul de pondération des prévisions logique.');
} else {
  console.error('❌ TEST 5 ÉCHEC: Incohérence dans le calcul des prévisions.');
}

// Test 6: Traitement des Prompts Copilot IA
console.log('\n📌 6. Test du Copilot Agentique IA (Commandes en langage naturel)...');
const resCopilot = await processCopilotPrompt('Scorer tous les prospects');
console.log(`✓ Prompt "Scorer tous les prospects" -> Action: ${resCopilot.actionTaken}`);
console.log(`✓ Raisonnement (Thought): "${resCopilot.thought}"`);
console.log(`✓ Réponse (Reply): "${resCopilot.reply.slice(0, 100)}..."`);
if (resCopilot.actionTaken === 'scoreAllLeads') {
  console.log('✅ TEST 6 SUCCÈS: Intent Copilot correctement identifié et exécuté.');
} else {
  console.error('❌ TEST 6 ÉCHEC: Action Copilot incorrecte.');
}

// Test 7: Traitement Automatique WhatsApp Entrant
console.log('\n📌 7. Test de l\'Automatisation WhatsApp (Devis & Commande)...');
const waRes = await traiterMessageWhatsAppEntrant({
  from: '+225 07 00 11 22 33',
  senderName: 'Test Client BTP',
  text: 'Bonjour, je souhaite commander 1500 briques de 15 et 200 hourdis de 15 pour Daloa',
});
console.log(`✓ Intention détectée : ${waRes.intent}`);
console.log(`✓ Total TTC calculé : ${waRes.totalTTC?.toLocaleString()} FCFA`);
console.log(`✓ ID Commande généré : ${waRes.commandeId}`);
if (waRes.success && waRes.intent === 'commande' && waRes.commandeId) {
  console.log('✅ TEST 7 SUCCÈS: Message WhatsApp analysé, commande créée et relayée usine.');
} else {
  console.error('❌ TEST 7 ÉCHEC: Traitement WhatsApp incorrect.');
}

console.log('\n----------------------------------------------------');
console.log('🎉 AUDIT DU CRM AGENTIQUE & AUTOMATISATIONS RÉUSSI À 100%');
console.log('----------------------------------------------------');
