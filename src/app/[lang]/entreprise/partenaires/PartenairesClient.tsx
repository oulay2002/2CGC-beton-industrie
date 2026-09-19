"use client";

import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface PartenairesClientProps {
  lang: Locale;
}

export default function PartenairesClient({ lang }: PartenairesClientProps) {
  const isEn = lang === "en";

  const categoriesPartenaires = [
    {
      titre: isEn
        ? "General Contractors & Real Estate Developers"
        : "Entreprises Générales de BTP & Promoteurs",
      description: isEn
        ? "They entrust us with the continuous supply of blocks and beams for their residential, commercial and industrial programs."
        : "Ils nous confient l'approvisionnement continu en briques et hourdis de leurs programmes résidentiels, tertiaires et industriels.",
      icone: "🏗️",
      exemples: [
        {
          nom: isEn
            ? "General Construction Contractors (Daloa & Region)"
            : "Entreprises Générales de Construction (Daloa & Région)",
          role: isEn ? "Structural works & masonry" : "Gros-œuvre & élévation",
        },
        {
          nom: isEn ? "Residential Property Developers" : "Promoteurs Immobiliers Résidentiels",
          role: isEn ? "Villas & housing communities" : "Villas & cités dortoirs",
        },
        {
          nom: isEn ? "Professional Masons & Craftsmen" : "Artisans & Maçons Professionnels",
          role: isEn ? "Landscaping & perimeter walls" : "Aménagements & clôtures sécurisées",
        },
      ],
    },
    {
      titre: isEn ? "Architects & Technical Control Bureaus" : "Architectes & Bureaux de Contrôle",
      description: isEn
        ? "Prescription of our technical data sheets, verification of B50/B60 compressive strengths and compliance with Ivorian standards."
        : "Prescription de nos fiches techniques, vérification des résistances B50/B60 et respect des normes ivoiriennes.",
      icone: "📐",
      exemples: [
        {
          nom: isEn
            ? "Architecture & Project Management Firms"
            : "Cabinets d'Architecture & de Maîtrise d'Œuvre",
          role: isEn ? "Prescription & structural sizing" : "Prescription & dimensionnement",
        },
        {
          nom: isEn ? "Technical Engineering Consultancies" : "Bureaux d'Études Techniques (BET)",
          role: isEn ? "Structural calculations & load paths" : "Calculs de charge & structures",
        },
        {
          nom: isEn ? "Building Quality Control Laboratories" : "Laboratoires de Contrôle du Bâtiment",
          role: isEn ? "Compression testing & compliance" : "Essais de compression & conformité",
        },
      ],
    },
    {
      titre: isEn ? "Certified Raw Material Suppliers" : "Fournisseurs de Matières Premières Certifiées",
      description: isEn
        ? "A rigorous supply chain of high-performance Portland cement and washed river aggregates for permanent consistency."
        : "Une chaîne d'approvisionnement stricte en ciment haute performance et agrégats lavés pour une constance absolue.",
      icone: "🧪",
      exemples: [
        {
          nom: isEn ? "Approved National Cement Plants" : "Cimenteries Nationales Agréées",
          role: "Ciment Portland CPJ 42.5",
        },
        {
          nom: isEn ? "Regional Crushed Aggregate Quarries" : "Carrières Régionales d'Agrégats Concassés",
          role: isEn ? "Gravel & washed river sands" : "Gravillons & sables de rivière lavés",
        },
        {
          nom: isEn ? "Pigment Manufacturers for Colored Pavers" : "Fabricants de Pigments pour Pavés Colorés",
          role: isEn ? "UV-resistant mineral oxides" : "Oxydes minéraux résistants aux UV",
        },
      ],
    },
    {
      titre: isEn ? "Banking & Institutional Partners" : "Partenaires Bancaires & Institutionnels",
      description: isEn
        ? "Financial strength and strict accounting transparency serving our corporate clients and transactions."
        : "Solidité financière et transparence comptable au service de nos clients et de nos transactions.",
      icone: "🏛️",
      exemples: [
        {
          nom: "BSIC Côte d'Ivoire — Agence Daloa",
          role: isEn ? "Official financial banking partner" : "Partenaire financier officiel",
        },
        {
          nom: "Centre des Impôts de Daloa 2",
          role: "Régime Réel Simplifié - CC N° 8104005 C",
        },
        {
          nom: isEn ? "Regional Chamber of Commerce & Industry" : "Chambre de Commerce & d'Industrie",
          role: isEn ? "Regional economic network" : "Réseau économique régional",
        },
      ],
    },
  ];

  const avantagesPartenaire = [
    {
      titre: isEn ? "B2B Preferential Rates" : "Conditions Tarifaires B2B",
      detail: isEn
        ? "Direct tiered volume discounts and tailored rate cards for licensed construction professionals."
        : "Remises quantitatives immédiates et barèmes dédiés pour les professionnels du bâtiment.",
    },
    {
      titre: isEn ? "Priority Delivery Slots" : "Livraisons Prioritaires",
      detail: isEn
        ? "Reserved production and delivery schedules to safeguard your workers' on-site productivity."
        : "Créneaux de livraison réservés pour ne jamais interrompre la cadence de vos ouvriers.",
    },
    {
      titre: isEn ? "Flexible Payment Terms" : "Facilités de Paiement",
      detail: isEn
        ? "Structured settlement options aligned with your project validation and progress milestones."
        : "Modalités de règlement adaptées aux étapes de vos situations de travaux.",
    },
    {
      titre: isEn ? "Technical Documentation" : "Support Technique & Fiches",
      detail: isEn
        ? "Delivery of compliance sheets and lab test certificates for your As-Built Records (DOE)."
        : "Remise des fiches de conformité pour constitution de vos dossiers d'ouvrage exécuté (DOE).",
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
                🤝 {isEn ? "Ecosystem & Trust" : "Écosystème & Confiance"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Professional Network • 2CGC CHEICKNA" : "Réseau Professionnel • 2CGC CHEICKNA"}
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {isEn ? "A Network of Partners " : "Un Réseau de Partenaires "}
            <br />
            <span className="text-gradient">
              {isEn ? "Committed to Building Ivory Coast" : "Engagés pour Bâtir la Côte d'Ivoire"}
            </span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-3xl leading-relaxed">
            {isEn ? (
              <>
                From quarry to finishing stages, <strong>2CGC</strong> collaborates with the best industry stakeholders:
                general contractors, architects, engineering consultants, and financial institutions.
              </>
            ) : (
              <>
                De la carrière au chantier de finition, <strong>2CGC</strong> collabore avec les meilleurs acteurs 
                du secteur : entreprises générales, architectes, prescripteurs et institutions financières.
              </>
            )}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Les 4 piliers du réseau */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Our Network" : "Notre Réseau"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn ? "A Complete Chain of Trust" : "Une chaîne de confiance complète"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {categoriesPartenaires.map((cat, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#002B5B]/10 border border-[#002B5B]/15 flex items-center justify-center text-3xl backdrop-blur-sm">
                    {cat.icone}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#002B5B] leading-tight">{cat.titre}</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{cat.description}</p>

                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  {cat.exemples.map((ex, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between text-xs sm:text-sm p-2.5 bg-[#F5F5F0] rounded-xl"
                    >
                      <strong className="text-[#002B5B] font-bold">{ex.nom}</strong>
                      <span className="text-gray-500 text-xs">{ex.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Avantages Programme Partenaires B2B */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xl space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "B2B Program" : "Programme B2B"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn
                ? "Join the 2CGC Professional Partner Program"
                : "Rejoignez le programme Partenaire Professionnel 2CGC"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {isEn
                ? "Whether you are a building contractor, developer or materials distributor, unlock exclusive corporate benefits."
                : "Que vous soyez entrepreneur du BTP, promoteur ou distributeur de matériaux, bénéficiez de privilèges exclusifs."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantagesPartenaire.map((av, idx) => (
              <div key={idx} className="p-6 bg-[#F5F5F0] rounded-2xl border-l-4 border-[#FFD700]">
                <div className="text-base font-black text-[#002B5B] mb-2">{av.titre}</div>
                <p className="text-gray-600 text-xs leading-relaxed">{av.detail}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100">
            <div>
              <div className="font-bold text-[#002B5B] text-base">
                {isEn ? "Do you have an active or upcoming construction site?" : "Vous avez un chantier en cours ou à venir ?"}
              </div>
              <div className="text-gray-500 text-xs">
                {isEn
                  ? "Create your business account in 1 minute or contact our sales team."
                  : "Créez votre compte professionnel en 1 minute ou contactez notre équipe commerciale."}
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
              <Link
                href={`/${lang}/inscription`}
                className="flex-1 sm:flex-initial bg-[#002B5B] text-white px-6 py-3.5 rounded-xl font-black text-sm text-center hover:bg-[#FFD700] hover:text-[#002B5B] transition-all"
              >
                👤 {isEn ? "Create B2B Account" : "Créer un compte B2B"}
              </Link>
              <Link
                href={`/${lang}/contact`}
                className="flex-1 sm:flex-initial border-2 border-gray-200 hover:border-[#002B5B] text-[#002B5B] px-6 py-3.5 rounded-xl font-bold text-sm text-center transition-colors"
              >
                📞 {isEn ? "Contact Us" : "Nous contacter"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
