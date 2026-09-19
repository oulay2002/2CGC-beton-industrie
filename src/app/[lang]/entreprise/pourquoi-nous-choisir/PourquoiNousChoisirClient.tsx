"use client";

import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface PourquoiNousChoisirClientProps {
  lang: Locale;
}

export default function PourquoiNousChoisirClient({ lang }: PourquoiNousChoisirClientProps) {
  const isEn = lang === "en";

  const atoutsTechniques = [
    {
      icone: "💎",
      titre: isEn ? "Mechanical Resistance B60 & B50" : "Résistance Mécanique B60 & B50",
      description: isEn
        ? "Our concrete products achieve certified compressive strengths up to 60 bars (B60), ensuring the safety of load-bearing structures even for multi-story buildings."
        : "Nos bétons atteignent des résistances à la compression certifiées jusqu'à 60 bars (B60), garantissant la sécurité des structures porteuses même en R+3 et plus.",
      tag: isEn ? "BTP Standard" : "Norme BTP",
    },
    {
      icone: "⚙️",
      titre: isEn ? "High-Pressure Hydraulic Press" : "Presse Industrielle Haute Pression",
      description: isEn
        ? "Robotic hydraulic compaction eliminating air pockets and microcracks. Razor-sharp, regular edges save significant time and mortar during wall elevation."
        : "Compactage hydraulique robotisé éliminant les poches d'air et les microfissures. Les arêtes sont parfaitement nettes et régulières pour un gain de temps au montage.",
      tag: isEn ? "Technology" : "Technologie",
    },
    {
      icone: "🧪",
      titre: isEn ? "Selected & Screened Aggregates" : "Agrégats Sélectionnés & Tamisés",
      description: isEn
        ? "Washed river sand and calibrated gravels free of organic matter. Optimized batching formulation with high-grade CPJ 42.5 Portland cement."
        : "Sables de rivière lavés et graviers calibrés sans matières organiques. Formulation optimisée avec ciment Portland de haute qualité CPJ 42.5.",
      tag: isEn ? "Raw Materials" : "Matières premières",
    },
    {
      icone: "⏱️",
      titre: isEn ? "Controlled Curing & Drying" : "Cure & Séchage Contrôlés",
      description: isEn
        ? "Sheltered watering and maturation process preventing rapid desiccation under the Ivorian tropical climate and maximizing ultimate structural strength."
        : "Processus d'arrosage et de maturation sous abri pour éviter la dessiccation rapide sous le climat ivoirien et maximiser la résistance finale du matériau.",
      tag: isEn ? "Continuous Quality" : "Qualité continue",
    },
    {
      icone: "🚚",
      titre: isEn ? "Turnkey Site Delivery" : "Livraison Chantier Clé en Main",
      description: isEn
        ? "Operational truck fleet 6 days a week delivering directly to construction sites in Daloa and across Ivory Coast with careful crane unloading."
        : "Flotte de camions opérationnelle 6j/7 pour livrer directement sur vos chantiers à Daloa et dans toutes les régions de Côte d'Ivoire avec déchargement soigné.",
      tag: isEn ? "Logistics" : "Logistique",
    },
    {
      icone: "📄",
      titre: isEn ? "Tax Compliance & 18% VAT" : "Transparence Fiscale & TVA 18%",
      description: isEn
        ? "Company officially registered in the Daloa RCCM, providing valid proformas and invoices with 18% VAT for easy accounting recovery by construction firms."
        : "Entreprise enregistrée au RCCM de Daloa, factures en règle avec mention de la TVA à 18% pour la récupération comptable des entreprises de BTP.",
      tag: isEn ? "Legal Compliance" : "Conformité légale",
    },
  ];

  const comparatif = [
    {
      critere: isEn ? "Compressive strength" : "Résistance à la compression",
      cgc: isEn ? "B50 to B60 certified in laboratory" : "B50 à B60 certifiée en laboratoire",
      artisanal: isEn ? "Random (often < B25), high crumbling risk" : "Aléatoire (souvent < B25), risque d'effritement",
    },
    {
      critere: isEn ? "Dimensional regularity" : "Régularité des dimensions",
      cgc: isEn ? "Millimetric tolerance (sharp straight edges)" : "Tolérance millimétrique (arêtes vives et rectilignes)",
      artisanal: isEn ? "Frequent irregularities (excess mortar consumption)" : "Irrégularités fréquentes (surconsommation de mortier)",
    },
    {
      critere: isEn ? "Sand quality & cement dosage" : "Qualité du sable & dosage ciment",
      cgc: isEn ? "Electronic scale batching control" : "Dosage contrôlé par pesage électronique",
      artisanal: isEn ? "Manual shovel dosing without precision" : "Dosage à la pelle sans contrôle précis",
    },
    {
      critere: isEn ? "Production capacity" : "Capacité de production",
      cgc: isEn ? "+50,000 units/month with permanent stock" : "+50 000 unités/mois avec stock permanent",
      artisanal: isEn ? "Slow manual output (uncertain delays)" : "Production manuelle lente (délais incertains)",
    },
    {
      critere: isEn ? "Order tracking & delivery" : "Suivi de commande & livraison",
      cgc: isEn ? "Dedicated fleet, tracking and official slip" : "Flotte dédiée, tracking et bordereau officiel",
      artisanal: isEn ? "Informal transport at customer's expense" : "Transport informel à la charge du client",
    },
    {
      critere: isEn ? "Invoicing & Legal compliance" : "Facturation & Conformité",
      cgc: isEn ? "Delivery slips + Invoices with 18% VAT" : "Bons de livraison + Factures avec TVA 18%",
      artisanal: isEn ? "Informal receipts without tax validity" : "Reçus informels sans valeur fiscale",
    },
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
                ⭐ {isEn ? "Competitive Advantages" : "Les Avantages Compétitifs"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Industrial Standards • Daloa Plant" : "Normes Industrielles • Usine de Daloa"}
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {isEn ? "Why Entrust Your Construction Sites " : "Pourquoi Confier vos Chantiers "}
            <br />
            <span className="text-gradient">
              {isEn ? "to 2CGC CHEICKNA?" : "à 2CGC CHEICKNA ?"}
            </span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-3xl leading-relaxed">
            {isEn
              ? "In construction, the quality of precast elements dictates building longevity. Discover how our industrial standards safeguard your investments and accelerate execution."
              : "Dans la construction, la qualité du matériau préfabriqué détermine la longévité de l'ouvrage. Découvrez comment notre rigueur industrielle protège vos investissements et accélère vos réalisations."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* Grille des 6 atouts majeurs */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Industrial Rigor" : "Exigence Industrielle"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn ? "6 Guaranteed Performance Pillars" : "6 piliers de performance garantis"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atoutsTechniques.map((atout, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 bg-[#002B5B]/10 border border-[#002B5B]/15 group-hover:bg-[#FFD700]/25 group-hover:border-[#FFD700]/50 rounded-2xl flex items-center justify-center text-3xl transition-all backdrop-blur-sm">
                      {atout.icone}
                    </div>
                    <span className="text-[11px] font-bold text-[#002B5B] bg-[#002B5B]/10 border border-[#002B5B]/15 px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      {atout.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#002B5B] mb-3 leading-snug">{atout.titre}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{atout.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tableau comparatif exclusif */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl overflow-hidden space-y-6">
          <div className="border-b border-gray-100 pb-6">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Objective Comparison" : "Comparatif Objectif"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn
                ? "2CGC vs. Conventional Roadside Artisanal Blocks"
                : "2CGC face à la fabrication artisanale de bord de route"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isEn
                ? "Why the apparent discount on artisanal blocks costs more in reality (excess mortar, breakage, and wall cracking)."
                : "Pourquoi l'économie apparente de briques artisanales coûte plus cher en réalité (surconsommation de ciment de ragréage, casse et fissures)."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100 text-xs font-black uppercase tracking-wider">
                  <th className="py-4 px-4 text-gray-500 w-1/3">
                    {isEn ? "Selection Criterion" : "Critère de sélection"}
                  </th>
                  <th className="py-4 px-4 text-[#002B5B] bg-[#FFD700]/10 rounded-t-xl w-1/3">
                    <span className="flex items-center gap-1.5 text-sm font-black">
                      <span>🏆</span> {isEn ? "2CGC Industrial Production" : "Production Industrielle 2CGC"}
                    </span>
                  </th>
                  <th className="py-4 px-4 text-gray-400 w-1/3">
                    {isEn ? "Standard Artisanal Blocks" : "Fabrication artisanale classique"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparatif.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#002B5B]">{item.critere}</td>
                    <td className="py-4 px-4 font-semibold text-emerald-800 bg-[#FFD700]/5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span> {item.cgc}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-red-400">✗</span> {item.artisanal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA Devis & Contact */}
        <section className="bg-gradient-to-r from-[#002B5B] to-[#003d80] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center sm:text-left">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest">
                {isEn ? "Next Step" : "Passez à l'étape suivante"}
              </span>
              <h2 className="text-3xl font-black text-white">
                {isEn
                  ? "Ready to secure the supply for your construction site?"
                  : "Prêt à sécuriser l'approvisionnement de votre chantier ?"}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                {isEn
                  ? "Get an immediate online estimate with our quote configurator or contact our management directly."
                  : "Obtenez une estimation immédiate avec notre configurateur en ligne ou contactez directement nos dirigeants."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
              <Link
                href={`/${lang}/devis`}
                className="bg-gold-gradient text-[#002B5B] px-8 py-4 rounded-2xl font-black text-sm text-center shadow-xl hover:shadow-[#FFD700]/30 hover:-translate-y-0.5 transition-all"
              >
                🧮 {isEn ? "Get my online quotation" : "Obtenir mon devis en ligne"}
              </Link>
              <Link
                href={`/${lang}/contact`}
                className="border-2 border-white/30 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold text-sm text-center transition-colors"
              >
                📞 {isEn ? "Contact our team" : "Contacter nos équipes"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
