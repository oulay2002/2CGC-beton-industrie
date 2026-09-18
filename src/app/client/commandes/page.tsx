"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, CompteUtilisateur } from '@/lib/auth-context';
import { getCommandes, Commande } from '@/lib/commandes-store';
import { genererPDF } from '@/lib/generer-pdf';
import Link from 'next/link';

function formatFCFA(montant: number): string {
  return Math.round(montant).toLocaleString('fr-FR') + ' FCFA';
}

const STATUT_LABELS: Record<string, { label: string; couleur: string; icone: string }> = {
  livree: { label: 'Livrée', couleur: 'bg-green-100 text-green-800', icone: '✅' },
  en_cours: { label: 'En cours de livraison', couleur: 'bg-blue-100 text-blue-800', icone: '🚚' },
  preparation: { label: 'En préparation', couleur: 'bg-yellow-100 text-yellow-800', icone: '⚙️' },
  annulee: { label: 'Annulée', couleur: 'bg-red-100 text-red-800', icone: '❌' },
};

function CommandesPageInner() {
  const { user, getUtilisateurs, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
        Chargement de vos commandes...
      </div>
    );
  }

  if (!user || !clientActif) return null;

  // Filtrer uniquement les commandes appartenant au client actif
  const commandesFiltrees = toutesCommandes.filter(cmd => {
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

  const handleTelechargerFacture = (cmd: any) => {
    const totalHT = Math.round(cmd.total / 1.18);
    const tva = cmd.total - totalHT;

    genererPDF({
      reference: cmd.id,
      date: cmd.date,
      typeDoc: 'proforma',
      client: {
        nom: cmd.client.nom,
        entreprise: cmd.client.entreprise,
        email: cmd.client.email || clientActif.email,
        telephone: cmd.client.telephone || clientActif.telephone,
        adresse: cmd.client.adresse || 'Abidjan / Daloa',
      },
      lignes: cmd.articles.map((a: any) => ({
        nom: a.nom,
        quantite: a.quantite,
        prix: a.prix,
        specification: a.nom.includes('Pavé') ? 'Autobloquant haute compacité' : 'Bloc béton vibré B50/B60',
      })),
      recap: {
        totalHT,
        tva,
        totalTTC: cmd.total,
      },
      conditions: {
        validiteJours: 30,
        delaiLivraison: '48h à 72h ouvrées avec déchargement grue',
        modalitePaiement: 'Virement bancaire BSIC Daloa (RIB : CI154 08521 029041500015 04) ou chèque certifié 2CGC SARL',
      },

    });
  };

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
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#002B5B] mb-1">📦 Historique des commandes</h1>
            <p className="text-gray-600 text-sm">
              Commandes enregistrées pour <strong>{clientActif.entreprise || clientActif.nom}</strong> ({commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? 's' : ''})
            </p>
          </div>
          {user.role !== 'dirigeant' && (
            <Link
              href="/devis"
              className="bg-[#002B5B] text-white hover:bg-[#001d3d] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <span>➕</span> Passer une nouvelle commande
            </Link>
          )}
        </div>

        {commandesFiltrees.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Aucune commande trouvée pour ce compte</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Aucun bon de commande n'a encore été émis sous le compte de <strong>{clientActif.entreprise}</strong>.
            </p>
            <Link
              href={retourHref}
              className="inline-block bg-[#002B5B] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#001d3d] transition-all"
            >
              Retour à l&apos;espace client
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {commandesFiltrees.map((cmd) => {
            const statut = STATUT_LABELS[cmd.statut];
            return (
              <div key={cmd.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* En-tête commande */}
                <div className="bg-[#002B5B] text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <div className="font-bold text-lg">{cmd.id}</div>
                    <div className="text-sm text-white/70">
                      Passée le {new Date(cmd.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${statut.couleur}`}>
                      {statut.icone} {statut.label}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-white/70">Total TTC</div>
                      <div className="text-xl font-bold text-[#FFD700]">{formatFCFA(cmd.total)}</div>
                    </div>
                  </div>
                </div>

                {/* Détail articles */}
                <div className="p-6">
                  <h3 className="font-bold text-[#002B5B] mb-3">Articles commandés</h3>
                  <div className="space-y-2">
                    {cmd.articles.map((article, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-semibold text-gray-800">{article.nom}</div>
                          <div className="text-sm text-gray-500">
                            {article.quantite} × {formatFCFA(article.prix)}
                          </div>
                        </div>
                        <div className="font-bold text-[#002B5B]">
                          {formatFCFA(article.quantite * article.prix)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                    <Link
                      href="/client/reassort-rapide"
                      className="bg-[#FFD700] text-[#002B5B] px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 min-h-[44px] flex items-center justify-center gap-2 shadow-sm"
                    >
                      🔄 Réassort identique
                    </Link>
                    <button
                      onClick={() => handleTelechargerFacture(cmd)}
                      className="border-2 border-[#002B5B] text-[#002B5B] px-6 py-3 rounded-xl font-bold hover:bg-[#002B5B] hover:text-white min-h-[44px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      📄 Télécharger Facture Proforma PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </main>
  );
}

export default function CommandesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">Chargement de vos commandes...</div>}>
      <CommandesPageInner />
    </Suspense>
  );
}