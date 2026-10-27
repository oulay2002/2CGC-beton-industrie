"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, saveCommande, Commande as CommandeStore } from '@/lib/commandes-store';
import BonLivraison from '@/components/BonLivraison';
import { genererBonLivraison as genererBonLivraisonPDF } from '@/lib/generer-bons';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';
import {
  fetchStocksMatieres,
  fetchStocksProduits,
  fetchChauffeurs,
  updateStockMatiere,
  ajusterStockMatiere,
  ajusterStockProduit,
  emettreBon,
  type StockMatiere,
  type StockProduit,
  type ChauffeurDisponible,
} from '@/lib/supabase/services';
import SimulateurWhatsAppModal from '@/components/SimulateurWhatsAppModal';
import { AlertTriangle, CheckCircle2, Cog, FileText, HardHat, MessageCircle, Package, Siren, Truck } from 'lucide-react';
import { useFermetureModale, fermerSiFond } from '@/lib/use-fermeture-modale';

type Commande = CommandeStore;

export default function UsineDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<Commande | null>(null);
  const [chauffeurSelectionne, setChauffeurSelectionne] = useState('');
  const [vehiculeSelectionne, setVehiculeSelectionne] = useState('');
  const [numeroBonEmis, setNumeroBonEmis] = useState<string | null>(null);
  const [notificationAction, setNotificationAction] = useState<string | null>(null);

  // Les stocks viennent de la base, et non plus d'une copie en memoire : une
  // valeur saisie ici devait etre visible du dirigeant, et survivre au
  // rechargement de la page. Tant que la lecture n'a pas abouti, les listes
  // restent vides et l'ecran le dit, plutot que d'afficher des chiffres
  // inventes.
  const [stocksProduits, setStocksProduits] = useState<StockProduit[]>([]);
  const [stocksMatieres, setStocksMatieres] = useState<StockMatiere[]>([]);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurDisponible[]>([]);
  const [stocksCharges, setStocksCharges] = useState(false);

  const [modalReappro, setModalReappro] = useState<string | null>(null);
  useFermetureModale(modalReappro !== null, () => setModalReappro(null));
  const [quantiteAjout, setQuantiteAjout] = useState<number>(20);

  // Ajustement d'un produit fini. Le panneau etait en lecture seule : on
  // voyait les stocks sans pouvoir les corriger apres un inventaire, ni
  // deplacer un seuil d'alerte.
  const [produitAjuste, setProduitAjuste] = useState<StockProduit | null>(null);
  const [saisieQuantite, setSaisieQuantite] = useState('');
  const [saisieSeuil, setSaisieSeuil] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  useFermetureModale(produitAjuste !== null, () => setProduitAjuste(null));

  // Matieres premieres : la boite ne savait qu'enregistrer une livraison.
  // Corriger un stock apres inventaire, ou deplacer un seuil, etait impossible.
  const [saisieStockMatiere, setSaisieStockMatiere] = useState('');
  const [saisieSeuilMatiere, setSaisieSeuilMatiere] = useState('');

  const ouvrirReappro = (m: StockMatiere) => {
    setSaisieStockMatiere(String(m.quantiteTonnes));
    setSaisieSeuilMatiere(String(m.seuilCritiqueTonnes));
    setQuantiteAjout(20);
    setModalReappro(m.id);
  };

  const enregistrerAjustementMatiere = async () => {
    const matiere = stocksMatieres.find((m) => m.id === modalReappro);
    if (!matiere) return;
    const q = Number(saisieStockMatiere);
    const seuil = Number(saisieSeuilMatiere);
    if (!Number.isFinite(q) || q < 0 || !Number.isFinite(seuil) || seuil < 0) {
      setAlertStockMessage('Saisissez des nombres positifs.');
      setTimeout(() => setAlertStockMessage(null), 5000);
      return;
    }
    const ok = await ajusterStockMatiere(matiere.id, {
      quantiteTonnes: q,
      seuilCritiqueTonnes: seuil,
    });
    if (!ok) {
      setAlertStockMessage("L'ajustement n'a pas pu etre enregistre.");
      setTimeout(() => setAlertStockMessage(null), 6000);
      return;
    }
    setStocksMatieres((prev) =>
      prev.map((m) =>
        m.id === matiere.id ? { ...m, quantiteTonnes: q, seuilCritiqueTonnes: seuil } : m,
      ),
    );
    setModalReappro(null);
    setAlertStockMessage(`${matiere.nom} : ${q} T en stock, alerte sous ${seuil} T.`);
    setTimeout(() => setAlertStockMessage(null), 5000);
  };

  const ouvrirAjustement = (s: StockProduit) => {
    setSaisieQuantite(String(s.quantite));
    setSaisieSeuil(String(s.seuilAlerte));
    setProduitAjuste(s);
  };

  const enregistrerAjustement = async () => {
    if (!produitAjuste) return;
    const q = Number(saisieQuantite);
    const seuil = Number(saisieSeuil);
    if (!Number.isFinite(q) || q < 0 || !Number.isFinite(seuil) || seuil < 0) {
      setAlertStockMessage('Saisissez des nombres positifs.');
      setTimeout(() => setAlertStockMessage(null), 5000);
      return;
    }
    setEnregistrement(true);
    const ok = await ajusterStockProduit(produitAjuste.produitId, {
      quantite: Math.round(q),
      seuilAlerte: Math.round(seuil),
    });
    setEnregistrement(false);
    if (!ok) {
      setAlertStockMessage("L'ajustement n'a pas pu etre enregistre.");
      setTimeout(() => setAlertStockMessage(null), 6000);
      return;
    }
    setProduitAjuste(null);
    void rechargerStocks();
    setAlertStockMessage(`${produitAjuste.nom} : ${Math.round(q)} unites, seuil ${Math.round(seuil)}.`);
    setTimeout(() => setAlertStockMessage(null), 5000);
  };
  const [alertStockMessage, setAlertStockMessage] = useState<string | null>(null);
  const [modalWhatsAppSimulateur, setModalWhatsAppSimulateur] = useState(false);

  useEffect(() => {
    void getCommandes().then(setCommandes);
    const handleUpdate = () => void getCommandes().then(setCommandes);
    window.addEventListener('commandes_updated', handleUpdate);

    return () => {
      window.removeEventListener('commandes_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'chef_usine' && user.role !== 'dirigeant')) {
      router.push('/connexion');
    }
  }, [user, isLoading, router]);

  const rechargerStocks = useCallback(async () => {
    const [produits, matieres] = await Promise.all([
      fetchStocksProduits(),
      fetchStocksMatieres(),
    ]);
    if (produits) setStocksProduits(produits);
    if (matieres) setStocksMatieres(matieres);
    setStocksCharges(true);
  }, []);

  useEffect(() => {
    if (isLoading || !user) return;
    // Lecture des stocks et des comptes apres le montage : ces donnees
    // n'existent pas au rendu serveur, et les poser pendant le rendu ferait
    // diverger l'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void rechargerStocks();
    // La liste des chauffeurs vient des comptes reels : l'ecran affichait
    // auparavant deux noms inventes, qui ne correspondaient a aucun compte,
    // si bien qu'aucune livraison affectee n'atteignait son destinataire.
    void fetchChauffeurs().then((liste) => { if (liste) setChauffeurs(liste); });
  }, [isLoading, user, rechargerStocks]);

  /**
   * Disponibilite d'une commande, ligne par ligne.
   *
   * Le rapprochement se fait par identifiant de produit. L'ancienne version
   * comparait des libelles et se repliait sur « 1000 unites » des qu'un nom
   * manquait a sa table : comme aucun des sept libelles ne correspondait au
   * catalogue, toute commande etait declaree disponible. Ici, une ligne dont
   * le produit reste introuvable est signalee comme telle, jamais supposee
   * servie.
   */
  const verifierDisponibiliteStock = (articles: Commande['articles']) => {
    const parId = new Map(stocksProduits.map((s) => [s.produitId, s]));

    const details = articles.map((art) => {
      const stock = art.produitId ? parId.get(art.produitId) : undefined;
      const connu = stock !== undefined;
      const disponible = stock?.quantite ?? 0;
      const suffisant = connu && disponible >= art.quantite;
      return {
        nom: art.nom,
        demande: art.quantite,
        disponible,
        connu,
        suffisant,
        manquant: suffisant ? 0 : Math.max(0, art.quantite - disponible),
      };
    });

    // Tant que les stocks ne sont pas charges, on ne conclut pas.
    const estTotalementEnStock = stocksCharges && details.every((d) => d.suffisant);
    return { estTotalementEnStock, details };
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
    const modifiee = updatedList.find((c) => c.id === id);
    if (modifiee) void saveCommande(modifiee);
  };

  /**
   * Emet le bon de livraison : le serveur attribue son numero et decremente
   * le stock dans la meme transaction que sa verification. Rien n'est ecrit
   * localement tant qu'il n'a pas repondu — une emission refusee faute de
   * stock ne doit pas laisser la commande marquee prete.
   */
  const validerEtGenererBLDirect = async (
    cmd: Commande,
    chauffeurNom: string,
    chauffeurEmail: string,
    immat: string,
  ) => {
    const resultat = await emettreBon({
      type: 'livraison',
      commandeId: cmd.id,
      client: cmd.client,
      articles: cmd.articles.map((a) => ({
        produitId: a.produitId,
        nom: a.nom,
        quantite: a.quantite,
        prix: a.prix,
      })),
      total: cmd.total,
      chauffeur: chauffeurNom,
      chauffeurEmail,
      immatriculation: immat,
    });

    if (!resultat.ok) {
      const detail = resultat.manquants?.length
        ? resultat.manquants
            .map((m) => `${m.produit_id} : ${m.disponible} dispo pour ${m.demande} demandes`)
            .join(' · ')
        : resultat.erreur;
      setAlertStockMessage(`Bon non emis — ${detail}`);
      setTimeout(() => setAlertStockMessage(null), 8000);
      return;
    }

    const updatedList = commandes.map((c) =>
      c.id === cmd.id
        ? {
            ...c,
            statutProduction: 'prete' as Commande['statutProduction'],
            statut: 'en_cours' as Commande['statut'],
            chauffeur: chauffeurNom,
            chauffeurEmail,
          }
        : c,
    );
    setCommandes(updatedList);
    const modifiee = updatedList.find((c) => c.id === cmd.id);
    if (modifiee) void saveCommande(modifiee);
    void rechargerStocks();

    genererBonLivraisonPDF({
      reference: cmd.id,
      date: cmd.date,
      numeroBon: resultat.numero,
      dateLivraisonPrevue: new Date().toISOString(),
      chauffeur: chauffeurNom,
      immatriculation: immat,
      client: cmd.client,
      articles: cmd.articles.map((a) => ({ nom: a.nom, quantite: a.quantite, prix: a.prix })),
      type: 'livraison',
    });

    setNotificationAction(
      `Bon ${resultat.numero} emis pour ${cmd.id}, affecte a ${chauffeurNom}. Stock mis a jour.`,
    );
    setTimeout(() => setNotificationAction(null), 6000);
  };

  const genererBonLivraison = async (cmd: Commande) => {
    const ch = CHAUFFEURS.find((c) => c.email === chauffeurSelectionne);
    if (!ch || !vehiculeSelectionne) {
      setAlertStockMessage('Selectionnez un chauffeur et renseignez le vehicule.');
      setTimeout(() => setAlertStockMessage(null), 6000);
      return;
    }

    // Ouvrir l'apercu, c'est emettre : le numero est attribue maintenant, par
    // le serveur, et le stock est decremente dans la meme transaction.
    const resultat = await emettreBon({
      type: 'livraison',
      commandeId: cmd.id,
      client: cmd.client,
      articles: cmd.articles.map((a) => ({
        produitId: a.produitId,
        nom: a.nom,
        quantite: a.quantite,
        prix: a.prix,
      })),
      total: cmd.total,
      chauffeur: ch.nom,
      chauffeurEmail: ch.email,
      immatriculation: vehiculeSelectionne,
    });

    if (!resultat.ok) {
      const detail = resultat.manquants?.length
        ? resultat.manquants
            .map((m) => `${m.produit_id} : ${m.disponible} dispo pour ${m.demande} demandes`)
            .join(' · ')
        : resultat.erreur;
      setAlertStockMessage(`Bon non emis — ${detail}`);
      setTimeout(() => setAlertStockMessage(null), 8000);
      return;
    }

    const updatedList = commandes.map((c) =>
      c.id === cmd.id ? { ...c, chauffeur: ch.nom, chauffeurEmail: ch.email } : c,
    );
    setCommandes(updatedList);
    const affectee = updatedList.find((c) => c.id === cmd.id);
    if (affectee) void saveCommande(affectee);
    void rechargerStocks();

    setNumeroBonEmis(resultat.numero ?? null);
    setCommandeSelectionnee(cmd);
  };

  // Les chauffeurs proviennent des comptes enregistres (cf. fetchChauffeurs).
  const CHAUFFEURS = chauffeurs.map((c) => ({
    email: c.email,
    nom: c.nom,
    telephone: c.telephone ?? '',
    vehicules: c.vehicule ? [c.vehicule] : [],
  }));

  /**
   * Reapprovisionnement d'un silo. L'ancienne version ne touchait que l'etat
   * React : la saisie disparaissait au rechargement et le dirigeant ne la
   * voyait jamais. L'ecriture passe desormais par l'API, et l'affichage n'est
   * mis a jour qu'une fois le serveur confirme.
   */
  const reapprovisionnerMatiere = async (id: string) => {
    const matiere = stocksMatieres.find((m) => m.id === id);
    if (!matiere) return;

    const nouvelleQuantite = Math.min(
      matiere.capaciteMaxTonnes,
      Math.round((matiere.quantiteTonnes + Number(quantiteAjout)) * 10) / 10,
    );

    const ok = await updateStockMatiere(id, nouvelleQuantite);
    if (!ok) {
      setAlertStockMessage("Le reapprovisionnement n'a pas pu etre enregistre.");
      setTimeout(() => setAlertStockMessage(null), 6000);
      return;
    }

    setStocksMatieres((prev) =>
      prev.map((m) => (m.id === id ? { ...m, quantiteTonnes: nouvelleQuantite } : m)),
    );
    setAlertStockMessage(
      `Silo ${matiere.nom} : +${quantiteAjout} T enregistrees (${nouvelleQuantite} T au total).`,
    );
    setModalReappro(null);
    setTimeout(() => setAlertStockMessage(null), 5000);
  };

  const genererLienWhatsAppAlerteDG = (matiere: typeof stocksMatieres[0]) => {
    const texte =`*ALERTE STOCK CRITIQUE USINE 2CGC DALOA*\n\n` +
      `Bonjour Direction Générale,\n` +
      `Le niveau de *${matiere.nom}* a atteint son seuil critique !\n\n` +
      `*Stock actuel :* ${matiere.quantiteTonnes} ${matiere.unite} (Seuil d'alerte : ${matiere.seuilCritiqueTonnes} ${matiere.unite})\n` +
      `*Capacité silo :* ${matiere.capaciteMaxTonnes} ${matiere.unite}\n` +
      `*Fournisseur recommandé :* ${matiere.fournisseur}\n\n` +
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
              <MessageCircle className="w-4 h-4" />
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
              <h1 className="text-3xl font-bold text-[#002B5B]">Bonjour {user.nom} </h1>
              <p className="text-gray-600 mt-1">Gestion de la production et préparation des commandes</p>
            </div>

            {/* Notification Bon de Livraison Direct */}
            {notificationAction && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-sm font-bold flex items-center justify-between shadow-sm animate-pulse">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" /> {notificationAction}
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full uppercase">BL Téléchargé</span>
              </div>
            )}

            {/* Stats production */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border border-red-500">
                <div className="text-sm text-gray-500 mb-1">À préparer</div>
                <div className="text-3xl font-bold text-[#002B5B]">{commandesAPreparer.length}</div>
                <div className="text-xs text-red-600 mt-1">Nouvelles commandes</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-500">
                <div className="text-sm text-gray-500 mb-1">En production</div>
                <div className="text-3xl font-bold text-[#002B5B]">{commandesEnProduction.length}</div>
                <div className="text-xs text-gray-500 mt-1">En cours de fabrication</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-green-500">
                <div className="text-sm text-gray-500 mb-1">Prêtes à livrer</div>
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
            {/* Stock de produits finis : ce que l'usine peut charger aujourd'hui.
                Il determine si une commande part directement ou passe en
                fabrication, d'ou sa place avant les matieres premieres. */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-8">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-[#002B5B] flex items-center gap-2">
                    <Package className="w-4 h-4" /> Stock de produits finis
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Unités disponibles sur parc, prêtes à être chargées. Déduites
                    automatiquement à l&apos;émission d&apos;un bon de livraison.
                    Cliquez une référence pour corriger sa quantité ou son seuil.
                  </p>
                </div>
                <button
                  onClick={() => void rechargerStocks()}
                  className="text-xs font-bold text-[#002B5B] border border-[#002B5B]/20 rounded-xl px-3 py-2 hover:bg-[#002B5B]/5 transition-colors"
                >
                  Actualiser
                </button>
              </div>

              {!stocksCharges ? (
                <p className="text-sm text-gray-500">Lecture des stocks…</p>
              ) : stocksProduits.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  Aucun stock enregistré. La table des produits finis n'a pas encore
                  été créée en base (migration 007).
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stocksProduits.map((s) => {
                    const critique = s.quantite <= s.seuilAlerte;
                    return (
                      <button
                        key={s.produitId}
                        type="button"
                        onClick={() => ouvrirAjustement(s)}
                        title="Ajuster la quantité et le seuil"
                        className={`text-left w-full rounded-xl border p-3 transition-colors hover:border-[#002B5B]/40 hover:shadow-sm ${
                          critique
                            ? 'border-red-300 bg-red-50/60'
                            : 'border-slate-200 bg-slate-50/60'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#002B5B] leading-snug">{s.nom}</div>
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span
                            className={`text-xl font-black tabular-nums ${
                              critique ? 'text-red-700' : 'text-[#002B5B]'
                            }`}
                          >
                            {s.quantite.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            seuil {s.seuilAlerte.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        {critique && (
                          <div className="text-[11px] font-bold text-red-700 mt-1">
                            Sous le seuil d&apos;alerte
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-[#002B5B] flex items-center gap-2">
                    <HardHat className="w-4 h-4" /> Niveaux des Silos &amp; Stocks Matières Premières
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
                          <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            Critique
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
                        <div>Conso : <span className="font-semibold">{mat.consommationMoyenne}</span></div>
                        <div className="truncate" title={mat.fournisseur}>{mat.fournisseur}</div>
                      </div>

                      {/* Boutons Action */}
                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() => {
                            ouvrirReappro(mat);
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
                            <Siren className="w-4 h-4" /> Alerter DG (WhatsApp)
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Réapprovisionnement Silo */}
            {/* Ajustement d'un produit fini : quantite apres inventaire et
                seuil d'alerte. Le panneau etait en lecture seule. */}
            {produitAjuste && (
              <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={fermerSiFond(() => setProduitAjuste(null))}
              >
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <h3 className="text-lg font-black text-[#002B5B]">{produitAjuste.nom}</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-5">
                    Stock actuel : {produitAjuste.quantite.toLocaleString('fr-FR')} unités.
                    Corrigez-le après un inventaire, ou déplacez le seuil d&apos;alerte.
                  </p>

                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={saisieQuantite}
                    onChange={(e) => setSaisieQuantite(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#FFD700] focus:outline-none mb-4"
                  />

                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Seuil d&apos;alerte
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={saisieSeuil}
                    onChange={(e) => setSaisieSeuil(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#FFD700] focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 mb-5">
                    En dessous de ce nombre, la référence est signalée en rouge.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setProduitAjuste(null)}
                      className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => void enregistrerAjustement()}
                      disabled={enregistrement}
                      className="flex-1 bg-[#002B5B] hover:bg-[#001D3D] disabled:opacity-50 text-white py-2.5 rounded-xl font-black text-sm transition-colors"
                    >
                      {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalReappro && (
              <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={fermerSiFond(() => setModalReappro(null))}
              >
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-150">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-lg text-[#002B5B]">
                      Réapprovisionner le stock
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

                  {/* Second volet : corriger le stock apres un inventaire
                      physique, et deplacer le seuil d'alerte. Distinct de la
                      saisie d'une livraison, qui s'ajoute au stock courant. */}
                  <div className="border-t border-gray-100 pt-4 mb-5">
                    <p className="text-xs font-bold text-gray-700 mb-3">
                      Ou corriger directement, après inventaire
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Stock réel (Tonnes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={saisieStockMatiere}
                          onChange={(e) => setSaisieStockMatiere(e.target.value)}
                          className="w-full border-2 border-gray-200 focus:border-[#FFD700] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Seuil d&apos;alerte (T)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={saisieSeuilMatiere}
                          onChange={(e) => setSaisieSeuilMatiere(e.target.value)}
                          className="w-full border-2 border-gray-200 focus:border-[#FFD700] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => void enregistrerAjustementMatiere()}
                      className="w-full mt-3 border-2 border-[#002B5B] text-[#002B5B] hover:bg-[#002B5B]/5 py-2 rounded-xl font-bold text-xs transition-colors"
                    >
                      Enregistrer la correction
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => void reapprovisionnerMatiere(modalReappro)}
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
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">Commandes à préparer</h2>
                <div className="space-y-4">
                  {commandesAPreparer.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-red-500">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-[#002B5B]">{cmd.id}</span>
                              {(cmd.client.email?.includes('@whatsapp.2cgc.ci') || cmd.notes?.includes('WhatsApp')) && (
                                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  WhatsApp Live
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
                                  Contrôle Stock Disponibilité Usine :
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                  estTotalementEnStock 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}>
                                  {estTotalementEnStock ? 'Stock Suffisant (Direct BL)' : 'Stock Insuffisant (Production requise)'}
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
                                      <Package className="w-4 h-4" /> Le stock actuel couvre intégralement cette commande. Vous pouvez émettre le Bon de Livraison immédiatement.
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button
                                        onClick={() => {
                                          const ch = CHAUFFEURS.find((c) => c.email === chauffeurSelectionne) ?? CHAUFFEURS[0];
                                          if (!ch) {
                                            setAlertStockMessage("Aucun compte chauffeur enregistre : creez-en un avant d'emettre un bon.");
                                            setTimeout(() => setAlertStockMessage(null), 8000);
                                            return;
                                          }
                                          void validerEtGenererBLDirect(cmd, ch.nom, ch.email, vehiculeSelectionne || ch.vehicules[0] || '');
                                        }}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                      >
                                        <FileText className="w-4 h-4" /> Émettre Bon de Livraison Direct (Stock dispo)
                                      </button>
                                      <button
                                        onClick={() => updateStatutProduction(cmd.id, 'en_cours')}
                                        className="px-3.5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors"
                                        title="Lancer quand même un cycle de presse pour reconstituer les stocks"
                                      >
                                        Lancer aussi fabrication
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                                    <div className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                                      <AlertTriangle className="w-4 h-4" /> Quantités en stock insuffisantes. Le lancement en fabrication est obligatoire avant livraison.
                                    </div>
                                    <button
                                      onClick={() => updateStatutProduction(cmd.id, 'en_cours')}
                                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                    >
                                      <Cog className="w-4 h-4" /> Lancer la production usine
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
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">En production</h2>
                <div className="space-y-4">
                  {commandesEnProduction.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-yellow-500">
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
                          Marquer comme prête à livrer
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
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">Prêtes à livrer - Générer le Bon de Livraison</h2>
                <div className="space-y-4">
                  {commandesPretes.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-green-500">
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
                              onChange={(e) => {
                                setChauffeurSelectionne(e.target.value);
                                // Le vehicule suit le compte, et reste modifiable
                                // si le chauffeur prend un autre camion.
                                const ch = CHAUFFEURS.find((c) => c.email === e.target.value);
                                setVehiculeSelectionne(ch?.vehicules[0] ?? '');
                              }}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none min-h-[44px] bg-white"
                            >
                              <option value="">
                                {CHAUFFEURS.length === 0
                                  ? 'Aucun compte chauffeur enregistré'
                                  : 'Sélectionner un chauffeur'}
                              </option>
                              {CHAUFFEURS.map((c) => (
                                <option key={c.email} value={c.email}>
                                  {c.nom}{c.telephone ? ` — ${c.telephone}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Véhicule *</label>
                            <input
                              type="text"
                              value={vehiculeSelectionne}
                              onChange={(e) => setVehiculeSelectionne(e.target.value)}
                              placeholder="Immatriculation — ex : 1234 HK 01"
                              maxLength={40}
                              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none min-h-[44px] bg-white"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => genererBonLivraison(cmd)}
                          className="w-full bg-[#002B5B] text-white py-3 rounded-lg font-bold hover:bg-[#001d3d] min-h-[44px]"
                        >
                          Générer le Bon de Livraison
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {commandesPretes.length === 0 && commandesAPreparer.length === 0 && commandesEnProduction.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <CheckCircle2 className="w-14 h-14 mb-4" />
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
              numero={numeroBonEmis ?? commandeSelectionnee.id}
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
                nom: CHAUFFEURS.find((c) => c.email === chauffeurSelectionne)?.nom ?? '',
                telephone: CHAUFFEURS.find((c) => c.email === chauffeurSelectionne)?.telephone || '',
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
        onRefreshData={() => void getCommandes().then(setCommandes)}
      />
    </main>
  );
}