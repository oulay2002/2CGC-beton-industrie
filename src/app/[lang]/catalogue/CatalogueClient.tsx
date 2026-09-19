"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";
import {
  Boxes,
  Grid,
  Layers,
  Search,
  Download,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

// ─── Données produits ─────────────────────────────────────────────────────────

const CATEGORIES_FR = [
  {
    id: "agglos",
    nom: "Briques & Agglomérés",
    icon: Boxes,
    description: "Blocs de béton pleins et creux certifiés",
    image: "/images/briques.jpg",
  },
  {
    id: "hourdis",
    nom: "Hourdis de Plancher",
    icon: Layers,
    description: "Éléments d'allègement de plancher en béton",
    image: "/images/hourdis.jpg",
  },
  {
    id: "paves",
    nom: "Pavés Décoratifs",
    icon: Grid,
    description: "Pavés autobloquants et carrossables",
    image: "/images/paves.jpg",
  },
];

const CATEGORIES_EN = [
  {
    id: "agglos",
    nom: "Blocks & Aggregates",
    icon: Boxes,
    description: "Certified solid and hollow concrete blocks",
    image: "/images/briques.jpg",
  },
  {
    id: "hourdis",
    nom: "Floor Beams",
    icon: Layers,
    description: "Concrete floor lightening elements",
    image: "/images/hourdis.jpg",
  },
  {
    id: "paves",
    nom: "Interlocking Pavers",
    icon: Grid,
    description: "Traffic-resistant paving stones",
    image: "/images/paves.jpg",
  },
];

const PRODUITS_FR = [
  { id: "1", categorie: "agglos", image: "/images/produits/page_0_img_12.jpeg", nom: "Brique 20 Pleine", description: "Brique pleine robuste pour murs porteurs et fondations.", prix: 570, unite: "unité", specs: { dimensions: "450x200x200mm", poids: "36 kg" } },
  { id: "2", categorie: "agglos", image: "/images/produits/page_0_img_13.jpeg", nom: "Brique 20 Creuse", description: "Brique creuse pour cloisons et murs d'élévation.", prix: 470, unite: "unité", specs: { dimensions: "450x200x200mm", poids: "18 kg" } },
  { id: "3", categorie: "agglos", image: "/images/produits/page_0_img_14.jpeg", nom: "Brique 15 Pleine", description: "Brique pleine pour murs intermédiaires renforcés.", prix: 460, unite: "unité", specs: { dimensions: "450x150x200mm", poids: "28 kg" } },
  { id: "4", categorie: "agglos", image: "/images/produits/page_0_img_15.jpeg", nom: "Brique 15 Creuse", description: "Brique creuse légère et polyvalente.", prix: 330, unite: "unité", specs: { dimensions: "450x150x200mm", poids: "16 kg" } },
  { id: "5", categorie: "agglos", image: "/images/produits/page_1_img_12.jpeg", nom: "Brique 12 Pleine", description: "Brique pleine fine pour cloisons phoniques.", prix: 430, unite: "unité", specs: { dimensions: "450x120x200mm", poids: "20 kg" } },
  { id: "6", categorie: "agglos", image: "/images/produits/page_1_img_13.jpeg", nom: "Brique 12 Creuse", description: "Brique creuse fine économique.", prix: 300, unite: "unité", specs: { dimensions: "450x120x200mm", poids: "14 kg" } },
  { id: "7", categorie: "agglos", image: "/images/produits/page_1_img_14.jpeg", nom: "Brique 10 Creuse", description: "Brique creuse très fine pour doublages.", prix: 260, unite: "unité", specs: { dimensions: "450x100x200mm", poids: "12 kg" } },
  { id: "8", categorie: "hourdis", image: "/images/produits/page_1_img_15.jpeg", nom: "Hourdis 15 Français", description: "Hourdis standard pour planchers à poutrelles.", prix: 430, unite: "unité", specs: { dimensions: "500x150x200mm", poids: "19 kg" } },
  { id: "9", categorie: "hourdis", image: "/images/produits/page_2_img_2.jpeg", nom: "Hourdis 12 Français", description: "Hourdis mince pour planchers bas.", prix: 380, unite: "unité", specs: { dimensions: "500x120x200mm", poids: "18 kg" } },
  { id: "10", categorie: "hourdis", image: "/images/produits/page_2_img_6.jpeg", nom: "Hourdis 16 Américain", description: "Hourdis haute capacité type américain.", prix: 600, unite: "unité", specs: { dimensions: "500x160x200mm", poids: "17 kg" } },
  { id: "11", categorie: "hourdis", image: "/images/produits/page_2_img_10.jpeg", nom: "Hourdis 20 Américain", description: "Grand hourdis pour charges lourdes.", prix: 700, unite: "unité", specs: { dimensions: "500x200x200mm", poids: "NC" } },
  { id: "12", categorie: "paves", image: "/images/produits/page_3_img_3.jpeg", nom: "Pavé Z-7 Rouge", description: "Pavé en Z couleur rouge carrossable.", prix: 7500, unite: "m²", specs: { dimensions: "240x240x60mm", poids: "NC" } },
  { id: "13", categorie: "paves", image: "/images/produits/page_3_img_4.jpeg", nom: "Pavé Z-7 Bleu", description: "Pavé en Z couleur bleue résistant UV.", prix: 7500, unite: "m²", specs: { dimensions: "240x240x60mm", poids: "NC" } },
  { id: "14", categorie: "paves", image: "/images/produits/page_3_img_5.jpeg", nom: "Pavé Z-7 Vert", description: "Pavé en Z couleur verte haute densité.", prix: 7500, unite: "m²", specs: { dimensions: "240x240x60mm", poids: "NC" } },
  { id: "15", categorie: "paves", image: "/images/produits/page_4_img_3.jpeg", nom: "Pavé Z-7 Jaune", description: "Pavé en Z couleur jaune pour marquages.", prix: 7500, unite: "m²", specs: { dimensions: "240x240x60mm", poids: "NC" } },
  { id: "16", categorie: "paves", image: "/images/produits/page_4_img_4.jpeg", nom: "Pavé Z-7 Gris", description: "Pavé en Z gris brut intemporel.", prix: 6500, unite: "m²", specs: { dimensions: "240x240x60mm", poids: "NC" } },
  { id: "17", categorie: "paves", image: "/images/produits/page_5_img_3.jpeg", nom: "Pavé Z-13 Bleu", description: "Petit pavé bleu décoratif pour allées.", prix: 7500, unite: "m²", specs: { dimensions: "130x130x60mm", poids: "NC" } },
  { id: "18", categorie: "paves", image: "/images/produits/page_5_img_3.jpeg", nom: "Pavé Z-13 Gris", description: "Petit pavé gris brut antidérapant.", prix: 6500, unite: "m²", specs: { dimensions: "130x130x60mm", poids: "NC" } },
  { id: "19", categorie: "paves", image: "/images/produits/page_5_img_4.jpeg", nom: "Pavé Z-14 Gris", description: "Pavé ovale gris brut pour bordures.", prix: 6500, unite: "m²", specs: { dimensions: "245x130x80mm", poids: "NC" } },
  { id: "20", categorie: "paves", image: "/images/produits/page_5_img_5.jpeg", nom: "Pavé Z-14 Jaune", description: "Pavé ovale couleur jaune lumineux.", prix: 7500, unite: "m²", specs: { dimensions: "245x130x80mm", poids: "NC" } },
  { id: "21", categorie: "paves", image: "/images/produits/page_6_img_3.jpeg", nom: "Pavé Z-13 Mixte", description: "Pavés assortis multi-couleurs élégants.", prix: 7500, unite: "m²", specs: { dimensions: "Mixte", poids: "NC" } },
  { id: "22", categorie: "paves", image: "/images/produits/page_6_img_4.jpeg", nom: "Pavé Z-6-s Rouge", description: "Pavé rectangulaire rouge carrossable.", prix: 7500, unite: "m²", specs: { dimensions: "245x130x80mm", poids: "NC" } },
  { id: "23", categorie: "paves", image: "/images/produits/page_7_img_3.jpeg", nom: "Pavé Z-6-s Gris", description: "Pavé rectangulaire gris brut haute charge.", prix: 6500, unite: "m²", specs: { dimensions: "245x130x80mm", poids: "NC" } },
  { id: "24", categorie: "paves", image: "/images/produits/page_7_img_4.jpeg", nom: "Pavé Z-7 Mixte", description: "Pavé en Z multi-couleurs pour parkings.", prix: 7500, unite: "m²", specs: { dimensions: "Mixte", poids: "NC" } },
];

const PRODUITS_EN = PRODUITS_FR.map((p) => {
  const descMap: Record<string, string> = {
    "1": "Robust solid block for load-bearing walls and foundations.",
    "2": "Hollow block for partitions and elevation walls.",
    "3": "Solid block for reinforced intermediate walls.",
    "4": "Lightweight and versatile hollow block.",
    "5": "Thin solid block for acoustic walls.",
    "6": "Economical thin hollow block.",
    "7": "Very thin hollow block for partition linings.",
    "8": "Standard beam block for joist concrete floors.",
    "9": "Thin beam block for low floors.",
    "10": "High capacity American-type beam block.",
    "11": "Large beam block for heavy floor loads.",
    "12": "Red Z-shaped driveable paver.",
    "13": "UV-resistant blue Z-shaped paver.",
    "14": "High-density green Z-shaped paver.",
    "15": "Yellow Z-shaped paver for demarcation.",
    "16": "Timeless raw grey Z-shaped paver.",
    "17": "Small decorative blue paver for paths.",
    "18": "Anti-slip small raw grey paver.",
    "19": "Oval raw grey paver for borders.",
    "20": "Bright yellow oval paver.",
    "21": "Assorted multi-colour pavers for decorative areas.",
    "22": "Rectangular red driveable paver.",
    "23": "Rectangular raw grey heavy-load paver.",
    "24": "Multi-colour Z-shaped paver for parking lots.",
  };
  const nomMap: Record<string, string> = {
    "Brique 20 Pleine": "Solid Block 20",
    "Brique 20 Creuse": "Hollow Block 20",
    "Brique 15 Pleine": "Solid Block 15",
    "Brique 15 Creuse": "Hollow Block 15",
    "Brique 12 Pleine": "Solid Block 12",
    "Brique 12 Creuse": "Hollow Block 12",
    "Brique 10 Creuse": "Hollow Block 10",
    "Hourdis 15 Français": "French Floor Beam 15",
    "Hourdis 12 Français": "French Floor Beam 12",
    "Hourdis 16 Américain": "American Floor Beam 16",
    "Hourdis 20 Américain": "American Floor Beam 20",
  };
  return {
    ...p,
    nom: nomMap[p.nom] ?? p.nom,
    description: descMap[p.id] ?? p.description,
    unite: p.unite === "unité" ? "unit" : p.unite,
  };
});

// ─── Composant client ─────────────────────────────────────────────────────────

export default function CatalogueClient({ lang }: { lang: Locale }) {
  const isFr = lang === "fr";
  const categories = isFr ? CATEGORIES_FR : CATEGORIES_EN;
  const produits = isFr ? PRODUITS_FR : PRODUITS_EN;

  const [filtre, setFiltre] = useState<string>("tous");
  const produitsFiltres =
    filtre === "tous" ? produits : produits.filter((p) => p.categorie === filtre);

  const t = {
    heroBadge: isFr ? "Usine de Daloa • Préfabriqués Béton" : "Daloa Plant • Precast Concrete",
    heroSub: isFr ? "Gamme certifiée 2CGC CHEICKNA" : "Certified 2CGC CHEICKNA range",
    title: "Catalogue Officiel 2CGC",
    desc: isFr
      ? `${produits.length} références certifiées avec dimensions exactes, poids unitaires et résistance conforme aux normes UEMOA.`
      : `${produits.length} certified references with exact dimensions, unit weights and compliance with UEMOA standards.`,
    telecharger: isFr ? "Télécharger PDF (1.1 Mo)" : "Download PDF (1.1 MB)",
    consulter: isFr ? "Consulter en ligne" : "View online",
    bannerText: isFr
      ? "Besoin d'un support imprimable ? Le catalogue officiel <strong>2CGC CHEICKNA</strong> contient toutes les dimensions, poids unitaires et prix HT."
      : "Need a printable catalog? The official <strong>2CGC CHEICKNA</strong> catalog contains all dimensions, unit weights and pre-tax prices.",
    bannerCta: isFr ? "Télécharger PDF" : "Download PDF",
    tout: isFr ? "Toutes les catégories" : "All categories",
    aPartirDe: isFr ? "FCFA HT / " : "CFA pre-tax / ",
    enStock: isFr ? "En stock direct" : "In stock",
    produitsCta: isFr ? "Demander un devis" : "Request quote",
    dims: isFr ? "Dimensions" : "Dimensions",
    poids: isFr ? "Poids unitaire" : "Unit weight",
    prodAffiches: isFr
      ? `${produitsFiltres.length} produit${produitsFiltres.length > 1 ? "s" : ""} affiché${
          produitsFiltres.length > 1 ? "s" : ""
        }`
      : `${produitsFiltres.length} product${produitsFiltres.length > 1 ? "s" : ""} shown`,
    ctaTitle: isFr ? "Besoin d'un devis sur-mesure ?" : "Need a custom estimate?",
    ctaDesc: isFr
      ? "Utilisez notre configurateur de devis proforma pour calculer vos besoins exacts en béton et transport."
      : "Use our proforma quote configurator to calculate your exact concrete and delivery needs.",
    ctaBtn: isFr ? "Configurer mon devis en ligne" : "Configure my quote online",
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Catalogue */}
      <section className="bg-brand-gradient text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="h-11 w-auto flex items-center justify-center flex-shrink-0 opacity-90">
                  <img
                    src="/logo-2cgc.png"
                    alt="Logo 2CGC"
                    className="h-11 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.15)]"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.heroBadge}</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">{t.heroSub}</div>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight">
                Catalogue <span className="text-gradient">2CGC BTP</span>
              </h1>
              <p className="text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
                {t.desc}
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
              <a
                href="/catalogue-produits-2cgc.pdf"
                download="Catalogue-2CGC-Produits-Officiel.pdf"
                className="group relative inline-flex items-center gap-3 bg-gold-gradient text-[#002B5B] px-6 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl hover:shadow-[#FFD700]/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Download className="w-5 h-5 text-[#002B5B]" />
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-wider text-[#002B5B]/80 font-bold">
                    {isFr ? "Fiche technique & Tarifs" : "Technical sheet & Prices"}
                  </div>
                  <div className="font-black text-xs sm:text-sm leading-tight">
                    {t.telecharger}
                  </div>
                </div>
              </a>

              <a
                href="/catalogue-produits-2cgc.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/25 text-white/90 hover:text-white px-5 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                <Eye className="w-4 h-4" />
                <span>{t.consulter}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bannière d'information PDF */}
      <div className="bg-[#FFF9E6] border-b border-[#FFD700]/30 py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#002B5B]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: t.bannerText }} />
          </div>
          <a
            href="/catalogue-produits-2cgc.pdf"
            download="Catalogue-2CGC-Produits-Officiel.pdf"
            className="inline-flex items-center gap-1.5 text-[#002B5B] font-black hover:underline flex-shrink-0 bg-[#FFD700] px-3.5 py-1.5 rounded-xl shadow-sm text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.bannerCta}</span>
          </a>
        </div>
      </div>

      {/* Filtres par catégorie avec onglets épurés */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[64px] z-30 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            <button
              onClick={() => setFiltre("tous")}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                filtre === "tous"
                  ? "bg-[#002B5B] text-white shadow-md"
                  : "text-gray-600 hover:text-[#002B5B] hover:bg-gray-100"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.tout}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  filtre === "tous" ? "bg-[#FFD700] text-[#002B5B]" : "bg-[#002B5B]/10 text-[#002B5B]"
                }`}
              >
                {produits.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = produits.filter((p) => p.categorie === cat.id).length;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFiltre(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                    filtre === cat.id
                      ? "bg-[#002B5B] text-white shadow-md"
                      : "text-gray-600 hover:text-[#002B5B] hover:bg-gray-100"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.nom}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      filtre === cat.id ? "bg-[#FFD700] text-[#002B5B]" : "bg-[#002B5B]/10 text-[#002B5B]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bandeau catégorie sélectionnée */}
      {filtre !== "tous" &&
        (() => {
          const cat = categories.find((c) => c.id === filtre);
          if (!cat) return null;
          const IconComp = cat.icon;
          return (
            <div className="bg-white border-b border-gray-100 py-6 px-4 shadow-sm">
              <div className="max-w-6xl mx-auto flex items-center gap-4">
                <div className="h-16 w-24 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
                  <img src={cat.image} alt={cat.nom} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#002B5B] flex items-center gap-2">
                    <IconComp className="w-5 h-5 text-[#D97706]" />
                    <span>{cat.nom}</span>
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{cat.description}</p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Grille de produits */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-gray-500 mb-6 font-mono uppercase tracking-wider font-semibold">
            {t.prodAffiches}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {produitsFiltres.map((produit) => {
              const cat = categories.find((c) => c.id === produit.categorie);
              const CatIcon = cat?.icon || Boxes;
              return (
                <div
                  key={produit.id}
                  className="card-hover bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="h-44 overflow-hidden bg-slate-50 p-4 flex items-center justify-center relative">
                    <img
                      src={produit.image || cat?.image}
                      alt={produit.nom}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="bg-[#002B5B] px-4 py-2 flex items-center gap-1.5">
                    <CatIcon className="w-3.5 h-3.5 text-[#FFD700]" />
                    <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">
                      {cat?.nom}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-[#002B5B] text-sm mb-1.5">{produit.nom}</h3>
                    <p className="text-gray-600 text-xs mb-3 leading-relaxed flex-1 font-normal">
                      {produit.description}
                    </p>

                    <div className="bg-[#F5F5F0] rounded-xl p-3 mb-3 text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.dims}</span>
                        <span className="font-bold text-[#002B5B]">{produit.specs.dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t.poids}</span>
                        <span className="font-bold text-[#002B5B]">{produit.specs.poids}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-xl font-black text-[#002B5B] font-mono">
                          {produit.prix.toLocaleString(isFr ? "fr-FR" : "en-US")}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {t.aPartirDe}
                          {produit.unite}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{t.enStock}</span>
                      </div>
                    </div>

                    <Link
                      href={`/${lang}/devis?produit=${encodeURIComponent(produit.id)}`}
                      className="block w-full bg-[#002B5B] hover:bg-[#FFD700] text-white hover:text-[#002B5B] text-center py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-sm min-h-[40px] flex items-center justify-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{t.produitsCta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-brand-gradient rounded-3xl p-10 text-white text-center relative overflow-hidden shadow-2xl border border-white/10">
            <div className="absolute inset-0 grid-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
                {t.ctaTitle}
              </h2>
              <p className="text-white/70 mb-7 text-sm max-w-lg mx-auto leading-relaxed">
                {t.ctaDesc}
              </p>
              <Link
                href={`/${lang}/devis`}
                className="inline-flex items-center gap-2 bg-gold-gradient text-[#002B5B] px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all duration-300"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t.ctaBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
