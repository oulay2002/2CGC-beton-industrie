"use client";

// src/components/CarrouselAgglos.tsx — Les dix agglos du catalogue, en anneau.
//
// Le hero montrait un bloc construit en CSS qui tournait sur lui-meme. Il
// etait juste — cotes du catalogue, alveoles comptees sur les photos — mais
// il restait un dessin, et le client voulait voir ses produits. Une photo
// seule ne peut pas tourner sur 360 degres : on n'en a qu'une par reference.
// Dix photos, en revanche, peuvent tourner ensemble.
//
// C'est donc un anneau : les dix references du catalogue, detourees, tournent
// lentement autour d'un axe vertical. Celle qui passe au premier plan donne
// son nom, ses cotes et son poids au panneau. Le selecteur amene une
// reference devant ; la souris, le doigt ou les fleches font tourner.
//
// Tout ce qu'on voit est photographie a l'usine. Les donnees viennent du
// catalogue (`catalogue-agglos`), comme le reste du site.

import { useCallback, useEffect, useRef, useState } from "react";
import { Hand } from "lucide-react";
import {
  AGGLOS_3D,
  type GeometrieAgglo,
} from "@/lib/catalogue-agglos";
import type { Locale } from "@/lib/dictionaries";

/** Le plateau s'arrete sur chaque reference, puis glisse a la suivante. */
const ARRET_MS = 2200;
/** Constante de temps du glissement d'une reference a l'autre, en secondes. */
const TAU_DEFILE = 0.32;
/** Apres un geste du visiteur, l'anneau attend avant de repartir seul. */
const REPOS_APRES_GESTE_MS = 6000;
const DEGRES_PAR_PIXEL = 0.35;
/** Constante de temps du rappel vers la reference choisie, en secondes. */
const TAU_RAPPEL = 0.16;
/** Ecart en deca duquel la carte est declaree arrivee et calee net : un
 *  rappel exponentiel rampe sur sa fin, inutilement. */
const ARRIVEE_DEG = 0.45;
/** Doit rester egale a la `perspective` du CSS. */
const PERSPECTIVE = 1400;

const DEG = Math.PI / 180;
/**
 * References dont la photo du catalogue n'est pas montrable. L'agglo 20
 * creux (2) est photographie surexpose, arete ebrechee : retire a la demande
 * du client le 14/11/2026. Il reste au catalogue et au calculateur ; seul
 * l'anneau s'en passe, en attendant une nouvelle prise de vue.
 */
const SANS_PHOTO = new Set(["2"]);
const PRODUITS = AGGLOS_3D.filter((a) => !SANS_PHOTO.has(a.id));
const PAS = 360 / PRODUITS.length;

// On ouvre sur le double alveoles de 20 : la photo la plus nette, et le
// produit le plus recent.
const indexParDefaut = Math.max(
  0,
  PRODUITS.findIndex((a) => a.epaisseurCm === 20 && a.type === "double"),
);

/** Ecart angulaire signe, ramene dans [-180, 180[. */
const ecartAngulaire = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

interface CarrouselAgglosProps {
  lang: Locale;
  labels: {
    prixUnite: string;
    indice: string;
    manipuler: string;
  };
}

export default function CarrouselAgglos({ lang, labels }: CarrouselAgglosProps) {
  // La reference au premier plan. C'est l'anneau qui la designe en tournant,
  // ou le visiteur qui la choisit ; dans les deux cas elle vit ici.
  const [courant, setCourant] = useState(indexParDefaut);
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const [visible, setVisible] = useState(false);
  const [aManipule, setAManipule] = useState(false);

  const scene = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLDivElement>(null);
  const cartes = useRef<(HTMLDivElement | null)[]>([]);

  const angle = useRef(indexParDefaut * PAS);
  /** Reference que l'anneau doit amener devant, ou `null` s'il tourne seul. */
  const cible = useRef<number | null>(null);
  const survol = useRef(false);
  const reposJusqua = useRef(0);
  /** Constante de temps du rappel en cours : vive au clic, douce en defile. */
  const tau = useRef(TAU_RAPPEL);
  /** Instant ou la carte courante s'est posee devant. */
  const arriveeA = useRef(0);
  const glissement = useRef({ actif: false, depuis: 0, angleInitial: 0, aBouge: false });
  const courantRef = useRef(courant);

  const format: GeometrieAgglo = PRODUITS[courant];

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

  // ── Le dessin d'une image ──────────────────────────────────────────────────

  const dessiner = useCallback(() => {
    const plateau = scene.current;
    const bague = anneau.current;
    if (!plateau || !bague) return;

    // Le rayon suit la largeur de la scene : l'anneau doit tenir dans son
    // cadre sur un telephone comme sur un grand ecran.
    const largeur = plateau.clientWidth;
    // Rayon large : les voisines s'ecartent au lieu de se chevaucher, et
    // celles du fond sortent du cadre, comme sur un vrai plateau tournant.
    const rayon = largeur * 0.72;
    const largeurCarte = largeur * 0.46;
    plateau.style.setProperty("--carte", `${largeurCarte.toFixed(1)}px`);

    const a = angle.current;
    for (let i = 0; i < PRODUITS.length; i += 1) {
      const carte = cartes.current[i];
      if (!carte) continue;
      const theta = i * PAS;
      const delta = ecartAngulaire(theta, a) * DEG;
      const profondeur = Math.cos(delta); // 1 devant, -1 derriere
      // Chaque carte reste face au visiteur ; seule sa place sur l'anneau
      // bouge. Les cartes du fond montent un peu, comme sur un plateau
      // tournant vu de haut.
      const avant = (profondeur + 1) * 0.5; // 0 au fond, 1 devant
      // La carte de devant est pleine taille ; celles du fond rapetissent et
      // s'eteignent. Posees au sol, les plus eloignees remontent un peu dans
      // le cadre — c'est la perspective d'une cour vue debout.
      const echelle = 0.48 + 0.52 * avant;
      const montee = (1 - avant) * largeur * 0.13;
      carte.style.transform =
        `rotateY(${theta - a}deg) translateZ(${rayon.toFixed(1)}px) ` +
        `rotateY(${a - theta}deg) translateY(${(-montee).toFixed(1)}px) scale(${echelle.toFixed(3)})`;
      carte.style.opacity = (0.1 + 0.9 * avant * avant).toFixed(3);
      carte.style.filter = `brightness(${(0.5 + 0.5 * avant).toFixed(3)})`;
    }

    // La reference au premier plan est celle dont l'ecart a l'angle courant
    // est le plus petit. On ne previent React que lorsqu'elle change.
    const devant =
      ((Math.round(a / PAS) % PRODUITS.length) + PRODUITS.length) % PRODUITS.length;
    if (devant !== courantRef.current) {
      courantRef.current = devant;
      setCourant(devant);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    let precedent = 0;
    arriveeA.current = performance.now();

    const image = (t: number) => {
      const dt = precedent === 0 ? 0 : Math.min((t - precedent) / 1000, 0.1);
      precedent = t;

      const c = cible.current;
      if (c !== null) {
        // Rappel exponentiel vers la reference visee, par le plus court
        // chemin. Instantane si l'on a demande moins d'animation.
        const ecart = ecartAngulaire(c * PAS, angle.current);
        const k = mouvementReduit ? 1 : 1 - Math.exp(-dt / tau.current);
        angle.current += ecart * k;
        if (Math.abs(ecart) < ARRIVEE_DEG) {
          angle.current = c * PAS;
          cible.current = null;
          arriveeA.current = t;
        }
      } else {
        // Le plateau tourne seul : un arret sur chaque reference, puis la
        // suivante. Il attend si le visiteur survole, glisse, ou vient d'agir.
        const auRepos =
          survol.current || glissement.current.actif || t < reposJusqua.current;
        if (!auRepos && !mouvementReduit && t - arriveeA.current > ARRET_MS) {
          tau.current = TAU_DEFILE;
          cible.current = (courantRef.current + 1) % PRODUITS.length;
        }
      }

      dessiner();
      raf = requestAnimationFrame(image);
    };

    raf = requestAnimationFrame(image);
    return () => cancelAnimationFrame(raf);
  }, [visible, mouvementReduit, dessiner]);

  // ── Gestes ─────────────────────────────────────────────────────────────────

  const amener = (index: number) => {
    tau.current = TAU_RAPPEL;
    cible.current = index;
    reposJusqua.current = performance.now() + REPOS_APRES_GESTE_MS;
    setAManipule(true);
  };

  const surPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    cible.current = null;
    glissement.current = {
      actif: true,
      depuis: e.clientX,
      angleInitial: angle.current,
      aBouge: false,
    };
    setAManipule(true);
  };

  const surPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = glissement.current;
    if (!g.actif) return;
    const dx = e.clientX - g.depuis;
    if (Math.abs(dx) > 3) g.aBouge = true;
    angle.current = g.angleInitial - dx * DEGRES_PAR_PIXEL;
  };

  const relacher = () => {
    const g = glissement.current;
    if (!g.actif) return;
    g.actif = false;
    reposJusqua.current = performance.now() + REPOS_APRES_GESTE_MS;
    // Une fois lache, l'anneau se cale sur la reference la plus proche :
    // une photo a moitie de cote ne se lit pas.
    tau.current = TAU_RAPPEL;
    cible.current =
      ((Math.round(angle.current / PAS) % PRODUITS.length) + PRODUITS.length) % PRODUITS.length;
  };

  const surClavier = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const base = cible.current ?? courantRef.current;
    const n = PRODUITS.length;
    amener((((base + (e.key === "ArrowRight" ? 1 : -1)) % n) + n) % n);
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  const nom = lang === "fr" ? format.nom : format.nomEn;
  const langue = lang === "fr" ? "fr-FR" : "en-US";
  return (
    <figure className="anneau m-0 mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mx-0 xl:max-w-[460px]">
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
        className="anneau-scene relative h-[250px] w-full overflow-hidden cursor-grab touch-pan-y rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#001D3D] active:cursor-grabbing sm:h-[290px] xl:h-[330px]"
        style={{ perspective: `${PERSPECTIVE}px` }}
      >
        {/* La fenetre porte le fondu des bords : pose sur l'anneau lui-meme,
            un masque aplatirait sa 3D, comme une opacite le ferait. */}
        <div className="anneau-fenetre" aria-hidden="true">
        <div className="anneau-sol" />

        <div ref={anneau} className="anneau-bague">
          {PRODUITS.map((p, i) => (
            <div
              key={p.id}
              ref={(n) => {
                cartes.current[i] = n;
              }}
              className="anneau-carte"
            >
              {/* Des WebP detoures de 4 a 14 Ko, deja a leur taille d'affichage
                  et transformes en 3D : `next/image` n'y gagnerait rien et
                  contraindrait la mise en page des cartes. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/produits-detoures/agglo-${p.id}.webp`}
                alt=""
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>
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
      </div>

      {/* Une seule ligne, pas un panneau : le hero est un ecran, pas trois.
          Les reglages d'epaisseur et de type vivent au catalogue ; ici le
          plateau tourne, et la ligne dit ce qu'il montre. */}
      <figcaption className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center lg:justify-start lg:text-left">
        <span className="text-base font-black leading-tight text-white">{nom}</span>
        <span className="font-mono text-[12px] text-white/55">
          {format.longueurMm} × {format.hauteurMm} × {format.epaisseurMm} mm
        </span>
        <span className="font-mono text-[12px] font-bold text-[#FFD700]">
          {format.poidsKg} kg
        </span>
        <span className="font-mono text-[12px] text-white/55">
          {format.prixFcfa.toLocaleString(langue)} {labels.prixUnite}
        </span>
      </figcaption>
    </figure>
  );
}
