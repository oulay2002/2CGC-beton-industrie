"use client";

import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface CalculateursClientProps {
  lang: Locale;
}

export default function CalculateursClient({ lang }: CalculateursClientProps) {
  const isEn = lang === "en";

  const calculateurs = [
    {
      id: "blocs-m2",
      titre: isEn ? "Blocks & Pavers / m² Calculator" : "Calculateur de Blocs / m²",
      badge: isEn ? "Structural Works & Masonry" : "Gros-Œuvre & Maçonnerie",
      description: isEn
        ? "Determine exactly how many blocks, bricks, or pavers you need for your wall or roadway surfaces, with automatic calculation of the breakage safety factor."
        : "Déterminez exactement le nombre de briques, agglos ou pavés nécessaires pour vos surfaces murales ou de voirie, avec intégration automatique du coefficient de casse.",
      icone: "🧱",
      caracteristiques: isEn
        ? [
            "Account for openings (doors and windows)",
            "Configurable safety and breakage margin (5% to 10%)",
            "Immediate conversion into number of pallets",
            "Direct estimated cost in FCFA excl. VAT",
          ]
        : [
            "Prise en compte des ouvertures (portes et fenêtres)",
            "Marge de sécurité et casse paramétrable (5% à 10%)",
            "Conversion immédiate en nombre de palettes",
            "Estimation directe du budget HT en FCFA",
          ],
      lien: `/${lang}/calculateurs/blocs-m2`,
    },
    {
      id: "temps-chantier",
      titre: isEn ? "Worksite Time & Pace Estimator" : "Estimateur de Temps de Chantier",
      badge: isEn ? "Planning & Productivity" : "Planning & Productivité",
      description: isEn
        ? "Accurately assess the installation time required according to building area, team size (masons + helpers), and site conditions."
        : "Évaluez précisément le temps de pose requis selon la surface à bâtir, le nombre de maçons mobilisés et les conditions du chantier.",
      icone: "⏱️",
      caracteristiques: isEn
        ? [
            "Real execution paces observed on Ivorian construction sites",
            "Adjustable by crew size (masons + helpers)",
            "Estimated wall elevation time in business days",
            "Recommendations for curing and pouring phases",
          ]
        : [
            "Cadences réelles constatées sur chantiers en Côte d'Ivoire",
            "Ajustement selon la taille de l'équipe (maçons + manœuvres)",
            "Estimation du délai d'élévation en jours ouvrés",
            "Recommandation sur les phases de séchage et coulage",
          ],
      lien: `/${lang}/calculateurs/temps-chantier`,
    },
  ];

  const ratiosPratiques = isEn
    ? [
        { type: "20x20x50 Concrete Blocks", ratio: "10 units / m²", usage: "Load-bearing walls & exterior facades" },
        { type: "15x20x50 Concrete Blocks", ratio: "10 units / m²", usage: "Partition walls & perimeter fences" },
        { type: "12 & 10 Hollow Blocks", ratio: "10 units / m²", usage: "Lightweight partitions & wall linings" },
        { type: "French 15 Hollow Floor Blocks", ratio: "~8 units / m²", usage: "Standard suspended upper floor slabs" },
        { type: "Z-7 Pavers (240×240×60)", ratio: "~35 units / m²", usage: "Parking areas & heavy traffic roads" },
        { type: "Z-13 Pavers (130×130×60)", ratio: "~60 units / m²", usage: "Pedestrian pathways & garden terraces" },
      ]
    : [
        { type: "Briques 20x20x50", ratio: "10 unités / m²", usage: "Murs porteurs et façades extérieures" },
        { type: "Briques 15x20x50", ratio: "10 unités / m²", usage: "Murs de séparation et clôtures" },
        { type: "Briques 12 & 10 Creuses", ratio: "10 unités / m²", usage: "Cloisons légères et doublages" },
        { type: "Hourdis 15 Français", ratio: "~8 unités / m²", usage: "Planchers d'étage standard" },
        { type: "Pavés Z-7 (240×240×60)", ratio: "~35 unités / m²", usage: "Parkings et voiries carrossables" },
        { type: "Pavés Z-13 (130×130×60)", ratio: "~60 unités / m²", usage: "Allées piétonnes et terrasses" },
      ];

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Premium */}
      <section className="bg-brand-gradient text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-[#FFD700] hover:text-yellow-300 text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
          >
            <span>←</span> {isEn ? "Back to home" : "Retour à l'accueil"}
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
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                {isEn ? "🛠️ Free Tools for Builders" : "🛠️ Outils Gratuits pour les Bâtisseurs"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "2CGC Daloa Engineering & Ratios" : "Ingénierie & Ratios 2CGC Daloa"}
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {isEn ? (
              <>
                Online Construction <br />
                <span className="text-gradient">Calculators &amp; Estimators</span>
              </>
            ) : (
              <>
                Calculateurs &amp; Estimateurs <br />
                <span className="text-gradient">de Chantier en Ligne</span>
              </>
            )}
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-3xl leading-relaxed">
            {isEn
              ? "Avoid costly surplus and inventory shortages. Our simulators integrate Ivorian construction standards to give you reliable estimates in a few clicks."
              : "Évitez les surplus coûteux et les ruptures d'approvisionnement. Nos simulateurs intègrent les standards constructifs ivoiriens pour vous donner des estimations fiables en quelques clics."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Les 2 Outils Phares */}
        <section className="grid md:grid-cols-2 gap-8">
          {calculateurs.map((calc) => (
            <div
              key={calc.id}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#002B5B]/10 border border-[#002B5B]/15 group-hover:bg-[#FFD700]/25 group-hover:border-[#FFD700]/50 flex items-center justify-center text-4xl transition-all backdrop-blur-sm">
                    {calc.icone}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#002B5B]/10 border border-[#002B5B]/15 text-[#002B5B] backdrop-blur-sm">
                    {calc.badge}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-[#002B5B] mb-3 transition-colors">
                  {calc.titre}
                </h2>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {calc.description}
                </p>

                <div className="space-y-2.5 mb-8">
                  {calc.caracteristiques.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={calc.lien}
                className="w-full bg-[#002B5B] group-hover:bg-[#FFD700] text-white group-hover:text-[#002B5B] py-4 rounded-2xl font-black text-sm text-center transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
              >
                <span>🚀</span> {isEn ? "Launch calculator" : "Lancer le calculateur"}
              </Link>
            </div>
          ))}
        </section>

        {/* Tableau des Ratios Pratiques de Référence */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Site Reference Cheat Sheet" : "Aide-Mémoire Chantier"}
            </span>
            <h3 className="text-2xl font-black text-[#002B5B] mt-2">
              {isEn ? "Average consumption ratios per m²" : "Ratios moyens de consommation par m²"}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              {isEn
                ? "Indicative benchmark values recommended by engineering consultancies for your preliminary sizing."
                : "Valeurs indicatives recommandées par les bureaux d'études pour vos pré-dimensionnements."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratiosPratiques.map((r, idx) => (
              <div key={idx} className="p-4 bg-[#F5F5F0] rounded-2xl border-l-4 border-[#002B5B]">
                <div className="font-bold text-sm text-[#002B5B]">{r.type}</div>
                <div className="text-xl font-black text-[#FFD700] my-1">{r.ratio}</div>
                <div className="text-[11px] text-gray-500">{r.usage}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Vers Devis */}
        <section className="bg-gradient-to-r from-[#002B5B] to-[#003d80] rounded-3xl p-8 sm:p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-2xl font-black text-white mb-2">
              {isEn ? "Already know your quantities?" : "Vous connaissez déjà vos quantités ?"}
            </h4>
            <p className="text-white/70 text-sm max-w-lg">
              {isEn
                ? "Go directly to our quotation configurator to receive an official quote with 18% VAT and instant PDF download."
                : "Accédez directement à notre configurateur de devis pour obtenir un chiffrage officiel avec TVA (18%) et téléchargement PDF immédiat."}
            </p>
          </div>
          <Link
            href={`/${lang}/devis`}
            className="flex-shrink-0 bg-gold-gradient text-[#002B5B] px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-[#FFD700]/30 transition-all"
          >
            {isEn ? "🧮 Configure my quote" : "🧮 Configurer mon devis"}
          </Link>
        </section>
      </div>
    </main>
  );
}
