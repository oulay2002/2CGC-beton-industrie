"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, COMMANDES_MOCK, CompteUtilisateur } from '@/lib/auth-context';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';

const STATUT_LABELS: Record<string, { label: string; couleur: string }> = {
  livree: { label: 'Livrée', couleur: 'bg-green-100 text-green-800' },
  en_cours: { label: 'En livraison', couleur: 'bg-blue-100 text-blue-800' },
  preparation: { label: 'En production', couleur: 'bg-yellow-100 text-yellow-800' },
  nouvelle: { label: 'Nouvelle', couleur: 'bg-gray-100 text-gray-800' },
};

function ClientDashboardInner() {
  const { user, logout, getUtilisateurs, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Liste des comptes clients disponibles
  const [clients, setClients] = useState<CompteUtilisateur[]>([]);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'client' && user.role !== 'dirigeant')) {
      router.push('/connexion');
      return;
    }

    if (user.role === 'dirigeant') {
      const tousClients = getUtilisateurs().filter(u => u.role === 'client');
      setClients(tousClients);

      const emailParam = searchParams.get('email');
      if (emailParam && tousClients.some(c => c.email.toLowerCase() === emailParam.toLowerCase())) {
        setSelectedClientEmail(emailParam);
      } else if (tousClients.length > 0) {
        setSelectedClientEmail(tousClients[0].email);
      }
    }
  }, [user, isLoading, router, searchParams, getUtilisateurs]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement de l'espace client...
      </div>
    );
  }

  if (!user || (user.role !== 'client' && user.role !== 'dirigeant')) return null;

  // Profil client actif (soit le client sélectionné par le dirigeant, soit le client connecté lui-même)
  const clientActif = user.role === 'dirigeant'
    ? (clients.find(c => c.email.toLowerCase() === selectedClientEmail.toLowerCase()) || clients[0] || user)
    : user;

  // Filtrer les commandes pour ce client précis
  const commandesClient = COMMANDES_MOCK.filter(cmd => {
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

  const totalDepenses = commandesClient.reduce((sum, c) => sum + c.total, 0);
  const commandesRecentes = commandesClient.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header Général */}
      <header className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/60 mx-3">|</span>
            <span className="text-white/80 text-sm">Espace Client</span>
          </div>
          <div className="flex items-center gap-4">
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
                {user.role === 'dirigeant' ? 'Supervision Dirigeant' : user.entreprise}
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm min-h-[44px]"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* ====== BANDEAU DE SUPERVISION MULTI-CLIENTS (DIRIGEANT SEULEMENT) ====== */}
      {user.role === 'dirigeant' && (
        <div className="bg-gradient-to-r from-[#001D3D] via-[#002B5B] to-[#08305d] text-white border-b-4 border-[#FFD700] shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Titre et description supervision */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700] text-[#002B5B] flex items-center justify-center font-black text-xl shadow flex-shrink-0">
                👁️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded border border-[#FFD700]/40">
                    Mode Supervision Dirigeant
                  </span>
                  <span className="text-xs text-white/60 hidden sm:inline">
                    ({clients.length} comptes clients B2B enregistrés)
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Choisissez un client ci-contre pour inspecter son compte en temps réel.
                </p>
              </div>
            </div>

            {/* Sélecteur de compte client & Action */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <div className="relative flex-1 sm:flex-initial min-w-[280px]">
                <label className="block text-[10px] uppercase font-bold text-[#FFD700] mb-1">
                  Client à superviser :
                </label>
                <div className="relative">
                  <select
                    value={selectedClientEmail}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setSelectedClientEmail(newEmail);
                      router.push(`/client?email=${encodeURIComponent(newEmail)}`);
                    }}
                    aria-label="Sélectionner le client à superviser"
                    className="w-full bg-white text-[#002B5B] font-extrabold text-sm px-4 py-2.5 rounded-xl border-2 border-[#FFD700] shadow-md focus:outline-none focus:ring-2 focus:ring-[#FFD700] cursor-pointer appearance-none pr-10"
                  >
                    {clients.map((c) => (
                      <option key={c.email} value={c.email}>
                        🏢 {c.entreprise} — {c.nom} ({c.tarifSpecial || 0}% remise)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#002B5B] font-black text-xs">
                    ▼
                  </div>
                </div>
              </div>

              <Link
                href="/dirigeant/utilisateurs"
                className="mt-4 md:mt-0 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow"
                title="Gérer les comptes clients"
              >
                <span>👥</span>
                <span>Gérer les comptes</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête de bienvenue / profil actif */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#002B5B]/10 text-[#002B5B]">
                {user.role === 'dirigeant' ? '👁️ Vue Client simulée' : 'Espace Client B2B'}
              </span>
              {clientActif.tarifSpecial ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Tarif VIP -{clientActif.tarifSpecial}%
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#002B5B]">
              {user.role === 'dirigeant' 
                ? `Portefeuille : ${clientActif.entreprise}` 
                : `Bonjour ${user.nom}`}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Interlocuteur : <strong>{clientActif.nom}</strong> • Tél : <strong>{clientActif.telephone || 'Non renseigné'}</strong> • Email : <span className="font-mono text-xs">{clientActif.email}</span>
            </p>
          </div>

          {user.role === 'dirigeant' && (
            <div className="flex items-center gap-2 bg-[#F5F5F0] px-4 py-3 rounded-xl border border-gray-200 text-xs">
              <span className="text-lg">🔄</span>
              <div>
                <div className="font-bold text-[#002B5B]">Bascule rapide</div>
                <div className="text-gray-500">Données filtrées en temps réel</div>
              </div>
            </div>
          )}
        </div>

        {/* KPIs du client sélectionné */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#002B5B]">
            <div className="text-sm text-gray-500 mb-1">Points fidélité</div>
            <div className="text-3xl font-bold text-[#FFD700]">{(clientActif.pointsFidelite || 0).toLocaleString('fr-FR')}</div>
            <div className="text-xs text-gray-500 mt-1">≈ {formatFCFA((clientActif.pointsFidelite || 0) * 10)} de réduction</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#FFD700]">
            <div className="text-sm text-gray-500 mb-1">Remise spéciale</div>
            <div className="text-3xl font-bold text-[#002B5B]">-{clientActif.tarifSpecial || 0}%</div>
            <div className="text-xs text-gray-500 mt-1">Négociée sur catalogue</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-500 mb-1">Commandes totales</div>
            <div className="text-3xl font-bold text-[#002B5B]">{commandesClient.length}</div>
            <div className="text-xs text-gray-500 mt-1">Depuis l'ouverture du compte</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 mb-1">Volume d'achat</div>
            <div className="text-2xl font-bold text-[#002B5B]">{formatFCFA(totalDepenses)}</div>
            <div className="text-xs text-gray-500 mt-1">Total facturé</div>
          </div>
        </div>

        {/* Commandes récentes du client */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#002B5B]">📦 Commandes de {clientActif.entreprise}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Historique des commandes et livraisons</p>
            </div>
            {commandesClient.length > 0 && (
              <Link href="/client/commandes" className="text-[#002B5B] hover:text-[#FFD700] font-bold text-sm">
                Voir tout →
              </Link>
            )}
          </div>

          {commandesClient.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="font-bold text-gray-700 text-base">Aucune commande pour ce client</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Ce compte client n'a pas encore passé de commande ou tous les bons ont été traités.
              </p>
              <Link 
                href="/devis" 
                className="mt-4 inline-block bg-[#002B5B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#001d3d] transition-all"
              >
                Créer un devis pour ce client →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {commandesRecentes.map((cmd) => {
                const statut = STATUT_LABELS[cmd.statut] || { label: cmd.statut, couleur: 'bg-gray-100 text-gray-800' };
                return (
                  <div key={cmd.id} className="border border-gray-200 rounded-xl p-4 hover:border-[#FFD700] transition-colors bg-white">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="font-bold text-[#002B5B] flex items-center gap-2">
                          <span>{cmd.id}</span>
                          {cmd.chauffeur && (
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-normal">
                              🚚 Chauffeur : {cmd.chauffeur}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {new Date(cmd.date).toLocaleDateString('fr-FR')} • {cmd.articles.length} article(s) : {cmd.articles.map(a => `${a.quantite}x ${a.nom}`).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statut.couleur}`}>
                          {statut.label}
                        </span>
                        <div className="text-right">
                          <div className="font-bold text-[#002B5B]">{formatFCFA(cmd.total)}</div>
                          <div className="text-xs text-gray-500">TTC</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions rapides — Réservées aux clients B2B, masquées pour le dirigeant en mode supervision */}
        {user.role !== 'dirigeant' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Link href="/devis" className="bg-[#002B5B] text-white rounded-2xl p-4 sm:p-6 hover:bg-[#001d3d] transition-all hover:shadow-lg block">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📝</div>
              <h3 className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">Nouveau devis</h3>
              <p className="text-xs sm:text-sm text-white/70">Créer une demande</p>
            </Link>

            <Link href="/client/reassort-rapide" className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#FFD700] hover:shadow-lg hover:border-[#002B5B] transition-all block">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🛒</div>
              <h3 className="font-bold text-sm sm:text-lg text-[#002B5B] mb-0.5 sm:mb-1">Réassort rapide</h3>
              <p className="text-xs sm:text-sm text-gray-600">Commander en 1 clic</p>
            </Link>

            <Link href="/client/bons-commande" className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:border-[#002B5B] hover:shadow-lg transition-all block">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📋</div>
              <h3 className="font-bold text-sm sm:text-lg text-[#002B5B] mb-0.5 sm:mb-1">Bons de commande</h3>
              <p className="text-xs sm:text-sm text-gray-600">Télécharger les BC</p>
            </Link>

            <Link href="/client/bons-livraison" className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:border-[#002B5B] hover:shadow-lg transition-all block">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🚚</div>
              <h3 className="font-bold text-sm sm:text-lg text-[#002B5B] mb-0.5 sm:mb-1">Bons de livraison</h3>
              <p className="text-xs sm:text-sm text-gray-600">Suivi et réception</p>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">Chargement de l'espace client...</div>}>
      <ClientDashboardInner />
    </Suspense>
  );
}