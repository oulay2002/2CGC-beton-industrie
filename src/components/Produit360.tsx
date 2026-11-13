"use client";

// src/components/Produit360.tsx — L'agglo du hero, tournant sur lui-meme.
//
// Le client achete un format avant d'acheter un produit : un macon qui hesite
// entre un 20 et un 15 veut voir l'epaisseur, pas la lire. Le bloc est donc
// construit a ses cotes reelles — 450 x 200 x 200 mm pour l'agglo 20, et les
// trois alveoles traversantes relevees sur les photos de production — puis
// tourne lentement, cote par des lignes qui suivent ses vraies aretes.
//
// Rien n'est une image : la geometrie vient de `produits-phares`, la position
// des cotes de `projection-bloc`. Changer une cote au catalogue change le
// bloc. C'est ce qui separe une maquette d'une fiche produit.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hand, Weight } from "lucide-react";
import { FORMATS_AGGLO, type FormatAgglo } from "@/lib/produits-phares";
import { coterLeBloc, ecarterLesCotes, empriseRelative } from "@/lib/projection-bloc";
import type { Locale } from "@/lib/dictionaries";

/** Inclinaison de la scene. Elle doit rester egale au `rotateX` du CSS. */
const TILT_DEG = -16;
/** Doit rester egale a la propriete `perspective` du CSS. */
const PERSPECTIVE = 1400;
/** Un tour en vingt secondes : assez lent pour qu'on lise les cotes. */
const DEGRES_PAR_SECONDE = 18;
/** Trois quarts : la pose ou un volume se lit le mieux, des la premiere image. */
const ANGLE_DEPART = -34;
const DEGRES_PAR_PIXEL = 0.55;
const PAS_CLAVIER = 15;
/** Constante de temps du changement de format, en secondes. */
const TAU_FORMAT = 0.13;

const DEG = Math.PI / 180;

/** Les cotes du format par defaut, d'ou part l'animation. */
const COTES_INITIALES = {
  l: FORMATS_AGGLO[0].longueurMm,
  h: FORMATS_AGGLO[0].hauteurMm,
  e: FORMATS_AGGLO[0].epaisseurMm,
};

type CleCote = "longueur" | "hauteur" | "epaisseur";
const CLES_COTES: CleCote[] = ["longueur", "hauteur", "epaisseur"];

interface Produit360Props {
  lang: Locale;
  labels: {
    longueur: string;
    hauteur: string;
    epaisseur: string;
    poids: string;
    prixUnite: string;
    choisirEpaisseur: string;
    indice: string;
    alveoles: string;
    manipuler: string;
  };
}

export default function Produit360({ lang, labels }: Produit360Props) {
  const [format, setFormat] = useState<FormatAgglo>(FORMATS_AGGLO[0]);
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const [visible, setVisible] = useState(false);
  /** L'invitation a manipuler ne sert plus une fois qu'on a manipule. */
  const [aManipule, setAManipule] = useState(false);

  const scene = useRef<HTMLDivElement>(null);
  const bloc = useRef<HTMLDivElement>(null);
  const ombre = useRef<HTMLDivElement>(null);
  const lignes = useRef<Record<CleCote, HTMLDivElement | null>>({
    longueur: null,
    hauteur: null,
    epaisseur: null,
  });
  const etiquettes = useRef<Record<CleCote, HTMLDivElement | null>>({
    longueur: null,
    hauteur: null,
    epaisseur: null,
  });

  const angle = useRef(ANGLE_DEPART * DEG);
  const survol = useRef(false);
  const glissement = useRef({ actif: false, depuis: 0, angleInitial: 0 });

  // Les cotes courantes du bloc, en millimetres. Elles rejoignent le format
  // choisi en glissant : le bloc s'epaissit a vue d'oeil au lieu de sauter.
  const cotesVues = useRef({ ...COTES_INITIALES });
  const cible = useRef({ ...COTES_INITIALES });

  useEffect(() => {
    cible.current = {
      l: format.longueurMm,
      h: format.hauteurMm,
      e: format.epaisseurMm,
    };
  }, [format]);

  // ── Preferences et visibilite ──────────────────────────────────────────────

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const relire = () => setMouvementReduit(mq.matches);
    relire();
    mq.addEventListener("change", relire);
    return () => mq.removeEventListener("change", relire);
  }, []);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── La boucle ──────────────────────────────────────────────────────────────

  const dessiner = useCallback(
    (ppm: number) => {
      const { l, h, e } = cotesVues.current;
      const [lp, hp, ep] = [l * ppm, h * ppm, e * ppm];

      // Les cotes sont posees sur la scene, non sur le bloc : l'ombre portee
      // en a besoin elle aussi pour se placer sous la bonne assise.
      const plateau = scene.current;
      if (plateau) {
        plateau.style.setProperty("--l", `${lp.toFixed(2)}px`);
        plateau.style.setProperty("--h", `${hp.toFixed(2)}px`);
        plateau.style.setProperty("--e", `${ep.toFixed(2)}px`);
      }
      bloc.current?.style.setProperty("--rot", `${(angle.current / DEG).toFixed(2)}deg`);

      if (ombre.current) {
        const emprise = empriseRelative(lp, ep, angle.current);
        ombre.current.style.transform = `translateX(-50%) scaleX(${emprise.toFixed(3)})`;
        ombre.current.style.opacity = `${(0.3 + 0.16 * emprise).toFixed(3)}`;
      }

      const cotes = ecarterLesCotes(
        coterLeBloc(lp, hp, ep, {
          tilt: TILT_DEG * DEG,
          angle: angle.current,
          perspective: PERSPECTIVE,
        })
      );

      for (const cle of CLES_COTES) {
        const cote = cotes[cle];
        const ligne = lignes.current[cle];
        if (ligne) {
          ligne.style.transform =
            `translate(${cote.depart.x.toFixed(2)}px, ${cote.depart.y.toFixed(2)}px) ` +
            `rotate(${cote.rotation.toFixed(2)}deg)`;
          ligne.style.width = `${cote.longueur.toFixed(2)}px`;
          ligne.style.opacity = cote.opacite.toFixed(3);
        }
        const etiquette = etiquettes.current[cle];
        if (etiquette) {
          etiquette.style.transform =
            `translate(-50%, -50%) ` +
            `translate(${cote.etiquette.x.toFixed(2)}px, ${cote.etiquette.y.toFixed(2)}px)`;
          etiquette.style.opacity = cote.opacite.toFixed(3);
        }
      }
    },
    []
  );

  useEffect(() => {
    const el = scene.current;
    if (!el || !visible) return;

    // L'echelle vit dans la feuille de style, ou les points de rupture la
    // font varier. On la relit plutot que de la redeclarer ici.
    let ppm = 0.5;
    const relireEchelle = () => {
      const brut = parseFloat(getComputedStyle(el).getPropertyValue("--ppm"));
      ppm = Number.isFinite(brut) && brut > 0 ? brut : 0.5;
    };
    relireEchelle();
    window.addEventListener("resize", relireEchelle);

    let raf = 0;
    let precedent = 0;

    const image = (t: number) => {
      const dt = precedent === 0 ? 0 : Math.min((t - precedent) / 1000, 0.1);
      precedent = t;

      const fige = survol.current || glissement.current.actif;
      if (!fige && !mouvementReduit) {
        angle.current += DEGRES_PAR_SECONDE * DEG * dt;
      }

      // Approche exponentielle du format vise, instantanee si l'on a demande
      // moins d'animation.
      const k = mouvementReduit ? 1 : 1 - Math.exp(-dt / TAU_FORMAT);
      const v = cotesVues.current;
      const c = cible.current;
      cotesVues.current = {
        l: v.l + (c.l - v.l) * k,
        h: v.h + (c.h - v.h) * k,
        e: v.e + (c.e - v.e) * k,
      };

      dessiner(ppm);
      raf = requestAnimationFrame(image);
    };

    raf = requestAnimationFrame(image);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", relireEchelle);
    };
  }, [visible, mouvementReduit, dessiner]);

  // ── Prise en main ──────────────────────────────────────────────────────────

  const surPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setAManipule(true);
    glissement.current = {
      actif: true,
      depuis: e.clientX,
      angleInitial: angle.current,
    };
  };

  const surPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = glissement.current;
    if (!g.actif) return;
    angle.current = g.angleInitial + (e.clientX - g.depuis) * DEGRES_PAR_PIXEL * DEG;
  };

  const relacher = () => {
    glissement.current.actif = false;
  };

  const surClavier = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setAManipule(true);
    angle.current += (e.key === "ArrowRight" ? PAS_CLAVIER : -PAS_CLAVIER) * DEG;
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  const nom = lang === "fr" ? format.nom : format.nomEn;
  const usage = lang === "fr" ? format.usage : format.usageEn;
  const langue = lang === "fr" ? "fr-FR" : "en-US";

  const valeurs: Record<CleCote, { mm: number; nom: string }> = useMemo(
    () => ({
      longueur: { mm: format.longueurMm, nom: labels.longueur },
      hauteur: { mm: format.hauteurMm, nom: labels.hauteur },
      epaisseur: { mm: format.epaisseurMm, nom: labels.epaisseur },
    }),
    [format, labels]
  );

  const alveoles = Array.from({ length: format.alveoles });

  return (
    <figure className="b3d m-0 w-full max-w-[340px] sm:max-w-[400px] xl:max-w-[460px] mx-auto lg:mx-0">
      <div
        ref={scene}
        tabIndex={0}
        role="img"
        aria-label={`${nom} — ${format.longueurMm} × ${format.hauteurMm} × ${format.epaisseurMm} mm, ${format.poidsKg} kg. ${labels.manipuler}`}
        onPointerDown={surPointerDown}
        onPointerMove={surPointerMove}
        onPointerUp={relacher}
        onPointerCancel={relacher}
        onPointerEnter={() => {
          survol.current = true;
        }}
        onPointerLeave={() => {
          survol.current = false;
          relacher();
        }}
        onKeyDown={surClavier}
        className="b3d-scene relative h-[250px] sm:h-[290px] xl:h-[330px] w-full cursor-grab active:cursor-grabbing touch-pan-y rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#001D3D]"
      >
        <div ref={ombre} className="b3d-sol" aria-hidden="true" />

        <div ref={bloc} className="b3d-bloc" aria-hidden="true">
          <div className="b3d-face b3d-avant" />
          <div className="b3d-face b3d-arriere" />
          <div className="b3d-face b3d-gauche" />
          <div className="b3d-face b3d-droite" />
          <div className="b3d-face b3d-dessus">
            {alveoles.map((_, i) => (
              <span key={i} className="b3d-alveole" />
            ))}
          </div>
          <div className="b3d-face b3d-dessous">
            {alveoles.map((_, i) => (
              <span key={i} className="b3d-alveole b3d-alveole-fond" />
            ))}
          </div>
        </div>

        <div className="b3d-cotes" aria-hidden="true">
          {CLES_COTES.map((cle) => (
            <div
              key={cle}
              ref={(n) => {
                lignes.current[cle] = n;
              }}
              className="b3d-ligne"
            />
          ))}
          {CLES_COTES.map((cle) => (
            <div
              key={cle}
              ref={(n) => {
                etiquettes.current[cle] = n;
              }}
              className="b3d-etiquette"
            >
              <span className="font-mono text-[13px] font-bold leading-none text-[#FFD700]">
                {valeurs[cle].mm}
                <span className="ml-0.5 text-[9px] font-semibold text-[#FFD700]/70">mm</span>
              </span>
              <span className="mt-0.5 block text-[8px] uppercase tracking-[0.14em] leading-none text-white/55">
                {valeurs[cle].nom}
              </span>
            </div>
          ))}
        </div>

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1 top-1 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45 transition-opacity duration-500 ${
            aManipule ? "opacity-0" : "opacity-100"
          }`}
        >
          <Hand className="h-3 w-3" />
          {labels.indice}
        </span>
      </div>

      <figcaption className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base font-black leading-tight text-white">{nom}</p>
            <p className="mt-0.5 truncate text-xs text-white/50">{usage}</p>
            <p className="mt-1.5 font-mono text-[11px] text-white/40">
              {format.longueurMm} × {format.hauteurMm} × {format.epaisseurMm} mm
              <span className="mx-1.5 text-white/25">·</span>
              {format.alveoles} {labels.alveoles}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-1 text-[#FFD700]">
              <Weight className="mr-0.5 h-4 w-4 self-center opacity-70" aria-hidden="true" />
              <span className="font-mono text-3xl font-black leading-none">
                {format.poidsKg}
              </span>
              <span className="text-sm font-bold">kg</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
              {labels.poids}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
          <div
            role="group"
            aria-label={labels.choisirEpaisseur}
            className="flex items-center gap-1.5"
          >
            <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
              {labels.choisirEpaisseur}
            </span>
            {FORMATS_AGGLO.map((f) => {
              const actif = f.id === format.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f)}
                  aria-pressed={actif}
                  className={`min-w-[44px] cursor-pointer rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-colors duration-200 ${
                    actif
                      ? "bg-[#FFD700] text-[#002B5B]"
                      : "border border-white/15 text-white/65 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {f.epaisseurCm}
                  <span className="ml-0.5 text-[9px] font-semibold opacity-70">cm</span>
                </button>
              );
            })}
          </div>

          <p className="shrink-0 text-right font-mono text-sm font-bold text-white/80">
            {format.prixFcfa.toLocaleString(langue)}
            <span className="ml-1 text-[10px] font-semibold text-white/45">
              {labels.prixUnite}
            </span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
