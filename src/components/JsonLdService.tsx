// src/components/JsonLdService.tsx — Schema.org Service structured data
import type { Locale } from "@/lib/dictionaries";

interface JsonLdServiceProps {
  lang: Locale;
  serviceType: "catalogue" | "devis" | "calculateurs";
}

const SERVICES = {
  catalogue: {
    name: {
      fr: "Catalogue Préfabriqués Béton 2CGC",
      en: "2CGC Precast Concrete Product Catalog",
    },
    description: {
      fr: "Gamme complète de briques pleines et creuses, hourdis de plancher et pavés autobloquants. Fiches techniques, dimensions et tarifs.",
      en: "Full range of solid and hollow blocks, floor beams and interlocking pavers. Technical specifications, dimensions and pricing.",
    },
    serviceType: {
      fr: "Vente de préfabriqués béton",
      en: "Precast concrete sales",
    },
  },
  devis: {
    name: {
      fr: "Devis Gratuit en Ligne — 2CGC",
      en: "Free Online Quote — 2CGC",
    },
    description: {
      fr: "Configurateur de devis proforma avec calcul automatique HT/TTC, TVA 18%, et export PDF. Réponse immédiate.",
      en: "Proforma quote configurator with automatic pre-tax/total calculation, 18% VAT, and PDF export. Instant response.",
    },
    serviceType: {
      fr: "Devis et facturation béton",
      en: "Concrete quoting and invoicing",
    },
  },
  calculateurs: {
    name: {
      fr: "Calculateurs de Chantier BTP — 2CGC",
      en: "Construction Site Calculators — 2CGC",
    },
    description: {
      fr: "Outils gratuits de calcul : nombre de briques par m², estimateur de temps de chantier. Résultats instantanés.",
      en: "Free calculation tools: blocks per m², construction time estimator. Instant results.",
    },
    serviceType: {
      fr: "Outils de calcul BTP",
      en: "Construction calculation tools",
    },
  },
};

export default function JsonLdService({ lang, serviceType }: JsonLdServiceProps) {
  const service = SERVICES[serviceType];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc-industrie.com";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name[lang],
    "description": service.description[lang],
    "serviceType": service.serviceType[lang],
    "provider": {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#organization`,
      "name": "2CGC - Cheickna Construction et Génie Civil",
    },
    "areaServed": [
      { "@type": "City", "name": "Daloa" },
      { "@type": "AdministrativeArea", "name": "Haut-Sassandra" },
      { "@type": "Country", "name": "Côte d'Ivoire" },
    ],
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": siteUrl,
      "servicePhone": "+2250707621799",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
