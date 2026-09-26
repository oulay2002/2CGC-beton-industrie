import { Locale } from "@/lib/dictionaries";
import { ZONES } from "@/lib/zones-data";

interface JsonLdProps {
  lang: Locale;
}

export default function JsonLd({ lang }: JsonLdProps) {
  const isFr = lang === "fr";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc-industrie.com";

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "GeneralContractor"],
        "@id": `${siteUrl}/#organization`,
        "name": "2CGC - Cheickna Construction et Génie Civil",
        "alternateName": "2CGC BTP Daloa",
        "legalName": "Cheickna Construction et Génie Civil SARL Unipersonnel",
        "url": siteUrl,
        "logo": `${siteUrl}/logo-2cgc.png`,
        "image": `${siteUrl}/images/hero-bg.jpg`,
        "description": isFr
          ? "Leader de la fabrication de préfabriqués béton à Daloa et en Côte d'Ivoire : briques pleines et creuses, hourdis de plancher, pavés autobloquants et calculateurs BTP."
          : "Leading precast concrete manufacturer in Daloa and Ivory Coast: solid and hollow blocks, floor beams, interlocking pavers, and construction estimation tools.",
        "telephone": ["+2250707621799", "+2250707857629"],
        "email": "cheicknaconstruction@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Quartier Commerce, Réf. Pharmacie Appaul, BP 129",
          "addressLocality": "Daloa",
          "addressRegion": "Haut-Sassandra",
          "addressCountry": "CI"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 6.8774,
          "longitude": -6.4502
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "opens": "07:00",
            "closes": "18:00"
          }
        ],
        "priceRange": "FCFA",
        "currenciesAccepted": "XOF",
        "paymentAccepted": "Cash, Bank Transfer, Mobile Money",
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Côte d'Ivoire" },
          { "@type": "AdministrativeArea", "name": "Haut-Sassandra" },
          ...ZONES.map((z) => ({ "@type": "City", "name": z.name })),
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": isFr ? "Gamme Préfabriqués Béton 2CGC" : "2CGC Precast Concrete Products",
          "itemListElement": [
            {
              "@type": "OfferCatalog",
              "name": isFr ? "Briques & Agglomérés Béton" : "Concrete Blocks",
              "itemListElement": [
                {
                  "@type": "Product",
                  "name": "Brique 20 Pleine",
                  "image": `${siteUrl}/images/products/brique-20-pleine.jpg`,
                  "brand": { "@type": "Brand", "name": "2CGC" },
                  "description": "Brique pleine 450x200x200mm pour murs porteurs et fondations",
                  "offers": {
                    "@type": "Offer",
                    "price": "570",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": "2027-12-31"
                  }
                },
                {
                  "@type": "Product",
                  "name": "Brique 20 Creuse",
                  "image": `${siteUrl}/images/products/brique-20-creuse.jpg`,
                  "brand": { "@type": "Brand", "name": "2CGC" },
                  "description": "Brique creuse 450x200x200mm pour élévations standards",
                  "offers": {
                    "@type": "Offer",
                    "price": "470",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": "2027-12-31"
                  }
                },
                {
                  "@type": "Product",
                  "name": "Brique 15 Creuse",
                  "image": `${siteUrl}/images/products/brique-15-creuse.jpg`,
                  "brand": { "@type": "Brand", "name": "2CGC" },
                  "description": "Brique creuse 450x150x200mm légère",
                  "offers": {
                    "@type": "Offer",
                    "price": "330",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": "2027-12-31"
                  }
                }
              ]
            },
            {
              "@type": "OfferCatalog",
              "name": isFr ? "Hourdis de Plancher Béton" : "Concrete Floor Beams",
              "itemListElement": [
                {
                  "@type": "Product",
                  "name": "Hourdis 15 Français",
                  "image": `${siteUrl}/images/products/hourdis-15.jpg`,
                  "brand": { "@type": "Brand", "name": "2CGC" },
                  "description": "Hourdis 500x150x200mm pour planchers hourdis",
                  "offers": {
                    "@type": "Offer",
                    "price": "430",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": "2027-12-31"
                  }
                }
              ]
            },
            {
              "@type": "OfferCatalog",
              "name": isFr ? "Pavés Autobloquants Décoratifs" : "Interlocking Paving Stones",
              "itemListElement": [
                {
                  "@type": "Product",
                  "name": "Pavé Z-7 Rouge / Gris / Jaune",
                  "image": `${siteUrl}/images/products/pave-z7.jpg`,
                  "brand": { "@type": "Brand", "name": "2CGC" },
                  "description": "Pavé autobloquant 240x240x60mm carrossable",
                  "offers": {
                    "@type": "Offer",
                    "price": "6500",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": "2027-12-31"
                  }
                }
              ]
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "128",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "2CGC - Cheickna Construction et Génie Civil",
        "description": isFr
          ? "Site officiel de 2CGC : préfabriqués béton, devis en ligne, calculateurs de chantier et suivi de commandes."
          : "Official 2CGC website: precast concrete, online quotes, construction calculators and order tracking.",
        "publisher": { "@id": `${siteUrl}/#organization` },
        "inLanguage": [
          { "@type": "Language", "name": "French", "alternateName": "fr" },
          { "@type": "Language", "name": "English", "alternateName": "en" }
        ],
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/{lang}/catalogue?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "2CGC - Cheickna Construction et Génie Civil",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo-2cgc.png`,
          "width": 800,
          "height": 600
        },
        "sameAs": [
          "https://wa.me/2250707621799",
          "https://facebook.com",
          "https://tiktok.com"
        ],
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+2250707621799",
            "contactType": "customer service",
            "areaServed": "CI",
            "availableLanguage": ["French", "English"]
          },
          {
            "@type": "ContactPoint",
            "telephone": "+2250707857629",
            "contactType": "sales",
            "areaServed": "CI",
            "availableLanguage": ["French"]
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
