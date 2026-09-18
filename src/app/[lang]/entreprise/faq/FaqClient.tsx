"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";

interface FaqClientProps {
  lang: Locale;
}

export default function FaqClient({ lang }: FaqClientProps) {
  const isEn = lang === "en";
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filtreCat, setFiltreCat] = useState<string>("toutes");

  const categories = [
    { id: "toutes", label: isEn ? "All questions" : "Toutes les questions", icon: "🔍" },
    { id: "produits", label: isEn ? "Products & Standards" : "Produits & Normes", icon: "🧱" },
    { id: "devis", label: isEn ? "Quotes & Orders" : "Devis & Commandes", icon: "🧮" },
    { id: "livraison", label: isEn ? "Delivery & Site" : "Livraison & Chantier", icon: "🚚" },
    { id: "paiement", label: isEn ? "Payment & B2B" : "Paiement & B2B", icon: "💳" },
  ];

  const questions = [
    {
      cat: "livraison",
      q: isEn
        ? "What are the delivery lead times to construction sites?"
        : "Quels sont les délais de livraison sur chantier ?",
      a: isEn
        ? "Our deliveries are fulfilled within 48 to 72 business hours after order confirmation. For sites located in Daloa and its immediate surroundings, express departures under 24 hours can be scheduled depending on available factory inventory."
        : "Nos livraisons sont assurées sous 48 à 72 heures ouvrées après confirmation de votre commande. Pour les chantiers situés à Daloa et ses environs immédiats, des départs express sous 24h peuvent être programmés selon le volume disponible en usine.",
    },
    {
      cat: "produits",
      q: isEn
        ? "What is the mechanical strength of 2CGC concrete blocks?"
        : "Quelle est la résistance mécanique des briques et agglos 2CGC ?",
      a: isEn
        ? "Our solid 20x20x50 and 15x20x50 blocks feature certified B60 (60 bar) compressive strength, perfectly suited for load-bearing walls and multi-story buildings. Our hollow blocks are tested to the B50 standard for partitions and standard wall elevation."
        : "Nos briques pleines 20x20x50 et 15x20x50 bénéficient d'une résistance à la compression certifiée B60 (60 bars), convenant parfaitement aux murs porteurs et structures R+1, R+2 et plus. Nos briques creuses sont testées à la norme B50 pour les cloisons et élévations standard.",
    },
    {
      cat: "devis",
      q: isEn
        ? "How to get an official proforma quote and download it as PDF?"
        : "Comment obtenir un devis officiel et le télécharger en PDF ?",
      a: isEn
        ? "You can use our online quotation configurator by selecting your products and quantities: the pre-tax amount, VAT (18%) and total TTC are calculated instantly. You can then download your official PDF invoice or send it directly via WhatsApp to our directors."
        : "Vous pouvez utiliser notre configurateur de devis en ligne en sélectionnant vos produits et quantités : le montant HT, la TVA (18%) et le total TTC sont calculés instantanément, et vous pouvez télécharger votre devis PDF officiel ou le transmettre directement sur WhatsApp à nos dirigeants.",
    },
    {
      cat: "produits",
      q: isEn
        ? "What is the difference between French and American type floor beams (hourdis)?"
        : "Quelle est la différence entre les hourdis français et américains ?",
      a: isEn
        ? "French-type floor beams (12 cm and 15 cm heights) feature a traditional straight-void profile designed for standard floor joists. American-type beams (16 cm and 20 cm) offer thicker sections for longer spans and heavier floor loads."
        : "Les hourdis type français (hauteurs 12 cm et 15 cm) possèdent un profil traditionnel à alvéoles droites adapté aux poutrelles standard. Les hourdis type américain (16 cm et 20 cm) offrent des sections plus épaisses pour planchers à plus grande portée et charges lourdes.",
    },
    {
      cat: "livraison",
      q: isEn
        ? "Do you deliver outside Daloa and nationwide across Ivory Coast?"
        : "Livrez-vous en dehors de Daloa et à l'intérieur du pays ?",
      a: isEn
        ? "Yes, our dedicated fleet supplies the entire Haut-Sassandra region (Issia, Vavoua, Zoukougbeu) as well as major axes towards Yamoussoukro, Bouaké, San Pedro and Abidjan. Transport costs are calculated accurately based on distance and volume."
        : "Oui, notre flotte approvisionne l'ensemble de la région du Haut-Sassandra (Issia, Vavoua, Zoukougbeu) ainsi que les grands axes vers Yamoussoukro, Bouaké, San Pedro et Abidjan. Les frais de transport sont calculés au plus juste selon la distance kilométrique et le cubage.",
    },
    {
      cat: "paiement",
      q: isEn
        ? "What payment methods are accepted?"
        : "Quels sont les moyens de paiement acceptés ?",
      a: isEn
        ? "We accept bank transfers to our official BSIC Daloa account (RIB: CI154 08521 029041500015 04), certified corporate checks payable to 2CGC SARL, and on-site payments. Registered B2B clients can agree on milestone-based credit terms."
        : "Nous acceptons les virements bancaires sur notre compte officiel BSIC Daloa (RIB : CI154 08521 029041500015 04), les chèques certifiés d'entreprises à l'ordre de 2CGC SARL, ainsi que les règlements en agence. Les professionnels enregistrés en compte B2B peuvent convenir d'échéances adaptées.",
    },
    {
      cat: "paiement",
      q: isEn
        ? "Do your invoices include deductible VAT?"
        : "Les factures comportent-elles la TVA déductible ?",
      a: isEn
        ? "Absolutely. 2CGC is registered under the 'Réel Simplifié' tax regime (Daloa 2 Tax Center, Tax ID N° 8104005 C). All our invoices state the official 18% VAT recoverable by construction companies."
        : "Absolument. 2CGC est une SARL enregistrée sous le régime fiscal du Réel Simplifié (Centre des Impôts de Daloa 2, Compte Contribuable N° 8104005 C). Toutes nos factures mentionnent la TVA légale de 18% récupérable par les entreprises de BTP.",
    },
    {
      cat: "devis",
      q: isEn
        ? "Do you sell to private homeowners or exclusively to businesses?"
        : "Vendez-vous aux particuliers ou uniquement aux entreprises ?",
      a: isEn
        ? "We welcome private individuals building their private residences as warmly as commercial contractors and property developers. Regardless of order volume, you benefit from the same guaranteed industrial concrete quality."
        : "Nous accueillons aussi bien les particuliers construisant leur maison individuelle que les entreprises de BTP et promoteurs. Quel que soit le volume, vous bénéficiez de la même qualité industrielle garantie.",
    },
  ];

  const questionsFiltrees =
    filtreCat === "toutes" ? questions : questions.filter((q) => q.cat === filtreCat);

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Premium */}
      <section className="bg-brand-gradient text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
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
                💬 {isEn ? "Frequently Asked Questions" : "Foire Aux Questions"}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                {isEn ? "Site Assistance • 2CGC CHEICKNA Daloa" : "Assistance Chantier • 2CGC CHEICKNA Daloa"}
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {isEn ? "All the Answers " : "Toutes les Réponses "}
            <br />
            <span className="text-gradient">
              {isEn ? "to your Technical Questions" : "à vos Questions Techniques"}
            </span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-2xl leading-relaxed">
            {isEn
              ? "Lead times, concrete compliance, transport modes and price terms: discover here all practical insights to plan your construction project with peace of mind."
              : "Délais, conformité des bétons, modes de livraison et conditions tarifaires : retrouvez ici les détails pratiques pour planifier sereinement votre chantier."}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Filtres par catégorie */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFiltreCat(cat.id);
                setOpenIndex(null);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                filtreCat === cat.id
                  ? "bg-[#002B5B] text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Liste Accordéon */}
        <div className="space-y-4">
          {questionsFiltrees.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <span className="font-black text-[#002B5B] text-base sm:text-lg leading-snug">
                    {item.q}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "bg-[#FFD700] text-[#002B5B] rotate-180" : "bg-[#F5F5F0] text-gray-500"
                    }`}
                  >
                    ▼
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-7 pt-2 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-50">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bandeau d'assistance personnalisé */}
        <section className="bg-gradient-to-br from-[#002B5B] to-[#003d80] rounded-3xl p-8 sm:p-10 text-white shadow-2xl text-center sm:text-left relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest">
                {isEn ? "A specific question?" : "Une question spécifique ?"}
              </span>
              <h3 className="text-2xl font-black text-white">
                {isEn
                  ? "Our advisors and directors answer you directly"
                  : "Nos conseillers et dirigeants vous répondent en direct"}
              </h3>
              <p className="text-white/70 text-sm max-w-xl">
                {isEn
                  ? "For custom mix designs, high-volume bids or emergency delivery in Daloa."
                  : "Pour une demande de formulation spéciale, un devis d'envergure ou une livraison urgente à Daloa."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
              <a
                href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <span>💬</span> WhatsApp Direct
              </a>
              <Link
                href={`/${lang}/contact`}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
              >
                <span>✉️</span> {isEn ? "Contact Form" : "Formulaire Contact"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
