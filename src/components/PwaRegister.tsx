"use client";

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Détection mode standalone (déjà installé)
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isAppStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Enregistrement du Service Worker
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker actif, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Erreur enregistrement SW:', err);
        });
    }

    // 3. Détection iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isAppleDevice && isSafariBrowser) {
      setIsIos(true);
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        // Afficher la bannière discrète après 4 secondes
        const timer = setTimeout(() => setShowBanner(true), 4000);
        return () => clearTimeout(timer);
      }
    }

    // 4. Capture de l'événement beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Détection après installation réussie
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] Application installée avec succès !');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Bannière PWA Flottante (en bas à gauche sur desktop, bas d'écran au-dessus de la nav sur mobile) */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:right-auto md:max-w-md z-40 bg-[#002B5B] text-white p-4 rounded-2xl shadow-2xl border border-[#FFD700]/30 backdrop-blur-xl animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 shadow-md">
            <img src="/icon-192.png" alt="2CGC App" className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(255,215,0,0.3)]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>📲</span> Installer l'application 2CGC
              </h4>
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white text-lg p-1 -mt-1 -mr-1 leading-none"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Devis instantanés, calculateurs m² et suivi de vos chantiers même avec un réseau faible.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-gold-gradient text-[#002B5B] text-xs font-black px-4 py-2 rounded-xl shadow hover:shadow-[#FFD700]/40 transition-all flex items-center gap-1.5"
              >
                <span>⚡</span> Installer l'app
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-white/70 hover:text-white px-3 py-2 rounded-xl border border-white/20 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>

        {/* Guide pas-à-pas pour Safari iOS */}
        {showIosGuide && (
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-amber-200 bg-black/20 p-2.5 rounded-xl space-y-1">
            <div className="font-bold flex items-center gap-1">
              <span>🍏</span> Pour installer sur iPhone / iPad :
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-white/90">
              <li>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (icône <span className="font-mono">⎋</span> ou carré avec flèche).</li>
              <li>Faites défiler et sélectionnez <strong>« Sur l'écran d'accueil »</strong> (icône ➕).</li>
              <li>Confirmez en cliquant sur <strong>Ajouter</strong> en haut à droite.</li>
            </ol>
          </div>
        )}
      </div>
    </>
  );
}
