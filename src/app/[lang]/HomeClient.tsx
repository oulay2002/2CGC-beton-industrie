"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import {
  ShieldCheck,
  Truck,
  Award,
  ArrowRight,
  Download,
  Eye,
  FileSpreadsheet,
  Boxes,
  Calculator,
  Timer,
  CheckCircle2,
  Building2,
  Clock,
  ThumbsUp,
  Gift,
  Star,
  Sparkles,
  PhoneCall,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomePageProps {
  lang: Locale;
  dict: Dictionary["home"];
}

// ─── Composant client ─────────────────────────────────────────────────────────

export default function HomeClient({ lang, dict }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = dict.heroSlides;

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [heroSlides.length]);

  // Compteurs animés avec IntersectionObserver
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll<HTMLElement>("[data-count]");
            counters.forEach((el) => {
              const target = parseInt(el.dataset.count || "0", 10);
              const duration = 1800;
              const step = target / (duration / 16);
              let current = 0;
              const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent =
                  Math.floor(current).toLocaleString(lang === "fr" ? "fr-FR" : "en-US") +
                  (el.dataset.suffix || "");
                if (current >= target) clearInterval(timer);
              }, 16);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [lang]);

  const STATS_ICONS = [Clock, Building2, Boxes, ThumbsUp];

  const STATS_DATA = [
    { value: 15, suffix: "+", ...dict.stats[0], icon: STATS_ICONS[0] },
    { value: 500, suffix: "+", ...dict.stats[1], icon: STATS_ICONS[1] },
    { value: 50000, suffix: "+", ...dict.stats[2], icon: STATS_ICONS[2] },
    { value: 98, suffix: "%", ...dict.stats[3], icon: STATS_ICONS[3] },
  ];

  const ENGAGEMENTS_HREFS = [
    `/${lang}/entreprise/pourquoi-nous-choisir`,
    `/${lang}/devis`,
    `/${lang}/catalogue`,
  ];

  const ENGAGEMENT_ICONS = [ShieldCheck, Truck, Award];

  const PRODUITS_COLORS = [
    {
      color: "from-blue-600 to-blue-800",
      accent: "#2563EB",
      tagColor: "bg-[#FFD700] text-[#002B5B]",
      spec: "Rc ≥ 4.0 MPa",
    },
    {
      color: "from-emerald-600 to-emerald-800",
      accent: "#059669",
      tagColor: "bg-emerald-600 text-white",
      spec: "Allègement plancher -35%",
    },
    {
      color: "from-amber-500 to-amber-700",
      accent: "#D97706",
      tagColor: "bg-[#002B5B] text-white",
      spec: "Haute résistance carrossable",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F5F0] overflow-x-hidden">
      {/* ========== HERO INDUSTRIEL PREMIUM ========== */}
      <section className="relative bg-[#001D3D] text-white pt-32 pb-24 px-4 md:px-6 overflow-hidden min-h-[92vh] flex items-center">
        {/* Background slider with smooth crossfade */}
        <div className="absolute inset-0 overflow-hidden">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out transform ${
                currentSlide === idx
                  ? "opacity-35 scale-105 filter blur-0"
                  : "opacity-0 scale-100 filter blur-sm pointer-events-none"
              }`}
              style={{
                backgroundImage: `url('${
                  idx === 0 ? "/images/hero-bg.jpg" : "/images/hero-livraison-agglos.jpg"
                }')`,
              }}
            />
          ))}
        </div>

        {/* Graduated lighting overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001D3D] via-[#002B5B]/85 to-[#002B5B]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-transparent to-transparent" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-24 right-16 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-16 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float-delay pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            {/* Trust Pill & Certification */}
            <div className="flex flex-wrap items-center gap-2.5 mb-7 animate-fade-in-up">
              <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img
                  src="/logo-2cgc.png"
                  alt="Logo 2CGC"
                  className="h-12 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(255,215,0,0.25)]"
                />
              </div>

              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#FFD700] tracking-wide">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>{heroSlides[currentSlide].tag}</span>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/30 text-white/90 text-xs px-3 py-1.5 rounded-full font-mono font-medium backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Normes UEMOA &bull; Rc &ge; 4.0 MPa</span>
              </div>
            </div>

            {/* H1 Principal */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.04] mb-6 tracking-tight">
              {dict.heroH1Line1}
              <span className="block text-gradient mt-1">{dict.heroH1Line2}</span>
              <span className="block text-lg sm:text-2xl md:text-3xl font-normal text-white/70 mt-3 tracking-normal">
                {dict.heroH1Line3}
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-white/75 mb-9 leading-relaxed max-w-2xl font-normal">
              {dict.heroDesc}
            </p>

            {/* Action Buttons - alignés sur une seule ligne */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-nowrap gap-3 mb-12">
              <Link
                href={`/${lang}/devis`}
                className="group relative bg-gold-gradient text-[#002B5B] px-5 sm:px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base hover:shadow-2xl hover:shadow-[#FFD700]/40 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden min-h-[50px] whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#002B5B] transition-transform group-hover:scale-110 shrink-0" />
                <span className="relative z-10 whitespace-nowrap">{dict.heroCTA1}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
              </Link>

              <Link
                href={`/${lang}/catalogue`}
                className="group border-2 border-white/20 text-white px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-sm sm:text-base hover:bg-white/10 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm min-h-[50px] whitespace-nowrap shrink-0"
              >
                <Boxes className="w-4 h-4 text-[#FFD700] opacity-80 shrink-0" />
                <span className="whitespace-nowrap">{dict.heroCTA2}</span>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform shrink-0" />
              </Link>

              <a
                href="/catalogue-produits-2cgc.pdf"
                download="Catalogue-2CGC-Produits-Officiel.pdf"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/15 text-[#FFD700] border border-[#FFD700]/40 px-4 sm:px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm backdrop-blur-sm transition-all duration-300 min-h-[50px] whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{dict.heroCTA3}</span>
              </a>
            </div>

            {/* Métriques Hero */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-7 border-t border-white/15">
              {dict.heroStats.map((s, i) => (
                <div key={i} className="text-left">
                  <div className="text-2xl sm:text-4xl font-black text-[#FFD700] font-mono">
                    {s.val}
                  </div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-1 leading-tight font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contrôles du Carrousel modernisés */}
        <div className="absolute bottom-6 right-6 z-20 hidden md:flex items-center gap-3 bg-[#001D3D]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl">
          <div className="flex items-center gap-1.5">
            {heroSlides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx ? "w-8 bg-[#FFD700]" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                title={slide.title}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/90 font-bold uppercase tracking-wider border-l border-white/20 pl-3">
            {currentSlide === 0 ? dict.heroSlide0Label : dict.heroSlide1Label}
          </span>
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
              }
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-xs text-white font-bold transition-colors cursor-pointer"
              aria-label={dict.heroPrevSlide}
            >
              &lsaquo;
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-xs text-white font-bold transition-colors cursor-pointer"
              aria-label={dict.heroNextSlide}
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </section>

      {/* ========== TICKER DE RÉASSURANCE INDUSTRIELLE ========== */}
      <section className="bg-white border-y border-slate-200/80 py-4 overflow-hidden shadow-sm">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...dict.ticker, ...dict.ticker].map((item, i) => (
            <div key={i} className="inline-flex items-center gap-6 mx-8">
              <div className="text-center">
                <div className="text-xs sm:text-sm font-black text-[#002B5B] tracking-wide">
                  {item.label}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 font-medium">
                  {item.sub}
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] ring-4 ring-[#FFD700]/20" />
            </div>
          ))}
        </div>
      </section>

      {/* ========== NOS ENGAGEMENTS QUALITÉ ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 bg-[#002B5B]/8 text-[#002B5B] px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest border border-[#002B5B]/10">
              <ShieldCheck className="w-3.5 h-3.5 text-[#002B5B]" />
              <span>{dict.engagementsBadge}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002B5B] mb-4 tracking-tight">
              {dict.engagementsTitle}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
              {dict.engagementsDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {dict.engagements.map((item, i) => {
              const IconComponent = ENGAGEMENT_ICONS[i];
              return (
                <Link
                  key={i}
                  href={ENGAGEMENTS_HREFS[i]}
                  className="card-hover bg-white rounded-3xl p-8 relative overflow-hidden group border border-slate-200/80 block transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-sm hover:shadow-xl"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#002B5B]/10 border border-[#002B5B]/15 group-hover:bg-[#002B5B]/20 group-hover:border-[#002B5B]/30 backdrop-blur-sm text-[#002B5B] flex items-center justify-center p-3 mb-6 transition-all duration-300 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-black text-[#002B5B] mb-3 group-hover:text-[#001D3D] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed text-sm mb-6 font-normal">
                    {item.desc}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-[#002B5B] group-hover:text-[#D97706] uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                      <span>{item.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#002B5B]/10 border border-[#002B5B]/15 group-hover:bg-[#FFD700]/25 group-hover:border-[#FFD700]/50 text-[#002B5B] flex items-center justify-center text-xs transition-colors backdrop-blur-sm">
                      &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== PRODUITS PHARES ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002B5B] via-[#FFD700] to-[#002B5B]" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 text-[#002B5B] px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest border border-[#FFD700]/30">
                <Boxes className="w-3.5 h-3.5 text-[#002B5B]" />
                <span>{dict.produitsBadge}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002B5B] tracking-tight">
                {dict.produitsTitle}
              </h2>
            </div>
            <Link
              href={`/${lang}/catalogue`}
              className="text-[#002B5B] font-bold hover:text-[#D97706] transition-colors flex items-center gap-1.5 text-sm uppercase tracking-wider"
            >
              <span>{dict.voirCatalogue}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {dict.produits.map((p, i) => {
              const images = ["/images/briques.jpg", "/images/hourdis.jpg", "/images/paves.jpg"];
              const c = PRODUITS_COLORS[i];
              return (
                <div
                  key={i}
                  className="card-hover group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-50">
                    <img
                      src={images[i]}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span
                      className={`absolute top-4 left-4 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md ${c.tagColor}`}
                    >
                      {p.tag}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-md font-mono">
                      {c.spec}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-[#002B5B] mb-2">{p.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-5 leading-relaxed flex-1">
                      {p.desc}
                    </p>

                    <div className="flex items-end justify-between mb-5 pb-5 border-t border-slate-100 pt-4">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                          {dict.aPartirDe}
                        </div>
                        <div className="text-2xl font-black text-[#002B5B] font-mono">
                          {p.prix}
                        </div>
                        <div className="text-xs text-gray-400">{p.unite}</div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>{dict.enStock}</span>
                      </div>
                    </div>

                    <Link
                      href={`/${lang}/catalogue`}
                      className="block w-full bg-[#002B5B] text-white text-center py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#FFD700] hover:text-[#002B5B] transition-all duration-300 shadow-sm"
                    >
                      {dict.voirProduits}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bannière PDF Officiel */}
          <div className="mt-12 bg-gradient-to-r from-[#001D3D] via-[#002B5B] to-[#001D3D] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute right-0 top-0 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gold-gradient text-[#002B5B] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg font-black">
                  <Download className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-[#FFD700]/30">
                    <Sparkles className="w-3 h-3" />
                    <span>{dict.cataloguePdfBadge}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {dict.cataloguePdfTitle}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl">
                    {dict.cataloguePdfDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 w-full md:w-auto">
                <a
                  href="/catalogue-produits-2cgc.pdf"
                  download="Catalogue-2CGC-Produits-Officiel.pdf"
                  className="w-full sm:w-auto bg-gold-gradient text-[#002B5B] px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{dict.telechargerPdf}</span>
                </a>
                <a
                  href="/catalogue-produits-2cgc.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto border border-white/30 text-white/90 hover:text-white px-5 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>{dict.ouvrirPdf}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATISTIQUES ANIMÉES ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-brand-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFD700]/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10" ref={statsRef}>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
              {dict.statsTitle}
            </h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">{dict.statsDesc}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STATS_DATA.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <div
                  key={i}
                  className="glass rounded-3xl p-6 md:p-8 text-center card-hover border border-white/10"
                >
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/10 flex items-center justify-center text-[#FFD700]">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div
                    className="text-4xl md:text-5xl font-black text-[#FFD700] mb-2 font-mono"
                    data-count={s.value}
                    data-suffix={s.suffix}
                  >
                    {s.value.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                    {s.suffix}
                  </div>
                  <div className="text-xs text-white/60 uppercase tracking-wider leading-tight font-medium">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== CALCULATEURS & OUTILS DE CHANTIER ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 bg-[#002B5B]/8 text-[#002B5B] px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest border border-[#002B5B]/10">
              <Calculator className="w-3.5 h-3.5 text-[#002B5B]" />
              <span>{dict.calcBadge}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002B5B] mb-4 tracking-tight">
              {dict.calcTitle}
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto text-sm leading-relaxed">
              {dict.calcDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {dict.outils.map((tool, i) => {
              const hrefs = [
                `/${lang}/calculateurs/blocs-m2`,
                `/${lang}/calculateurs/temps-chantier`,
              ];
              const ToolIcon = i === 0 ? Calculator : Timer;
              return (
                <Link
                  key={i}
                  href={hrefs[i]}
                  className="card-hover group relative bg-white rounded-3xl p-8 md:p-10 overflow-hidden border border-slate-200/80 hover:border-[#002B5B] transition-all block shadow-sm hover:shadow-xl"
                >
                  <div className="w-14 h-14 bg-[#002B5B]/5 group-hover:bg-[#002B5B] text-[#002B5B] group-hover:text-[#FFD700] rounded-2xl flex items-center justify-center p-3 mb-6 transition-all duration-300 shadow-sm">
                    <ToolIcon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-[#002B5B] mb-3">{tool.title}</h3>
                  <p className="text-gray-600 mb-7 text-sm leading-relaxed">{tool.desc}</p>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#002B5B] text-white group-hover:bg-[#FFD700] group-hover:text-[#002B5B] px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-sm transition-colors flex items-center gap-2">
                      <span>{tool.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== ESPACE CLIENT B2B PLATFORM ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-brand-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/25 text-[#FFD700] px-4 py-2 rounded-full text-xs font-bold mb-7 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>{dict.b2bBadge}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                {dict.b2bTitle1}
                <span className="block text-gradient mt-1">{dict.b2bTitle2}</span>
              </h2>

              <p className="text-white/70 mb-9 leading-relaxed text-sm sm:text-base">
                {dict.b2bDesc}
              </p>

              <ul className="space-y-3.5 mb-10">
                {dict.b2bFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                    <span className="text-white/85 text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/connexion"
                className="inline-flex items-center gap-3 bg-gold-gradient text-[#002B5B] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider hover:shadow-2xl hover:shadow-[#FFD700]/40 transition-all duration-300 min-h-[52px]"
              >
                <span>{dict.b2bCTA}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Dashboard Mockup moderne */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFD700]/15 rounded-3xl blur-3xl" />
              <div className="relative glass rounded-3xl p-6 border border-white/20 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                      {dict.dashboardLabel}
                    </div>
                    <div className="text-base font-black flex items-center gap-2 mt-0.5">
                      <Building2 className="w-4 h-4 text-[#FFD700]" />
                      <span>BTP Afrique SARL</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center text-[#002B5B] shadow-md font-bold text-xs">
                    PRO
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                        {dict.pointsFidelite}
                      </div>
                      <div className="text-3xl font-black text-[#FFD700] font-mono mt-0.5">
                        2 450 pts
                      </div>
                    </div>
                    <Gift className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden mt-3">
                    <div className="bg-gold-gradient h-full rounded-full w-[75%]" />
                  </div>
                  <div className="text-[10px] text-white/40 mt-2">{dict.pointsAvant}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: dict.remise, val: "-10%" },
                    { label: dict.commandes, val: "3" },
                    { label: dict.livraisons, val: "2" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center"
                    >
                      <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1">
                        {s.label}
                      </div>
                      <div className="text-lg font-black text-[#FFD700] font-mono">{s.val}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 font-mono">
                    {dict.derniereCommande}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white">Briques 20 Creuse &times; 500</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{dict.livreIlYA}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{dict.livre}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TÉMOIGNAGES CLIENTS VÉRIFIÉS ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 bg-[#002B5B]/8 text-[#002B5B] px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-widest border border-[#002B5B]/10">
              <Star className="w-3.5 h-3.5 text-[#002B5B]" />
              <span>{dict.temoignagesBadge}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002B5B] tracking-tight">
              {dict.temoignagesTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {dict.temoignages.map((t, i) => (
              <div
                key={i}
                className="card-hover bg-[#F5F5F0] rounded-3xl p-7 relative group border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm relative z-10 mb-6 font-normal italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-gray-200">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${t.couleur} rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm`}
                  >
                    {t.initiale}
                  </div>
                  <div>
                    <div className="font-black text-[#002B5B] text-xs sm:text-sm">{t.nom}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-[#F5F5F0]">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-brand-gradient rounded-3xl p-10 md:p-16 text-white text-center overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD700]/15 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/15 rounded-full blur-3xl -ml-36 -mb-36 pointer-events-none" />
            <div className="absolute inset-0 grid-pattern opacity-10" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/25 text-[#FFD700] px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>{dict.ctaBadge}</span>
              </span>

              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                {dict.ctaTitle}
              </h2>

              <p className="text-white/70 mb-10 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                {dict.ctaDesc}
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link
                  href={`/${lang}/devis`}
                  className="inline-flex items-center justify-center gap-2 bg-gold-gradient text-[#002B5B] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider hover:shadow-2xl hover:shadow-[#FFD700]/40 transition-all duration-300 min-h-[52px]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{dict.ctaDevis}</span>
                </Link>

                <Link
                  href={`/${lang}/catalogue`}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/25 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 hover:border-white/50 transition-all duration-300 min-h-[52px] backdrop-blur-sm"
                >
                  <Boxes className="w-4 h-4 text-[#FFD700]" />
                  <span>{dict.ctaCatalogue}</span>
                </Link>

                <a
                  href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-300 min-h-[52px]"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>WhatsApp Direct</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
