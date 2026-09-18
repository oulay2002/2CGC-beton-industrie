"use client";

import { useEffect, useState } from "react";

export default function IntroSplash() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState(0); // 0: start, 1: blueprint, 2: foundation, 3: bricks, 4: roof, 5: glow, 6: fadeout

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu l'intro lors de cette session
    const hasSeen = sessionStorage.getItem("cgc_intro_viewed_v1");
    // Permet de forcer avec ?intro=1 dans l'URL
    const forceIntro = typeof window !== "undefined" && window.location.search.includes("intro=1");

    if (hasSeen && !forceIntro) {
      setVisible(false);
      return;
    }

    setMounted(true);

    // Timeline séquentielle de l'assemblage
    const t1 = setTimeout(() => setStage(1), 100);  // Lignes d'épure & grille
    const t2 = setTimeout(() => setStage(2), 500);  // Fondation équerre
    const t3 = setTimeout(() => setStage(3), 800);  // Briques maçonnerie
    const t4 = setTimeout(() => setStage(4), 1400); // Toiture & cheminée
    const t5 = setTimeout(() => setStage(5), 1800); // Consolidation & éclat doré
    const t6 = setTimeout(() => setStage(6), 2500); // Début du fade-out
    const t7 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("cgc_intro_viewed_v1", "true");
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, []);

  const handleSkip = () => {
    setStage(6);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("cgc_intro_viewed_v1", "true");
    }, 300);
  };

  if (!mounted || !visible) return null;

  const isFadingOut = stage === 6;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#001428] text-white select-none transition-all duration-500 ease-out overflow-hidden ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Grille Blueprint architecturale en arrière-plan */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Halos de lumière ambiante */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#002B5B]/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FFD700]/10 rounded-full blur-2xl pointer-events-none transition-opacity duration-700"
        style={{ opacity: stage >= 5 ? 1 : 0 }}
      />

      {/* Bouton Passer */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-30 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white/80 hover:text-white transition-all backdrop-blur-md flex items-center gap-1.5"
      >
        <span>Passer</span>
        <span className="text-[10px] text-[#FFD700]">✕</span>
      </button>

      {/* Zone centrale : Assemblage du Logo */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4">
        
        {/* Conteneur SVG du Logo animé */}
        <div className="relative w-64 sm:w-80 md:w-96 aspect-[140/94] flex items-center justify-center">
          
          {/* SVG contenant chaque pièce individualisée */}
          <svg
            viewBox="0 0 140 94"
            className="w-full h-full drop-shadow-2xl"
            style={{
              filter: stage >= 5 ? "drop-shadow(0 0 16px rgba(255, 215, 0, 0.45))" : "none",
              transition: "filter 0.5s ease-out",
            }}
          >
            {/* 1. LIGNES D'ÉPURE & DE PERSPECTIVE (Blueprint Lines) */}
            <g
              className="transition-all duration-700 ease-out"
              style={{
                opacity: stage >= 1 ? 0.9 : 0,
                transform: stage >= 1 ? "scale(1)" : "scale(0.9)",
                transformOrigin: "center",
              }}
            >
              {/* Ligne verticale 1 */}
              <line
                x1="65"
                y1="11"
                x2="65"
                y2="83"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="100"
                strokeDashoffset={stage >= 1 ? "0" : "100"}
                style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
              />
              {/* Ligne verticale 2 */}
              <line
                x1="78"
                y1="26"
                x2="78"
                y2="83"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="80"
                strokeDashoffset={stage >= 1 ? "0" : "80"}
                style={{ transition: "stroke-dashoffset 0.6s ease-out 0.1s" }}
              />

              {/* Ligne horizontale 1 */}
              <line
                x1="53"
                y1="76"
                x2="112"
                y2="76"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="80"
                strokeDashoffset={stage >= 1 ? "0" : "80"}
                style={{ transition: "stroke-dashoffset 0.6s ease-out 0.15s" }}
              />
              {/* Ligne horizontale 2 (base étendue) */}
              <line
                x1="53"
                y1="83"
                x2="125"
                y2="83"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="90"
                strokeDashoffset={stage >= 1 ? "0" : "90"}
                style={{ transition: "stroke-dashoffset 0.6s ease-out 0.2s" }}
              />

              {/* Ligne diagonale 1 (perspective haute) */}
              <line
                x1="53"
                y1="27"
                x2="105"
                y2="62"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="2 1.5"
                style={{
                  opacity: stage >= 1 ? 0.75 : 0,
                  transition: "opacity 0.6s ease-out 0.2s",
                }}
              />
              {/* Ligne diagonale 2 (perspective basse) */}
              <line
                x1="53"
                y1="34"
                x2="105"
                y2="69"
                stroke="#E25845"
                strokeWidth="0.9"
                strokeDasharray="2 1.5"
                style={{
                  opacity: stage >= 1 ? 0.75 : 0,
                  transition: "opacity 0.6s ease-out 0.25s",
                }}
              />

              {/* Points de repère d'intersection (Architectural Dots) */}
              <circle cx="65" cy="76" r="1.1" fill="#FFD700" className="animate-pulse" />
              <circle cx="78" cy="76" r="1.1" fill="#FFD700" className="animate-pulse" />
              <circle cx="65" cy="83" r="1.1" fill="#FFD700" className="animate-pulse" />
              <circle cx="78" cy="83" r="1.1" fill="#FFD700" className="animate-pulse" />
            </g>

            {/* 2. FONDATION ÉQUERRE (L-Bracket) */}
            <path
              d="M 24 53 L 27 53 L 27 78 L 47 78 L 47 84 L 24 84 Z"
              fill="#E25845"
              className="transition-all duration-600 ease-out"
              style={{
                transform: stage >= 2 ? "translate(0, 0)" : "translate(-25px, 20px)",
                opacity: stage >= 2 ? 1 : 0,
                transformOrigin: "24px 84px",
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {/* 3. LES BRIQUES DE CONSTRUCTION (Staggered Assembly) */}
            {/* Rangée 3 (Basse) */}
            {/* Brique Basse Gauche */}
            <rect
              x="29"
              y="70"
              width="12"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(-30px, 15px) rotate(-10deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.05s",
              }}
            />
            {/* Brique Basse Droite */}
            <rect
              x="43"
              y="70"
              width="6"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(25px, 15px) rotate(8deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.12s",
              }}
            />

            {/* Rangée 2 (Milieu) */}
            {/* Brique Milieu Gauche */}
            <rect
              x="29"
              y="62"
              width="6"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(-35px, -5px) rotate(-8deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.18s",
              }}
            />
            {/* Brique Milieu Droite */}
            <rect
              x="37"
              y="62"
              width="12"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(30px, -10px) rotate(10deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.24s",
              }}
            />

            {/* Rangée 1 (Haute) */}
            {/* Brique Haute Gauche */}
            <rect
              x="29"
              y="55"
              width="13"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(-20px, -25px) rotate(-6deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s",
              }}
            />
            {/* Brique Haute Droite */}
            <rect
              x="44"
              y="55"
              width="5"
              height="5"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 3 ? "translate(0, 0)" : "translate(20px, -20px) rotate(6deg)",
                opacity: stage >= 3 ? 1 : 0,
                transition: "all 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) 0.36s",
              }}
            />

            {/* 4. TOITURE TRIANGULAIRE & CHEMINÉE */}
            {/* Toit */}
            <path
              d="M 27 48 L 48 26 L 48 48 Z"
              fill="#E25845"
              style={{
                transform: stage >= 4 ? "translate(0, 0) rotate(0deg)" : "translate(0, -40px) rotate(-5deg)",
                opacity: stage >= 4 ? 1 : 0,
                transformOrigin: "48px 48px",
                transition: "all 0.55s cubic-bezier(0.34, 1.3, 0.64, 1)",
              }}
            />
            {/* Cheminée */}
            <rect
              x="29"
              y="34"
              width="4"
              height="10"
              rx="0.5"
              fill="#E25845"
              style={{
                transform: stage >= 4 ? "translate(0, 0)" : "translate(0, -30px)",
                opacity: stage >= 4 ? 1 : 0,
                transition: "all 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) 0.1s",
              }}
            />
          </svg>

          {/* Overlay du logo réel haute fidélité qui se fond une fois consolidé */}
          <img
            src="/logo-2cgc.png"
            alt="Logo officiel 2CGC"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-700"
            style={{
              opacity: stage >= 5 ? 1 : 0,
              filter: "drop-shadow(0 4px 12px rgba(255, 215, 0, 0.35))",
            }}
          />

          {/* Effet de balayage lumineux doré (Shimmer Sweep) */}
          <div
            className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-300 ${
              stage === 5 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
          </div>
        </div>

        {/* Typographie de marque sous le logo */}
        <div
          className="mt-6 text-center space-y-1.5 transition-all duration-700 ease-out"
          style={{
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div className="text-3xl sm:text-4xl font-black tracking-wider text-white flex items-center justify-center gap-2">
            <span className="text-[#FFD700] drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)]">
              2CGC
            </span>
            <span className="text-white text-xs uppercase px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono tracking-normal">
              BTP
            </span>
          </div>

          <div className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/80 font-bold">
            CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL
          </div>

          <div className="text-[11px] text-[#FFD700]/90 tracking-widest uppercase font-medium pt-1">
            Usine de Préfabriqués Béton &bull; Daloa
          </div>
        </div>

        {/* Règle graduée de chargement / progression architecturale */}
        <div className="w-52 sm:w-64 mt-6 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#FFD700] transition-all duration-500 ease-out rounded-full"
            style={{
              width:
                stage === 0 ? "10%" :
                stage === 1 ? "25%" :
                stage === 2 ? "45%" :
                stage === 3 ? "70%" :
                stage === 4 ? "88%" :
                "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
