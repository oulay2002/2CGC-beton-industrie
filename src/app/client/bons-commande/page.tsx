"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, Commande } from '@/lib/commandes-store';
import { genererBonCommande } from '@/lib/generer-bons';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';


const STATUT_LABELS: Record<string, { label: string; couleur: string }> = {
  confirmee: { label: 'Confirmée', couleur: 'bg-green-100 text-green-800' },
  en_cours: { label: 'En cours', couleur: 'bg-blue-100 text-blue-800' },
  annulee: { label: 'Annulée', couleur: 'bg-red-100 text-red-800' },
};

function BonsCommandePageInner() {
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
        Chargement des bons de commande...
      </div>
    );
  }

  if (!user || !clientActif) return null;

  // Filtrer les bons de commande selon le compte actif
  // On dérive les bons directement des commandes réelles du client actif
  const commandesDuClient = toutesCommandes.filter(cmd => {
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

  const bonsFiltres = commandesDuClient.map(cmd => ({
    id: `BC-${cmd.id.replace('CMD-', '')}`,
    date: cmd.date,
    statut: cmd.statut === 'livree' ? 'confirmee' : cmd.statut === 'nouvelle' ? 'en_cours' : 'confirmee',
    total: cmd.total,
    articles: cmd.articles,
  }));

  const telechargerBon = (bon: any) => {
    genererBonCommande({
      reference: bon.id,
      date: bon.date,
      client: {
        nom: clientActif.nom,
        entreprise: clientActif.entreprise || clientActif.nom,
        email: clientActif.email,
        telephone: clientActif.telephone || '+225 07 00 00 00',
        adresse: clientActif.adresse || 'Zone Industrielle / Daloa',
      },
      articles: bon.articles,
      total: bon.total,
      type: 'commande',
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#002B5B] mb-2">📋 Bons de Commande</h1>
          <p className="text-gray-600">
            Téléchargez les bons de commande officiels pour <strong>{clientActif.entreprise || clientActif.nom}</strong> ({bonsFiltres.length} bon{bonsFiltres.length > 1 ? 's' : ''})
          </p>
        </div>

        {bonsFiltres.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">📄</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Aucun bon de commande disponible</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Ce compte client n'a aucun bon de commande émis pour l'instant.
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
            {bonsFiltres.map((bon) => {
              const statut = STATUT_LABELS[bon.statut] || { label: bon.statut, couleur: 'bg-gray-100 text-gray-800' };
              return (
                <div key={bon.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-[#002B5B] text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <div className="font-bold text-lg">{bon.id}</div>
                      <div className="text-sm text-white/70">
                        Commandé le {new Date(bon.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${statut.couleur}`}>
                        {statut.label}
                      </span>
                      <div className="text-right">
                        <div className="text-xs text-white/70">Total TTC</div>
                        <div className="text-xl font-bold text-[#FFD700]">{formatFCFA(bon.total)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-[#002B5B] mb-3">Articles commandés</h3>
                    <div className="space-y-2 mb-6">
                      {bon.articles.map((article: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <div className="font-semibold text-gray-800">{article.nom}</div>
                            <div className="text-sm text-gray-500">
                              {article.quantite} × {formatFCFA(article.prix || 0)}
                            </div>
                          </div>
                          <div className="font-bold text-[#002B5B]">
                            {formatFCFA(article.quantite * (article.prix || 0))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => telechargerBon(bon)}
                      className="w-full bg-[#FFD700] text-[#002B5B] py-4 rounded-lg font-bold hover:bg-yellow-400 transition-colors min-h-[44px] cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>📄</span> Télécharger le bon de commande officiel (PDF)
                    </button>
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

export default function BonsCommandePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">Chargement des bons de commande...</div>}>
      <BonsCommandePageInner />
    </Suspense>
  );
}