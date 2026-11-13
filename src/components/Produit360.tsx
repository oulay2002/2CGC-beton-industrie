"use client";

// src/components/Produit360.tsx — Les agglos du hero, en volume.
//
// Le client achete un format avant d'acheter un produit : un macon qui
// hesite entre un 20 et un 15 veut voir l'epaisseur, pas la lire. Et avant
// de commander, il veut savoir combien il lui en faut. D'ou deux vues du
// meme produit : le bloc seul, cote et pese ; et un pan de mur appareille,
// qui repond a la seule question qui compte — dix agglos au metre carre.
//
// Rien n'y est une image. Les dix references viennent du catalogue
// (`catalogue-agglos`), l'appareil du mur de `mur-agglos`, la position des
// cotes de `projection-bloc`. Changer une cote au catalogue change le bloc.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrickWall, Box, Hand, Weight } from "lucide-react";
import {
  AGGLOS_3D,
  agglosParM2,
  type GeometrieAgglo,
  type TypeAgglo,
} from "@/lib/catalogue-agglos";
import { monterLeMur } from "@/lib/mur-agglos";
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
/** Place a reserver autour de l'objet pour ses cotes, en pixels. */
const MARGE_COTES = 62;

const DEG = Math.PI / 180;

type Vue = "bloc" | "mur";
type CleCote = "longueur" | "hauteur" | "epaisseur";
const CLES_COTES: CleCote[] = ["longueur", "hauteur", "epaisseur"];

const EPAISSEURS = [...new Set(AGGLOS_3D.map((a) => a.epaisseurCm))].sort((a, b) => b - a);
const TYPES: TypeAgglo[] = ["creux", "plein", "double"];

const DEFAUT =
  AGGLOS_3D.find((a) => a.epaisseurCm === 20 && a.type === "creux") ?? AGGLOS_3D[0];

/** Le format existant le plus proche de ce qu'on demande. */
function choisirFormat(epaisseurCm: number, type: TypeAgglo): GeometrieAgglo {
  return (
    AGGLOS_3D.find((a) => a.epaisseurCm === epaisseurCm && a.type === type) ??
    AGGLOS_3D.find((a) => a.epaisseurCm === epaisseurCm) ??
    DEFAUT
  );
}

/**
 * Echelle qui fait tenir un objet dans la scene, ses cotes comprises.
 *
 * Le mur mesure deux metres de diagonale la ou le bloc en fait un demi : une
 * echelle commune donnerait soit un bloc minuscule, soit un mur hors cadre.
 */
function echellePourTenir(
  largeurMm: number,
  hauteurMm: number,
  boite: { width: number; height: number },
): number {
  const utile = (c: number) => Math.max(c - MARGE_COTES * 2, 40);
  return Math.min(utile(boite.width) / largeurMm, utile(boite.height) / hauteurMm);
}

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
    choisirType: string;
    typeCreux: string;
    typePlein: string;
    typeDouble: string;
    vueBloc: string;
    vueMur: string;
    choisirVue: string;
    murNom: string;
    murRangs: string;
    murAgglos: string;
    murParM2: string;
    murSurface: string;
    prixM2: string;
    pleinSansAlveole: string;
  };
}

export default function Produit360({ lang, labels }: Produit360Props) {
  const [epaisseurCm, setEpaisseurCm] = useState(DEFAUT.epaisseurCm);
  const [type, setType] = useState<TypeAgglo>(DEFAUT.type);
  const [vue, setVue] = useState<Vue>("bloc");
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const [visible, setVisible] = useState(false);
  /** L'invitation a manipuler ne sert plus une fois qu'on a manipule. */
  const [aManipule, setAManipule] = useState(false);

  const format = useMemo(() => choisirFormat(epaisseurCm, type), [epaisseurCm, type]);
  const panneau = useMemo(() => monterLeMur(format), [format]);
  const parM2 = useMemo(() => agglosParM2(format), [format]);

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

  // Cotes de l'objet montre, en millimetres. Elles rejoignent la cible en
  // glissant : le bloc s'epaissit a vue d'oeil au lieu de sauter.
  const cotesVues = useRef({
    l: DEFAUT.longueurMm,
    h: DEFAUT.hauteurMm,
    e: DEFAUT.epaisseurMm,
  });
  const cible = useRef({
    l: DEFAUT.longueurMm,
    h: DEFAUT.hauteurMm,
    e: DEFAUT.epaisseurMm,
  });
  /** Le passage du bloc au mur change tout : on y coupe au lieu de glisser. */
  const couper = useRef(false);
  const vuePrecedente = useRef<Vue>("bloc");

  useEffect(() => {
    cible.current =
      vue === "mur"
        ? { l: panneau.largeurMm, h: panneau.hauteurMm, e: panneau.epaisseurMm }
        : { l: format.longueurMm, h: format.hauteurMm, e: format.epaisseurMm };

    if (vuePrecedente.current !== vue) {
      couper.current = true;
      vuePrecedente.current = vue;
    }
  }, [vue, format, panneau]);

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
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.05,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── La boucle ──────────────────────────────────────────────────────────────

  const dessiner = useCallback(() => {
    const plateau = scene.current;
    if (!plateau) return;

    const { l, h, e } = cotesVues.current;
    const echelle = echellePourTenir(l, h, {
      width: plateau.clientWidth,
      height: plateau.clientHeight,
    });
    const lp = l * echelle;
    const hp = h * echelle;
    const ep = e * echelle;

    plateau.style.setProperty("--l", `${lp.toFixed(2)}px`);
    plateau.style.setProperty("--h", `${hp.toFixed(2)}px`);
    plateau.style.setProperty("--e", `${ep.toFixed(2)}px`);
    plateau.style.setProperty("--ech", echelle.toFixed(5));
    bloc.current?.style.setProperty("--rot", `${(angle.current / DEG).toFixed(2)}deg`);

    if (ombre.current) {
      const emprise = empriseRelative(lp, ep, angle.current);
      ombre.current.style.transform = `translate(-50%, -50%) scaleX(${emprise.toFixed(3)})`;
      ombre.current.style.opacity = `${(0.3 + 0.16 * emprise).toFixed(3)}`;
    }

    const cotes = ecarterLesCotes(
      coterLeBloc(lp, hp, ep, {
        tilt: TILT_DEG * DEG,
        angle: angle.current,
        perspective: PERSPECTIVE,
      }),
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
  }, []);

  useEffect(() => {
    if (!visible) return;

    let raf = 0;
    let precedent = 0;

    const image = (t: number) => {
      const dt = precedent === 0 ? 0 : Math.min((t - precedent) / 1000, 0.1);
      precedent = t;

      const fige = survol.current || glissement.current.actif;
      if (!fige && !mouvementReduit) {
        angle.current += DEGRES_PAR_SECONDE * DEG * dt;
      }

      // Approche exponentielle du format vise. Instantanee au changement de
      // vue, ou l'objet montre n'est plus le meme, et si l'on a demande moins
      // d'animation.
      const k = couper.current || mouvementReduit ? 1 : 1 - Math.exp(-dt / TAU_FORMAT);
      couper.current = false;

      const v = cotesVues.current;
      const c = cible.current;
      cotesVues.current = {
        l: v.l + (c.l - v.l) * k,
        h: v.h + (c.h - v.h) * k,
        e: v.e + (c.e - v.e) * k,
      };

      dessiner();
      raf = requestAnimationFrame(image);
    };

    raf = requestAnimationFrame(image);
    return () => cancelAnimationFrame(raf);
  }, [visible, mouvementReduit, dessiner]);

  // ── Prise en main ──────────────────────────────────────────────────────────

  const surPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // La bascule bloc / mur est posee sur la scene. Sans cette garde, la
    // scene capture le pointeur des l'appui, le clic n'atteint jamais le
    // bouton, et la bascule ne bascule pas.
    if ((e.target as HTMLElement).closest("button")) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setAManipule(true);
    glissement.current = { actif: true, depuis: e.clientX, angleInitial: angle.current };
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
  const estMur = vue === "mur";
  const parM2Arrondi = Math.round(parM2 * 10) / 10;

  const valeurs: Record<CleCote, { mm: number; nom: string }> = estMur
    ? {
        longueur: { mm: panneau.largeurMm, nom: labels.longueur },
        hauteur: { mm: panneau.hauteurMm, nom: labels.hauteur },
        epaisseur: { mm: panneau.epaisseurMm, nom: labels.epaisseur },
      }
    : {
        longueur: { mm: format.longueurMm, nom: labels.longueur },
        hauteur: { mm: format.hauteurMm, nom: labels.hauteur },
        epaisseur: { mm: format.epaisseurMm, nom: labels.epaisseur },
      };

  const nomType: Record<TypeAgglo, string> = {
    creux: labels.typeCreux,
    plein: labels.typePlein,
    double: labels.typeDouble,
  };

  const alveoles = (classe = "") =>
    Array.from({ length: format.rangees }, (_, r) => (
      <span key={r} className="b3d-rangee">
        {Array.from({ length: format.alveoles }, (_, i) => (
          <span key={i} className={`b3d-alveole ${classe}`} />
        ))}
      </span>
    ));

  return (
    <figure className="b3d m-0 mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mx-0 xl:max-w-[460px]">
      <div
        ref={scene}
        tabIndex={0}
        role="img"
        aria-label={
          estMur
            ? `${labels.murNom} ${nom} — ${panneau.rangs} ${labels.murRangs}. ${panneau.agglos} ${labels.murAgglos}, ${parM2Arrondi} ${labels.murParM2}. ${labels.manipuler}`
            : `${nom} — ${format.longueurMm} × ${format.hauteurMm} × ${format.epaisseurMm} mm, ${format.poidsKg} kg. ${labels.manipuler}`
        }
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
        className="b3d-scene relative h-[250px] w-full cursor-grab touch-pan-y rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#001D3D] active:cursor-grabbing sm:h-[290px] xl:h-[330px]"
      >
        <div ref={ombre} className="b3d-sol" aria-hidden="true" />

        <div
          ref={bloc}
          className="b3d-bloc"
          aria-hidden="true"
          style={
            estMur
              ? ({
                  // Hauteur d'un rang : le panneau porte `--h`, les pieces
                  // qui le composent ont besoin de la leur.
                  "--bh": `calc(${format.hauteurMm} * var(--ech) * 1px)`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {estMur ? (
            <>
              {/* Le mortier, vu au fond des joints. */}
              <div className="b3d-mortier" />
              {panneau.pieces.map((p, i) => (
                <div
                  key={i}
                  className="b3d-piece"
                  style={
                    {
                      "--cx": `calc(${p.x + p.longueurMm / 2 - panneau.largeurMm / 2} * var(--ech) * 1px)`,
                      "--cy": `calc(${p.y + format.hauteurMm / 2 - panneau.hauteurMm / 2} * var(--ech) * 1px)`,
                      "--pl": `calc(${p.longueurMm} * var(--ech) * 1px)`,
                    } as React.CSSProperties
                  }
                >
                  <div className="b3d-face b3d-avant b3d-p-avant" />
                  <div className="b3d-face b3d-arriere b3d-p-arriere" />
                  {p.bordGauche && <div className="b3d-face b3d-gauche b3d-p-gauche" />}
                  {p.bordDroit && <div className="b3d-face b3d-droite b3d-p-droite" />}
                  {p.rang === 0 && (
                    <div className="b3d-face b3d-dessus b3d-p-dessus">
                      {!p.demi && alveoles()}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="b3d-face b3d-avant" />
              <div className="b3d-face b3d-arriere" />
              <div className="b3d-face b3d-gauche" />
              <div className="b3d-face b3d-droite" />
              <div className="b3d-face b3d-dessus">{alveoles()}</div>
              <div className="b3d-face b3d-dessous">{alveoles("b3d-alveole-fond")}</div>
            </>
          )}
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
              <span className="mt-0.5 block text-[8px] uppercase leading-none tracking-[0.14em] text-white/55">
                {valeurs[cle].nom}
              </span>
            </div>
          ))}
        </div>

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-2 top-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45 transition-opacity duration-500 ${
            aManipule ? "opacity-0" : "opacity-100"
          }`}
        >
          <Hand className="h-3 w-3" />
          {labels.indice}
        </span>

        {/* Bascule bloc / mur, posee sur la scene : c'est ce qu'on y voit
            qu'elle change, pas un reglage du produit. */}
        <div
          role="group"
          aria-label={labels.choisirVue}
          className="absolute right-1 top-1 flex items-center gap-1 rounded-xl border border-white/15 bg-[#001D3D]/70 p-0.5 backdrop-blur-sm"
        >
          {(
            [
              ["bloc", labels.vueBloc, Box],
              ["mur", labels.vueMur, BrickWall],
            ] as const
          ).map(([cle, texte, Icone]) => (
            <button
              key={cle}
              type="button"
              onClick={() => setVue(cle)}
              aria-pressed={vue === cle}
              className={`flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors duration-200 ${
                vue === cle ? "bg-[#FFD700] text-[#002B5B]" : "text-white/60 hover:text-white"
              }`}
            >
              <Icone className="h-3.5 w-3.5" aria-hidden="true" />
              {texte}
            </button>
          ))}
        </div>
      </div>

      <figcaption className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base font-black leading-tight text-white">
              {estMur ? `${labels.murNom} ${nom.toLowerCase()}` : nom}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/50">
              {estMur ? `${panneau.rangs} ${labels.murRangs}` : usage}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-white/40">
              {estMur ? (
                <>
                  {panneau.largeurMm} × {panneau.hauteurMm} mm
                  <span className="mx-1.5 text-white/25">·</span>
                  {panneau.agglos} {labels.murAgglos}
                  <span className="mx-1.5 text-white/25">·</span>
                  {panneau.surfaceM2.toFixed(2).replace(".", ",")} m² {labels.murSurface}
                </>
              ) : (
                <>
                  {format.longueurMm} × {format.hauteurMm} × {format.epaisseurMm} mm
                  <span className="mx-1.5 text-white/25">·</span>
                  {format.alveoles === 0
                    ? labels.pleinSansAlveole
                    : `${format.alveoles * format.rangees} ${labels.alveoles}`}
                </>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-1 text-[#FFD700]">
              {estMur ? (
                <BrickWall className="mr-0.5 h-4 w-4 self-center opacity-70" aria-hidden="true" />
              ) : (
                <Weight className="mr-0.5 h-4 w-4 self-center opacity-70" aria-hidden="true" />
              )}
              <span className="font-mono text-3xl font-black leading-none">
                {estMur ? parM2Arrondi.toLocaleString(langue) : format.poidsKg}
              </span>
              {!estMur && <span className="text-sm font-bold">kg</span>}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
              {estMur ? labels.murParM2 : labels.poids}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div
              role="group"
              aria-label={labels.choisirEpaisseur}
              className="flex items-center gap-1.5"
            >
              <span className="w-[58px] shrink-0 text-[10px] uppercase leading-tight tracking-[0.12em] text-white/45">
                {labels.choisirEpaisseur}
              </span>
              {EPAISSEURS.map((cm) => {
                const actif = cm === epaisseurCm;
                return (
                  <button
                    key={cm}
                    type="button"
                    onClick={() => setEpaisseurCm(cm)}
                    aria-pressed={actif}
                    className={`min-w-[40px] cursor-pointer rounded-lg px-1.5 py-1.5 font-mono text-xs font-bold transition-colors duration-200 ${
                      actif
                        ? "bg-[#FFD700] text-[#002B5B]"
                        : "border border-white/15 text-white/65 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {cm}
                    <span className="ml-0.5 text-[9px] font-semibold opacity-70">cm</span>
                  </button>
                );
              })}
            </div>

            <p className="ml-auto shrink-0 whitespace-nowrap text-right font-mono text-sm font-bold text-white/80">
              {(estMur
                ? Math.round(format.prixFcfa * parM2Arrondi)
                : format.prixFcfa
              ).toLocaleString(langue)}
              <span className="ml-1 text-[10px] font-semibold text-white/45">
                {estMur ? labels.prixM2 : labels.prixUnite}
              </span>
            </p>
          </div>

          <div role="group" aria-label={labels.choisirType} className="flex items-center gap-1.5">
            <span className="w-[58px] shrink-0 text-[10px] uppercase leading-tight tracking-[0.12em] text-white/45">
              {labels.choisirType}
            </span>
            {TYPES.map((t) => {
              // Toutes les combinaisons n'existent pas : le 10 ne se fait qu'en
              // creux. On montre le bouton eteint plutot que de le retirer,
              // sinon la rangee change de longueur a chaque clic.
              const existe = AGGLOS_3D.some(
                (a) => a.epaisseurCm === epaisseurCm && a.type === t,
              );
              const actif = t === format.type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={!existe}
                  aria-pressed={actif}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
                    actif
                      ? "cursor-pointer bg-[#FFD700] text-[#002B5B]"
                      : existe
                        ? "cursor-pointer border border-white/15 text-white/65 hover:border-white/40 hover:text-white"
                        : "cursor-not-allowed border border-white/5 text-white/20"
                  }`}
                >
                  {nomType[t]}
                </button>
              );
            })}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
