"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";
import { FAQ_ITEMS, FAQ_CATEGORIES } from "@/lib/faq-data";
import Breadcrumb from "@/components/Breadcrumb";

interface FaqClientProps {
  lang: Locale;
}

export default function FaqClient({ lang }: FaqClientProps) {
  const isEn = lang === "en";
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filtreCat, setFiltreCat] = useState<string>("toutes");

  const questionsFiltrees =
    filtreCat === "toutes"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((q) => q.cat === filtreCat);

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      <Breadcrumb
        lang={lang}
        items={[
          {
            label: isEn ? "Company" : "L'Entreprise",
            href: `/${lang}/entreprise/qui-sommes-nous`,
          },
          { label: isEn ? "FAQ" : "Foire Aux Questions" },
        ]}
      />
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
          {FAQ_CATEGORIES.map((cat) => (
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
              <span>{cat.label[lang]}</span>
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
                    {item.q[lang]}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all duration-300 ${
                      isOpen ? "bg-[#FFD700]/25 border border-[#FFD700]/50 text-[#002B5B] rotate-180 backdrop-blur-sm" : "bg-[#002B5B]/10 border border-[#002B5B]/15 text-[#002B5B] backdrop-blur-sm"
                    }`}
                  >
                    ▼
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-7 pt-2 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-50">
                    <p>{item.a[lang]}</p>
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
