"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, CompteUtilisateur, UserRole, genererMotDePasse } from '@/lib/auth-context';
import { genererLienWhatsApp } from '@/lib/crm-data';
import {
  imprimerBaseClientsPDF,
  exporterBaseClientsCSV,
  parserCSVEntrants,
  telechargerModeleCSV,
  ClientImportData,
} from '@/lib/import-export-clients';
import Link from 'next/link';

const ROLES_CONFIG = [
  { value: 'client', label: '👤 Client', color: 'bg-blue-100 text-blue-700', desc: 'Accès aux commandes, devis et livraisons' },
  { value: 'chef_usine', label: '🏭 Chef d\'Usine', color: 'bg-orange-100 text-orange-700', desc: 'Validation et lancement de production' },
  { value: 'chauffeur', label: '🚚 Chauffeur', color: 'bg-emerald-100 text-emerald-700', desc: 'Tournées de livraison et bons de route' },
  { value: 'dirigeant', label: '👔 Dirigeant', color: 'bg-purple-100 text-purple-700', desc: 'Accès complet au tableau de bord' },
];

const STATUT_BADGE: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  chef_usine: 'bg-orange-100 text-orange-700',
  chauffeur: 'bg-emerald-100 text-emerald-700',
  dirigeant: 'bg-purple-100 text-purple-700',
};

export default function GestionUtilisateurs() {
  const { user, creerUtilisateur, importerUtilisateurs, getUtilisateurs, supprimerUtilisateur, isLoading } = useAuth();
  const router = useRouter();

  const [utilisateurs, setUtilisateurs] = useState<CompteUtilisateur[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showModalImport, setShowModalImport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [envoyant, setEnvoyant] = useState<string | null>(null);
  const [notif, setNotif] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [motDePasseGenere, setMotDePasseGenere] = useState('');

  // États Import CSV
  const [fichierImportNom, setFichierImportNom] = useState<string | null>(null);
  const [clientsPrevisualises, setClientsPrevisualises] = useState<ClientImportData[]>([]);
  const [texteColler, setTexteColler] = useState('');
  const [importModeOnglet, setImportModeOnglet] = useState<'fichier' | 'coller'>('fichier');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtre de recherche & rôle
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<'tous' | 'client' | 'interne'>('tous');

  const [form, setForm] = useState({
    nom: '', entreprise: '', email: '', telephone: '',
    role: 'client' as UserRole, vehicule: '', permis: '',
    motDePasse: '',
  });

  const charger = useCallback(() => {
    setUtilisateurs(getUtilisateurs());
  }, [getUtilisateurs]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'dirigeant') { router.push('/connexion'); return; }
    charger();
  }, [user, isLoading, router, charger]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement de la gestion utilisateurs...
      </div>
    );
  }

  if (!user || user.role !== 'dirigeant') return null;

  const afficherNotif = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  // Traitement du fichier CSV importé
  const handleFichierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFichierImportNom(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const contenu = event.target?.result as string;
      if (contenu) {
        const parsed = parserCSVEntrants(contenu);
        setClientsPrevisualises(parsed);
        if (parsed.length === 0) {
          afficherNotif('Aucune ligne client valide détectée dans le fichier.', 'error');
        } else {
          afficherNotif(`📋 ${parsed.length} clients détectés. Vérifiez la prévisualisation ci-dessous.`, 'info');
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyserTexteColle = () => {
    if (!texteColler.trim()) {
      afficherNotif('Veuillez coller les données CSV ou copier/coller depuis Excel.', 'error');
      return;
    }
    const parsed = parserCSVEntrants(texteColler);
    setClientsPrevisualises(parsed);
    if (parsed.length === 0) {
      afficherNotif('Format non reconnu. Assurez-vous d\'avoir une ligne d\'en-tête (Nom;Entreprise;Email;Telephone).', 'error');
    } else {
      afficherNotif(`📋 ${parsed.length} clients détectés dans le texte collé !`, 'info');
    }
  };

  const handleConfirmerImport = () => {
    if (clientsPrevisualises.length === 0) {
      afficherNotif('Aucun client à importer.', 'error');
      return;
    }

    const comptesAImporter: CompteUtilisateur[] = clientsPrevisualises.map(c => ({
      nom: c.nom,
      entreprise: c.entreprise,
      email: c.email,
      telephone: c.telephone,
      role: 'client' as UserRole,
      password: c.password || genererMotDePasse(c.nom),
      tarifSpecial: c.tarifSpecial,
      pointsFidelite: c.pointsFidelite || 100,
      dateCreation: new Date().toISOString().split('T')[0],
      creeParDirigeant: true,
    }));

    const res = importerUtilisateurs(comptesAImporter);
    charger();
    setShowModalImport(false);
    setClientsPrevisualises([]);
    setFichierImportNom(null);
    setTexteColler('');

    afficherNotif(`🎉 Importation réussie : ${res.ajoutes} anciens clients ajoutés à la base ! (${res.ignores} doublons ignorés)`, 'success');
  };

  const handleImprimerPDF = () => {
    const clients = utilisateurs.filter(u => u.role === 'client');
    if (clients.length === 0) {
      afficherNotif('Aucun client à imprimer.', 'info');
      return;
    }
    imprimerBaseClientsPDF(clients);
    afficherNotif(`📄 Répertoire officiel des ${clients.length} clients généré en PDF !`, 'success');
  };

  const handleExporterCSV = () => {
    const clients = utilisateurs.filter(u => u.role === 'client');
    if (clients.length === 0) {
      afficherNotif('Aucun client à exporter.', 'info');
      return;
    }
    exporterBaseClientsCSV(clients);
    afficherNotif(`📊 Base de données de ${clients.length} clients exportée en CSV (Excel) !`, 'success');
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGenererMDP = () => {
    const mdp = genererMotDePasse(form.nom || 'Utilisateur');
    setMotDePasseGenere(mdp);
    setForm(prev => ({ ...prev, motDePasse: mdp }));
  };

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.motDePasse) {
      afficherNotif('Nom, email et mot de passe sont requis.', 'error');
      return;
    }
    setLoading(true);

    const result = creerUtilisateur({
      nom: form.nom,
      email: form.email,
      telephone: form.telephone,
      entreprise: form.entreprise || '2CGC',
      password: form.motDePasse,
      role: form.role,
      ...(form.role === 'chauffeur' && { vehicule: form.vehicule, permis: form.permis }),
    });

    if (!result.success) {
      setLoading(false);
      afficherNotif(result.error || 'Erreur lors de la création.', 'error');
      return;
    }

    // Envoyer les identifiants par email
    try {
      const res = await fetch('/api/creer-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom, email: form.email, telephone: form.telephone,
          entreprise: form.entreprise || '2CGC', role: form.role,
          motDePasse: form.motDePasse, envoyerEmail: true,
        }),
      });
      const data = await res.json();
      if (data.mode === 'reel') afficherNotif(`✅ Compte créé et email envoyé à ${form.email} !`, 'success');
      else afficherNotif(`✅ Compte créé ! (Email simulé — configurez Resend pour l'envoi réel)`, 'info');
    } catch {
      afficherNotif(`✅ Compte créé ! Envoyez les identifiants via WhatsApp.`, 'info');
    }

    setLoading(false);
    setShowForm(false);
    setForm({ nom: '', entreprise: '', email: '', telephone: '', role: 'client', vehicule: '', permis: '', motDePasse: '' });
    setMotDePasseGenere('');
    charger();
  };

  const handleSupprimerUtilisateur = (email: string, nom: string) => {
    if (!confirm(`Supprimer le compte de ${nom} (${email}) ?`)) return;
    // Ne pas supprimer les comptes fixes (mock)
    const comptesDynamiques = ['directeur@2cgc-industrie.com', 'usine@2cgc-industrie.com', 'chauffeur@2cgc-industrie.com', 'client@btp-afrique.com', 'keita.dambou@2cgc-industrie.com'];
    if (comptesDynamiques.includes(email)) {
      afficherNotif('Impossible de supprimer un compte système.', 'error');
      return;
    }
    supprimerUtilisateur(email);
    charger();
    afficherNotif(`Compte de ${nom} supprimé.`, 'success');
  };

  const handleEnvoyerWhatsApp = (u: CompteUtilisateur, mdp: string) => {
    const roleLabel: Record<string, string> = {
      client: 'Client', chef_usine: "Chef d'Usine", chauffeur: 'Chauffeur', dirigeant: 'Dirigeant',
    };
    const message = `Bonjour ${u.nom} 👋\n\nVotre accès au portail *2CGC* est prêt !\n\n🔐 *Vos identifiants :*\n• Profil : ${roleLabel[u.role]}\n• Email : ${u.email}\n• Mot de passe : *${mdp}*\n\n🔗 Connexion : https://2cgc-industrie.com/connexion\n\n_Conservez ce message précieusement. 2CGC Daloa_`;
    const tel = u.telephone.replace(/[\s\+\-]/g, '');
    const telFinal = tel.startsWith('225') ? tel : `225${tel}`;
    window.open(`https://wa.me/${telFinal}?text=${encodeURIComponent(message)}`, '_blank');
    afficherNotif(`💬 WhatsApp ouvert pour ${u.nom}`, 'info');
  };

  const stats = {
    total: utilisateurs.length,
    clients: utilisateurs.filter(u => u.role === 'client').length,
    internes: utilisateurs.filter(u => u.role !== 'client').length,
    recents: utilisateurs.filter(u => {
      const d = new Date(u.dateCreation || '2026-01-01');
      return (Date.now() - d.getTime()) < 7 * 86400000;
    }).length,
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/dirigeant" className="text-[#FFD700] font-bold hover:underline text-sm flex items-center gap-1">
              <span>←</span> Dashboard Dirigeant
            </Link>
            <span className="text-white/30 hidden sm:inline">|</span>
            <h1 className="text-lg font-black flex items-center gap-2">
              <span>👥</span> Base Clients & Équipe
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bouton Trousseau Identifiants Collaborateurs */}
            <Link
              href="/dirigeant/identifiants"
              className="bg-amber-400 hover:bg-amber-300 text-[#002B5B] text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
              title="Accéder au coffre-fort des identifiants et accès des collaborateurs"
            >
              <span>🔐</span>
              <span>Trousseau Collaborateurs</span>
            </Link>

            {/* Bouton Télécharger Modèle CSV */}
            <button
              onClick={telechargerModeleCSV}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
              title="Télécharger un modèle CSV pour importer d'anciens clients"
            >
              <span>📥</span> Modèle CSV
            </button>

            {/* Bouton Importer Anciens Clients */}
            <button
              onClick={() => setShowModalImport(true)}
              className="bg-[#FFD700] text-[#002B5B] hover:bg-yellow-400 text-xs font-black px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
              title="Importer un fichier d'anciens clients ou coller depuis Excel"
            >
              <span>📂</span> Importer Anciens Clients
            </button>

            {/* Bouton Imprimer Base Client PDF */}
            <button
              onClick={handleImprimerPDF}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
              title="Imprimer le répertoire officiel de tous les clients en PDF"
            >
              <span>🖨️</span> Imprimer Base Client (PDF)
            </button>

            {/* Bouton Export Excel/CSV */}
            <button
              onClick={handleExporterCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
              title="Exporter la base complète au format CSV compatible Excel"
            >
              <span>📊</span> Export CSV
            </button>

            {/* Bouton Nouveau Compte */}
            <button
              onClick={() => setShowForm(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>➕</span> Nouveau
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notif && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${
          notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {notif.msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 max-w-7xl mx-auto">
        {[
          { label: 'Total comptes', val: stats.total, icon: '👥', color: 'border-blue-400' },
          { label: 'Clients B2B / Pro', val: stats.clients, icon: '👤', color: 'border-[#FFD700]' },
          { label: 'Équipe interne', val: stats.internes, icon: '🏢', color: 'border-purple-400' },
          { label: 'Nouveaux (7j)', val: stats.recents, icon: '🆕', color: 'border-green-400' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${k.color}`}>
            <div className="w-9 h-9 rounded-xl bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm flex items-center justify-center text-lg mb-2">{k.icon}</div>
            <div className="text-xs text-gray-400">{k.label}</div>
            <div className="text-2xl font-black text-[#002B5B]">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Liste des utilisateurs avec recherche & filtres */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#002B5B]">Répertoire & Base de Données</h2>
              <p className="text-xs text-gray-400 mt-1">Comptes actifs, anciens clients importés et profils logistiques</p>
            </div>

            {/* Filtre & Recherche */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher par nom, entreprise, tél..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs rounded-xl pl-8 pr-4 py-2 focus:border-[#FFD700] focus:outline-none w-64"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-gray-400">🔍</span>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFiltreRole('tous')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtreRole === 'tous' ? 'bg-white text-[#002B5B] shadow-sm' : 'text-gray-500'}`}
                >
                  Tous ({utilisateurs.length})
                </button>
                <button
                  onClick={() => setFiltreRole('client')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtreRole === 'client' ? 'bg-white text-[#002B5B] shadow-sm' : 'text-gray-500'}`}
                >
                  Clients ({stats.clients})
                </button>
                <button
                  onClick={() => setFiltreRole('interne')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtreRole === 'interne' ? 'bg-white text-[#002B5B] shadow-sm' : 'text-gray-500'}`}
                >
                  Internes ({stats.internes})
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {utilisateurs
              .filter(u => {
                const matchRole = filtreRole === 'tous' ? true : filtreRole === 'client' ? u.role === 'client' : u.role !== 'client';
                const matchQuery = !recherche.trim() || 
                  u.nom.toLowerCase().includes(recherche.toLowerCase()) ||
                  u.entreprise.toLowerCase().includes(recherche.toLowerCase()) ||
                  u.email.toLowerCase().includes(recherche.toLowerCase()) ||
                  (u.telephone && u.telephone.includes(recherche));
                return matchRole && matchQuery;
              })
              .map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
                {/* Avatar */}
                <div className="w-11 h-11 bg-gradient-to-br from-[#002B5B] to-[#003d80] rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {u.nom.charAt(0).toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-black text-[#002B5B] text-sm truncate">{u.nom}</div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_BADGE[u.role]}`}>
                      {ROLES_CONFIG.find(r => r.value === u.role)?.label || u.role}
                    </span>
                    {u.creeParDirigeant && (
                      <span className="text-[10px] bg-[#002B5B]/10 text-[#002B5B] px-2 py-0.5 rounded-full font-bold flex-shrink-0">Créé manuellement</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{u.entreprise}</span>
                    <span>·</span>
                    <span>{u.telephone || 'Pas de tél.'}</span>
                    {u.vehicule && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold text-[11px] flex items-center gap-1">
                        🚚 {u.vehicule}
                      </span>
                    )}
                    {u.permis && (
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 font-mono px-2 py-0.5 rounded-md font-bold text-[11px]">
                        🔢 {u.permis}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="hidden md:block text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">Créé le</div>
                  <div className="text-xs font-bold text-gray-600">{u.dateCreation || '—'}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {u.role === 'client' ? (
                    <Link
                      href={`/client?email=${encodeURIComponent(u.email)}`}
                      className="bg-[#002B5B] hover:bg-[#003d80] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Inspecter l'espace de ce client"
                    >
                      <span>👁️</span>
                      <span className="hidden sm:inline">Vue Client</span>
                    </Link>
                  ) : (
                    <Link
                      href="/dirigeant/identifiants"
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                      title="Voir les identifiants et mot de passe dans le trousseau"
                    >
                      <span>🔐</span>
                      <span className="hidden sm:inline">Accès</span>
                    </Link>
                  )}
                  {u.telephone && u.telephone !== 'Non renseigné' && (
                    <button
                      onClick={() => handleEnvoyerWhatsApp(u, u.password || '(mot de passe non visible)')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      💬 WA
                    </button>
                  )}
                  {u.creeParDirigeant && (
                    <button
                      onClick={() => handleSupprimerUtilisateur(u.email, u.nom)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== MODAL : CRÉER UN COMPTE ====== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div className="bg-[#002B5B] rounded-t-3xl px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">Créer un nouveau compte</h2>
                <p className="text-white/60 text-xs mt-0.5">Les identifiants seront envoyés par email et WhatsApp</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreer} className="p-6 space-y-4">
              {/* Sélection du rôle */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rôle *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES_CONFIG.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => update('role', r.value)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        form.role === r.value
                          ? 'border-[#FFD700] bg-[#FFD700]/10'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{r.label.split(' ')[0]}</span>
                      <div>
                        <div className="font-bold text-[#002B5B] text-xs">{r.label.slice(2)}</div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Champs */}
              {[
                { field: 'nom', label: 'Nom complet *', placeholder: 'M. Traoré Seydou', icon: '👤', required: true },
                { field: 'entreprise', label: 'Entreprise', placeholder: form.role === 'client' ? 'BTP Horizon SARL' : '2CGC', icon: '🏢', required: false },
                { field: 'email', label: 'Email *', placeholder: `prenom@${form.role === 'client' ? 'email.com' : '2cgc-industrie.com'}`, icon: '📧', required: true },
                { field: 'telephone', label: 'Téléphone WhatsApp', placeholder: '+225 07 XX XX XX XX', icon: '📞', required: false },
              ].map(({ field, label, placeholder, icon, required }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{icon}</span>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={(form as any)[field]}
                      onChange={e => update(field, e.target.value)}
                      placeholder={placeholder}
                      required={required}
                      className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              ))}

              {/* Champs spécifiques chauffeur */}
              {form.role === 'chauffeur' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Véhicule assigné</label>
                    <input type="text" value={form.vehicule} onChange={e => update('vehicule', e.target.value)}
                      placeholder="Ex: Camion Mercedes 1217" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">N° de permis</label>
                    <input type="text" value={form.permis} onChange={e => update('permis', e.target.value)}
                      placeholder="Ex: CI-2024-ABC123" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors" />
                  </div>
                </>
              )}

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mot de passe *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                    <input
                      type="text"
                      value={form.motDePasse}
                      onChange={e => update('motDePasse', e.target.value)}
                      placeholder="Mot de passe ou générer →"
                      required
                      className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-mono focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenererMDP}
                    className="bg-[#002B5B] text-white px-4 py-3 rounded-2xl text-xs font-bold hover:bg-[#FFD700] hover:text-[#002B5B] transition-all whitespace-nowrap"
                  >
                    🎲 Générer
                  </button>
                </div>
                {motDePasseGenere && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-bold">✓ Mot de passe généré : <span className="font-mono">{motDePasseGenere}</span></p>
                )}
              </div>

              {/* Info envoi */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700">
                <div className="font-bold mb-1">📧 Envoi automatique des identifiants</div>
                <div>Après création, les identifiants seront envoyés par email à <strong>{form.email || 'l\'adresse renseignée'}</strong> et vous pourrez envoyer un message WhatsApp depuis la liste.</div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:border-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#002B5B] text-white py-3.5 rounded-2xl font-black text-sm hover:bg-[#FFD700] hover:text-[#002B5B] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Création...</>
                  ) : '✅ Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== MODAL : IMPORTER D'ANCIENS CLIENTS (FICHIER CSV / EXCEL) ====== */}
      {showModalImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModalImport(false)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center text-xl">
                  📥
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Importer d'Anciens Clients dans la Base 2CGC</h2>
                  <p className="text-white/70 text-xs">Fichiers CSV, exports Excel ou copier/coller direct</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModalImport(false)} 
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Corps Modal Défilant */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Onglets de méthode d'import */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setImportModeOnglet('fichier')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    importModeOnglet === 'fichier' ? 'bg-white text-[#002B5B] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>📁</span> Fichier CSV / Excel
                </button>
                <button
                  type="button"
                  onClick={() => setImportModeOnglet('coller')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    importModeOnglet === 'coller' ? 'bg-white text-[#002B5B] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>📋</span> Copier / Coller Direct
                </button>
              </div>

              {/* Mode Fichier */}
              {importModeOnglet === 'fichier' && (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#FFD700] rounded-3xl p-8 text-center cursor-pointer bg-gray-50/50 hover:bg-amber-50/20 transition-all group"
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.txt"
                      onChange={handleFichierChange}
                      className="hidden" 
                    />
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                    <div className="font-black text-[#002B5B] text-sm mb-1">
                      {fichierImportNom ? `Fichier sélectionné : ${fichierImportNom}` : 'Cliquez pour sélectionner votre fichier CSV'}
                    </div>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Compatible avec les fichiers CSV exportés depuis Excel, Google Sheets, ERP ou carnets d'adresses.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl">
                    <span className="flex items-center gap-2">
                      <span>💡</span> Besoin d'un modèle prêt à l'emploi ?
                    </span>
                    <button
                      type="button"
                      onClick={telechargerModeleCSV}
                      className="text-[#002B5B] font-black underline hover:text-amber-800"
                    >
                      Télécharger le modèle CSV officiel (.csv)
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Copier / Coller */}
              {importModeOnglet === 'coller' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Collez vos lignes clients (Format : Nom ; Entreprise ; Email ; Téléphone ; Remise%)
                  </label>
                  <textarea
                    rows={6}
                    value={texteColler}
                    onChange={e => setTexteColler(e.target.value)}
                    placeholder={`Nom;Entreprise;Email;Telephone;Remise%\nKoné Drissa;BTP Afrique;contact@btp.ci;+225 07 12 34 56;5\nSociété Ivoire;Promo SARL;info@ivoire.ci;+225 05 00 00 00;0`}
                    className="w-full border-2 border-gray-200 rounded-2xl p-4 text-xs font-mono focus:border-[#FFD700] focus:outline-none bg-gray-50 focus:bg-white resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyserTexteColle}
                    className="bg-[#002B5B] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#003d80] transition-colors flex items-center gap-2"
                  >
                    <span>🔍</span> Analyser les données
                  </button>
                </div>
              )}

              {/* Prévisualisation des clients détectés */}
              {clientsPrevisualises.length > 0 && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm text-[#002B5B] flex items-center gap-2">
                      <span>✅</span> Clients prêts à être importés ({clientsPrevisualises.length})
                    </h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                      Format Validé
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100">
                    {clientsPrevisualises.map((c, idx) => (
                      <div key={idx} className="p-3.5 bg-white hover:bg-gray-50 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#002B5B] truncate">{c.nom}</div>
                          <div className="text-gray-500 text-[11px] truncate">{c.entreprise} · {c.telephone}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-[11px] text-gray-600">{c.email}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            MDP généré : <span className="font-mono">{c.password}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 space-y-1">
                    <div className="font-bold">✨ Avantages de l'importation directe 2CGC :</div>
                    <div>• Les anciens clients pourront immédiatement se connecter à leur espace client.</div>
                    <div>• Les comptes seront synchronisés avec le CRM dirigeant et l'impression officielle.</div>
                    <div>• Les doublons d'email sont automatiquement détectés et ignorés pour éviter toute collision.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowModalImport(false);
                  setClientsPrevisualises([]);
                }}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:border-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmerImport}
                disabled={clientsPrevisualises.length === 0}
                className="flex-1 bg-gold-gradient text-[#002B5B] py-3.5 rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀</span>
                <span>Valider et Ajouter à la Base ({clientsPrevisualises.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
