"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, CompteUtilisateur, UserRole, genererMotDePasse } from '@/lib/auth-context';
import {
  imprimerTrousseauCollaborateursPDF,
  imprimerFicheCollaborateurPDF,
  exporterTrousseauCSV,
} from '@/lib/import-export-clients';

const ROLES_INFO: Record<string, { label: string; badge: string; icon: string; desc: string }> = {
  chef_usine: {
    label: "Chef d'Usine",
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🏭',
    desc: 'Validation des ordres de fabrication, suivi des stocks de ciment et agrégats',
  },
  chauffeur: {
    label: 'Chauffeur Flotte',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🚚',
    desc: 'Feuille de route, bons de livraison dématérialisés et déchargement grue',
  },
  dirigeant: {
    label: 'Dirigeant 2CGC',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '👔',
    desc: 'Supervision globale, comptabilité TVA, CRM et administration des accès',
  },
};

export default function EspaceIdentifiantsCollaborateurs() {
  const { user, getUtilisateurs, creerUtilisateur, supprimerUtilisateur, mettreAJourMotDePasse, isLoading } = useAuth();
  const router = useRouter();

  const [collaborateurs, setCollaborateurs] = useState<CompteUtilisateur[]>([]);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<'tous' | 'chef_usine' | 'chauffeur' | 'dirigeant'>('tous');
  const [motsDePasseVisibles, setMotsDePasseVisibles] = useState<Record<string, boolean>>({});
  const [notif, setNotif] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal Génération
  const [showModalGenerer, setShowModalGenerer] = useState(false);
  const [nouveauCollab, setNouveauCollab] = useState({
    nom: '',
    role: 'chauffeur' as UserRole,
    telephone: '',
    email: '',
    vehicule: '',
    permis: '',
    motDePasse: '',
    envoyerEmail: true,
  });
  const [derniersIdentifiantsGeneres, setDerniersIdentifiantsGeneres] = useState<CompteUtilisateur | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Modal Réinitialisation MDP
  const [collabAReinitialiser, setCollabAReinitialiser] = useState<CompteUtilisateur | null>(null);
  const [nouveauMDP, setNouveauMDP] = useState('');

  const charger = useCallback(() => {
    const tous = getUtilisateurs();
    // Ne garder que les collaborateurs internes (non clients)
    const internes = tous.filter(u => u.role !== 'client');
    setCollaborateurs(internes);
  }, [getUtilisateurs]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'dirigeant') {
      router.push('/connexion');
      return;
    }
    charger();
  }, [user, isLoading, router, charger]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement du Trousseau des Collaborateurs...
      </div>
    );
  }

  if (!user || user.role !== 'dirigeant') return null;

  const afficherNotif = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const toggleVisibiliteMDP = (email: string) => {
    setMotsDePasseVisibles(prev => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const copierTexte = (texte: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texte);
      afficherNotif(`📋 ${label} copié dans le presse-papier !`, 'success');
    }
  };

  const copierFicheComplete = (c: CompteUtilisateur) => {
    const roleStr = ROLES_INFO[c.role]?.label || c.role;
    const texte = `🔐 VOS IDENTIFIANTS 2CGC (${roleStr.toUpperCase()})\n\n` +
      `Bonjour ${c.nom},\n` +
      `Voici vos accès au portail officiel 2CGC :\n\n` +
      `🌐 Lien de connexion : https://2cgc.ci/connexion\n` +
      `📧 Identifiant : ${c.email}\n` +
      `🔑 Mot de passe : ${c.password || '••••••••'}\n` +
      (c.vehicule ? `🚚 Véhicule assigné : ${c.vehicule}\n` : '') +
      (c.permis ? `🔢 N° Permis : ${c.permis}\n` : '') +
      `\nConservez ces accès confidentiels. Direction Générale 2CGC Daloa.`;
    copierTexte(texte, 'Fiche d\'accès complète');
  };

  const transmettreWhatsApp = (c: CompteUtilisateur) => {
    const roleStr = ROLES_INFO[c.role]?.label || c.role;
    const msg = `Bonjour ${c.nom} 👋\n\nVoici vos identifiants d'accès au portail *2CGC* (${roleStr}) :\n\n` +
      `🌐 *Lien :* https://2cgc.ci/connexion\n` +
      `📧 *Identifiant :* \`${c.email}\`\n` +
      `🔑 *Mot de passe :* \`${c.password || '2CGC-2026'}\`\n` +
      (c.vehicule ? `🚚 *Véhicule :* ${c.vehicule}\n` : '') +
      `\n_Conservez ce message confidentiel. Direction Générale 2CGC._`;
    const cleanTel = c.telephone.replace(/[\s\+\-]/g, '');
    const telFinal = cleanTel.startsWith('225') ? cleanTel : `225${cleanTel}`;
    window.open(`https://wa.me/${telFinal}?text=${encodeURIComponent(msg)}`, '_blank');
    afficherNotif(`💬 WhatsApp ouvert pour ${c.nom}`, 'info');
  };

  const renvoyerEmail = async (c: CompteUtilisateur) => {
    try {
      afficherNotif(`📧 Envoi des accès à ${c.email}...`, 'info');
      const res = await fetch('/api/creer-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: c.nom,
          email: c.email,
          telephone: c.telephone,
          entreprise: c.entreprise || '2CGC',
          role: c.role,
          motDePasse: c.password || '2CGC-2026',
          envoyerEmail: true,
        }),
      });
      const data = await res.json();
      if (data.mode === 'reel') {
        afficherNotif(`✅ Identifiants officiels envoyés par email à ${c.email} !`, 'success');
      } else {
        afficherNotif(`✅ Identifiants envoyés (Mode simulation / local) !`, 'info');
      }
    } catch {
      afficherNotif(`Erreur lors de l'envoi de l'email`, 'error');
    }
  };

  const ouvrirModalGenerer = () => {
    const mdp = `2CGC-${Math.floor(100 + Math.random() * 900)}!`;
    setNouveauCollab({
      nom: '',
      role: 'chauffeur',
      telephone: '+225 07 ',
      email: '',
      vehicule: '',
      permis: '',
      motDePasse: mdp,
      envoyerEmail: true,
    });
    setDerniersIdentifiantsGeneres(null);
    setShowModalGenerer(true);
  };

  const ajusterNomEtEmailAuto = (nom: string, role: UserRole) => {
    const clean = nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '.');
    const rolePrefix = role === 'chef_usine' ? 'usine.' : role === 'chauffeur' ? 'flotte.' : 'direction.';
    const emailSuggere = clean.length > 2 ? `${rolePrefix}${clean}@2cgc.ci` : '';
    setNouveauCollab(prev => ({
      ...prev,
      nom,
      email: prev.email.includes('@') && !prev.email.includes('@2cgc.ci') ? prev.email : emailSuggere,
    }));
  };

  const handleConfirmerCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauCollab.nom || !nouveauCollab.email || !nouveauCollab.motDePasse) {
      afficherNotif('Veuillez renseigner le nom, l\'email et le mot de passe.', 'error');
      return;
    }

    setEnvoiEnCours(true);

    const compte: CompteUtilisateur = {
      nom: nouveauCollab.nom,
      email: nouveauCollab.email.trim().toLowerCase(),
      telephone: nouveauCollab.telephone || '+225 07 00 00 00',
      entreprise: '2CGC — Cheickna Construction & Génie Civil',
      password: nouveauCollab.motDePasse,
      role: nouveauCollab.role,
      vehicule: nouveauCollab.role === 'chauffeur' ? nouveauCollab.vehicule || 'Camion 15T Flotte 2CGC' : undefined,
      permis: nouveauCollab.role === 'chauffeur' ? nouveauCollab.permis || 'Permis Poids Lourd C/E' : undefined,
      dateCreation: new Date().toISOString().split('T')[0],
      creeParDirigeant: true,
    };

    const res = creerUtilisateur(compte);
    if (!res.success) {
      setEnvoiEnCours(false);
      afficherNotif(res.error || 'Erreur lors de la création.', 'error');
      return;
    }

    if (nouveauCollab.envoyerEmail) {
      try {
        await fetch('/api/creer-compte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: compte.nom,
            email: compte.email,
            telephone: compte.telephone,
            entreprise: compte.entreprise,
            role: compte.role,
            motDePasse: compte.password,
            envoyerEmail: true,
          }),
        });
      } catch (err) {
        console.warn('Erreur envoi auto email:', err);
      }
    }

    setEnvoiEnCours(false);
    charger();
    setDerniersIdentifiantsGeneres(compte);
    afficherNotif(`🎉 Identifiants créés pour ${compte.nom} !`, 'success');
  };

  const ouvrirModalReinitialiser = (c: CompteUtilisateur) => {
    setCollabAReinitialiser(c);
    setNouveauMDP(genererMotDePasse(c.nom));
  };

  const handleConfirmerReinitialisation = () => {
    if (!collabAReinitialiser || !nouveauMDP) return;
    const ok = mettreAJourMotDePasse(collabAReinitialiser.email, nouveauMDP);
    if (ok) {
      charger();
      afficherNotif(`🔑 Mot de passe mis à jour pour ${collabAReinitialiser.nom} !`, 'success');
      setCollabAReinitialiser(null);
      setNouveauMDP('');
    } else {
      afficherNotif(`Erreur lors de la réinitialisation`, 'error');
    }
  };

  const handleSupprimer = (c: CompteUtilisateur) => {
    if (!confirm(`Supprimer l'accès du collaborateur ${c.nom} (${c.email}) ?`)) return;
    supprimerUtilisateur(c.email);
    charger();
    afficherNotif(`Compte de ${c.nom} supprimé.`, 'success');
  };

  // Filtrage
  const collaborateursFiltres = collaborateurs.filter(c => {
    const matchRole = filtreRole === 'tous' ? true : c.role === filtreRole;
    const q = recherche.toLowerCase().trim();
    const matchQ = !q ||
      c.nom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      (c.vehicule && c.vehicule.toLowerCase().includes(q)) ||
      (c.permis && c.permis.toLowerCase().includes(q));
    return matchRole && matchQ;
  });

  const stats = {
    total: collaborateurs.length,
    chefsUsine: collaborateurs.filter(c => c.role === 'chef_usine').length,
    chauffeurs: collaborateurs.filter(c => c.role === 'chauffeur').length,
    dirigeants: collaborateurs.filter(c => c.role === 'dirigeant').length,
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0] pb-16">
      {/* Header Premium */}
      <header className="bg-gradient-to-r from-[#002B5B] via-[#003366] to-[#001D3D] text-white shadow-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-95">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/dirigeant" className="text-[#FFD700] font-bold hover:underline text-xs sm:text-sm flex items-center gap-1">
              <span>←</span> Dashboard Dirigeant
            </Link>
            <span className="text-white/30 hidden md:inline">|</span>
            <Link href="/dirigeant/utilisateurs" className="text-white/80 hover:text-white text-xs sm:text-sm hidden md:inline">
              Base Clients & Équipe
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => imprimerTrousseauCollaborateursPDF(collaborateurs)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
              title="Générer le PDF officiel du trousseau des accès pour archivage"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Imprimer Trousseau (PDF)</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={() => exporterTrousseauCSV(collaborateurs)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Exporter les identifiants en format Excel/CSV"
            >
              <span>📊</span>
              <span>CSV</span>
            </button>

            <button
              onClick={ouvrirModalGenerer}
              className="bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span>
              <span>Générer Identifiants</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notif && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white flex items-center gap-2 ${
          notif.type === 'success' ? 'bg-emerald-600 border border-emerald-400' :
          notif.type === 'error' ? 'bg-red-600 border border-red-400' : 'bg-blue-600 border border-blue-400'
        }`}>
          <span>{notif.type === 'success' ? '✅' : notif.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{notif.msg}</span>
        </div>
      )}

      {/* Bannière de présentation & Sécurité */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-gradient-to-r from-[#002B5B] to-[#004080] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="bg-[#FFD700] text-[#002B5B] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              Espace Sécurisé Direction Générale
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 text-white">
              🔐 Trousseau & Identifiants des Collaborateurs
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1.5 leading-relaxed">
              Consultez, révélez, copiez et transmettez instantanément les identifiants et mots de passe d'accès
              de l'équipe 2CGC (Chefs d'Usine, Chauffeurs logistiques et Dirigeants).
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Collaborateurs Actifs', val: stats.total, icon: '👥', color: 'border-[#002B5B]' },
          { label: "Chefs d'Usine (Daloa)", val: stats.chefsUsine, icon: '🏭', color: 'border-orange-500' },
          { label: 'Chauffeurs Flotte', val: stats.chauffeurs, icon: '🚚', color: 'border-emerald-500' },
          { label: 'Direction Générale', val: stats.dirigeants, icon: '👔', color: 'border-purple-500' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${k.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xl">{k.icon}</span>
              <span className="text-2xl font-black text-[#002B5B]">{k.val}</span>
            </div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de Filtre & Recherche */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, email, véhicule, tél..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="w-full bg-[#F5F5F0] border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-[#002B5B] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'tous', label: `Tous (${collaborateurs.length})` },
              { id: 'chef_usine', label: `Usine (${stats.chefsUsine})` },
              { id: 'chauffeur', label: `Chauffeurs (${stats.chauffeurs})` },
              { id: 'dirigeant', label: `Direction (${stats.dirigeants})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltreRole(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtreRole === tab.id
                    ? 'bg-[#002B5B] text-[#FFD700] shadow'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille des Cartes Identifiants Collaborateurs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {collaborateursFiltres.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-bold text-gray-700">Aucun collaborateur trouvé</h3>
            <p className="text-xs text-gray-400 mt-1">Essayez un autre mot-clé ou générez de nouveaux identifiants.</p>
            <button
              onClick={ouvrirModalGenerer}
              className="mt-4 bg-[#002B5B] text-[#FFD700] px-4 py-2 rounded-xl text-xs font-bold"
            >
              ➕ Générer des identifiants
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborateursFiltres.map(c => {
              const roleInfo = ROLES_INFO[c.role] || { label: c.role, badge: 'bg-gray-100 text-gray-700', icon: '👤', desc: '' };
              const isVisible = motsDePasseVisibles[c.email] || false;
              const motDePasseAffiche = c.password || '••••••••';

              return (
                <div
                  key={c.email}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Header Carte */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#002B5B] to-[#004080] text-white font-black flex items-center justify-center text-lg shadow-sm">
                          {c.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#002B5B] leading-snug">{c.nom}</h3>
                          <span className={`inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${roleInfo.badge}`}>
                            {roleInfo.icon} {roleInfo.label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => imprimerFicheCollaborateurPDF(c)}
                        title="Télécharger la fiche d'accès individuelle PDF"
                        className="text-gray-400 hover:text-[#002B5B] p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        🖨️
                      </button>
                    </div>

                    {/* Détails affectation / logistique */}
                    <div className="text-xs text-gray-500 space-y-1 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Téléphone :</span>
                        <span className="font-semibold text-gray-700">{c.telephone || 'Non renseigné'}</span>
                      </div>
                      {c.vehicule && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Véhicule :</span>
                          <span className="font-bold text-emerald-800">🚚 {c.vehicule}</span>
                        </div>
                      )}
                      {c.permis && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Permis :</span>
                          <span className="font-mono text-slate-700">🔢 {c.permis}</span>
                        </div>
                      )}
                    </div>

                    {/* Bloc Identifiants de Connexion */}
                    <div className="bg-[#FFFDF0] border border-[#FDE68A] rounded-2xl p-3.5 space-y-2.5">
                      {/* Email */}
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-0.5">
                          Identifiant (Email de Connexion)
                        </div>
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-2.5 py-1.5">
                          <span className="font-mono text-xs font-bold text-[#002B5B] truncate mr-2 select-all">
                            {c.email}
                          </span>
                          <button
                            onClick={() => copierTexte(c.email, 'Identifiant')}
                            className="text-xs text-gray-400 hover:text-[#002B5B] p-1 hover:bg-gray-100 rounded cursor-pointer"
                            title="Copier l'identifiant"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      {/* Mot de passe */}
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-0.5 flex items-center justify-between">
                          <span>Mot de passe d'accès</span>
                          <span className="text-[9px] text-amber-700 font-normal">Actif</span>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-2.5 py-1.5">
                          <span className="font-mono text-xs font-bold text-red-600 truncate mr-2 select-all">
                            {isVisible ? motDePasseAffiche : '••••••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleVisibiliteMDP(c.email)}
                              className="text-xs text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded cursor-pointer"
                              title={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                              {isVisible ? '🙈' : '👁️'}
                            </button>
                            <button
                              onClick={() => copierTexte(c.password || '', 'Mot de passe')}
                              className="text-xs text-gray-400 hover:text-[#002B5B] p-1 hover:bg-gray-100 rounded cursor-pointer"
                              title="Copier le mot de passe"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Rapides en bas de carte */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => transmettreWhatsApp(c)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2 px-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Transmettre les identifiants sur WhatsApp"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => renvoyerEmail(c)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 px-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Renvoyer la fiche d'accès par email"
                      >
                        <span>📧</span>
                        <span>Par Email</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => copierFicheComplete(c)}
                        className="text-[#002B5B] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span>📑</span> Copier toute la fiche
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ouvrirModalReinitialiser(c)}
                          className="text-amber-700 hover:text-amber-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Réinitialiser le mot de passe"
                        >
                          <span>🔄</span> Reset
                        </button>

                        {c.creeParDirigeant && (
                          <button
                            onClick={() => handleSupprimer(c)}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                            title="Supprimer ce compte"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== MODAL : GÉNÉRER IDENTIFIANTS ====== */}
      {showModalGenerer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModalGenerer(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in" onClick={e => e.stopPropagation()}>
            <div className="bg-[#002B5B] px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>➕</span> Générer des Identifiants Collaborateur
                </h2>
                <p className="text-xs text-white/70 mt-0.5">Création instantanée d'accès usine, flotte ou direction</p>
              </div>
              <button onClick={() => setShowModalGenerer(false)} className="text-white/70 hover:text-white text-lg cursor-pointer">✕</button>
            </div>

            {derniersIdentifiantsGeneres ? (
              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-center">
                  <div className="text-3xl mb-1">🎉</div>
                  <h3 className="font-black text-base">Identifiants créés avec succès !</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">Le collaborateur peut dès maintenant se connecter.</p>
                </div>

                <div className="bg-[#FFFDF0] border border-[#FDE68A] rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Collaborateur :</span>
                    <span className="font-black text-[#002B5B]">{derniersIdentifiantsGeneres.nom}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Fonction :</span>
                    <span className="font-bold text-gray-700">{ROLES_INFO[derniersIdentifiantsGeneres.role]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200">
                    <span className="text-gray-500">Identifiant (Email) :</span>
                    <span className="font-mono font-bold text-[#002B5B]">{derniersIdentifiantsGeneres.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Mot de Passe :</span>
                    <span className="font-mono font-bold text-red-600">{derniersIdentifiantsGeneres.password}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => transmettreWhatsApp(derniersIdentifiantsGeneres)}
                    className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> Envoyer sur WhatsApp
                  </button>

                  <button
                    onClick={() => imprimerFicheCollaborateurPDF(derniersIdentifiantsGeneres)}
                    className="w-full bg-[#002B5B] text-[#FFD700] py-3 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🖨️</span> Imprimer Fiche (PDF)
                  </button>
                </div>

                <button
                  onClick={() => setShowModalGenerer(false)}
                  className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-700 font-bold"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmerCreation} className="p-6 space-y-4">
                {/* Rôle */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Fonction *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { role: 'chauffeur', label: 'Chauffeur', icon: '🚚' },
                      { role: 'chef_usine', label: "Chef d'Usine", icon: '🏭' },
                      { role: 'dirigeant', label: 'Dirigeant', icon: '👔' },
                    ].map(r => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          setNouveauCollab(prev => ({ ...prev, role: r.role as UserRole }));
                          ajusterNomEtEmailAuto(nouveauCollab.nom, r.role as UserRole);
                        }}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          nouveauCollab.role === r.role
                            ? 'border-[#002B5B] bg-[#002B5B]/5 font-black text-[#002B5B]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{r.icon}</div>
                        <div className="text-xs">{r.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={nouveauCollab.nom}
                    onChange={e => ajusterNomEtEmailAuto(e.target.value, nouveauCollab.role)}
                    placeholder="Ex: M. Bamba Karim"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                  />
                </div>

                {/* Téléphone WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Téléphone WhatsApp</label>
                  <input
                    type="tel"
                    value={nouveauCollab.telephone}
                    onChange={e => setNouveauCollab(prev => ({ ...prev, telephone: e.target.value }))}
                    placeholder="+225 07 12 34 56 78"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                  />
                </div>

                {/* Email de connexion */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Email / Identifiant de Connexion *</label>
                  <input
                    type="email"
                    required
                    value={nouveauCollab.email}
                    onChange={e => setNouveauCollab(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="collaborateur@2cgc.ci"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                  />
                </div>

                {/* Spécifique chauffeur */}
                {nouveauCollab.role === 'chauffeur' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Véhicule assigné</label>
                      <input
                        type="text"
                        value={nouveauCollab.vehicule}
                        onChange={e => setNouveauCollab(prev => ({ ...prev, vehicule: e.target.value }))}
                        placeholder="Ex: Camion Benne 20T"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">N° de Permis</label>
                      <input
                        type="text"
                        value={nouveauCollab.permis}
                        onChange={e => setNouveauCollab(prev => ({ ...prev, permis: e.target.value }))}
                        placeholder="Ex: CI-2024-ABC"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs focus:border-[#002B5B] focus:outline-none bg-gray-50/50"
                      />
                    </div>
                  </div>
                )}

                {/* Mot de passe */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Mot de passe généré *</label>
                    <button
                      type="button"
                      onClick={() => setNouveauCollab(prev => ({ ...prev, motDePasse: `2CGC-${Math.floor(100 + Math.random() * 900)}!` }))}
                      className="text-[11px] text-[#002B5B] font-bold hover:underline cursor-pointer"
                    >
                      🎲 Régénérer
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={nouveauCollab.motDePasse}
                    onChange={e => setNouveauCollab(prev => ({ ...prev, motDePasse: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-red-600 bg-amber-50/50 focus:border-[#002B5B] focus:outline-none"
                  />
                </div>

                {/* Case envoi automatique email */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkEnvoyerEmail"
                    checked={nouveauCollab.envoyerEmail}
                    onChange={e => setNouveauCollab(prev => ({ ...prev, envoyerEmail: e.target.checked }))}
                    className="rounded text-[#002B5B]"
                  />
                  <label htmlFor="chkEnvoyerEmail" className="text-xs text-gray-600 font-medium cursor-pointer">
                    Transmettre automatiquement les identifiants par email
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModalGenerer(false)}
                    className="w-1/3 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={envoiEnCours}
                    className="w-2/3 py-3 rounded-xl bg-[#002B5B] hover:bg-[#003d80] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {envoiEnCours ? 'Création en cours...' : 'Valider & Activer les Identifiants →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====== MODAL : RÉINITIALISER MDP ====== */}
      {collabAReinitialiser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setCollabAReinitialiser(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-[#002B5B]">
              🔄 Réinitialiser le mot de passe
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Pour le collaborateur : <strong>{collabAReinitialiser.nom}</strong> ({collabAReinitialiser.email})
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-600 mb-1">Nouveau mot de passe</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nouveauMDP}
                  onChange={e => setNouveauMDP(e.target.value)}
                  className="flex-1 font-mono font-bold text-red-600 text-sm border-2 border-gray-200 rounded-xl px-3 py-2 bg-amber-50/50"
                />
                <button
                  type="button"
                  onClick={() => setNouveauMDP(genererMotDePasse(collabAReinitialiser.nom))}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-xs font-bold"
                >
                  🎲 Aléatoire
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setCollabAReinitialiser(null)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmerReinitialisation}
                className="w-1/2 py-2.5 rounded-xl bg-[#002B5B] text-[#FFD700] text-xs font-black shadow"
              >
                Confirmer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
