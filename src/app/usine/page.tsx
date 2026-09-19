"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, saveCommandes, Commande as CommandeStore } from '@/lib/commandes-store';
import BonLivraison from '@/components/BonLivraison';
import { genererBonLivraison as genererBonLivraisonPDF } from '@/lib/generer-bons';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';
import { subscribeToRealtimeChanges, updateStockMatiereSupabase } from '@/lib/supabase/services';
import SimulateurWhatsAppModal from '@/components/SimulateurWhatsAppModal';

type Commande = CommandeStore;

export default function UsineDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<Commande | null>(null);
  const [chauffeurSelectionne, setChauffeurSelectionne] = useState('');
  const [vehiculeSelectionne, setVehiculeSelectionne] = useState('');
  const [notificationAction, setNotificationAction] = useState<string | null>(null);

  // Stocks disponibles sur parc de produits finis (palettes/unités prêtes à être chargées)
  const [stocksProduitsFinis, setStocksProduitsFinis] = useState<Record<string, number>>({
    'Agglo 20x20x50 Plein': 1200,
    'Agglo 15x20x50 Creux': 2500,
    'Pavé Autobloquant 20x10x8': 5000,
    'Pavé Hollandais 20x10x6': 1500,
    'Bordure T2 100x25x15': 400,
    'Bordure T4 100x25x27': 250,
    'Hourdis 16x20x50 B50': 3000,
  });

  // État des stocks de matières premières & silos usine (Daloa)
  const [stocksMatieres, setStocksMatieres] = useState([
    {
      id: 'ciment',
      nom: 'Ciment CPJ 42.5 (Silo Principal)',
      quantiteTonnes: 18.5,
      capaciteMaxTonnes: 80,
      seuilCritiqueTonnes: 20,
      unite: 'Tonnes',
      fournisseur: 'Cimaf / Dangote San Pedro',
      consommationMoyenne: '4.2 T / jour',
    },
    {
      id: 'sable',
      nom: 'Sable Fin Silicieux 0/4',
      quantiteTonnes: 62.0,
      capaciteMaxTonnes: 120,
      seuilCritiqueTonnes: 25,
      unite: 'Tonnes',
      fournisseur: 'Carrière Sassandra Daloa',
      consommationMoyenne: '8.5 T / jour',
    },
    {
      id: 'gravier',
      nom: 'Gravier Granitique Concassé 4/10',
      quantiteTonnes: 74.0,
      capaciteMaxTonnes: 150,
      seuilCritiqueTonnes: 30,
      unite: 'Tonnes',
      fournisseur: 'Carrière Granit Haut-Sassandra',
      consommationMoyenne: '11.0 T / jour',
    },
    {
      id: 'adjuvant',
      nom: 'Adjuvant Plastifiant & Accélérateur',
      quantiteTonnes: 2.8,
      capaciteMaxTonnes: 10,
      seuilCritiqueTonnes: 3.0,
      unite: 'Tonnes (Fûts)',
      fournisseur: 'Sika Côte d\'Ivoire',
      consommationMoyenne: '0.3 T / jour',
    },
  ]);

  const [modalReappro, setModalReappro] = useState<string | null>(null);
  const [quantiteAjout, setQuantiteAjout] = useState<number>(20);
  const [alertStockMessage, setAlertStockMessage] = useState<string | null>(null);
  const [modalWhatsAppSimulateur, setModalWhatsAppSimulateur] = useState(false);

  useEffect(() => {
    setCommandes(getCommandes());
    const handleUpdate = () => setCommandes(getCommandes());
    window.addEventListener('commandes_updated', handleUpdate);

    const unsubscribe = subscribeToRealtimeChanges(
      () => setCommandes(getCommandes()),
      () => setCommandes(getCommandes())
    );

    return () => {
      window.removeEventListener('commandes_updated', handleUpdate);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'chef_usine' && user.role !== 'dirigeant')) {
      router.push('/connexion');
    }
  }, [user, isLoading, router]);

  const verifierDisponibiliteStock = (articles: Commande['articles']) => {
    // Vérifie pour chaque article si stock >= quantite
    const details = articles.map(art => {
      const stockDispo = stocksProduitsFinis[art.nom] ?? 1000;
      const suffisant = stockDispo >= art.quantite;
      return {
        nom: art.nom,
        demande: art.quantite,
        disponible: stockDispo,
        suffisant,
        manquant: suffisant ? 0 : art.quantite - stockDispo,
      };
    });
    const estTotalementEnStock = details.every(d => d.suffisant);
    return { estTotalementEnStock, details };
  };

  const deduireStockProduits = (articles: Commande['articles']) => {
    setStocksProduitsFinis(prev => {
      const nouveauStock = { ...prev };
      articles.forEach(art => {
        const actuel = nouveauStock[art.nom] ?? 1000;
        nouveauStock[art.nom] = Math.max(0, actuel - art.quantite);
      });
      return nouveauStock;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement de l'espace chef d'usine...
      </div>
    );
  }

  if (!user || (user.role !== 'chef_usine' && user.role !== 'dirigeant')) return null;

  const commandesAPreparer = commandes.filter(c => c.statutProduction === 'a_preparer');
  const commandesEnProduction = commandes.filter(c => c.statutProduction === 'en_cours');
  const commandesPretes = commandes.filter(c => c.statutProduction === 'prete');

  const updateStatutProduction = (id: string, nouveauStatut: Commande['statutProduction']) => {
    const updatedList = commandes.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, statutProduction: nouveauStatut };
      if (nouveauStatut === 'prete') updated.statut = 'preparation';
      return updated;
    });
    setCommandes(updatedList);
    saveCommandes(updatedList);
  };

  const validerEtGenererBLDirect = (cmd: Commande, chauffeurNom: string, immat: string) => {
    // 1. Déduire le stock de produits finis
    deduireStockProduits(cmd.articles);

    // 2. Mettre à jour la commande en statut 'prete' avec chauffeur assigné
    const updatedList = commandes.map(c => {
      if (c.id !== cmd.id) return c;
      return {
        ...c,
        statutProduction: 'prete' as Commande['statutProduction'],
        statut: 'en_cours' as Commande['statut'],
        chauffeur: chauffeurNom,
      };
    });
    setCommandes(updatedList);
    saveCommandes(updatedList);

    // 3. Générer le Bon de Livraison Officiel PDF 2CGC
    genererBonLivraisonPDF({
      reference: cmd.id,
      date: cmd.date,
      numeroBon: `BL-${cmd.id}`,
      dateLivraisonPrevue: new Date().toISOString(),
      chauffeur: chauffeurNom,
      immatriculation: immat,
      client: {
        nom: cmd.client.nom,
        entreprise: cmd.client.entreprise,
        email: 'client@btp.ci',
        telephone: cmd.client.telephone,
        adresse: cmd.client.adresse,
      },
      articles: cmd.articles.map(a => ({ nom: a.nom, quantite: a.quantite, prix: a.prix })),
      type: 'livraison',
    });

    setNotificationAction(`✅ Stock suffisant ! Bon de Livraison généré pour ${cmd.id} et affecté à ${chauffeurNom}.`);
    setTimeout(() => setNotificationAction(null), 5000);
  };

  const genererBonLivraison = (cmd: Commande) => {
    if (!chauffeurSelectionne || !vehiculeSelectionne) {
      alert('Veuillez sélectionner un chauffeur et un véhicule');
      return;
    }
    setCommandeSelectionnee(cmd);
  };

  const CHAUFFEURS = [
    { nom: 'M. Kouadio', telephone: '+225 07 99 88 77', vehicules: ['1234 HK 01', '5678 AB 23'] },
    { nom: 'M. Traoré', telephone: '+225 07 88 77 66', vehicules: ['9012 CD 45'] },
  ];

  const reapprovisionnerMatiere = (id: string) => {
    setStocksMatieres(prev => prev.map(m => {
      if (m.id === id) {
        const nouvelleQuantite = Math.min(m.capaciteMaxTonnes, Math.round((m.quantiteTonnes + Number(quantiteAjout)) * 10) / 10);
        return { ...m, quantiteTonnes: nouvelleQuantite };
      }
      return m;
    }));
    setAlertStockMessage(`✅ Réapprovisionnement de +${quantiteAjout} Tonnes enregistré avec succès.`);
    setModalReappro(null);
    setTimeout(() => setAlertStockMessage(null), 4000);
  };

  const genererLienWhatsAppAlerteDG = (matiere: typeof stocksMatieres[0]) => {
    const texte = `🚨 *ALERTE STOCK CRITIQUE USINE 2CGC DALOA*\n\n` +
      `Bonjour Direction Générale,\n` +
      `Le niveau de *${matiere.nom}* a atteint son seuil critique !\n\n` +
      `📊 *Stock actuel :* ${matiere.quantiteTonnes} ${matiere.unite} (Seuil d'alerte : ${matiere.seuilCritiqueTonnes} ${matiere.unite})\n` +
      `🏭 *Capacité silo :* ${matiere.capaciteMaxTonnes} ${matiere.unite}\n` +
      `🚚 *Fournisseur recommandé :* ${matiere.fournisseur}\n\n` +
      `Merci d'émettre un bon de commande fournisseur d'urgence afin d'éviter tout arrêt de presse.\n` +
      `*Chef d'Usine 2CGC*`;
    return `https://wa.me/2250707621799?text=${encodeURIComponent(texte)}`;
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
            <span className="text-white/80 text-sm">Espace Chef d&apos;Usine</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalWhatsAppSimulateur(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors shadow flex items-center gap-1.5 cursor-pointer border border-emerald-400/30"
              title="Tester les commandes et demandes de devis WhatsApp"
            >
              <span>💬</span>
              <span>Simulateur WhatsApp Live</span>
            </button>
            {user.role === 'dirigeant' && (
              <Link 
                href="/dirigeant" 
                className="bg-[#FFD700] text-[#002B5B] px-3.5 py-1.5 rounded-lg text-xs font-black hover:bg-yellow-400 transition-colors shadow flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Retour Dirigeant</span>
              </Link>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold">{user.nom}</div>
              <div className="text-xs text-white/60">
                {user.role === 'dirigeant' ? 'Supervision Dirigeant' : 'Chef d\'Usine'}
              </div>
            </div>
            <button onClick={() => { logout(); router.push('/'); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm min-h-[44px]">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!commandeSelectionnee ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#002B5B]">Bonjour {user.nom} 🏭</h1>
              <p className="text-gray-600 mt-1">Gestion de la production et préparation des commandes</p>
            </div>

            {/* Notification Bon de Livraison Direct */}
            {notificationAction && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-sm font-bold flex items-center justify-between shadow-sm animate-bounce">
                <span className="flex items-center gap-2">
                  <span>🚛</span> {notificationAction}
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full uppercase">BL Téléchargé</span>
              </div>
            )}

            {/* Stats production */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <div className="text-sm text-gray-500 mb-1">📥 À préparer</div>
                <div className="text-3xl font-bold text-[#002B5B]">{commandesAPreparer.length}</div>
                <div className="text-xs text-red-600 mt-1">Nouvelles commandes</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="text-sm text-gray-500 mb-1">⚙️ En production</div>
                <div className="text-3xl font-bold text-[#002B5B]">{commandesEnProduction.length}</div>
                <div className="text-xs text-gray-500 mt-1">En cours de fabrication</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="text-sm text-gray-500 mb-1">✅ Prêtes à livrer</div>
                <div className="text-3xl font-bold text-[#002B5B]">{commandesPretes.length}</div>
                <div className="text-xs text-green-600 mt-1">En attente de chauffeur</div>
              </div>
            </div>

            {/* Feedback Réapprovisionnement */}
            {alertStockMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-sm">
                <span>{alertStockMessage}</span>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full">Actualisé</span>
              </div>
            )}

            {/* SECTION 1 : Suivi des Silos & Matières Premières Usine */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-[#002B5B] flex items-center gap-2">
                    <span>🏗️</span> Niveaux des Silos &amp; Stocks Matières Premières
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Supervision en temps réel des intrants de fabrication à l'usine 2CGC de Daloa
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Alerte critique auto &lt; 20T
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stocksMatieres.map((mat) => {
                  const pourcentage = Math.min(100, Math.round((mat.quantiteTonnes / mat.capaciteMaxTonnes) * 100));
                  const isCritique = mat.quantiteTonnes <= mat.seuilCritiqueTonnes;

                  return (
                    <div 
                      key={mat.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCritique 
                          ? 'border-red-300 bg-red-50/50 shadow-sm shadow-red-100' 
                          : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {mat.id === 'ciment' ? 'Silo Ciment' : mat.id === 'sable' ? 'Parc Sable' : mat.id === 'gravier' ? 'Parc Gravier' : 'Adjuvants'}
                        </span>
                        {isCritique ? (
                          <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-bounce">
                            ⚠️ Critique
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-sm text-[#002B5B] mb-1 truncate" title={mat.nom}>
                        {mat.nom}
                      </div>

                      {/* Jauge Visuelle */}
                      <div className="my-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-black text-[#002B5B] text-lg">
                            {mat.quantiteTonnes} <span className="text-xs font-normal text-gray-500">{mat.unite}</span>
                          </span>
                          <span className="text-xs text-gray-400 font-semibold">{pourcentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritique ? 'bg-red-500' : pourcentage < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pourcentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Seuil : {mat.seuilCritiqueTonnes} {mat.unite}</span>
                          <span>Max : {mat.capaciteMaxTonnes} {mat.unite}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 space-y-0.5 mb-3 border-t border-gray-200/50 pt-2">
                        <div>⏱️ Conso : <span className="font-semibold">{mat.consommationMoyenne}</span></div>
                        <div className="truncate" title={mat.fournisseur}>🚚 {mat.fournisseur}</div>
                      </div>

                      {/* Boutons Action */}
                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() => {
                            setModalReappro(mat.id);
                            setQuantiteAjout(mat.id === 'adjuvant' ? 2 : 25);
                          }}
                          className="w-full bg-white hover:bg-gray-100 text-[#002B5B] border border-gray-200 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          ➕ Réapprovisionner
                        </button>

                        {isCritique && (
                          <a
                            href={genererLienWhatsAppAlerteDG(mat)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <span>🚨</span> Alerter DG (WhatsApp)
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Réapprovisionnement Silo */}
            {modalReappro && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-150">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-lg text-[#002B5B]">
                      📦 Réapprovisionner le stock
                    </h3>
                    <button 
                      onClick={() => setModalReappro(null)}
                      className="text-gray-400 hover:text-gray-600 text-lg p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Enregistrement de la livraison de matière première sur le parc ou dans le silo de l'usine 2CGC Daloa.
                  </p>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Matière Première
                    </label>
                    <input
                      type="text"
                      disabled
                      value={stocksMatieres.find(m => m.id === modalReappro)?.nom || ''}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002B5B]"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tonnage / Quantité reçue (Tonnes) *
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={quantiteAjout}
                      onChange={(e) => setQuantiteAjout(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full border-2 border-gray-200 focus:border-[#FFD700] rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => reapprovisionnerMatiere(modalReappro)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Confirmer l'ajout
                    </button>
                    <button
                      onClick={() => setModalReappro(null)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Commandes à préparer */}
            {commandesAPreparer.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">📥 Commandes à préparer</h2>
                <div className="space-y-4">
                  {commandesAPreparer.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-red-500">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-[#002B5B]">{cmd.id}</span>
                              {(cmd.client.email?.includes('@whatsapp.2cgc.ci') || cmd.notes?.includes('WhatsApp')) && (
                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  💬 WhatsApp Live
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{cmd.client.entreprise} - {new Date(cmd.date).toLocaleDateString('fr-FR')}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#002B5B]">{formatFCFA(cmd.total)}</div>
                            <div className="text-xs text-gray-500">{cmd.articles.length} article(s)</div>
                          </div>
                        </div>

                        {/* Comparatif Stock Produits Finis vs Commande */}
                        {(() => {
                          const { estTotalementEnStock, details } = verifierDisponibiliteStock(cmd.articles);
                          return (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                                  🔍 Contrôle Stock Disponibilité Usine :
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                  estTotalementEnStock 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}>
                                  {estTotalementEnStock ? '✅ Stock Suffisant (Direct BL)' : '⚙️ Stock Insuffisant (Production requise)'}
                                </span>
                              </div>

                              <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100 text-xs">
                                {details.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-none">
                                    <div>
                                      <span className="font-bold text-[#002B5B]">{item.nom}</span>
                                      <div className="text-[11px] text-gray-500">
                                        Demandé : <span className="font-semibold text-gray-800">{item.demande}</span> • Disponible sur parc : <span className={`font-semibold ${item.suffisant ? 'text-emerald-700' : 'text-red-600'}`}>{item.disponible}</span>
                                      </div>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                      item.suffisant 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-red-50 text-red-600'
                                    }`}>
                                      {item.suffisant ? 'En stock' : `Manque ${item.manquant}`}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Choix d'action : Si stock suffisant -> Émission BL direct, sinon -> Lancer la production */}
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                {estTotalementEnStock ? (
                                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-3">
                                    <div className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                                      <span>📦</span> Le stock actuel couvre intégralement cette commande. Vous pouvez émettre le Bon de Livraison immédiatement.
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button
                                        onClick={() => validerEtGenererBLDirect(cmd, CHAUFFEURS[0].nom, CHAUFFEURS[0].vehicules[0])}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                      >
                                        <span>📄</span> Émettre Bon de Livraison Direct (Stock dispo)
                                      </button>
                                      <button
                                        onClick={() => updateStatutProduction(cmd.id, 'en_cours')}
                                        className="px-3.5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
                                        title="Lancer quand même un cycle de presse pour reconstituer les stocks"
                                      >
                                        ⚙️ Lancer aussi fabrication
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                                    <div className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                                      <span>⚠️</span> Quantités en stock insuffisantes. Le lancement en fabrication est obligatoire avant livraison.
                                    </div>
                                    <button
                                      onClick={() => updateStatutProduction(cmd.id, 'en_cours')}
                                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                    >
                                      <span>⚙️</span> Lancer la production usine
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes en production */}
            {commandesEnProduction.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">⚙️ En production</h2>
                <div className="space-y-4">
                  {commandesEnProduction.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-yellow-500">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="font-bold text-lg text-[#002B5B]">{cmd.id}</div>
                            <div className="text-sm text-gray-600">{cmd.client.entreprise}</div>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">EN PRODUCTION</span>
                        </div>

                        <div className="space-y-1 mb-4">
                          {cmd.articles.map((article, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100">
                              <span>{article.nom}</span>
                              <span className="font-bold">{article.quantite} unités</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => updateStatutProduction(cmd.id, 'prete')}
                          className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 min-h-[44px]"
                        >
                          ✅ Marquer comme prête à livrer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes prêtes - Génération BL */}
            {commandesPretes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">✅ Prêtes à livrer - Générer le Bon de Livraison</h2>
                <div className="space-y-4">
                  {commandesPretes.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-green-500">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="font-bold text-lg text-[#002B5B]">{cmd.id}</div>
                            <div className="text-sm text-gray-600">{cmd.client.entreprise}</div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">PRÊTE</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chauffeur assigné *</label>
                            <select
                              value={chauffeurSelectionne}
                              onChange={(e) => setChauffeurSelectionne(e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none min-h-[44px] bg-white"
                            >
                              <option value="">Sélectionner un chauffeur</option>
                              {CHAUFFEURS.map((c, idx) => (
                                <option key={idx} value={c.nom}>{c.nom} - {c.telephone}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Véhicule *</label>
                            <select
                              value={vehiculeSelectionne}
                              onChange={(e) => setVehiculeSelectionne(e.target.value)}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none min-h-[44px] bg-white"
                            >
                              <option value="">Sélectionner un véhicule</option>
                              <option value="1234 HK 01">1234 HK 01 - Benne 20T</option>
                              <option value="5678 AB 23">5678 AB 23 - Benne 15T</option>
                              <option value="9012 CD 45">9012 CD 45 - Benne 25T</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => genererBonLivraison(cmd)}
                          className="w-full bg-[#002B5B] text-white py-3 rounded-lg font-bold hover:bg-[#001d3d] min-h-[44px]"
                        >
                          📄 Générer le Bon de Livraison
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {commandesPretes.length === 0 && commandesAPreparer.length === 0 && commandesEnProduction.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-gray-500">Aucune commande à traiter</p>
              </div>
            )}
          </>
        ) : (
          // Affichage du Bon de Livraison
          <div className="max-w-5xl mx-auto">
            <button 
              onClick={() => { setCommandeSelectionnee(null); setChauffeurSelectionne(''); setVehiculeSelectionne(''); }}
              className="mb-6 text-[#002B5B] hover:text-[#FFD700] font-bold flex items-center gap-2"
            >
              ← Retour à la liste des commandes
            </button>

            <BonLivraison
              numero={`BL-2026-${commandeSelectionnee.id.split('-')[2]}`}
              date={commandeSelectionnee.date}
              statut="chargement"
              usine={{
                nom: 'CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC SARL)',
                adresse: 'Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa',
                rccm: 'CI DAL 2013 B. 20779 • CC N° : 8104005 C',
                telephone: '+225 07 07 62 17 99 / +225 07 07 85 76 29',
              }}



              client={{
                nom: commandeSelectionnee.client.entreprise,
                chantier: commandeSelectionnee.client.adresse,
                telephone: commandeSelectionnee.client.telephone,
              }}
              vehicule={vehiculeSelectionne}
              chauffeur={{
                nom: chauffeurSelectionne,
                telephone: CHAUFFEURS.find(c => c.nom === chauffeurSelectionne)?.telephone || '',
              }}
              articles={commandeSelectionnee.articles.map(a => ({
                designation: a.nom,
                quantite: a.quantite,
                conditionnement: 'Palettes filmées',
              }))}
              responsableUsine="Mamadou B."
            />
          </div>
        )}
      </div>

      {/* Modal Simulateur WhatsApp Live */}
      <SimulateurWhatsAppModal
        isOpen={modalWhatsAppSimulateur}
        onClose={() => setModalWhatsAppSimulateur(false)}
        onRefreshData={() => setCommandes(getCommandes())}
      />
    </main>
  );
}