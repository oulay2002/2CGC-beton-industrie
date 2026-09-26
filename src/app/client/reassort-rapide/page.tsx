"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, ajouterCommandeDepuisDevis, Commande } from '@/lib/commandes-store';
import { genererBonCommande } from '@/lib/generer-bons';
import Link from 'next/link';
import posthog from 'posthog-js';

function formatFCFA(montant: number): string {
  return Math.round(montant).toLocaleString('fr-FR') + ' FCFA';
}

// Produits fréquents basés sur l'historique
const PRODUITS_FREQUENTS = [
  { id: '1', nom: 'Agglo 20x20x50 Plein', prix: 1200, categorie: 'agglos' },
  { id: '2', nom: 'Agglo 15x20x50 Creux', prix: 950, categorie: 'agglos' },
  { id: '3', nom: 'Pavé Autobloquant 20x10x8', prix: 600, categorie: 'paves' },
  { id: '4', nom: 'Pavé Hollandais 20x10x6', prix: 450, categorie: 'paves' },
  { id: '5', nom: 'Bordure T2 100x25x15', prix: 5500, categorie: 'bordures' },
  { id: '6', nom: 'Bordure T4 100x25x27', prix: 7800, categorie: 'bordures' },
];

interface ProduitReassort {
  produitId: string;
  quantite: number;
}

function ReassortRapidePageInner() {
  const { user, getUtilisateurs, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [panier, setPanier] = useState<ProduitReassort[]>([]);
  const [clientActif, setClientActif] = useState<any>(null);
  const [toutesCommandes, setToutesCommandes] = useState<Commande[]>([]);

  useEffect(() => {
    setToutesCommandes(getCommandes());
    const handleUpdate = () => setToutesCommandes(getCommandes());
    window.addEventListener('commandes_updated', handleUpdate);
    return () => window.removeEventListener('commandes_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'client' && user.role !== 'dirigeant')) {
      router.push('/connexion');
      return;
    }

    if (user.role === 'dirigeant') {
      const tousClients = getUtilisateurs().filter(u => u.role === 'client');
      const emailParam = searchParams.get('email');
      const cible = (emailParam && tousClients.find(c => c.email.toLowerCase() === emailParam.toLowerCase())) || tousClients[0] || user;
      setClientActif(cible);
    } else {
      setClientActif(user);
    }
  }, [user, isLoading, router, searchParams, getUtilisateurs]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement du réassort rapide...
      </div>
    );
  }

  if (!user || !clientActif) return null;

  // Filtrer l'historique spécifique à ce client pour calculer ses produits fréquents
  const commandesClient = toutesCommandes.filter(cmd => {
    const cEmail = (cmd.client as any).email?.toLowerCase();
    const cNom = cmd.client.nom?.toLowerCase();
    const cEnt = cmd.client.entreprise?.toLowerCase();
    const targetEmail = clientActif.email?.toLowerCase();
    const targetNom = clientActif.nom?.toLowerCase();
    const targetEnt = clientActif.entreprise?.toLowerCase();

    return (cEmail && targetEmail && cEmail === targetEmail) ||
           (cNom && targetNom && cNom === targetNom) ||
           (cEnt && targetEnt && cEnt === targetEnt);
  });

  // Calculer les produits fréquents réels du client
  const produitsFrequentsClient = PRODUITS_FREQUENTS.map(p => {
    const totalQuantite = commandesClient.reduce((sum, cmd) => {
      const article = cmd.articles.find(a => a.nom.toLowerCase().includes(p.nom.toLowerCase()) || p.nom.toLowerCase().includes(a.nom.toLowerCase()));
      return sum + (article ? article.quantite : 0);
    }, 0);
    
    return { ...p, quantiteTotale: totalQuantite };
  }).filter(p => p.quantiteTotale > 0);

  // Fallback si le client n'a pas encore de commandes : proposer les 3 best-sellers
  const produitsAffiches = produitsFrequentsClient.length > 0 
    ? produitsFrequentsClient 
    : PRODUITS_FREQUENTS.slice(0, 4).map(p => ({ ...p, quantiteTotale: 0 }));

  const ajouterAuPanier = (produitId: string, quantiteDefaut: number = 100) => {
    const existe = panier.find(p => p.produitId === produitId);
    if (existe) {
      setPanier(panier.map(p => 
        p.produitId === produitId ? { ...p, quantite: p.quantite + quantiteDefaut } : p
      ));
    } else {
      setPanier([...panier, { produitId, quantite: quantiteDefaut }]);
    }
  };

  const modifierQuantite = (produitId: string, quantite: number) => {
    if (quantite <= 0) {
      setPanier(panier.filter(p => p.produitId !== produitId));
    } else {
      setPanier(panier.map(p => 
        p.produitId === produitId ? { ...p, quantite } : p
      ));
    }
  };

  const genererCommandeRapide = () => {
    if (panier.length === 0) return;

    const articles = panier.map(p => {
      const produit = PRODUITS_FREQUENTS.find(prod => prod.id === p.produitId);
      return {
        nom: produit?.nom || '',
        quantite: p.quantite,
        prix: produit?.prix || 0,
      };
    });

    const total = articles.reduce((sum, a) => sum + (a.quantite * a.prix), 0) * 1.18;
    const reference = `BC-RR-${Date.now().toString().slice(-6)}`;
    
    // Ajout direct dans le store des commandes 2CGC (usine et direction générale)
    ajouterCommandeDepuisDevis({
      id: `CMD-${reference.replace('BC-', '')}`,
      total,
      client: {
        nom: clientActif.nom,
        entreprise: clientActif.entreprise || clientActif.nom,
        email: clientActif.email,
        telephone: clientActif.telephone || '+225 07 00 00 00',
        adresse: clientActif.adresse || 'Daloa / Enlèvement Chantier',
      },
      articles,
    });

    genererBonCommande({
      reference,
      date: new Date().toISOString(),
      client: {
        nom: clientActif.nom,
        entreprise: clientActif.entreprise || clientActif.nom,
        email: clientActif.email,
        telephone: clientActif.telephone || '+225 07 00 00 00',
        adresse: clientActif.adresse || 'Abidjan / Daloa',
      },
      articles,
      total,
      type: 'commande',
    });

    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.capture('quick_reorder_created', {
        product_count: articles.length,
        total_amount: Math.round(total),
        currency: 'XOF',
      });
    }
  };

  const totalPanier = panier.reduce((sum, p) => {
    const produit = PRODUITS_FREQUENTS.find(prod => prod.id === p.produitId);
    return sum + (p.quantite * (produit?.prix || 0));
  }, 0);

  const retourHref = user.role === 'dirigeant' 
    ? `/client?email=${encodeURIComponent(clientActif.email)}`
    : '/client';

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/40">|</span>
            <Link href={retourHref} className="text-[#FFD700] hover:underline font-bold text-xs sm:text-sm">← Espace Client</Link>
          </div>
          <div className="text-sm">
            <span className="text-white/60">Compte :</span> <strong className="text-white">{clientActif.entreprise || clientActif.nom}</strong>
            {user.role === 'dirigeant' && (
              <span className="ml-2 text-[10px] bg-[#FFD700] text-[#002B5B] font-black px-2 py-0.5 rounded">
                Supervision Dirigeant
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#002B5B] mb-2"> Réassort Rapide</h1>
          <p className="text-gray-600">
            Commandez vos produits habituels en quelques clics basés sur votre historique
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Produits fréquents */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-[#002B5B] mb-4">📦 Vos produits fréquents</h2>
              <p className="text-sm text-gray-600 mb-6">
                Basé sur les {commandesClient.length} commande{commandesClient.length > 1 ? 's' : ''} de <strong>{clientActif.entreprise || clientActif.nom}</strong>
              </p>

              <div className="space-y-4">
                {produitsAffiches.map((produit) => {
                  const dansPanier = panier.find(p => p.produitId === produit.id);
                  return (
                    <div key={produit.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#FFD700] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-bold text-[#002B5B] text-lg">{produit.nom}</div>
                          <div className="text-sm text-gray-600">
                            {produit.quantiteTotale} unités commandées au total • {formatFCFA(produit.prix)} / unité
                          </div>
                        </div>
                        
                        {dansPanier ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => modifierQuantite(produit.id, dansPanier.quantite - 50)}
                              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl flex items-center justify-center min-h-[44px]"
                            >
                              −
                            </button>
                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-[#002B5B]">{dansPanier.quantite}</div>
                              <div className="text-xs text-gray-500">unités</div>
                            </div>
                            <button
                              onClick={() => modifierQuantite(produit.id, dansPanier.quantite + 50)}
                              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl flex items-center justify-center min-h-[44px]"
                            >
                              +
                            </button>
                            <button
                              onClick={() => modifierQuantite(produit.id, 0)}
                              className="text-red-500 hover:text-red-700 font-bold px-3 py-2 min-h-[44px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => ajouterAuPanier(produit.id, 100)}
                            className="bg-[#FFD700] text-[#002B5B] px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors min-h-[44px]"
                          >
                            + Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {produitsAffiches.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📦</div>
                    <p>Aucun produit dans votre historique</p>
                    <Link href="/catalogue" className="text-[#002B5B] font-bold hover:text-[#FFD700] mt-2 inline-block">
                      Parcourir le catalogue →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Tous les produits disponibles */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#002B5B] mb-4"> Tous les produits</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {PRODUITS_FREQUENTS.filter(p => !produitsAffiches.find(pf => pf.id === p.id)).map((produit) => (
                  <div key={produit.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#FFD700] transition-colors">
                    <div className="font-bold text-[#002B5B] mb-1">{produit.nom}</div>
                    <div className="text-sm text-gray-600 mb-3">{formatFCFA(produit.prix)} / unité</div>
                    <button
                      onClick={() => ajouterAuPanier(produit.id, 50)}
                      className="w-full bg-[#002B5B] text-white py-3 rounded-lg font-bold hover:bg-[#001d3d] transition-colors min-h-[44px]"
                    >
                      Ajouter 50 unités
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite : Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl border-t-4 border-[#FFD700] p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-[#002B5B] mb-4">📋 Votre commande</h2>

              {panier.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-5xl mb-3">🛒</div>
                  <p>Votre panier est vide</p>
                  <p className="text-sm mt-2">Ajoutez des produits pour commander</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {panier.map((item) => {
                      const produit = PRODUITS_FREQUENTS.find(p => p.id === item.produitId);
                      return (
                        <div key={item.produitId} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{produit?.nom}</div>
                            <div className="text-xs text-gray-500">
                              {item.quantite} × {formatFCFA(produit?.prix || 0)}
                            </div>
                          </div>
                          <div className="font-bold text-[#002B5B]">
                            {formatFCFA(item.quantite * (produit?.prix || 0))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t-2 border-[#002B5B] pt-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total HT</span>
                      <span className="font-bold text-lg">{formatFCFA(totalPanier)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">TVA (18%)</span>
                      <span className="font-bold">{formatFCFA(totalPanier * 0.18)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xl font-bold text-[#002B5B]">Total TTC</span>
                      <span className="text-2xl font-bold text-[#002B5B]">{formatFCFA(totalPanier * 1.18)}</span>
                    </div>
                  </div>

                  <button
                    onClick={genererCommandeRapide}
                    className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#002B5B] py-4 rounded-lg font-black text-lg hover:shadow-lg transition-all min-h-[44px] mb-3"
                  >
                    ⚡ Commander maintenant
                  </button>

                  <div className="text-xs text-center text-gray-500">
                    Le bon de commande sera généré automatiquement
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReassortRapidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">Chargement du réassort rapide...</div>}>
      <ReassortRapidePageInner />
    </Suspense>
  );
}