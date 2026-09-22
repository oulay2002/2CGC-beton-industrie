// src/components/ReviewPrompt.tsx — Composant sollicitation d'avis Google
"use client";

import { useState, useEffect } from "react";
import { Star, X, ExternalLink } from "lucide-react";
import ENTREPRISE_INFO from "@/lib/entreprise-info";

interface ReviewPromptProps {
  /** Délai avant apparition (ms). Défaut : 60 secondes */
  delayMs?: number;
  /** Clé localStorage pour ne plus afficher */
  storageKey?: string;
}

export default function ReviewPrompt({
  delayMs = 60000,
  storageKey = "2cgc_review_dismissed",
}: ReviewPromptProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà rejeté
    if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, storageKey]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
    }
  };

  if (!visible) return null;

  const googleReviewUrl = ENTREPRISE_INFO.googleReviewUrl;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#002B5B]/10 p-5 max-w-sm relative">
        {/* Bouton fermer */}
        <button
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Étoiles décoratives */}
        <div className="flex items-center gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-5 h-5 text-[#FFD700] fill-[#FFD700]"
            />
          ))}
        </div>

        {/* Texte */}
        <h3 className="font-bold text-[#002B5B] text-sm mb-1.5">
          Satisfait de nos produits ?
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          Votre avis compte ! Aidez d&apos;autres professionnels du BTP à nous
          découvrir en laissant un avis sur Google.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex-1 bg-[#002B5B] hover:bg-[#001D3D] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" />
            Donner mon avis
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-2.5 px-3"
          >
            Plus tard
          </button>
        </div>

        {/* Badge Google */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-[10px] text-gray-400 font-medium">
            Avis Google · 4.9 ★ (128 avis)
          </span>
        </div>
      </div>
    </div>
  );
}
