"use client";

import Link from "next/link";
import {
  MapPin,
  Truck,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Phone,
  MessageCircle,
  Building2,
  Layers,
  Compass,
} from "lucide-react";
import type { Locale } from "@/lib/dictionaries";
import { type ZoneData, ZONES } from "@/lib/zones-data";
import Breadcrumb from "@/components/Breadcrumb";

interface ZoneClientProps {
  zone: ZoneData;
  lang: Locale;
}

export default function ZoneClient({ zone, lang }: ZoneClientProps) {
  const isEn = lang === "en";
  const otherZones = ZONES.filter((z) => z.slug !== zone.slug);

  const products = [
    {
      name: isEn ? "Solid Blocks 20x20x50 B60" : "Briques Pleines 20x20x50 B60",
      desc: isEn
        ? "Heavy-duty load-bearing walls for multi-story buildings and civil foundations."
        : "Murs porteurs haute résistance pour immeubles R+1 à R+4 et fondations génie civil.",
      tag: "B60 Certifié",
      price: "570 FCFA",
    },
    {
      name: isEn ? "Hollow Blocks 20 & 15" : "Briques Creuses 20 & 15",
      desc: isEn
        ? "Lightweight, thermal and acoustic insulation for standard partition walls."
        : "Allègement de structure et isolation thermique pour cloisons et élévations.",
      tag: "B50 Standard",
      price: isEn ? "From 330 FCFA" : "Dès 330 FCFA",
    },
    {
      name: isEn ? "Floor Beams (Hourdis 12-20)" : "Hourdis de Plancher (12 à 20)",
      desc: isEn
        ? "French & American floor blocks for lightweight, high-capacity intermediate floors."
        : "Profils français et américains pour dalles de plancher à haute portée.",
      tag: isEn ? "Floors" : "Planchers",
      price: isEn ? "From 430 FCFA" : "Dès 430 FCFA",
    },
    {
      name: isEn ? "Interlocking Pavers Z-7 & I" : "Pavés Autobloquants Z-7 & I",
      desc: isEn
        ? "6cm car-drivable pavers in red, gray and yellow for yards, roads, and car parks."
        : "Pavés carrossables 6cm rouge, gris et jaune pour cours, voiries et parkings.",
      tag: isEn ? "Car-drivable" : "Carrossable",
      price: "6 500 FCFA/m²",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Breadcrumb visuel */}
      <Breadcrumb
        lang={lang}
        items={[
          {
            label: isEn ? "Delivery Zones" : "Zones de livraison",
            href: `/${lang}#zones`,
          },
          { label: zone.name },
        ]}
      />

      {/* Hero Section Localisée */}
      <section className="bg-brand-gradient text-white pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Badge Zone & Région */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#FFD700] mb-5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{zone.name}</span>
            <span className="opacity-50">·</span>
            <span className="text-white/80">{zone.region}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {zone.heroTitle[lang]}
          </h1>

          <p className="text-white/80 text-base sm:text-xl max-w-2xl leading-relaxed mb-8">
            {zone.heroSubtitle[lang]}
          </p>

          {/* Quick CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/${lang}/devis`}
              className="inline-flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-6 py-3.5 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Building2 className="w-4 h-4" />
              <span>
                {isEn
                  ? `Request Quote for ${zone.name}`
                  : `Devis Livraison à ${zone.name}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={`https://wa.me/2250707621799?text=${encodeURIComponent(
                `Bonjour 2CGC, je souhaite des informations sur la livraison de béton à ${zone.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct</span>
            </a>

            <a
              href="tel:+2250707621799"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>07 07 62 17 99</span>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Logistiques Clés */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#002B5B]">
                {zone.distanceFromDaloa === 0
                  ? isEn
                    ? "Headquarters"
                    : "Sur place"
                  : `${zone.distanceFromDaloa} km`}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {isEn ? "From Daloa factory" : "Depuis l'usine Daloa"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/20 text-[#002B5B] flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#002B5B]">
                {zone.deliveryDelay[lang].split(" ")[isEn ? 2 : 1] || "24–48h"}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {zone.deliveryDelay[lang]}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#002B5B]">
                Camion-Grue
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {isEn ? "On-site unloading" : "Déchargement sur chantier"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-100 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#002B5B] flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#002B5B]">
                B60 Certifié
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {isEn ? "60 bars compression" : "60 bars résistance"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu Rédactionnel Localisé (SEO Content) */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#002B5B] bg-[#002B5B]/5 px-3 py-1 rounded-full">
              <span>🏗️</span>
              <span>{isEn ? "Local Expertise" : "Approvisionnement Local"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#002B5B] leading-tight">
              {isEn
                ? `Supplying Construction Projects in ${zone.name}`
                : `Fourniture et Logistique Chantier à ${zone.name}`}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {zone.localContent[lang]}
            </p>
            <div className="pt-2">
              <Link
                href={`/${lang}/catalogue`}
                className="inline-flex items-center gap-2 text-[#002B5B] font-bold text-sm hover:underline"
              >
                <span>
                  {isEn ? "View technical specs" : "Voir les fiches techniques"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Carte Google Maps de la zone */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner h-72 sm:h-80 relative bg-gray-100">
            <iframe
              title={`Carte de livraison 2CGC - ${zone.name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${zone.lat},${zone.lng}&z=12&output=embed`}
            />
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#002B5B] shadow-md flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Zone {zone.name} & Environs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gamme Produits Disponibles pour cette ville */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#002B5B] bg-[#002B5B]/5 px-3 py-1 rounded-full mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>{isEn ? "Available Products" : "Gamme Disponible"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#002B5B]">
            {isEn
              ? `Concrete Products Delivered to ${zone.name}`
              : `Préfabriqués Béton Livrés à ${zone.name}`}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {isEn
              ? "All our factory-tested products are available with delivery to your site."
              : "Tous nos matériaux certifiés en usine sont éligibles à la livraison sur votre chantier."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {products.map((prod, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#002B5B]/10 text-[#002B5B]">
                    {prod.tag}
                  </span>
                  <span className="text-sm font-black text-[#002B5B]">
                    {prod.price}
                  </span>
                </div>
                <h3 className="font-black text-lg text-[#002B5B] mb-2">
                  {prod.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  {prod.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={`/${lang}/devis`}
                  className="text-xs font-bold text-[#002B5B] hover:text-yellow-600 transition-colors inline-flex items-center gap-1"
                >
                  <span>{isEn ? "Add to quote" : "Ajouter au devis"}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/${lang}/catalogue`}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {isEn ? "Details →" : "Détails →"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Maillage Interne : Autres Zones Desservies (Internal linking SEO) */}
      <section className="bg-white border-y border-gray-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-[#002B5B]">
                {isEn ? "Other Delivery Destinations" : "Autres Villes & Zones Desservies"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEn
                  ? "2CGC supplies construction sites throughout Ivory Coast."
                  : "2CGC approvisionne les chantiers dans toute la Côte d'Ivoire."}
              </p>
            </div>
            <Link
              href={`/${lang}#zones`}
              className="text-xs font-bold text-[#002B5B] hover:underline hidden sm:block"
            >
              {isEn ? "All zones →" : "Toutes les zones →"}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherZones.map((z) => (
              <Link
                key={z.slug}
                href={`/${lang}/zones/${z.slug}`}
                className="group p-3 rounded-xl border border-gray-100 hover:border-[#002B5B]/30 hover:bg-[#002B5B]/5 transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#002B5B] group-hover:text-[#001D3D]">
                  <MapPin className="w-3.5 h-3.5 text-[#002B5B]/60 group-hover:text-[#002B5B]" />
                  <span>{z.name}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {z.distanceFromDaloa === 0
                    ? isEn
                      ? "Direct factory"
                      : "Direct usine"
                    : `${z.distanceFromDaloa} km · ${z.deliveryDelay[lang].replace(/^(Livraison\s+|Delivery\s+)/i, "")}`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Localisé */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-[#002B5B] to-[#003d80] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest">
              {isEn ? "Direct Factory Quote" : "Devis Direct Usine"}
            </span>
            <h3 className="text-2xl sm:text-4xl font-black">
              {isEn
                ? `Plan Your Delivery in ${zone.name} Today`
                : `Planifiez votre livraison à ${zone.name} dès aujourd'hui`}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {isEn
                ? `Receive an instant proforma quote with transport costs adapted to ${zone.name}. Our sales engineers assist you from order to site drop-off.`
                : `Recevez un devis proforma instantané avec frais de transport adaptés à ${zone.name}. Nos technico-commerciaux vous accompagnent de la commande au déchargement.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
            <Link
              href={`/${lang}/devis`}
              className="inline-flex items-center justify-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl"
            >
              <span>{isEn ? "Configure Quote" : "Configurer un Devis"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors"
            >
              <span>✉️</span> {isEn ? "Contact Sales Team" : "Parler à un Conseiller"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
