"use client";

import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface QuiSommesNousClientProps {
  lang: Locale;
}

export default function QuiSommesNousClient({ lang }: QuiSommesNousClientProps) {
  const isEn = lang === "en";

  const piliers = [
    {
      icone: "🏭",
      titre: isEn ? "Industrial Capacity" : "Capacité Industrielle",
      description: isEn
        ? "Automated production units in Daloa capable of churning out over 50,000 blocks and pavers per month to supply all construction sites."
        : "Unités de production automatisées à Daloa capables de débiter plus de 50 000 blocs et pavés par mois pour alimenter tous types de chantiers.",
    },
    {
      icone: "🔬",
      titre: isEn ? "Certified Formulation & Batching" : "Formulation & Dosage Certifiés",
      description: isEn
        ? "Exclusive use of high-performance CPJ cement and washed, screened aggregates ensuring flawless B50 and B60 compressive strengths."
        : "Utilisation exclusive de ciment haute performance CPJ et d'agrégats lavés et criblés pour garantir des résistances B50 et B60 irréprochables.",
    },
    {
      icone: "🚚",
      titre: isEn ? "Dedicated Construction Logistics" : "Logistique Dédiée Chantier",
      description: isEn
        ? "Integrated truck fleet with secure crane unloading and strict adherence to pouring and masonry schedules for all clients."
        : "Flotte intégrée de camions avec déchargement sécurisé et respect rigoureux des plannings de coulage et d'élévation de nos clients.",
    },
    {
      icone: "🤝",
      titre: isEn ? "Committed B2B Partner" : "Partenaire B2B Engagé",
      description: isEn
        ? "Tailored support for architects, structural engineers and developers with negotiated rates, official VAT invoicing and payment terms."
        : "Accompagnement personnalisé des architectes, ingénieurs et promoteurs avec tarifs négociés, facturation HT/TVA et facilités de paiement.",
    },
  ];

  const chiffres = [
    {
      valeur: "15+",
      label: isEn ? "Years of experience" : "Ans d'expérience",
      detail: isEn ? "Serving construction since 2010" : "Depuis 2010 dans le BTP",
    },
    {
      valeur: "50 000+",
      label: isEn ? "Units / month" : "Unités / mois",
      detail: isEn ? "Continuous production capacity" : "Capacité de production",
    },
    {
      valeur: "500+",
      label: isEn ? "Completed projects" : "Chantiers livrés",
      detail: isEn ? "In Daloa & Ivory Coast" : "À Daloa et en Côte d'Ivoire",
    },
    {
      valeur: "98%",
      label: isEn ? "Client satisfaction" : "Satisfaction client",
      detail: isEn ? "Renewed client trust" : "Confiance renouvelée",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Hero */}
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

          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
              <img
                src="/logo-2cgc.png"
                alt="Logo 2CGC"
                className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                🏢 Cheickna Construction &amp; Génie Civil
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Approved Construction Company • Daloa, Ivory Coast" : "Société BTP agréée • Daloa, Côte d'Ivoire"}
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {isEn ? "Concrete Excellence " : "L'Excellence du Béton "}
            <br />
            <span className="text-gradient">
              {isEn ? "empowering Ivorian Construction" : "au service du BTP ivoirien"}
            </span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-3xl leading-relaxed">
            {isEn ? (
              <>
                Built on rigorous engineering and trusted local presence, <strong>2CGC</strong> is a benchmark
                leader in precast concrete products and infrastructure solutions in Ivory Coast.
              </>
            ) : (
              <>
                Fondée sur des valeurs de rigueur technique et de proximité, <strong>2CGC</strong> est une référence
                incontournable dans la préfabrication d'éléments en béton et les travaux d'infrastructure en Côte d'Ivoire.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Bannière Chiffres Clés */}
      <section className="relative -mt-8 z-20 max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {chiffres.map((c, i) => (
            <div
              key={i}
              className="text-center lg:text-left border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 last:border-0"
            >
              <div className="text-3xl sm:text-4xl font-black text-[#002B5B] mb-1">{c.valeur}</div>
              <div className="text-sm font-bold text-gray-800">{c.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Corps de page */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Histoire & Vision */}
        <section className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Our Journey" : "Notre Trajectoire"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight">
              {isEn
                ? "Building sustainably with materials meeting international standards"
                : "Bâtir durablement avec des matériaux conformes aux normes internationales"}
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              {isEn ? (
                <>
                  Located in the heart of Daloa in the Commercial District, <strong>2CGC (Cheickna Construction &amp; Génie Civil)</strong> has
                  become the trusted industrial partner for builders throughout Haut-Sassandra and across Ivory Coast.
                </>
              ) : (
                <>
                  Implantée au cœur de Daloa dans le Quartier Commerce, <strong>2CGC (Cheickna Construction &amp; Génie Civil)</strong> s'est
                  imposée comme le partenaire industriel de confiance des bâtisseurs de la région du Haut-Sassandra et de l'ensemble de la Côte d'Ivoire.
                </>
              )}
            </p>
            <p className="text-gray-600 leading-relaxed text-base">
              {isEn ? (
                <>
                  Tackling modern construction challenges — structural strength, crisp edges, durability over time —,
                  we invested in high-pressure automated hydraulic presses ensuring optimal concrete density, controlled curing and complete batch traceability.
                </>
              ) : (
                <>
                  Face aux défis des chantiers modernes — résistances structurelles, régularité des arêtes, tenue dans le temps —,
                  nous avons investi dans un outil de production moderne garantissant une compacité optimale du béton,
                  une cure contrôlée et une traçabilité totale sur chaque lot livré.
                </>
              )}
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href={`/${lang}/catalogue`}
                className="bg-[#002B5B] text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#FFD700] hover:text-[#002B5B] transition-all duration-300 shadow-md flex items-center gap-2"
              >
                <span>📦</span> {isEn ? "Explore our 24 products" : "Découvrir nos 24 produits"}
              </Link>
              <a
                href="/catalogue-produits-2cgc.pdf"
                download="Catalogue-2CGC-Produits-Officiel.pdf"
                className="border-2 border-gray-300 hover:border-[#002B5B] text-[#002B5B] px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <span>📥</span> {isEn ? "Download catalogue (PDF)" : "Télécharger le catalogue (PDF)"}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-[#002B5B] to-[#003d80] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-2xl" />
            <h3 className="text-xl font-black text-[#FFD700] mb-4">
              {isEn ? "Corporate & Official Information" : "Informations Juridiques & Officielles"}
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm text-white/80">
              <li className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-white/50">{isEn ? "Company name" : "Raison sociale"}</span>
                <strong className="text-white">2CGC SARL Unipersonnelle</strong>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-white/50">{isEn ? "Share capital" : "Capital social"}</span>
                <strong className="text-[#FFD700]">1 000 000 FCFA</strong>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-white/50">RCCM</span>
                <strong className="text-white">CI DAL 2013 B. 20779</strong>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-white/50">{isEn ? "Tax Account ID (CC)" : "Compte Contribuable (CC)"}</span>
                <strong className="text-white">N° 8104005 C</strong>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2.5">
                <span className="text-white/50">{isEn ? "Tax regime" : "Régime fiscal"}</span>
                <strong className="text-white">Réel Simplifié (Daloa 2)</strong>
              </li>
              <li className="flex justify-between pt-1">
                <span className="text-white/50">{isEn ? "Banking partner" : "Partenaire bancaire"}</span>
                <strong className="text-white">BSIC Daloa</strong>
              </li>
            </ul>
          </div>
        </section>

        {/* 4 Piliers d'Excellence */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Industrial Know-How" : "Savoir-Faire Industriel"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn ? "Why professionals choose 2CGC" : "Pourquoi les professionnels choisissent 2CGC"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {piliers.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#002B5B]/5 group-hover:bg-[#FFD700] flex items-center justify-center text-3xl mb-5 transition-colors">
                  {p.icone}
                </div>
                <h3 className="text-xl font-black text-[#002B5B] mb-2">{p.titre}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Direction Générale Exécutive */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-lg space-y-8">
          <div>
            <span className="text-xs font-black text-[#002B5B] uppercase tracking-widest bg-[#002B5B]/5 px-3 py-1.5 rounded-full">
              {isEn ? "Leadership" : "Gouvernance"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002B5B] tracking-tight mt-3">
              {isEn ? "Executive Management" : "La Direction Générale"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isEn
                ? "Dedicated leaders on the ground alongside building professionals."
                : "Des dirigeants engagés sur le terrain aux côtés des bâtisseurs."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Dirigeant 1 : KEITA BOUBACAR */}
            <div className="bg-gradient-to-br from-[#002B5B] to-[#003d80] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD700] text-[#002B5B] font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  KB
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">KEITA BOUBACAR</h3>
                  <div className="text-xs text-[#FFD700] font-black uppercase tracking-widest mt-1 mb-4">
                    {isEn ? "Managing Director (CEO)" : "Directeur Général (D.G)"}
                  </div>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
                    {isEn
                      ? "Strategic supervision of operations, industrial steering of production units and major construction client relations."
                      : "Supervision stratégique des opérations, pilotage industriel des unités de production et relations grands comptes BTP."}
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                    <a
                      href="tel:+2250707621799"
                      className="inline-flex items-center gap-1.5 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm"
                    >
                      <span>📞</span> 07 07 62 17 99
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Dirigeant 2 : Keita Dambou */}
            <div className="bg-[#F5F5F0] rounded-3xl p-8 border-2 border-gray-200 text-[#002B5B] relative overflow-hidden">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#002B5B] text-white font-black text-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  KD
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#002B5B] leading-tight">Keita Dambou</h3>
                  <div className="text-xs text-gray-500 font-black uppercase tracking-widest mt-1 mb-4">
                    {isEn ? "Operations & Procurement" : "Direction"}
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                    {isEn
                      ? "Logistics coordination, raw materials procurement, quality control and customer account administration."
                      : "Coordination logistique, approvisionnement des matières premières, contrôle qualité et suivi administratif de la clientèle."}
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href="https://wa.me/2250707857629?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                    <a
                      href="tel:+2250707857629"
                      className="inline-flex items-center gap-1.5 bg-[#002B5B] hover:bg-[#003d80] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>📞</span> 07 07 85 76 29
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Siège Social & Coordonnées */}
        <section className="bg-gradient-to-r from-[#002B5B] to-[#003d80] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest">
                📍 {isEn ? "Headquarters & Daloa Plant" : "Siège & Usine de Daloa"}
              </span>
              <h2 className="text-3xl font-black text-white">
                {isEn ? "Meet us or visit our manufacturing plant" : "Venez nous rencontrer ou visitez notre usine"}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                {isEn
                  ? "Located in Daloa's Commercial Activity Zone (Quartier Commerce), our facility welcomes contractors, engineers and private developers Monday through Saturday to formulate quotations and schedule deliveries."
                  : "Situé dans la Zone d'Activité Professionnelle de Daloa (Quartier Commerce), notre site accueille les entrepreneurs, maîtres d'ouvrage et particuliers du lundi au samedi pour élaborer vos devis et organiser vos livraisons."}
              </p>
              <div className="pt-2 text-sm text-white/90 space-y-1.5">
                <div>
                  📍 <strong>Quartier Commerce</strong>{" "}
                  {isEn ? "(near Pharmacie Appaul)" : "(non loin de la Pharmacie Appaul)"}, BP 129 Daloa
                </div>
                <div>
                  📞 {isEn ? "Phones:" : "Téléphones :"} <strong>+225 07 07 62 17 99</strong> /{" "}
                  <strong>+225 07 07 85 76 29</strong>
                </div>
                <div>
                  📧{" "}
                  <a href="mailto:cheicknaconstruction@gmail.com" className="text-[#FFD700] underline">
                    cheicknaconstruction@gmail.com
                  </a>
                </div>
                <div className="text-xs text-white/60 pt-1">
                  SARL Unipersonnel • Capital: 1.000.000 FCFA • RCCM: CI DAL 2013 B. 20779 • CC N°: 8104005 C
                </div>
                <div>
                  🕐 {isEn ? "Monday to Saturday:" : "Du Lundi au Samedi :"} <strong>7:00 AM – 6:00 PM</strong>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4 text-center lg:text-left">
              <div className="text-lg font-bold text-white">
                {isEn ? "Need an instant quotation?" : "Besoin d'un devis immédiat ?"}
              </div>
              <p className="text-white/70 text-xs">
                {isEn
                  ? "Use our online configurator to calculate your needs for blocks, beams and pavers with official 18% VAT included."
                  : "Utilisez notre configurateur en ligne pour chiffrer vos besoins en briques, hourdis et pavés avec TVA 18% incluse."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/${lang}/devis`}
                  className="flex-1 bg-gold-gradient text-[#002B5B] py-3 px-5 rounded-xl font-black text-sm text-center shadow-lg hover:shadow-yellow-400/30 transition-all"
                >
                  🧮 {isEn ? "Configure Quote" : "Configurer mon devis"}
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="flex-1 border border-white/40 hover:bg-white/10 text-white py-3 px-5 rounded-xl font-bold text-sm text-center transition-colors"
                >
                  ✉️ {isEn ? "Contact Form" : "Formulaire de contact"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
