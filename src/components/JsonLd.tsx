import { Locale } from "@/lib/dictionaries";

interface JsonLdProps {
  lang: Locale;
}

export default function JsonLd({ lang }: JsonLdProps) {
  const isFr = lang === "fr";

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "GeneralContractor"],
        "@id": "https://2cgc.ci/#organization",
        "name": "2CGC - Cheickna Construction et Génie Civil",
        "alternateName": "2CGC BTP Daloa",
        "legalName": "Cheickna Construction et Génie Civil SARL Unipersonnel",
        "url": "https://2cgc.ci",
        "logo": "https://2cgc.ci/logo-2cgc.png",
        "image": "https://2cgc.ci/images/hero-bg.jpg",
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
          { "@type": "City", "name": "Daloa" },
          { "@type": "AdministrativeArea", "name": "Haut-Sassandra" },
          { "@type": "City", "name": "Bouaflé" },
          { "@type": "City", "name": "Issia" },
          { "@type": "City", "name": "Vavoua" },
          { "@type": "City", "name": "Yamoussoukro" },
          { "@type": "City", "name": "Abidjan" }
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
                  "description": "Brique pleine 450x200x200mm pour murs porteurs et fondations",
                  "offers": {
                    "@type": "Offer",
                    "price": "570",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
                  }
                },
                {
                  "@type": "Product",
                  "name": "Brique 20 Creuse",
                  "description": "Brique creuse 450x200x200mm pour élévations standards",
                  "offers": {
                    "@type": "Offer",
                    "price": "470",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
                  }
                },
                {
                  "@type": "Product",
                  "name": "Brique 15 Creuse",
                  "description": "Brique creuse 450x150x200mm légère",
                  "offers": {
                    "@type": "Offer",
                    "price": "330",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
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
                  "description": "Hourdis 500x150x200mm pour planchers hourdis",
                  "offers": {
                    "@type": "Offer",
                    "price": "430",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
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
                  "description": "Pavé autobloquant 240x240x60mm carrossable",
                  "offers": {
                    "@type": "Offer",
                    "price": "6500",
                    "priceCurrency": "XOF",
                    "availability": "https://schema.org/InStock"
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
