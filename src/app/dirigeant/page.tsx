"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, Commande } from '@/lib/commandes-store';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';
import { CRMAgenticCopilot } from '@/components/crm/CRMAgenticCopilot';
import { CRMAgenticLogsModal } from '@/components/crm/CRMAgenticLogsModal';

export default function DirigeantDashboard() {
  const { user, logout, creerUtilisateur, getUtilisateurs, isLoading } = useAuth();
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);

  useEffect(() => {
    setCommandes(getCommandes());
    const handleUpdate = () => setCommandes(getCommandes());
    window.addEventListener('commandes_updated', handleUpdate);
    return () => window.removeEventListener('commandes_updated', handleUpdate);
  }, []);

  // Modal d'enregistrement rapide Chauffeur / Chef d'Usine
  const [showModalRapide, setShowModalRapide] = useState(false);
  const [roleRapide, setRoleRapide] = useState<'chauffeur' | 'chef_usine'>('chauffeur');
  const [nomRapide, setNomRapide] = useState('');
  const [telephoneRapide, setTelephoneRapide] = useState('');
  const [vehiculeRapide, setVehiculeRapide] = useState('');
  const [immatriculationRapide, setImmatriculationRapide] = useState('');
  const [notifRapide, setNotifRapide] = useState<string | null>(null);
  const [modalLogsOpen, setModalLogsOpen] = useState(false);
  const [identifiantGenere, setIdentifiantGenere] = useState<{
    role: string;
    nom: string;
    email: string;
    password: string;
    telephone?: string;
  } | null>(null);
  const [copieMdp, setCopieMdp] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'dirigeant') router.push('/connexion');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement de l'espace dirigeant...
      </div>
    );
  }

  if (!user || user.role !== 'dirigeant') return null;

  const handleEnregistrerPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomRapide) return;

    const emailGenere = `${nomRapide.toLowerCase().replace(/[^a-z0-9]/g, '') || 'personnel'}@2cgc-industrie.com`;
    const mdpGenere = `${roleRapide === 'chauffeur' ? 'Chauffeur' : 'Usine'}2026!`;

    const res = creerUtilisateur({
      nom: nomRapide,
      email: emailGenere,
      telephone: telephoneRapide || '+225 07 00 00 00',
      entreprise: '2CGC — Cheickna Construction & Génie Civil',
      password: mdpGenere,
      role: roleRapide,
      vehicule: vehiculeRapide ? `${vehiculeRapide} (${immatriculationRapide || 'Sans immat.'})` : undefined,
      permis: immatriculationRapide || undefined,
    });

    if (res.success) {
      setIdentifiantGenere({
        role: roleRapide,
        nom: nomRapide,
        email: emailGenere,
        password: mdpGenere,
        telephone: telephoneRapide || undefined,
      });
      setNotifRapide(`✅ ${roleRapide === 'chauffeur' ? 'Chauffeur' : "Chef d'Usine"} ${nomRapide} enregistré !`);
      setNomRapide('');
      setTelephoneRapide('');
      setVehiculeRapide('');
      setImmatriculationRapide('');
      setShowModalRapide(false);
    }
  };

  const totalCA = commandes.reduce((sum, c) => sum + c.total, 0);
  const commandesLivrees = commandes.filter(c => c.statut === 'livree').length;
  const commandesEnCours = commandes.filter(c => c.statut === 'en_cours' || c.statut === 'preparation').length;
  const nouvellesCommandes = commandes.filter(c => c.statut === 'nouvelle').length;

  // Calculs Fiscaux & Comptables (TVA 18% CI)
  // total = TTC = HT * 1.18 => HT = TTC / 1.18, TVA = TTC - HT
  const totalHT = Math.round(totalCA / 1.18);
  const totalTVACollectee = Math.round(totalCA - totalHT);

  // Fonction d'export du Grand Livre des Ventes (CSV compatible Excel)
  const exporterJournalVentesCSV = () => {
    const entetes = [
      'Reference Commande',
      'Date Commande',
      'Entreprise Client',
      'Contact Telephone',
      'Adresse / Ville',
      'Chauffeur Assigne',
      'Statut Logistique',
      'Montant HT (FCFA)',
      'TVA 18% (FCFA)',
      'Total TTC (FCFA)',
    ];

    const lignesData = commandes.map(cmd => {
      const montantTTC = cmd.total;
      const montantHT = Math.round(montantTTC / 1.18);
      const montantTVA = montantTTC - montantHT;
      const chauffeur = cmd.chauffeur || 'Flotte 2CGC (À affecter)';
      const statutLabel = cmd.statut === 'livree' ? 'Livree / Emargee' : cmd.statut === 'en_cours' ? 'En acheminement' : cmd.statut === 'preparation' ? 'En fabrication usine' : 'Nouvelle / A valider';

      return [
        `"${cmd.id}"`,
        `"${new Date(cmd.date).toLocaleDateString('fr-FR')}"`,
        `"${cmd.client.entreprise.replace(/"/g, '""')}"`,
        `"${cmd.client.telephone}"`,
        `"${cmd.client.adresse.replace(/"/g, '""')}"`,
        `"${chauffeur}"`,
        `"${statutLabel}"`,
        montantHT,
        montantTVA,
        montantTTC,
      ].join(';');
    });

    // Ligne Totaux
    const ligneTotaux = [
      '"TOTAL GENERAL 2CGC"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      totalHT,
      totalTVACollectee,
      totalCA,
    ].join(';');

    const csvContent = '\uFEFF' + [entetes.join(';'), ...lignesData, ligneTotaux].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `2CGC_Journal_Ventes_TVA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/60 mx-3">|</span>
            <span className="text-white/80 text-sm">Espace Dirigeant</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dirigeant/identifiants"
              className="bg-white/10 hover:bg-white/20 border border-white/25 text-white px-3.5 py-2 rounded-lg text-sm font-bold shadow transition-all flex items-center gap-1.5"
              title="Consulter le trousseau de tous les identifiants collaborateurs"
            >
              <span>🔐</span>
              <span className="hidden md:inline">Identifiants Collaborateurs</span>
            </Link>
            <button
              onClick={() => setShowModalRapide(true)}
              className="bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-4 py-2 rounded-lg text-sm font-extrabold shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Enregistrer</span> Personnel
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold">{user.nom}</div>
              <div className="text-xs text-white/60">Directeur Général</div>
            </div>
            <button onClick={() => { logout(); router.push('/'); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm min-h-[44px]">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Notification toast */}
      {notifRapide && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border border-emerald-400 animate-bounce">
          <span>🎉</span>
          <span>{notifRapide}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#002B5B]">Bonjour {user.nom} 👔</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de votre entreprise & gestion des opérations</p>
          </div>
          <button
            onClick={() => setShowModalRapide(true)}
            className="sm:hidden bg-[#FFD700] text-[#002B5B] py-3 px-4 rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2"
          >
            ➕ Enregistrer Chauffeur / Usine
          </button>
        </div>

        {/* KPIs Principaux */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#FFD700]">
            <div className="text-sm text-gray-500 mb-1">Chiffre d'affaires</div>
            <div className="text-2xl font-bold text-[#002B5B]">{formatFCFA(totalCA)}</div>
            <div className="text-xs text-green-600 mt-1">↑ +12% ce mois</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-500 mb-1">Commandes livrées</div>
            <div className="text-3xl font-bold text-[#002B5B]">{commandesLivrees}</div>
            <div className="text-xs text-gray-500 mt-1">Ce mois</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 mb-1">En cours de traitement</div>
            <div className="text-3xl font-bold text-[#002B5B]">{commandesEnCours}</div>
            <div className="text-xs text-gray-500 mt-1">Production + Livraison</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="text-sm text-gray-500 mb-1">Nouvelles commandes</div>
            <div className="text-3xl font-bold text-[#002B5B]">{nouvellesCommandes}</div>
            <div className="text-xs text-red-600 mt-1">À traiter</div>
          </div>
        </div>

        {/* Accès rapide aux autres espaces */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/usine" className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#002B5B] hover:shadow-lg transition-all block">
            <div className="w-12 h-12 rounded-xl bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm flex items-center justify-center text-2xl mb-3">🏭</div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1">Vue Usine</h3>
            <p className="text-sm text-gray-600">Superviser la production</p>
          </Link>

          <Link href="/chauffeur" className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#002B5B] hover:shadow-lg transition-all block">
            <div className="w-12 h-12 rounded-xl bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm flex items-center justify-center text-2xl mb-3">🚚</div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1">Vue Logistique</h3>
            <p className="text-sm text-gray-600">Suivi des livraisons</p>
          </Link>

          <Link href="/client" className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#002B5B] hover:shadow-lg transition-all block group">
            <div className="w-12 h-12 rounded-xl bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm flex items-center justify-center text-2xl mb-3">👤</div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1 group-hover:text-[#002B5B]">Vue Client</h3>
            <p className="text-sm text-gray-600">Expérience client</p>
            <span className="inline-block mt-2 text-[11px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 backdrop-blur-sm">
              👁️ Sélecteur multi-clients
            </span>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link href="/dirigeant/identifiants" className="bg-white rounded-xl p-6 border-2 border-amber-300 hover:border-[#002B5B] hover:shadow-lg transition-all block group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 backdrop-blur-sm flex items-center justify-center text-2xl">🔐</div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-400/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Trousseau Sécurisé
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1 group-hover:text-amber-700 transition-colors">Identifiants Collaborateurs</h3>
            <p className="text-sm text-gray-600">Accès, mots de passe, fiches PDF &amp; envoi WhatsApp</p>
          </Link>

          <Link href="/dirigeant/crm" className="bg-white rounded-xl p-6 border-2 border-[#FFD700] hover:shadow-lg hover:border-[#002B5B] transition-all block">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 border border-[#FFD700]/40 backdrop-blur-sm flex items-center justify-center text-2xl mb-3">🤖</div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1">CRM Automatisé</h3>
            <p className="text-sm text-gray-600">Pipeline, leads et relances automatiques</p>
          </Link>

          <Link href="/dirigeant/utilisateurs" className="bg-white rounded-xl p-6 border-2 border-emerald-300 hover:border-[#002B5B] hover:shadow-lg transition-all block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm flex items-center justify-center text-2xl">👥</div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-400/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Import & Impression
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#002B5B] mb-1">Base Clients & Comptes</h3>
            <p className="text-sm text-gray-600">Importer anciens clients CSV/Excel, imprimer répertoire PDF</p>
          </Link>
        </div>

        {/* MODULE 6 : Export Comptable & Fiscalité 18% 2CGC */}
        <div className="bg-gradient-to-r from-[#002B5B] via-[#003d80] to-[#002B5B] rounded-3xl p-6 text-white shadow-md mb-8 border border-[#FFD700]/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] text-xs font-black px-3 py-1 rounded-full border border-[#FFD700]/30 mb-2">
                <span>📑</span> MODULE COMPTABILITÉ &amp; AUDIT FISCAL CI
              </div>
              <h2 className="text-2xl font-black text-white">
                Grand Livre des Ventes &amp; Déclaration TVA (18%)
              </h2>
              <p className="text-white/70 text-xs mt-1 max-w-2xl leading-relaxed">
                Export officiel conforme aux normes comptables SYSCOHADA et Direction Générale des Impôts (DGI Côte d'Ivoire). Téléchargez le récapitulatif détaillé des encaissements HT, de la TVA 18% collectée et du fret logistique.
              </p>
            </div>

            <button
              onClick={exporterJournalVentesCSV}
              className="bg-gold-gradient text-[#002B5B] hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all font-black text-sm px-6 py-4 rounded-2xl flex items-center justify-center gap-2.5 flex-shrink-0 cursor-pointer"
              title="Télécharger le fichier CSV compatible Microsoft Excel et logiciels comptables"
            >
              <span>📊</span>
              <span>Exporter Journal des Ventes (Excel / CSV)</span>
            </button>
          </div>

          {/* Cartouches Chiffres Fiscaux */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <span className="text-xs text-white/60 uppercase font-semibold">Chiffre d'Affaires HT</span>
              <div className="text-xl font-black text-white mt-1">{formatFCFA(totalHT)}</div>
              <span className="text-[11px] text-emerald-400">Assiette imposable</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <span className="text-xs text-[#FFD700] uppercase font-semibold">TVA Collectée (18%)</span>
              <div className="text-xl font-black text-[#FFD700] mt-1">{formatFCFA(totalTVACollectee)}</div>
              <span className="text-[11px] text-[#FFD700]/80">Déclaration DGI Daloa</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <span className="text-xs text-white/60 uppercase font-semibold">Total Encaissé TTC</span>
              <div className="text-xl font-black text-white mt-1">{formatFCFA(totalCA)}</div>
              <span className="text-[11px] text-blue-300">Règlements &amp; Proformas</span>
            </div>
          </div>
        </div>

        {/* Tableau de bord des commandes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-[#002B5B]">📊 Toutes les commandes</h2>
            <button
              onClick={exporterJournalVentesCSV}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-[#002B5B] font-bold px-3.5 py-2 rounded-xl border border-gray-300 transition-colors flex items-center gap-1.5"
            >
              <span>📥</span> Export CSV rapide
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-bold text-gray-500 uppercase">
                  <th className="py-3 px-4">Réf</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {commandes.map((cmd) => (
                  <tr key={cmd.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-[#002B5B]">{cmd.id}</td>
                    <td className="py-3 px-4 text-sm">
                      <Link 
                        href={`/client?email=${encodeURIComponent((cmd.client as any).email || 'client@btp-afrique.com')}`}
                        className="font-bold text-[#002B5B] hover:text-blue-600 hover:underline flex items-center gap-1"
                        title="Ouvrir la vue de ce client"
                      >
                        <span>{cmd.client.entreprise}</span>
                        <span className="text-xs text-gray-400">↗</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">{new Date(cmd.date).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        cmd.statut === 'livree' ? 'bg-green-100 text-green-800' :
                        cmd.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        cmd.statut === 'preparation' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cmd.statut === 'livree' ? 'Livrée' : cmd.statut === 'en_cours' ? 'En livraison' : cmd.statut === 'preparation' ? 'En production' : 'Nouvelle'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#002B5B]">{formatFCFA(cmd.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== MODAL D'ENREGISTREMENT RAPIDE PERSONNEL & VÉHICULE ====== */}
      {showModalRapide && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModalRapide(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-[#002B5B] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>📋</span> Enregistrer Personnel & Véhicule
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Commande directe Direction Générale 2CGC
                </p>
              </div>
              <button 
                onClick={() => setShowModalRapide(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Formulaire Modal */}
            <form onSubmit={handleEnregistrerPersonnel} className="p-6 space-y-4">
              
              {/* Choix du rôle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Fonction à enregistrer *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRoleRapide('chauffeur')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      roleRapide === 'chauffeur'
                        ? 'border-[#002B5B] bg-emerald-50 text-[#002B5B] ring-2 ring-[#002B5B]/10'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚚</div>
                    <div className="font-extrabold text-sm">Chauffeur</div>
                    <div className="text-[11px] text-gray-500">Livraisons & flotte</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleRapide('chef_usine')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                      roleRapide === 'chef_usine'
                        ? 'border-[#002B5B] bg-orange-50 text-[#002B5B] ring-2 ring-[#002B5B]/10'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏭</div>
                    <div className="font-extrabold text-sm">Chef d'Usine</div>
                    <div className="text-[11px] text-gray-500">Production & stocks</div>
                  </button>
                </div>
              </div>

              {/* Nom & Prénoms */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nom & Prénoms *
                </label>
                <input
                  type="text"
                  value={nomRapide}
                  onChange={e => setNomRapide(e.target.value)}
                  placeholder={roleRapide === 'chauffeur' ? 'Ex: M. Bamba Karim' : 'Ex: Ing. Konaté Lassina'}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                />
              </div>

              {/* Téléphone WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={telephoneRapide}
                  onChange={e => setTelephoneRapide(e.target.value)}
                  placeholder="+225 07 XX XX XX XX"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                />
              </div>

              {/* Champs flotte (Véhicule & Immatriculation) */}
              {roleRapide === 'chauffeur' && (
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Type / Modèle de Véhicule
                    </label>
                    <input
                      type="text"
                      value={vehiculeRapide}
                      onChange={e => setVehiculeRapide(e.target.value)}
                      placeholder="Ex: Camion Benne 20T"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Plaque d'Immatriculation
                    </label>
                    <input
                      type="text"
                      value={immatriculationRapide}
                      onChange={e => setImmatriculationRapide(e.target.value)}
                      placeholder="Ex: 8945 HK 01"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                    />
                  </div>
                </div>
              )}

              {/* Note automatique */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed">
                💡 Le mot de passe et l'email d'accès seront générés automatiquement et enregistrés dans le système. Le collaborateur pourra se connecter directement depuis la page de connexion.
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalRapide(false)}
                  className="w-1/3 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3.5 rounded-xl bg-[#002B5B] hover:bg-[#003d80] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Valider l'enregistrement</span>
                  <span>→</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Accès Rapide aux Identifiants Générés */}
      {identifiantGenere && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-400 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl font-black">
                  🔐
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002B5B]">Identifiants Collaborateur</h3>
                  <p className="text-xs text-gray-500">Compte créé avec succès dans le système</p>
                </div>
              </div>
              <button
                onClick={() => setIdentifiantGenere(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-6 space-y-3">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Collaborateur</span>
                <p className="text-base font-extrabold text-[#002B5B]">{identifiantGenere.nom} ({identifiantGenere.role === 'chauffeur' ? 'Chauffeur Flotte' : "Chef d'Usine"})</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Identifiant (Email)</span>
                  <p className="text-sm font-mono font-bold text-[#002B5B]">{identifiantGenere.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(identifiantGenere.email)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
                >
                  Copier
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Mot de passe provisoire</span>
                  <p className="text-sm font-mono font-black text-emerald-700">{identifiantGenere.password}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(identifiantGenere.password);
                    setCopieMdp(true);
                    setTimeout(() => setCopieMdp(false), 2000);
                  }}
                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold transition-colors"
                >
                  {copieMdp ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {identifiantGenere.telephone && (
                <a
                  href={`https://wa.me/${identifiantGenere.telephone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${identifiantGenere.nom},\nVoici vos identifiants d'accès 2CGC BÉTON INDUSTRIE :\n\nLien : https://2cgc-industrie.com/connexion\nIdentifiant : ${identifiantGenere.email}\nMot de passe : ${identifiantGenere.password}\n\nDirection 2CGC`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
                >
                  <span>📲</span>
                  <span>Transmettre sur WhatsApp ({identifiantGenere.telephone})</span>
                </a>
              )}

              <Link
                href="/dirigeant/identifiants"
                className="w-full py-3 rounded-xl bg-[#002B5B] hover:bg-[#003d80] text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
              >
                <span>📂</span>
                <span>Ouvrir l'Espace Trousseau &amp; Fiches PDF</span>
              </Link>

              <button
                type="button"
                onClick={() => setIdentifiantGenere(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copilot Agentique IA & Modal Audit */}
      <CRMAgenticCopilot
        onRefreshLeads={() => setCommandes(getCommandes())}
        onOpenLogsModal={() => setModalLogsOpen(true)}
      />

      <CRMAgenticLogsModal
        isOpen={modalLogsOpen}
        onClose={() => setModalLogsOpen(false)}
      />
    </main>
  );
}
