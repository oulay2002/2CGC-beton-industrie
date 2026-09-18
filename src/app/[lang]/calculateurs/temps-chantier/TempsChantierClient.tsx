"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface TempsChantierClientProps {
  lang: Locale;
}

const TYPES_TRAVAUX_CONFIG = [
  {
    id: "mur_agglo",
    nomFr: "Élévation mur en agglos",
    nomEn: "Hollow block wall elevation",
    productivite: 12,
  },
  {
    id: "pose_paves",
    nomFr: "Pose de pavés (terrasse / allée)",
    nomEn: "Paver installation (terrace / driveway)",
    productivite: 20,
  },
  {
    id: "bordures",
    nomFr: "Pose de bordures",
    nomEn: "Curbstone laying",
    productivite: 15,
  },
  {
    id: "enduit",
    nomFr: "Enduit / Crépi",
    nomEn: "Plastering / Rendering",
    productivite: 25,
  },
];

export default function TempsChantierClient({ lang }: TempsChantierClientProps) {
  const isEn = lang === "en";

  const [surface, setSurface] = useState("");
  const [travailId, setTravailId] = useState(TYPES_TRAVAUX_CONFIG[0].id);
  const [ouvriers, setOuvriers] = useState("2");

  const resultat = useMemo(() => {
    const S = parseFloat(surface) || 0;
    const N = parseInt(ouvriers) || 1;

    const travail = TYPES_TRAVAUX_CONFIG.find((t) => t.id === travailId);
    const productivite = travail ? travail.productivite : 10;

    // Jours = Surface / (Productivité * Nombre d'ouvriers)
    const joursBruts = S / (productivite * N);
    const jours = Math.ceil(joursBruts * 10) / 10; // Arrondi à 1 décimale

    const heures = Math.round(jours * 8); // Base 8h/jour

    return { jours, heures, productivite };
  }, [surface, travailId, ouvriers]);

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header Premium */}
      <section className="relative bg-brand-gradient text-white pt-32 pb-16 px-4 border-b border-white/10 overflow-hidden">
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
                {isEn ? "⏱️ Construction Planning & Ratios" : "⏱️ Planification & Ratios BTP"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Worksite Paces • 2CGC CHEICKNA" : "Cadences Chantier • 2CGC CHEICKNA"}
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            {isEn ? "Worksite Time & Pace Estimator" : "Estimateur de Temps de Chantier"}
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl font-light leading-relaxed">
            {isEn
              ? "Estimate implementation paces, plan your team mobilization, and secure your project delivery schedules."
              : "Évaluez les cadences de mise en œuvre, planifiez la mobilisation de vos équipes et sécurisez vos plannings de livraison."}
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
                {isEn ? "Worksite Parameters" : "Paramètres du chantier"}
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Surface area to treat (m²)" : "Surface à traiter (m²)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none min-h-[44px]"
                  placeholder={isEn ? "E.g. 120" : "Ex: 120"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Type of structure / Work" : "Type d'ouvrage / Travaux"}
                </label>
                <select
                  value={travailId}
                  onChange={(e) => setTravailId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none bg-white min-h-[44px]"
                >
                  {TYPES_TRAVAUX_CONFIG.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isEn ? t.nomEn : t.nomFr} (~{t.productivite}{" "}
                      {isEn ? "m²/day/worker" : "m²/jour/ouvrier"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {isEn ? "Number of workers mobilized" : "Nombre d'ouvriers mobilisés"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={ouvriers}
                  onChange={(e) => setOuvriers(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Résultat Premium */}
          <div className="lg:col-span-5 bg-gradient-to-br from-brand-navy via-brand-navy to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <span className="w-8 h-8 rounded-full bg-brand-accent text-brand-navy font-bold flex items-center justify-center text-sm">
                  2
                </span>
                <h2 className="text-xl font-bold text-white">
                  {isEn ? "Forecasted Estimate" : "Estimation Prévisionnelle"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="pt-4 pb-4 text-center bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-brand-accent uppercase tracking-widest mb-1">
                    {isEn ? "Estimated Lead Time" : "Délai Estimé"}
                  </div>
                  <div className="text-5xl font-black text-white tracking-tight">
                    {resultat.jours}{" "}
                    <span className="text-2xl font-bold text-slate-300">
                      {isEn ? "days" : "jours"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {isEn
                      ? `approx. ${resultat.heures} man-hours (8h/day base)`
                      : `environ ${resultat.heures} heures de main-d'œuvre (base 8h/j)`}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-slate-300">
                      {isEn ? "Average pace:" : "Cadence moyenne :"}
                    </span>
                    <span className="font-semibold text-white">
                      {resultat.productivite} {isEn ? "m²/day/worker" : "m²/jour/ouvrier"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-slate-300">
                      {isEn ? "Selected workforce:" : "Effectif retenu :"}
                    </span>
                    <span className="font-semibold text-brand-accent">
                      {ouvriers} {isEn ? "worker(s)" : "ouvrier(s)"}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
                  {isEn ? (
                    <>
                      💡 <strong>2CGC Tip:</strong> Thanks to the regular geometry of our concrete blocks and interlocking pavers, masons gain up to 20% productivity compared to artisanal blocks.
                    </>
                  ) : (
                    <>
                      💡 <strong>Conseil 2CGC :</strong> Grâce à la géométrie régulière de nos blocs et pavés autobloquants, les poseurs gagnent jusqu'à 20% de productivité par rapport à des blocs artisanaux.
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href={`/${lang}/devis`}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-amber-400 text-brand-navy text-center py-4 rounded-xl font-bold text-base shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
              >
                <span>
                  {isEn ? "Request a quote for this project" : "Demander un devis pour ce chantier"}
                </span>
                <span>→</span>
              </Link>
              <p className="text-center text-xs text-slate-400">
                {isEn
                  ? "Guaranteed supply and phased deliveries according to project progress."
                  : "Fourniture garantie et livraisons échelonnées selon avancement."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
