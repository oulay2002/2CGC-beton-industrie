"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import posthog from 'posthog-js';

export default function InscriptionPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    motDePasse: '',
    motDePasseConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [succes, setSucces] = useState(false);

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (form.motDePasse !== form.motDePasseConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    // Créer le compte dans le système local
    const result = register({
      nom: form.nom,
      email: form.email,
      telephone: form.telephone,
      entreprise: form.entreprise || 'Particulier',
      password: form.motDePasse,
      role: 'client',
      pointsFidelite: 0,
      tarifSpecial: 0,
    });

    if (!result.success) {
      setLoading(false);
      setError(result.error || 'Erreur lors de la création du compte.');
      return;
    }

    // Envoyer les identifiants par email (simulation si pas de clé Resend)
    try {
      await fetch('/api/creer-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          entreprise: form.entreprise || 'Particulier',
          role: 'client',
          motDePasse: form.motDePasse,
          envoyerEmail: true,
        }),
      });
    } catch {
      // Non bloquant — le compte est déjà créé
    }

    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      posthog.capture('account_registered', {
        account_type: 'client',
      });
    }

    setLoading(false);
    setSucces(true);
  };

  if (succes) {
    return (
      <main className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ✅
            </div>
            <h1 className="text-2xl font-black text-[#002B5B] mb-3">Compte créé !</h1>
            <p className="text-gray-500 text-sm mb-2">
              Bienvenue <strong className="text-[#002B5B]">{form.nom}</strong> !
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Vos identifiants ont été envoyés à <strong>{form.email}</strong>.
              Vous pouvez maintenant vous connecter à votre espace client.
            </p>

            <div className="bg-[#F5F5F0] rounded-2xl p-5 text-left mb-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vos identifiants</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Email :</span> <strong className="text-[#002B5B]">{form.email}</strong></div>
                <div><span className="text-gray-500">Mot de passe :</span> <strong className="text-[#002B5B]">{form.motDePasse}</strong></div>
                <div><span className="text-gray-500">Rôle :</span> <strong className="text-[#002B5B]">👤 Client</strong></div>
              </div>
            </div>

            <button
              onClick={() => router.push('/connexion')}
              className="w-full bg-[#002B5B] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#FFD700] hover:text-[#002B5B] transition-all duration-300"
            >
              → Se connecter maintenant
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex overflow-hidden">
      {/* Panneau gauche */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-gradient flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl animate-float" />

        <Link href="/" className="inline-flex items-center gap-3 relative z-10 group">
          <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
            <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]" />
          </div>
          <div>
            <div className="font-black text-white text-lg">2CGC</div>
            <div className="text-[#FFD700] text-[10px] uppercase tracking-widest">Construction & Génie Civil</div>
          </div>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Rejoignez
            <span className="block text-gradient">l'espace</span>
            <span className="block">client 2CGC</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs">
            Créez votre compte pour passer vos commandes, suivre vos livraisons et accéder à vos devis en ligne.
          </p>
          <div className="space-y-3">
            {[
              { icon: '📦', text: 'Passez vos commandes en ligne 24h/24' },
              { icon: '🚚', text: 'Suivez vos livraisons en temps réel' },
              { icon: '📄', text: 'Accédez à tous vos devis et factures' },
              { icon: '⭐', text: 'Programme fidélité B2B exclusif' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white/80 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-xs leading-relaxed">
          📍 Quartier Commerce (Réf. Pharmacie Appaul), BP 129 Daloa<br />
          📞 Tel : +225 07 07 62 17 99 / +225 07 07 85 76 29
        </div>

      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F5F5F0] overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Header mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90">
              <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-9 w-auto object-contain" />
            </div>
            <div className="font-black text-[#002B5B]">2CGC</div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[#002B5B] mb-2 tracking-tight">Créer mon compte client</h1>
            <p className="text-gray-500 text-sm">
              Déjà un compte ?{' '}
              <Link href="/connexion" className="text-[#002B5B] font-bold hover:text-[#FFD700] transition-colors">
                Se connecter →
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom complet *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => update('nom', e.target.value)}
                  placeholder="M. Koné Drissa"
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:border-[#FFD700] focus:outline-none bg-white transition-colors"
                />
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entreprise / Société <span className="text-gray-400 normal-case font-normal">(optionnel)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🏢</span>
                <input
                  type="text"
                  value={form.entreprise}
                  onChange={e => update('entreprise', e.target.value)}
                  placeholder="BTP Horizon SARL ou Particulier"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:border-[#FFD700] focus:outline-none bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:border-[#FFD700] focus:outline-none bg-white transition-colors"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Téléphone WhatsApp *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={e => update('telephone', e.target.value)}
                  placeholder="+225 07 XX XX XX XX"
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:border-[#FFD700] focus:outline-none bg-white transition-colors"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mot de passe * <span className="text-gray-400 normal-case font-normal">(min. 6 caractères)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.motDePasse}
                  onChange={e => update('motDePasse', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-12 py-3.5 text-sm focus:border-[#FFD700] focus:outline-none bg-white transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#002B5B] text-xs transition-colors">
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirmer le mot de passe *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.motDePasseConfirm}
                  onChange={e => update('motDePasseConfirm', e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full border-2 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none bg-white transition-colors ${
                    form.motDePasseConfirm && form.motDePasse !== form.motDePasseConfirm
                      ? 'border-red-300 focus:border-red-400'
                      : form.motDePasseConfirm && form.motDePasse === form.motDePasseConfirm
                      ? 'border-emerald-300 focus:border-emerald-400'
                      : 'border-gray-200 focus:border-[#FFD700]'
                  }`}
                />
                {form.motDePasseConfirm && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                    {form.motDePasse === form.motDePasseConfirm ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white py-4 rounded-2xl font-black text-sm hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 min-h-[52px] mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Création du compte...
                </>
              ) : '✅ Créer mon compte client'}
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              En vous inscrivant, vous acceptez les conditions d'utilisation de 2CGC.
              Vos données sont sécurisées et ne sont jamais partagées.
            </p>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400">
            © 2026 2CGC — Cheickna Construction & Génie Civil
          </div>
        </div>
      </div>
    </main>
  );
}
