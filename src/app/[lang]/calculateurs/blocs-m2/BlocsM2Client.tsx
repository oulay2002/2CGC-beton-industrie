"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";
import posthog from "posthog-js";

interface BlocsM2ClientProps {
  lang: Locale;
}

const PRODUITS_CONFIG = [
  {
    id: "1",
    nomFr: "Brique 20 Pleine (Mur porteur)",
    nomEn: "Solid Block 20 (Load-bearing wall)",
    ratio: 12.5,
  },
  {
    id: "2",
    nomFr: "Brique 20 Creuse (Mur standard)",
    nomEn: "Hollow Block 20 (Standard wall)",
    ratio: 12.5,
  },
  {
    id: "3",
    nomFr: "Brique 15 Pleine (Mur intermédiaire)",
    nomEn: "Solid Block 15 (Intermediate wall)",
    ratio: 12.5,
  },
  {
    id: "4",
    nomFr: "Brique 15 Creuse (Cloison de séparation)",
    nomEn: "Hollow Block 15 (Partition wall)",
    ratio: 12.5,
  },
  {
    id: "6",
    nomFr: "Brique 12 Creuse (Cloison légère)",
    nomEn: "Hollow Block 12 (Lightweight partition)",
    ratio: 12.5,
  },
  {
    id: "16",
    nomFr: "Pavé Z-7 Gris (Terrasse / Voirie)",
    nomEn: "Z-7 Grey Paver (Terrace / Roadway)",
    ratio: 50,
  },
  {
    id: "12",
    nomFr: "Pavé Z-7 Rouge (Allée / Parking)",
    nomEn: "Z-7 Red Paver (Driveway / Parking)",
    ratio: 50,
  },
];

export default function BlocsM2Client({ lang }: BlocsM2ClientProps) {
  const isEn = lang === "en";

  const [longueur, setLongueur] = useState("10");
  const [hauteur, setHauteur] = useState("2.5");
  const [produitId, setProduitId] = useState(PRODUITS_CONFIG[0].id);
  const [margeCasse, setMargeCasse] = useState(5); // 5% par défaut

  const resultat = useMemo(() => {
    const L = parseFloat(longueur) || 0;
    const H = parseFloat(hauteur) || 0;
    const surface = L * H;

    const produit = PRODUITS_CONFIG.find((p) => p.id === produitId);
    const ratio = produit ? produit.ratio : 0;

    const blocsNets = surface * ratio;
    const marge = blocsNets * (margeCasse / 100);
    const blocsTotaux = Math.ceil(blocsNets + marge);

    return {
      surface: surface.toFixed(2),
      blocsNets: Math.ceil(blocsNets),
      marge: Math.ceil(marge),
      blocsTotaux,
    };
  }, [longueur, hauteur, produitId, margeCasse]);

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header Premium */}
      <section className="relative bg-brand-gradient text-white pt-32 pb-16 px-4 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link
            href={`/${lang}/calculateurs`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FFD700] hover:text-amber-300 transition-colors mb-4 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            {isEn ? "Back to calculators hub" : "Retour au pôle calculateurs"}
          </Link>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
              <img
                src="/logo-2cgc.png"
                alt="Logo 2CGC"
                className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#FFD700] uppercase tracking-wider">
                {isEn ? "📐 On-Site Precision Tool" : "📐 Outil de Précision Chantier"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Technical Calculator • 2CGC CHEICKNA" : "Calculateur Technique • 2CGC CHEICKNA"}
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            {isEn ? "Blocks & Pavers / m² Calculator" : "Calculateur de Blocs & Pavés / m²"}
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl font-light leading-relaxed">
            {isEn
              ? "Accurately estimate your material needs for masonry, paving, and roadworks, with intelligent allowance for breakage margins."
              : "Estimez précisément vos besoins en matériaux pour vos maçonneries, dallages et voiries, avec intégration intelligente de la marge de casse."}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Formulaire */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <span className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy font-bold flex items-center justify-center text-sm">
                1
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {isEn ? "Surface Parameters" : "Paramètres de la surface"}
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Length (in meters)" : "Longueur (en mètres)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={longueur}
                  onChange={(e) => setLongueur(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none min-h-[44px]"
                  placeholder={isEn ? "E.g. 10" : "Ex: 10"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Height / Thickness (in meters)" : "Hauteur / Épaisseur (en mètres)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hauteur}
                  onChange={(e) => setHauteur(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none min-h-[44px]"
                  placeholder={isEn ? "E.g. 2.5" : "Ex: 2.5"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Product type" : "Type de produit"}
                </label>
                <select
                  value={produitId}
                  onChange={(e) => setProduitId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none bg-white min-h-[44px]"
                >
                  {PRODUITS_CONFIG.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isEn ? p.nomEn : p.nomFr} ({p.ratio} {isEn ? "units/m²" : "unités/m²"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {isEn ? "Breakage margin (%)" : "Marge de casse (%)"}
                </label>
                <select
                  value={margeCasse}
                  onChange={(e) => setMargeCasse(parseInt(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none bg-white min-h-[44px]"
                >
                  <option value={0}>{isEn ? "0% (Exact quantity)" : "0% (Quantité exacte)"}</option>
                  <option value={5}>
                    {isEn ? "5% (Recommended by our technicians)" : "5% (Recommandé par nos techniciens)"}
                  </option>
                  <option value={10}>
                    {isEn ? "10% (Complex sites or cuttings)" : "10% (Chantiers complexes ou découpes)"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Résultat - Haute Visibilité & Contraste Parfait */}
          <div className="lg:col-span-5 bg-[#002B5B] text-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-[#002B5B] flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
                <span className="w-8 h-8 rounded-full bg-[#FFD700] text-[#002B5B] font-bold flex items-center justify-center text-sm shadow">
                  2
                </span>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {isEn ? "Industrial Estimation" : "Estimation Industrielle"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-white/15 text-sm">
                  <span className="text-gray-200">
                    {isEn ? "Calculated surface:" : "Surface calculée :"}
                  </span>
                  <span className="font-bold text-white text-base">{resultat.surface} m²</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/15 text-sm">
                  <span className="text-gray-200">
                    {isEn ? "Theoretical net blocks:" : "Blocs nets théoriques :"}
                  </span>
                  <span className="font-bold text-white text-base">
                    {resultat.blocsNets} {isEn ? "units" : "unités"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/15 text-sm">
                  <span className="text-gray-200">
                    {isEn ? `Safety margin (${margeCasse}%):` : `Marge de sécurité (${margeCasse}%) :`}
                  </span>
                  <span className="font-bold text-[#FFD700] text-base">
                    +{resultat.marge} {isEn ? "units" : "unités"}
                  </span>
                </div>

                {/* Encart Total Mis en Valeur */}
                <div className="pt-6 pb-5 px-4 text-center bg-[#001D3D] rounded-2xl border border-white/20 my-5 shadow-inner">
                  <div className="text-xs font-bold text-[#FFD700] uppercase tracking-widest mb-1">
                    {isEn ? "RECOMMENDED TOTAL" : "TOTAL RECOMMANDÉ"}
                  </div>
                  <div className="text-5xl md:text-6xl font-black text-[#FFD700] tracking-tight my-1">
                    {resultat.blocsTotaux}
                  </div>
                  <div className="text-xs text-gray-300 font-medium">
                    {isEn ? "NF / 2CGC (Daloa) certified units" : "unités certifiées NF / 2CGC (Daloa)"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {resultat.blocsTotaux > 0 ? (
                <Link
                  href={`/${lang}/devis?produit=${produitId}&quantite=${resultat.blocsTotaux}`}
                  onClick={() => {
                    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
                      posthog.capture("calculator_quote_started", {
                        calculator: "blocks_m2",
                        product_id: produitId,
                        recommended_quantity: resultat.blocsTotaux,
                        breakage_margin_percent: margeCasse,
                      });
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-3 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] text-center py-4 px-6 rounded-xl font-extrabold text-base shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[50px] cursor-pointer"
                >
                  <span>{isEn ? "Insert into my Express Quote" : "Insérer dans mon Devis Express"}</span>
                  <span className="text-lg">→</span>
                </Link>
              ) : (
                <div className="w-full py-4 px-6 rounded-xl bg-white/10 text-gray-300 text-center font-semibold text-sm border border-white/20">
                  {isEn ? "👆 Enter a length and height on the left" : "👆 Saisissez une longueur et une hauteur ci-contre"}
                </div>
              )}
              <p className="text-center text-xs text-gray-300 font-normal">
                {isEn
                  ? "Volume discounts available for full pallets and truckloads."
                  : "Tarification dégressive par palette complète et camion disponible."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
