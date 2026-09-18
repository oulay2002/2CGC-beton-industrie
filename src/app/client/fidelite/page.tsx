"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';


export default function FidelitePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/connexion');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement...
      </div>
    );
  }

  if (!user) return null;

  const points = user.pointsFidelite ?? 0;
  const prochaineReduction = Math.floor(points / 1000) * 10000;
  const pointsRestants = 1000 - (points % 1000);
  const progression = ((points % 1000) / 1000) * 100;

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
            <Link href="/client" className="text-[#FFD700] hover:underline font-bold text-xs sm:text-sm">← Espace Client</Link>
          </div>
          <div className="text-sm font-semibold">{user.entreprise || user.nom}</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002B5B] mb-2">🎁 Programme de fidélité</h1>
        <p className="text-gray-600 mb-8">Merci pour votre confiance ! Voici vos avantages.</p>

        {/* Carte fidélité principale */}
        <div className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative">
            <div className="text-sm text-white/70 mb-1">Vos points fidélité</div>
            <div className="text-6xl font-bold text-[#FFD700] mb-2">
              {points.toLocaleString('fr-FR')}
            </div>
            <div className="text-white/80">
              ≈ {formatFCFA(points * 10)} de pouvoir d&apos;achat
            </div>

            {/* Barre de progression */}
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression vers la prochaine récompense</span>
                <span className="font-bold">{pointsRestants} points restants</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div 
                  className="bg-[#FFD700] h-4 rounded-full transition-all"
                  style={{ width: `${progression}%` }}
                ></div>
              </div>
              <div className="text-sm text-white/70 mt-2">
                 Prochaine récompense : {formatFCFA(prochaineReduction + 10000)} de réduction
              </div>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-[#002B5B] text-lg mb-2">Remise permanente</h3>
            <p className="text-gray-600 text-sm">
              <span className="font-bold text-[#FFD700] text-2xl">-{user.tarifSpecial}%</span> sur tous vos achats grâce à votre statut client privilégié.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-bold text-[#002B5B] text-lg mb-2">Livraison prioritaire</h3>
            <p className="text-gray-600 text-sm">
              Traitement de vos commandes en priorité et créneaux de livraison réservés.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold text-[#002B5B] text-lg mb-2">Cadeaux fidélité</h3>
            <p className="text-gray-600 text-sm">
              Échangez vos points contre des réductions ou des produits offerts.
            </p>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#002B5B] mb-6">Comment gagner des points ?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-[#FFD700] text-[#002B5B] w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-bold text-[#002B5B]">100 FCFA achetés = 1 point</div>
                <div className="text-sm text-gray-600">Chaque achat crédite automatiquement votre compte</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-[#FFD700] text-[#002B5B] w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-bold text-[#002B5B]">Parrainage = 500 points</div>
                <div className="text-sm text-gray-600">Invitez un confrère et gagnez 500 points bonus</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-[#FFD700] text-[#002B5B] w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <div className="font-bold text-[#002B5B]">1 000 points = 10 000 FCFA de réduction</div>
                <div className="text-sm text-gray-600">Utilisables sur votre prochaine commande</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/catalogue" className="inline-block bg-[#FFD700] text-[#002B5B] px-8 py-4 rounded-lg font-bold hover:bg-yellow-400 min-h-[44px]">
            🛒 Faire un achat pour gagner des points
          </Link>
        </div>
      </div>
    </main>
  );
}