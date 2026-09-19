"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getLeads, updateLeadStatut, CRMLead, CRMSequence,
  ajouterLeadManuellement, ajouterActivite, marquerSequenceEnvoyee,
  genererLienWhatsApp, getSequencesEnAttente, TEMPLATES_EMAIL, TEMPLATES_WHATSAPP,
  importerLeadsScrapes,
} from '@/lib/crm-data';
import { envoyerEmail, getMetriquesBotCommercial, MetriquesBotCommercial } from '@/lib/bot-commercial';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';
import { subscribeToRealtimeChanges } from '@/lib/supabase/services';
import SimulateurWhatsAppModal from '@/components/SimulateurWhatsAppModal';

const COLONNES: { id: CRMLead['statut']; label: string; couleur: string; bg: string; dot: string }[] = [
  { id: 'nouveau', label: 'Nouveau', couleur: 'border-blue-400', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  { id: 'contacte', label: 'Contacté', couleur: 'border-indigo-400', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  { id: 'devis_envoye', label: 'Devis Envoyé', couleur: 'border-yellow-400', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  { id: 'negociation', label: 'Négociation', couleur: 'border-purple-400', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  { id: 'gagne', label: '🎉 Gagné', couleur: 'border-green-400', bg: 'bg-green-50', dot: 'bg-green-500' },
  { id: 'perdu', label: 'Perdu', couleur: 'border-red-400', bg: 'bg-red-50', dot: 'bg-red-500' },
];

const CANAL_ICONS: Record<string, string> = {
  email: '📧', whatsapp: '💬', telephone: '📞', systeme: '⚙️',
};

type Onglet = 'pipeline' | 'scraping' | 'sequences' | 'templates' | 'nouveau_lead';

export default function CRMDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [metriques, setMetriques] = useState<MetriquesBotCommercial | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('pipeline');
  const [leadSelectionne, setLeadSelectionne] = useState<CRMLead | null>(null);
  const [envoyant, setEnvoyant] = useState<string | null>(null);
  const [notif, setNotif] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // États Scraping de prospects BTP
  const [villeScrap, setVilleScrap] = useState('toutes');
  const [secteurScrap, setSecteurScrap] = useState('tous');
  const [motsClesScrap, setMotsClesScrap] = useState('');
  const [prospectsScrapes, setProspectsScrapes] = useState<any[]>([]);
  const [scrapingEnCours, setScrapingEnCours] = useState(false);
  const [sourcesScrapees, setSourcesScrapees] = useState<string[]>([]);
  const [selectionProspects, setSelectionProspects] = useState<string[]>([]);
  const [envoiAutoEnCours, setEnvoiAutoEnCours] = useState(false);
  const [modalWhatsAppQueue, setModalWhatsAppQueue] = useState(false);
  const [indexWhatsAppQueue, setIndexWhatsAppQueue] = useState(0);
  const [modalWhatsAppSimulateur, setModalWhatsAppSimulateur] = useState(false);

  // Nouveau lead form
  const [formNouveauLead, setFormNouveauLead] = useState({
    nom: '', entreprise: '', email: '', telephone: '', produitInteresse: '', valeurEstimee: '', notes: '',
  });

  const chargerDonnees = useCallback(() => {
    const l = getLeads();
    setLeads(l);
    setMetriques(getMetriquesBotCommercial());
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'dirigeant') { router.push('/connexion'); return; }
    chargerDonnees();

    const unsubscribe = subscribeToRealtimeChanges(
      () => chargerDonnees(),
      undefined,
      () => chargerDonnees()
    );

    // ✅ Traitement automatique des séquences email J+0 en attente
    const traiterJ0Auto = async () => {
      const today = new Date().toISOString().split('T')[0];
      const leads = getLeads();
      let nbEnvoyes = 0;
      for (const lead of leads) {
        const seqsJ0 = lead.sequences.filter(
          s => s.statut === 'en_attente' && s.canal === 'email' && s.datePrevu <= today
        );
        for (const seq of seqsJ0) {
          if (!lead.email || lead.email === 'Non renseigné') continue;
          try {
            const ok = await envoyerEmail(lead, seq.template);
            if (ok) {
              marquerSequenceEnvoyee(lead.id, seq.id, 'email');
              nbEnvoyes++;
            }
          } catch (e) {
            // Silencieux — ne pas bloquer l'UI
          }
        }
      }
      if (nbEnvoyes > 0) {
        chargerDonnees();
      }
    };

    const timer = setTimeout(traiterJ0Auto, 1500);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user, isLoading, router, chargerDonnees]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement du CRM...
      </div>
    );
  }

  if (!user || user.role !== 'dirigeant') return null;

  const afficherNotif = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const deplacerLead = (leadId: string, statut: CRMLead['statut']) => {
    updateLeadStatut(leadId, statut);
    chargerDonnees();
    if (leadSelectionne?.id === leadId) setLeadSelectionne(getLeads().find(l => l.id === leadId) || null);
  };

  const handleEnvoyerEmail = async (lead: CRMLead, templateKey: string, seqId?: string) => {
    const key = `${lead.id}-${templateKey}`;
    setEnvoyant(key);
    const ok = await envoyerEmail(lead, templateKey);
    setEnvoyant(null);
    if (ok) {
      if (seqId) {
        marquerSequenceEnvoyee(lead.id, seqId, 'email');
      } else {
        ajouterActivite(lead.id, `📧 Email "${templateKey}" envoyé manuellement`, 'email', false);
        if (lead.statut === 'nouveau') {
          updateLeadStatut(lead.id, 'devis_envoye');
        }
      }
      chargerDonnees();
      afficherNotif(`📧 Email envoyé à ${lead.nom} ! Le lead passe en "Devis Envoyé".`, 'success');
    } else {
      afficherNotif('Erreur lors de l\'envoi (vérifiez RESEND_API_KEY)', 'error');
    }
  };

  const handleLancerAutomationsManuelles = async () => {
    afficherNotif('⚡ Lancement des séquences automatiques J+0 et envoi des emails...', 'info');
    const today = new Date().toISOString().split('T')[0];
    const leads = getLeads();
    let nbEnvoyes = 0;
    for (const lead of leads) {
      const seqsJ0 = lead.sequences.filter(
        s => s.statut === 'en_attente' && s.canal === 'email' && s.datePrevu <= today
      );
      for (const seq of seqsJ0) {
        if (!lead.email || lead.email === 'Non renseigné') continue;
        try {
          const ok = await envoyerEmail(lead, seq.template);
          if (ok) {
            marquerSequenceEnvoyee(lead.id, seq.id, 'email');
            nbEnvoyes++;
          }
        } catch (e) {
          // Silencieux
        }
      }
    }
    chargerDonnees();
    afficherNotif(`✅ ${nbEnvoyes} email(s) envoyé(s) automatiquement ! Pipeline actualisé.`, 'success');
  };

  const handleEnvoyerWhatsApp = (lead: CRMLead, templateKey: string, seqId?: string) => {
    const lien = genererLienWhatsApp(lead.telephone, templateKey, {
      nom: lead.nom,
      produit: lead.produitInteresse || 'nos produits',
    });
    window.open(lien, '_blank');
    if (seqId) marquerSequenceEnvoyee(lead.id, seqId, 'whatsapp');
    else ajouterActivite(lead.id, `💬 WhatsApp "${templateKey}" envoyé manuellement`, 'whatsapp', false);
    chargerDonnees();
    afficherNotif(`💬 WhatsApp ouvert pour ${lead.nom}`, 'info');
  };

  const handleCreerLead = async () => {
    if (!formNouveauLead.nom || !formNouveauLead.email) {
      afficherNotif('Nom et email requis', 'error');
      return;
    }
    const nouveauLead = ajouterLeadManuellement({
      ...formNouveauLead,
      valeurEstimee: parseFloat(formNouveauLead.valeurEstimee) || 0,
      source: 'site_web',
    });
    chargerDonnees();
    setFormNouveauLead({ nom: '', entreprise: '', email: '', telephone: '', produitInteresse: '', valeurEstimee: '', notes: '' });
    setOnglet('pipeline');
    afficherNotif(`✅ Lead "${nouveauLead.nom}" créé ! Envoi de l'email de bienvenue...`, 'info');

    // ✅ Déclenchement automatique de l'email J+0 (bienvenue)
    const seqJ0 = nouveauLead.sequences.find(s => s.template === 'bienvenue' && s.canal === 'email');
    if (seqJ0 && nouveauLead.email) {
      const ok = await envoyerEmail(nouveauLead, 'bienvenue');
      if (ok) {
        marquerSequenceEnvoyee(nouveauLead.id, seqJ0.id, 'email');
        chargerDonnees();
        afficherNotif(`📧 Email de bienvenue envoyé automatiquement à ${nouveauLead.nom} !`, 'success');
      } else {
        afficherNotif(`⚠️ Lead créé, mais l'email J+0 a échoué — vérifiez RESEND_API_KEY`, 'error');
      }
    }
  };


  // =============================================
  // ACTIONS DU MODULE DE SCRAPING BTP
  // =============================================
  const lancerScraping = async () => {
    setScrapingEnCours(true);
    try {
      const params = new URLSearchParams();
      if (villeScrap !== 'toutes') params.append('ville', villeScrap);
      if (secteurScrap !== 'tous') params.append('secteur', secteurScrap);
      if (motsClesScrap.trim()) params.append('motsCles', motsClesScrap.trim());

      const res = await fetch(`/api/prospects/scrape?${params.toString()}`);
      const data = await res.json();
      if (data.succes) {
        setProspectsScrapes(data.prospects);
        setSourcesScrapees(data.sourcesScrapees || []);
        setSelectionProspects(data.prospects.map((p: any) => p.id));
        afficherNotif(`🎯 ${data.totalTrouves} prospects BTP qualifiés extraits !`, 'success');
      } else {
        afficherNotif('Erreur lors de l\'extraction des prospects', 'error');
      }
    } catch {
      afficherNotif('Impossible de contacter le service de scraping', 'error');
    } finally {
      setScrapingEnCours(false);
    }
  };

  const toggleSelectionProspect = (id: string) => {
    setSelectionProspects(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllProspects = () => {
    if (selectionProspects.length === prospectsScrapes.length) {
      setSelectionProspects([]);
    } else {
      setSelectionProspects(prospectsScrapes.map(p => p.id));
    }
  };

  const handleImporterSelection = () => {
    const aImporter = prospectsScrapes.filter(p => selectionProspects.includes(p.id));
    if (aImporter.length === 0) {
      afficherNotif('Veuillez sélectionner au moins un prospect.', 'info');
      return;
    }
    const importes = importerLeadsScrapes(aImporter.map(p => ({
      nom: p.nom,
      entreprise: p.entreprise,
      email: p.email,
      telephone: p.telephone,
      produitInteresse: p.produitInteresse,
      valeurEstimee: p.valeurEstimee,
      ville: p.ville,
      source: 'scraping_btp',
      notes: `Extrait via scraping [${p.source}]. Chantier: ${p.chantiersEnCours || 'N/A'}. Score de fiabilité: ${p.scoreFiabilite}%.`,
    })));

    chargerDonnees();
    afficherNotif(`📥 ${importes.length} nouveaux prospects ajoutés au Pipeline CRM !`, 'success');
  };

  const handleCampagneEmailAuto = async () => {
    const aEnvoyer = prospectsScrapes.filter(p => selectionProspects.includes(p.id) && p.email);
    if (aEnvoyer.length === 0) {
      afficherNotif('Aucun email disponible parmi la sélection.', 'error');
      return;
    }

    // Assurer l'importation préalable dans le CRM
    handleImporterSelection();

    setEnvoiAutoEnCours(true);
    afficherNotif(`🚀 Démarrage de la campagne email (${aEnvoyer.length} prospects BTP)...`, 'info');
    let succes = 0;

    for (const p of aEnvoyer) {
      const mockLead: CRMLead = {
        id: p.id,
        nom: p.nom,
        entreprise: p.entreprise,
        email: p.email,
        telephone: p.telephone,
        statut: 'nouveau',
        valeurEstimee: p.valeurEstimee,
        source: 'scraping_btp',
        produitInteresse: p.produitInteresse,
        activites: [],
        sequences: [],
        dateCreation: new Date().toISOString().split('T')[0],
      };
      const ok = await envoyerEmail(mockLead, 'prospection_b2b');
      if (ok) {
        succes++;
        updateLeadStatut(p.id, 'devis_envoye');
      }
    }

    setEnvoiAutoEnCours(false);
    chargerDonnees();
    afficherNotif(`✉️ ${succes}/${aEnvoyer.length} emails de prospection B2B envoyés ! Les prospects sont passés en "Devis Envoyé".`, 'success');
  };

  const handleLancerWhatsAppQueue = () => {
    const aEnvoyer = prospectsScrapes.filter(p => selectionProspects.includes(p.id) && p.telephone);
    if (aEnvoyer.length === 0) {
      afficherNotif('Aucun numéro WhatsApp dans la sélection.', 'error');
      return;
    }
    // Assurer l'importation préalable dans le CRM
    handleImporterSelection();
    setIndexWhatsAppQueue(0);
    setModalWhatsAppQueue(true);
  };

  const envoyerWhatsAppIndividuel = (p: any) => {
    const lien = genererLienWhatsApp(p.telephone, 'prospection_b2b', {
      nom: p.nom,
      entreprise: p.entreprise,
      produit: p.produitInteresse,
    });
    window.open(lien, '_blank');
    afficherNotif(`💬 WhatsApp ouvert pour ${p.entreprise} (${p.nom})`, 'info');
  };

  // Calculs KPIs
  const pipeline = leads.filter(l => !['gagne', 'perdu'].includes(l.statut));
  const gagnes = leads.filter(l => l.statut === 'gagne');
  const valeurPipeline = pipeline.reduce((s, l) => s + l.valeurEstimee, 0);
  const valeurGagnee = gagnes.reduce((s, l) => s + l.valeurEstimee, 0);
  const tauxConversion = leads.length > 0 ? Math.round((gagnes.length / leads.length) * 100) : 0;
  const sequencesEnAttente = getSequencesEnAttente();

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* ====== HEADER ====== */}
      <header className="bg-[#002B5B] text-white shadow-xl">
        <div className="max-w-full px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dirigeant" className="text-[#FFD700] font-bold hover:underline text-sm">← Dashboard</Link>
            <span className="text-white/30 hidden sm:block">|</span>
            <div>
              <h1 className="text-lg font-black">🤖 CRM Automatisé</h1>
              <div className="text-xs text-white/60">{leads.length} leads · {gagnes.length} gagnés · {tauxConversion}% conversion</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalWhatsAppSimulateur(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-400/30"
              title="Tester et simuler en direct les demandes de devis et commandes WhatsApp"
            >
              <span>💬</span>
              <span>Simulateur WhatsApp Live</span>
            </button>
            <button
              onClick={handleLancerAutomationsManuelles}
              className="bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-3.5 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lancer l'envoi immédiat de toutes les séquences emails J+0 en attente"
            >
              <span>⚡</span>
              <span>Lancer Automations J+0</span>
            </button>
            {metriques && metriques.sequencesEnAttente > 0 && (
              <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold animate-pulse">
                🔔 {metriques.sequencesEnAttente} actions à traiter
              </div>
            )}
            <div className="text-sm text-white/70">{user.nom}</div>
          </div>
        </div>

        {/* Onglets navigation */}
        <div className="px-6 flex gap-1 border-t border-white/10 overflow-x-auto">
          {([
            { id: 'pipeline', label: '📊 Pipeline', badge: null },
            { id: 'scraping', label: '🔍 Scraping & Prospection', badge: 'PRO' },
            { id: 'sequences', label: '🤖 Séquences', badge: sequencesEnAttente.length || null },
            { id: 'templates', label: '📋 Modèles', badge: null },
            { id: 'nouveau_lead', label: '➕ Nouveau Lead', badge: null },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setOnglet(t.id)}
              className={`relative py-3 px-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                onglet === t.id
                  ? 'border-[#FFD700] text-[#FFD700]'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* Notification flottante */}
      {notif && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${
          notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {notif.msg}
        </div>
      )}

      {/* ====== KPI BAR ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 max-w-full">
        {[
          { label: 'Pipeline actif', val: pipeline.length, color: 'border-blue-400', icon: '📊' },
          { label: 'Valeur pipeline', val: formatFCFA(valeurPipeline), color: 'border-yellow-400', icon: '💰' },
          { label: 'Revenus gagnés', val: formatFCFA(valeurGagnee), color: 'border-green-400', icon: '🎉' },
          { label: 'Taux conversion', val: `${tauxConversion}%`, color: 'border-purple-400', icon: '📈' },
          { label: 'Actions bot', val: metriques?.sequencesEnAttente ?? '...', color: 'border-red-400', icon: '🤖' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${k.color}`}>
            <div className="w-9 h-9 rounded-xl bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm flex items-center justify-center text-lg mb-2">{k.icon}</div>
            <div className="text-xs text-gray-500 font-medium">{k.label}</div>
            <div className="text-lg font-black text-[#002B5B] mt-0.5">{k.val}</div>
          </div>
        ))}
      </div>

      {/* ====== ONGLET : PIPELINE KANBAN ====== */}
      {onglet === 'pipeline' && (
        <div className="px-4 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minWidth: 'fit-content' }}>
            {COLONNES.map((col) => {
              const leadsCol = leads.filter(l => l.statut === col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-72">
                  {/* En-tête colonne */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-t-4 ${col.couleur} bg-white mb-0.5`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className="font-black text-[#002B5B] text-sm">{col.label}</h3>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs font-black px-2 py-0.5 rounded-full">{leadsCol.length}</span>
                  </div>

                  {/* Cartes leads */}
                  <div className={`min-h-48 rounded-b-2xl ${col.bg} border border-t-0 ${col.couleur.replace('border-', 'border-').replace('400', '200')} p-2 space-y-2`}>
                    {leadsCol.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setLeadSelectionne(leadSelectionne?.id === lead.id ? null : lead)}
                        className={`bg-white rounded-xl p-3 shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                          leadSelectionne?.id === lead.id ? 'border-[#FFD700] shadow-lg' : 'border-transparent hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {/* Header carte */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.dot}`} />
                            <span className="text-[10px] text-gray-400 font-bold">{lead.id}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            lead.source === 'chatbot' ? 'bg-purple-100 text-purple-700' :
                            lead.source === 'devis_auto' ? 'bg-blue-100 text-blue-700' :
                            lead.source === 'whatsapp' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {lead.source === 'chatbot' ? '🤖 Bot' : lead.source === 'devis_auto' ? '📄 Devis' :
                             lead.source === 'whatsapp' ? '💬 WA' : '🌐 Web'}
                          </span>
                        </div>

                        <h4 className="font-black text-[#002B5B] text-sm leading-tight">{lead.nom}</h4>
                        <p className="text-xs text-gray-500 mb-1">{lead.entreprise}</p>
                        {lead.produitInteresse && (
                          <p className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg mb-2 truncate">{lead.produitInteresse}</p>
                        )}

                        <div className="text-base font-black text-[#FFD700] mb-2">
                          {formatFCFA(lead.valeurEstimee)}
                        </div>

                        {/* Dernière activité */}
                        {lead.activites[0] && (
                          <div className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2 mb-2 leading-tight">
                            <span>{CANAL_ICONS[lead.activites[0].canal || 'systeme']}</span> {lead.activites[0].action.slice(0, 55)}...
                          </div>
                        )}

                        {/* Séquences à traiter */}
                        {lead.sequences.filter(s => s.statut === 'en_attente' && s.datePrevu <= new Date().toISOString().split('T')[0]).length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                            <div className="text-[10px] font-bold text-orange-600">
                              ⏰ {lead.sequences.filter(s => s.statut === 'en_attente' && s.datePrevu <= new Date().toISOString().split('T')[0]).length} action(s) à traiter
                            </div>
                          </div>
                        )}

                        {/* Actions rapides */}
                        <div className="flex gap-1.5 pt-2 border-t border-gray-50">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEnvoyerEmail(lead, 'relance_j2'); }}
                            disabled={envoyant === `${lead.id}-relance_j2`}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {envoyant === `${lead.id}-relance_j2` ? '⏳' : '📧'} Email
                          </button>
                          {lead.telephone && lead.telephone !== 'Non renseigné' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEnvoyerWhatsApp(lead, 'relance'); }}
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                            >
                              💬 WhatsApp
                            </button>
                          )}
                        </div>

                        {/* Sélecteur statut */}
                        <select
                          value={lead.statut}
                          onChange={(e) => { e.stopPropagation(); deplacerLead(lead.id, e.target.value as CRMLead['statut']); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full mt-1.5 text-[10px] border border-gray-200 rounded-lg p-1.5 bg-white focus:border-[#FFD700] focus:outline-none cursor-pointer text-gray-600 font-semibold"
                        >
                          {COLONNES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                    ))}

                    {leadsCol.length === 0 && (
                      <div className="text-center py-10 text-gray-400 text-xs border-2 border-dashed border-gray-300 rounded-xl">
                        Aucun lead
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ====== FICHE LEAD DÉTAILLÉE ====== */}
          {leadSelectionne && (
            <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setLeadSelectionne(null)}>
              <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header fiche */}
                <div className="bg-[#002B5B] rounded-t-3xl px-6 py-5 flex justify-between items-start">
                  <div>
                    <div className="text-xs text-white/50 mb-1">{leadSelectionne.id} · {leadSelectionne.source}</div>
                    <h2 className="text-xl font-black text-white">{leadSelectionne.nom}</h2>
                    <div className="text-white/70 text-sm">{leadSelectionne.entreprise}</div>
                  </div>
                  <button onClick={() => setLeadSelectionne(null)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">✕</button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Infos */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Email', val: leadSelectionne.email, icon: '📧' },
                      { label: 'Téléphone', val: leadSelectionne.telephone, icon: '📞' },
                      { label: 'Valeur estimée', val: formatFCFA(leadSelectionne.valeurEstimee), icon: '💰' },
                      { label: 'Produit', val: leadSelectionne.produitInteresse || '—', icon: '📦' },
                    ].map((inf, i) => (
                      <div key={i} className="bg-[#F5F5F0] rounded-xl p-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{inf.icon} {inf.label}</div>
                        <div className="text-sm font-bold text-[#002B5B] break-all">{inf.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Changer statut */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Statut du lead</label>
                    <select
                      value={leadSelectionne.statut}
                      onChange={(e) => {
                        deplacerLead(leadSelectionne.id, e.target.value as CRMLead['statut']);
                        setLeadSelectionne({ ...leadSelectionne, statut: e.target.value as CRMLead['statut'] });
                      }}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-sm focus:border-[#FFD700] focus:outline-none"
                    >
                      {COLONNES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Actions de contact */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions commerciales</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(TEMPLATES_EMAIL).map(templateKey => (
                        <button
                          key={templateKey}
                          onClick={() => handleEnvoyerEmail(leadSelectionne, templateKey)}
                          disabled={envoyant !== null}
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {envoyant === `${leadSelectionne.id}-${templateKey}` ? '⏳' : '📧'}
                          Email {templateKey.replace(/_/g, ' ')}
                        </button>
                      ))}
                      {leadSelectionne.telephone !== 'Non renseigné' && Object.keys(TEMPLATES_WHATSAPP).map(templateKey => (
                        <button
                          key={`wa-${templateKey}`}
                          onClick={() => handleEnvoyerWhatsApp(leadSelectionne, templateKey)}
                          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          💬 WA {templateKey}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Séquences du lead */}
                  {leadSelectionne.sequences.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Séquences automatiques</div>
                      <div className="space-y-2">
                        {leadSelectionne.sequences.map(seq => (
                          <div key={seq.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                            seq.statut === 'envoyee' ? 'bg-green-50 border-green-200' :
                            seq.statut === 'annulee' ? 'bg-gray-50 border-gray-200 opacity-50' :
                            seq.datePrevu <= new Date().toISOString().split('T')[0]
                              ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <div>
                              <div className="text-xs font-bold text-gray-700">
                                {seq.canal === 'email' ? '📧' : '💬'} {seq.nom}
                              </div>
                              <div className="text-[10px] text-gray-500">Prévu : {seq.datePrevu}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                seq.statut === 'envoyee' ? 'bg-green-500 text-white' :
                                seq.statut === 'annulee' ? 'bg-gray-400 text-white' :
                                'bg-orange-500 text-white'
                              }`}>
                                {seq.statut === 'envoyee' ? '✓ Envoyé' : seq.statut === 'annulee' ? 'Annulé' : '⏰ En attente'}
                              </span>
                              {seq.statut === 'en_attente' && (
                                seq.canal === 'email'
                                  ? <button onClick={() => handleEnvoyerEmail(leadSelectionne, seq.template, seq.id)} className="text-blue-600 text-[10px] font-bold hover:underline">Envoyer →</button>
                                  : <button onClick={() => handleEnvoyerWhatsApp(leadSelectionne, seq.template, seq.id)} className="text-green-600 text-[10px] font-bold hover:underline">Ouvrir WA →</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historique activités */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historique des activités</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {leadSelectionne.activites.map((act, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${
                            act.automatique ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {CANAL_ICONS[act.canal || 'systeme']}
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-700 leading-tight">{act.action}</div>
                            <div className="text-gray-400 text-[10px] mt-0.5">{act.date} · {act.automatique ? '⚙️ Auto' : '👤 Manuel'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== ONGLET : SÉQUENCES ====== */}
      {onglet === 'sequences' && (
        <div className="p-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#002B5B]">🤖 Séquences automatiques à traiter</h2>
              <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-full">{sequencesEnAttente.length} en attente</span>
            </div>
            <div className="divide-y divide-gray-50">
              {sequencesEnAttente.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-sm font-semibold">Tout est à jour ! Aucune séquence en attente.</p>
                </div>
              ) : sequencesEnAttente.map(({ lead, sequence }, i) => (
                <div key={i} className={`p-5 flex items-center justify-between gap-4 ${sequence.datePrevu < new Date().toISOString().split('T')[0] ? 'bg-red-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${sequence.canal === 'email' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {sequence.canal === 'email' ? '📧' : '💬'}
                    </div>
                    <div>
                      <div className="font-black text-[#002B5B] text-sm">{lead.nom} — {sequence.nom}</div>
                      <div className="text-xs text-gray-500">{lead.email} · {lead.telephone}</div>
                      <div className={`text-xs font-bold mt-0.5 ${sequence.datePrevu < new Date().toISOString().split('T')[0] ? 'text-red-600' : 'text-orange-600'}`}>
                        Prévu : {sequence.datePrevu} {sequence.datePrevu < new Date().toISOString().split('T')[0] ? '⚠️ EN RETARD' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {sequence.canal === 'email' ? (
                      <button
                        onClick={() => handleEnvoyerEmail(lead, sequence.template, sequence.id)}
                        disabled={envoyant !== null}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {envoyant ? '⏳...' : '📧 Envoyer maintenant'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnvoyerWhatsApp(lead, sequence.template, sequence.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        💬 Ouvrir WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toutes les séquences par lead */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-black text-[#002B5B]">Toutes les séquences — par lead</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {leads.filter(l => l.sequences.length > 0).map(lead => (
                <div key={lead.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-black text-[#002B5B] text-sm">{lead.nom} · {lead.entreprise}</div>
                      <div className="text-xs text-gray-400">{lead.id} · {formatFCFA(lead.valeurEstimee)}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      lead.statut === 'gagne' ? 'bg-green-100 text-green-700' :
                      lead.statut === 'perdu' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{lead.statut}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.sequences.map(seq => (
                      <div key={seq.id} className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        seq.statut === 'envoyee' ? 'bg-green-100 text-green-700' :
                        seq.statut === 'annulee' ? 'bg-gray-100 text-gray-500' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {seq.canal === 'email' ? '📧' : '💬'} {seq.nom} · {seq.datePrevu}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== ONGLET : MODÈLES ====== */}
      {onglet === 'templates' && (
        <div className="p-4 max-w-4xl mx-auto space-y-5">
          {/* Templates Email */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-black text-[#002B5B]">📧 Modèles Email</h2>
              <p className="text-xs text-gray-400 mt-1">Variables disponibles : {'{nom}'}, {'{produit}'}, {'{montant}'}, {'{date_expiration}'}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(TEMPLATES_EMAIL).map(([key, tpl]) => (
                <div key={key} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">{key}</span>
                    </div>
                  </div>
                  <div className="font-bold text-[#002B5B] text-sm mb-2">✉ {tpl.sujet}</div>
                  <pre className="bg-[#F5F5F0] rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                    {tpl.corps}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Templates WhatsApp */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-black text-[#002B5B]">💬 Modèles WhatsApp</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(TEMPLATES_WHATSAPP).map(([key, msg]) => (
                <div key={key} className="p-5">
                  <span className="bg-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">{key}</span>
                  <pre className="bg-[#F5F5F0] rounded-xl p-4 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans mt-2">
                    {msg}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Statut API email — ACTIF */}
          <div className="bg-[#002B5B] rounded-3xl p-6 text-white">
            <h2 className="text-lg font-black mb-4">⚙️ Configuration API Email — Resend</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="glass rounded-2xl p-4">
                <div className="text-[#FFD700] font-bold text-xs uppercase tracking-wider mb-2">Fournisseur</div>
                <div className="font-bold">Resend (resend.com)</div>
                <div className="text-white/60 text-xs mt-1">3 000 emails/mois gratuits</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-[#FFD700] font-bold text-xs uppercase tracking-wider mb-2">Statut</div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-emerald-400">✅ Actif — Envois réels</span>
                </div>
                <div className="text-white/60 text-xs mt-1">RESEND_API_KEY configurée dans .env.local</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-[#FFD700] font-bold text-xs uppercase tracking-wider mb-2">Expéditeur</div>
                <div className="font-bold text-sm">noreply@2cgc.ci</div>
                <div className="text-white/60 text-xs mt-1">Nom : 2CGC Commercial</div>
              </div>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4 text-sm">
              <div className="font-bold text-emerald-300 mb-1">🚀 Automation active</div>
              <div className="text-white/70 text-xs leading-relaxed">
                Les emails de bienvenue, relance J+2, offre J+7 et confirmations de commande sont envoyés <strong>automatiquement et en temps réel</strong> aux prospects et clients dès les événements déclencheurs.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ====== ONGLET : NOUVEAU LEAD ====== */}
      {onglet === 'nouveau_lead' && (
        <div className="p-4 max-w-2xl mx-auto space-y-4">

          {/* Bandeau informatif — Automatisation */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-black text-sm mb-1">Traitement 100% automatique dès la création</div>
                <div className="text-emerald-100 text-xs leading-relaxed">
                  Dès que vous cliquez sur "Créer", le prospect reçoit automatiquement :
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    { icon: '📧', label: 'Email bienvenue', timing: 'Immédiatement (J+0)' },
                    { icon: '📧', label: 'Relance email', timing: 'Dans 2 jours (J+2)' },
                    { icon: '💬', label: 'WhatsApp relance', timing: 'Dans 5 jours (J+5)' },
                    { icon: '🎁', label: 'Offre spéciale', timing: 'Dans 7 jours (J+7)' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 rounded-xl px-3 py-2">
                      <div className="text-xs font-bold">{s.icon} {s.label}</div>
                      <div className="text-[10px] text-emerald-200">{s.timing}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="text-lg font-black text-[#002B5B]">➕ Ajouter un nouveau lead</h2>
              <p className="text-xs text-gray-400 mt-1">L'email de bienvenue est envoyé <strong>automatiquement</strong> à la création</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { field: 'nom', label: 'Nom complet *', placeholder: 'M. Kouassi Patrick', required: true },
                { field: 'entreprise', label: 'Entreprise', placeholder: 'BTP Horizon SARL' },
                { field: 'email', label: 'Email *', placeholder: 'contact@entreprise.ci', required: true },
                { field: 'telephone', label: 'Téléphone WhatsApp', placeholder: '+225 07 XX XX XX XX' },
                { field: 'produitInteresse', label: 'Produit / Projet', placeholder: 'Ex: Briques 15 Creuse × 500' },
                { field: 'valeurEstimee', label: 'Valeur estimée (FCFA)', placeholder: '1500000' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <input
                    type={field === 'valeurEstimee' ? 'number' : 'text'}
                    value={(formNouveauLead as any)[field]}
                    onChange={(e) => setFormNouveauLead(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  value={formNouveauLead.notes}
                  onChange={(e) => setFormNouveauLead(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires..."
                  rows={3}
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleCreerLead}
                disabled={envoyant !== null}
                className="w-full bg-[#002B5B] disabled:opacity-60 text-white py-4 rounded-2xl font-black text-sm hover:bg-[#FFD700] hover:text-[#002B5B] transition-all duration-300 mt-2 flex items-center justify-center gap-2"
              >
                {envoyant ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Création + envoi email en cours...</>
                ) : (
                  <>🚀 Créer le lead + envoyer l'email de bienvenue</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ====== ONGLET : SCRAPING DE PROSPECTS BTP ====== */}
      {onglet === 'scraping' && (
        <div className="p-4 max-w-7xl mx-auto space-y-6">
          {/* Bannière explicative */}
          <div className="bg-gradient-to-r from-[#001D3D] via-[#002B5B] to-[#08305d] rounded-3xl p-6 text-white shadow-xl border-t-4 border-[#FFD700]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#FFD700]/30 mb-2">
                  <span>⚡</span>
                  <span>Moteur de Prospection & Scraping Intelligent BTP</span>
                </div>
                <h2 className="text-2xl font-black text-white">Extraction & Qualification de Prospects en Côte d'Ivoire</h2>
                <p className="text-sm text-white/80 mt-1 max-w-3xl">
                  Scrapez automatiquement les registres professionnels, marchés publics et chantiers pour détecter les entreprises de BTP, promoteurs et quincailleries ayant besoin de blocs bétons, pavés et bordures 2CGC.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">📍 Daloa & Abidjan</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">💬 Numéros WhatsApp vérifiés</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">✉️ Emails B2B certifiés</span>
              </div>
            </div>

            {/* Barre de commande des critères */}
            <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Ville */}
              <div>
                <label className="block text-[11px] font-bold text-[#FFD700] uppercase tracking-wider mb-1.5">
                  Zone géographique
                </label>
                <select
                  value={villeScrap}
                  onChange={(e) => setVilleScrap(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-sm px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="toutes" className="text-gray-900">🇨🇮 Toute la Côte d'Ivoire</option>
                  <option value="daloa" className="text-gray-900">📍 Daloa (Haut-Sassandra)</option>
                  <option value="abidjan" className="text-gray-900">📍 Abidjan (Cocody, Yopougon...)</option>
                  <option value="san pedro" className="text-gray-900">📍 San Pedro (Bas-Sassandra)</option>
                  <option value="bouake" className="text-gray-900">📍 Bouaké (Gbêkê)</option>
                  <option value="yamoussoukro" className="text-gray-900">📍 Yamoussoukro (District)</option>
                </select>
              </div>

              {/* Secteur */}
              <div>
                <label className="block text-[11px] font-bold text-[#FFD700] uppercase tracking-wider mb-1.5">
                  Secteur cible
                </label>
                <select
                  value={secteurScrap}
                  onChange={(e) => setSecteurScrap(e.target.value)}
                  className="w-full bg-white/10 text-white font-bold text-sm px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="tous" className="text-gray-900">🏗️ Tous les secteurs BTP</option>
                  <option value="btp" className="text-gray-900">🏢 Entreprises Générales & Gros Œuvre</option>
                  <option value="promoteur" className="text-gray-900">🏡 Promoteurs Immobiliers</option>
                  <option value="voirie" className="text-gray-900">🛣️ Voirie, VRD & Travaux Publics</option>
                  <option value="architecte" className="text-gray-900">📐 Architectes & Bureaux d'Études</option>
                  <option value="quincaillerie" className="text-gray-900">🏪 Quincailleries & Négoces Matériaux</option>
                </select>
              </div>

              {/* Mots-clés */}
              <div>
                <label className="block text-[11px] font-bold text-[#FFD700] uppercase tracking-wider mb-1.5">
                  Mots-clés / Projet
                </label>
                <input
                  type="text"
                  value={motsClesScrap}
                  onChange={(e) => setMotsClesScrap(e.target.value)}
                  placeholder="Ex: pavés, école, bordures, villa..."
                  className="w-full bg-white/10 text-white placeholder-white/50 text-sm px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              {/* Bouton Scraping */}
              <div className="flex items-end">
                <button
                  onClick={lancerScraping}
                  disabled={scrapingEnCours}
                  className="w-full bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] font-black py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {scrapingEnCours ? (
                    <>
                      <span className="animate-spin text-base">⏳</span>
                      <span>Scraping en direct...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">🚀</span>
                      <span>Lancer le Scraping</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sources et état */}
          {sourcesScrapees.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-bold text-[#002B5B]">🌐 Sources scannées :</span>
                <span className="text-gray-500">{sourcesScrapees.join(' • ')}</span>
              </div>
              <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ Données vérifiées & enrichies
              </div>
            </div>
          )}

          {/* Résultats du scraping */}
          {prospectsScrapes.length > 0 ? (
            <div className="space-y-4">
              {/* Barre d'action groupée */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#002B5B]">
                    <input
                      type="checkbox"
                      checked={selectionProspects.length === prospectsScrapes.length && prospectsScrapes.length > 0}
                      onChange={toggleSelectAllProspects}
                      className="w-4 h-4 rounded text-[#002B5B] focus:ring-[#FFD700] cursor-pointer"
                    />
                    <span>Sélectionner tout ({selectionProspects.length}/{prospectsScrapes.length})</span>
                  </label>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs font-extrabold text-[#002B5B] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    💰 Potentiel sélection : {formatFCFA(
                      prospectsScrapes
                        .filter(p => selectionProspects.includes(p.id))
                        .reduce((sum, p) => sum + p.valeurEstimee, 0)
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Import CRM */}
                  <button
                    onClick={handleImporterSelection}
                    className="bg-[#002B5B] hover:bg-[#001D3D] text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>📥</span>
                    <span>Importer dans le CRM ({selectionProspects.length})</span>
                  </button>

                  {/* Campagne Email Automatique */}
                  <button
                    onClick={handleCampagneEmailAuto}
                    disabled={envoiAutoEnCours}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    {envoiAutoEnCours ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>✉️</span>
                        <span>Email Partenariat B2B</span>
                      </>
                    )}
                  </button>

                  {/* Campagne WhatsApp */}
                  <button
                    onClick={handleLancerWhatsAppQueue}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>💬</span>
                    <span>WhatsApp B2B ({selectionProspects.length})</span>
                  </button>
                </div>
              </div>

              {/* Grille des fiches prospects */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prospectsScrapes.map((p) => {
                  const estSelectionne = selectionProspects.includes(p.id);
                  const dejaDansCRM = leads.some(l => 
                    (p.email && l.email.toLowerCase() === p.email.toLowerCase()) ||
                    (p.telephone && l.telephone.replace(/\D/g, '') === p.telephone.replace(/\D/g, ''))
                  );

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all flex flex-col justify-between ${
                        estSelectionne ? 'border-[#002B5B] shadow-md' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div>
                        {/* Header carte */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={estSelectionne}
                              onChange={() => toggleSelectionProspect(p.id)}
                              className="mt-1 w-4 h-4 rounded text-[#002B5B] focus:ring-[#FFD700] cursor-pointer"
                            />
                            <div>
                              <h3 className="font-black text-[#002B5B] text-base leading-snug">{p.entreprise}</h3>
                              <p className="text-xs text-gray-500 font-semibold">{p.ville}</p>
                            </div>
                          </label>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ⭐ {p.scoreFiabilite}% match
                            </span>
                            {dejaDansCRM && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                Dans le CRM
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interlocuteur & Titre */}
                        <div className="bg-[#F5F5F0] rounded-xl p-3 mb-3 text-xs space-y-1">
                          <div className="font-bold text-[#002B5B]">👤 {p.nom}</div>
                          <div className="text-gray-500">{p.poste}</div>
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60 font-mono">
                            <span className="text-emerald-700 font-bold">💬 {p.telephone}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-blue-700 truncate max-w-[180px]">{p.email}</span>
                          </div>
                        </div>

                        {/* Détails du besoin */}
                        <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                          <div>
                            <span className="font-bold text-[#002B5B]">🧱 Besoin détecté :</span>{' '}
                            <span className="text-gray-700">{p.produitInteresse}</span>
                          </div>
                          {p.chantiersEnCours && (
                            <div>
                              <span className="font-bold text-amber-800">🏗️ Chantier :</span>{' '}
                              <span className="text-gray-700">{p.chantiersEnCours}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-gray-400">Source : {p.source}</span>
                            <span className="font-black text-[#002B5B] text-sm">{formatFCFA(p.valeurEstimee)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Boutons d'action individuelle */}
                      <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => envoyerWhatsAppIndividuel(p)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1"
                          title="Ouvrir WhatsApp avec proposition personnalisée"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={async () => {
                            const mockLead: CRMLead = {
                              id: p.id,
                              nom: p.nom,
                              entreprise: p.entreprise,
                              email: p.email,
                              telephone: p.telephone,
                              statut: 'nouveau',
                              valeurEstimee: p.valeurEstimee,
                              source: 'scraping_btp',
                              produitInteresse: p.produitInteresse,
                              activites: [],
                              sequences: [],
                              dateCreation: new Date().toISOString().split('T')[0],
                            };
                            const ok = await envoyerEmail(mockLead, 'prospection_b2b');
                            if (ok) {
                              importerLeadsScrapes([mockLead]);
                              chargerDonnees();
                              afficherNotif(`✉️ Email envoyé à ${p.nom} (${p.entreprise}) !`, 'success');
                            } else {
                              afficherNotif('Erreur d\'envoi email (vérifiez la clé API)', 'error');
                            }
                          }}
                          className="bg-[#002B5B] hover:bg-[#001D3D] text-white py-2 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1"
                          title="Envoyer la proposition de partenariat B2B par email"
                        >
                          <span>✉️</span>
                          <span>Email B2B</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* État vide invitant au premier scan */
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-xl font-black text-[#002B5B]">Prêt pour la prospection BTP automatisée</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                Sélectionnez vos critères (Zone géographique, corps de métier ou mots-clés) puis cliquez sur <strong>« Lancer le Scraping »</strong> pour extraire instantanément des entreprises et chantiers qualifiés.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setVilleScrap('daloa');
                    setSecteurScrap('tous');
                    lancerScraping();
                  }}
                  className="bg-[#002B5B] text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#001D3D] transition-all shadow"
                >
                  📍 Lancer un test sur Daloa (Chantiers & BTP locaux)
                </button>
                <button
                  onClick={() => {
                    setVilleScrap('toutes');
                    setSecteurScrap('tous');
                    lancerScraping();
                  }}
                  className="bg-[#FFD700] text-[#002B5B] font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-yellow-400 transition-all shadow"
                >
                  🚀 Scraper tous les prospects BTP en Côte d'Ivoire
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== MODAL FILE D'ATTENTE WHATSAPP AUTOMATISÉE ====== */}
      {modalWhatsAppQueue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-emerald-500 space-y-4">
            {/* Header modal */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-black text-[#002B5B] text-base">Campagne WhatsApp B2B Assistée</h3>
                  <p className="text-xs text-gray-500">
                    Prospect {indexWhatsAppQueue + 1} sur {prospectsScrapes.filter(p => selectionProspects.includes(p.id) && p.telephone).length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalWhatsAppQueue(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Fiche du prospect en cours */}
            {(() => {
              const prospectsQueue = prospectsScrapes.filter(p => selectionProspects.includes(p.id) && p.telephone);
              const pCourant = prospectsQueue[indexWhatsAppQueue];
              if (!pCourant) return null;

              return (
                <div className="space-y-4">
                  <div className="bg-[#F5F5F0] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="font-black text-[#002B5B] text-sm">{pCourant.entreprise}</div>
                    <div className="text-gray-600">
                      Interlocuteur : <strong>{pCourant.nom}</strong> ({pCourant.poste})
                    </div>
                    <div className="text-emerald-700 font-bold font-mono">
                      Numéro WhatsApp : {pCourant.telephone}
                    </div>
                    <div className="text-gray-500">
                      Besoin identifié : {pCourant.produitInteresse} ({pCourant.ville})
                    </div>
                  </div>

                  {/* Aperçu du message */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Aperçu du message personnalisé :
                    </label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-sans whitespace-pre-line max-h-40 overflow-y-auto">
                      {TEMPLATES_WHATSAPP.prospection_b2b
                        .replace(/{nom}/g, pCourant.nom)
                        .replace(/{entreprise}/g, pCourant.entreprise)
                        .replace(/{produit}/g, pCourant.produitInteresse)}
                    </div>
                  </div>

                  {/* Boutons d'action file */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        envoyerWhatsAppIndividuel(pCourant);
                        if (indexWhatsAppQueue < prospectsQueue.length - 1) {
                          setIndexWhatsAppQueue(prev => prev + 1);
                        } else {
                          afficherNotif('🎉 Tous les messages WhatsApp de la sélection ont été traités !', 'success');
                          setModalWhatsAppQueue(false);
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>💬 Envoyer ce message & passer au suivant</span>
                      <span>→</span>
                    </button>

                    {indexWhatsAppQueue < prospectsQueue.length - 1 && (
                      <button
                        onClick={() => setIndexWhatsAppQueue(prev => prev + 1)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors"
                      >
                        Passer
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Simulateur WhatsApp Live */}
      <SimulateurWhatsAppModal
        isOpen={modalWhatsAppSimulateur}
        onClose={() => setModalWhatsAppSimulateur(false)}
        onRefreshData={chargerDonnees}
      />
    </main>
  );
}
