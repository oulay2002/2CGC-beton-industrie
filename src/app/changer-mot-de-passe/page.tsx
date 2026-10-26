"use client";

// Écran de changement de mot de passe imposé au premier accès.
//
// Les comptes créés par la direction reçoivent un mot de passe provisoire,
// transmis par email ou WhatsApp — donc passé par un canal que l'on ne maîtrise
// pas. Il doit être remplacé avant tout accès aux données. Le blocage est
// appliqué par le proxy (src/proxy.ts) à partir du drapeau porté par le jeton
// de session : cet écran ne peut pas être sauté en changeant d'URL.

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const LONGUEUR_MIN = 10;

/** Même politique que le serveur, pour un retour immédiat à la saisie. */
function motifRejet(mdp: string): string | null {
  if (mdp.length < LONGUEUR_MIN) return `Au moins ${LONGUEUR_MIN} caractères.`;
  if (!/[a-zA-Z]/.test(mdp)) return 'Au moins une lettre.';
  if (!/[0-9]/.test(mdp)) return 'Au moins un chiffre.';
  return null;
}

function ForceCriteres({ mdp }: { mdp: string }) {
  const criteres = [
    { ok: mdp.length >= LONGUEUR_MIN, label: `${LONGUEUR_MIN} caractères minimum` },
    { ok: /[a-zA-Z]/.test(mdp), label: 'une lettre' },
    { ok: /[0-9]/.test(mdp), label: 'un chiffre' },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {criteres.map((c) => (
        <li
          key={c.label}
          className={`text-xs flex items-center gap-2 ${c.ok ? 'text-green-700' : 'text-gray-400'}`}
        >
          <span aria-hidden="true">{c.ok ? '✓' : '○'}</span>
          {c.label}
        </li>
      ))}
    </ul>
  );
}

function ChangerMotDePasseInner() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const destination = searchParams.get('redirect') || '/';

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!user?.email) {
      setErreur('Session expirée. Reconnectez-vous.');
      return;
    }
    const motif = motifRejet(nouveau);
    if (motif) {
      setErreur(motif);
      return;
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux saisies ne correspondent pas.');
      return;
    }
    if (nouveau === ancien) {
      setErreur('Le nouveau mot de passe doit être différent du provisoire.');
      return;
    }

    setEnCours(true);
    try {
      const res = await fetch('/api/profiles/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          ancienMotDePasse: ancien,
          nouveauMotDePasse: nouveau,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data?.error || 'Échec du changement de mot de passe.');
        setEnCours(false);
        return;
      }

      // Le serveur a réémis la session sans le drapeau : la destination
      // d'origine est désormais accessible.
      router.replace(destination);
      router.refresh();
    } catch {
      setErreur('Service injoignable. Vérifiez votre connexion.');
      setEnCours(false);
    }
  };

  const champ =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#002B5B] focus:ring-2 focus:ring-[#002B5B]/20 outline-none transition-colors';

  return (
    <main className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#002B5B] to-[#003d80] px-8 py-7 text-white">
          <div className="inline-block bg-[#FFD700] text-[#002B5B] font-black px-3 py-1 rounded-lg text-sm mb-3">
            2CGC
          </div>
          <h1 className="text-xl font-black">Changez votre mot de passe</h1>
          <p className="text-white/70 text-sm mt-1">
            Votre accès utilise encore le mot de passe provisoire remis par la Direction.
          </p>
        </div>

        <form onSubmit={soumettre} className="p-8 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            Ce mot de passe vous a été transmis par email ou WhatsApp. Il doit être remplacé
            avant d&apos;accéder à vos données.
          </div>

          <div>
            <label htmlFor="ancien" className="block text-xs font-bold text-gray-500 mb-1.5">
              MOT DE PASSE PROVISOIRE
            </label>
            <input
              id="ancien"
              type="password"
              autoComplete="current-password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              className={champ}
              required
            />
          </div>

          <div>
            <label htmlFor="nouveau" className="block text-xs font-bold text-gray-500 mb-1.5">
              NOUVEAU MOT DE PASSE
            </label>
            <input
              id="nouveau"
              type="password"
              autoComplete="new-password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              className={champ}
              required
            />
            <ForceCriteres mdp={nouveau} />
          </div>

          <div>
            <label htmlFor="confirmation" className="block text-xs font-bold text-gray-500 mb-1.5">
              CONFIRMEZ LE NOUVEAU MOT DE PASSE
            </label>
            <input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={champ}
              required
            />
            {confirmation.length > 0 && confirmation !== nouveau && (
              <p className="text-xs text-red-600 mt-1.5">Les deux saisies diffèrent.</p>
            )}
          </div>

          {erreur && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3"
            >
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="w-full bg-[#002B5B] hover:bg-[#003d80] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-colors"
          >
            {enCours ? 'Enregistrement…' : 'Valider et accéder au portail'}
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace('/connexion');
            }}
            className="w-full text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ChangerMotDePassePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
          Chargement…
        </div>
      }
    >
      <ChangerMotDePasseInner />
    </Suspense>
  );
}
