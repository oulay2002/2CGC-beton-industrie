"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, ROUTES_PAR_ROLE } from '@/lib/auth-context';
import Link from 'next/link';

function ConnexionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const mode = searchParams.get('mode') === 'equipe' ? 'equipe' : 'client';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(email, password);
    setLoading(false);
    if (result.success && result.role) {
      const redirectPath = searchParams.get('redirect');
      if (redirectPath && redirectPath.startsWith('/')) {
        router.push(redirectPath);
      } else {
        router.push(ROUTES_PAR_ROLE[result.role]);
      }
    } else {
      setError(
        mode === 'equipe'
          ? 'Identifiants collaborateurs incorrects. Vérifiez votre email @2cgc-industrie.com et votre mot de passe.'
          : 'Identifiants incorrects. Veuillez vérifier votre adresse email client et votre mot de passe.'
      );
    }
  };

  const whatsappHelpUrl = mode === 'equipe'
    ? 'https://wa.me/2250707621799?text=Bonjour%20Direction%202CGC%2C%20je%20suis%20collaborateur%20et%20j%27ai%20besoin%20d%27assistance%20pour%20mes%20identifiants.'
    : 'https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20suis%20client%20et%20j%27ai%20oubli%C3%A9%20mon%20mot%20de%20passe%20Espace%20Client.';

  return (
    <main className="min-h-screen flex overflow-hidden bg-[#F8F9FA]">

      {/* ══════════════════════════════════════════════
          PANNEAU GAUCHE — BRANDING DYNAMIQUE
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[54%] bg-[#001D3D] flex-col justify-between p-12 xl:p-16 relative overflow-hidden transition-all duration-300">
        
        {/* Motifs de fond & dégradés de lumière */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FFD700]/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl" />

        {/* Header Branding */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-4 group">
            <div className="h-12 w-auto flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo-2cgc.png" 
                alt="Logo 2CGC" 
                className="h-11 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)] transition-transform group-hover:scale-105" 
              />
            </div>
            <div>
              <div className="font-black text-white text-xl tracking-wider leading-none">2CGC</div>
              <div className="text-[#FFD700] text-[10px] uppercase tracking-[0.25em] mt-1 font-bold">
                Cheickna Construction &amp; Génie Civil
              </div>
            </div>
          </Link>
        </div>

        {/* Message de bienvenue Contextuel */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 mb-6">
            <span className={`w-2 h-2 rounded-full animate-pulse ${mode === 'equipe' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
              {mode === 'equipe' ? 'Portail Sécurisé Interne' : 'Portail Sécurisé Clients B2B'}
            </span>
          </div>

          {mode === 'equipe' ? (
            <>
              <h1 className="text-4xl xl:text-[3.25rem] font-black text-white leading-[1.12] tracking-tight mb-6">
                Supervision &amp; Pilotage <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-yellow-200 to-amber-400">
                  industriel en direct.
                </span>
              </h1>

              <p className="text-white/70 text-base leading-relaxed mb-10">
                Plateforme interne réservée à la direction, aux équipes d&apos;exploitation usine et aux chauffeurs pour le suivi de la production et de la logistique à Daloa.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-lg flex-shrink-0 text-amber-400">
                    🏭
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">Pilotage Usine &amp; Centrales</div>
                    <div className="text-white/50 text-xs mt-0.5">Suivi des cadences de production d&apos;agglos, pavés et gestion des stocks agrégats.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-lg flex-shrink-0 text-blue-400">
                    🚛
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">Flotte &amp; Dispatch Chantiers</div>
                    <div className="text-white/50 text-xs mt-0.5">Affectation des camions-grues, suivi des livraisons et émargement numérique.</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl xl:text-[3.25rem] font-black text-white leading-[1.12] tracking-tight mb-6">
                L&apos;excellence du béton <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-yellow-200 to-amber-400">
                  au service de vos chantiers.
                </span>
              </h1>

              <p className="text-white/70 text-base leading-relaxed mb-10">
                Accédez à votre espace dédié pour gérer vos commandes de bétons prêts à l&apos;emploi, vos bons de livraison et suivre l&apos;avancement de vos projets BTP en Côte d&apos;Ivoire.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-lg flex-shrink-0 text-[#FFD700]">
                    🏗️
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">Centrale à Béton Haute Performance</div>
                    <div className="text-white/50 text-xs mt-0.5">Fabrication automatisée d&apos;agglos, pavés et bordures certifiés à Daloa.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-lg flex-shrink-0 text-blue-400">
                    🚚
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">Logistique &amp; Camions-Grues Intégrés</div>
                    <div className="text-white/50 text-xs mt-0.5">Livraison directe sur chantier avec géolocalisation et émargement numérique.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Gauche */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <div>📍 Quartier Commerce, BP 129 Daloa</div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Connexion Chiffrée SSL
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PANNEAU DROIT — FORMULAIRE AVEC ONGLETS
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Navigation Supérieure */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto" />
            <span className="font-black text-[#002B5B] text-lg">2CGC</span>
          </Link>

          <div className="ml-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#002B5B] transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-gray-200/80 hover:bg-white"
            >
              <span>←</span>
              <span>Retour au site principal</span>
            </Link>
          </div>
        </div>

        {/* Conteneur Formulaire */}
        <div className="max-w-md w-full mx-auto px-6 py-4">

          {/* En-tête principal dynamique */}
          <div className="text-center mb-6">
            {mode === 'equipe' ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 mb-2">
                  🔐 Portail Collaborateurs &amp; Direction
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#002B5B] tracking-tight">
                  Accès Équipe 2CGC
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1.5">
                  Connectez-vous avec vos identifiants nominatifs délivrés par la Direction.
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#002B5B] border border-blue-200 mb-2">
                  👤 Espace Entreprises &amp; Clients B2B
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#002B5B] tracking-tight">
                  Espace Client 2CGC
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1.5">
                  Saisissez vos identifiants pour accéder à vos commandes et factures.
                </p>
              </>
            )}
          </div>

          {/* Carte Formulaire */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Adresse Email / Identifiant */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {mode === 'equipe' ? 'Identifiant Collaborateur Officiel' : 'Adresse Email Client / Identifiant'}
                </label>
                <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
                  focused === 'email'
                    ? 'border-[#002B5B] bg-white shadow-md shadow-[#002B5B]/10'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-transparent pl-12 pr-4 py-3.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                    placeholder={mode === 'equipe' ? 'prenom.nom@2cgc-industrie.com' : 'contact@entreprise-btp.com'}
                    required
                    autoComplete="email"
                  />
                </div>

                {mode === 'equipe' && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-900 font-semibold bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100">
                    <span>💡</span>
                    <span>Format officiel : <strong className="font-bold text-[#002B5B]">@2cgc-industrie.com</strong></span>
                  </div>
                )}
              </div>

              {/* Mot de Passe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <a
                    href={whatsappHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#002B5B] hover:underline"
                  >
                    Oublié ?
                  </a>
                </div>
                <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
                  focused === 'password'
                    ? 'border-[#002B5B] bg-white shadow-md shadow-[#002B5B]/10'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Se souvenir de moi */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#002B5B] focus:ring-[#002B5B]"
                  />
                  <span className="text-xs font-semibold text-gray-600">Mémoriser cet appareil</span>
                </label>
              </div>

              {/* Message d'Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Bouton Soumettre */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#002B5B] hover:bg-[#003d80] text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-[#002B5B]/25 hover:shadow-xl hover:shadow-[#002B5B]/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-[#FFD700]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Vérification des accès en cours...</span>
                  </>
                ) : mode === 'equipe' ? (
                  <>
                    <span>🔐</span>
                    <span>Accéder au Portail Collaborateur</span>
                    <span className="text-base">→</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter à mon Espace Client</span>
                    <span className="text-base">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Pied de Carte Différencié */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              {mode === 'equipe' ? (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 font-semibold flex items-center justify-center gap-1.5">
                    <span>🛡️</span>
                    <span>Accès strictement réservé au personnel 2CGC</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Les accès sont attribués par la Direction Générale.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-medium">
                  Vous n&apos;avez pas encore de compte client B2B ?{' '}
                  <Link href="/inscription" className="text-[#002B5B] font-extrabold hover:underline">
                    Faire une demande d&apos;ouverture →
                  </Link>
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer Bas */}
        <div className="py-4 text-center text-xs text-gray-400">
          © 2026 CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL — Tous droits réservés.
        </div>
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-[#002B5B] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-gray-400 font-bold">Chargement du portail 2CGC...</div>
        </div>
      </div>
    }>
      <ConnexionPageInner />
    </Suspense>
  );
}


