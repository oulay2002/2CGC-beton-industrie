import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale, hasLocale } from "@/lib/dictionaries";
import { ZONES, getZoneBySlug, getZoneSlugs } from "@/lib/zones-data";
import ZoneClient from "./ZoneClient";
import JsonLdBreadcrumb from "@/components/JsonLdBreadcrumb";

interface ZonePageProps {
  params: Promise<{
    lang: string;
    ville: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getZoneSlugs();
  const params: { lang: string; ville: string }[] = [];

  for (const lang of locales) {
    for (const slug of slugs) {
      params.push({ lang, ville: slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: ZonePageProps): Promise<Metadata> {
  const { lang, ville } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const zone = getZoneBySlug(ville);

  if (!zone) {
    return {
      title: "Zone non trouvée | 2CGC",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc-industrie.com";
  const title = zone.metaTitle[locale];
  const description = zone.metaDescription[locale];

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/zones/${zone.slug}`,
      languages: {
        fr: `${siteUrl}/fr/zones/${zone.slug}`,
        en: `${siteUrl}/en/zones/${zone.slug}`,
        "x-default": `${siteUrl}/fr/zones/${zone.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/zones/${zone.slug}`,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      locale: locale === "fr" ? "fr_CI" : "en_US",
      type: "website",
      images: [
        {
          url: "/logo-2cgc.png",
          width: 800,
          height: 600,
          alt: `Livraison préfabriqués béton 2CGC à ${zone.name}`,
        },
      ],
    },
  };
}

export default async function ZonePage({ params }: ZonePageProps) {
  const { lang, ville } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const zone = getZoneBySlug(ville);

  if (!zone) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc-industrie.com";

  // Schema.org spécifique à la zone locale
  const localSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Livraison Préfabriqués Béton à ${zone.name}`,
    "description": zone.description[locale],
    "provider": {
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#organization`,
      "name": "2CGC - Cheickna Construction et Génie Civil",
      "telephone": "+2250707621799",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Quartier Commerce, Réf. Pharmacie Appaul",
        "addressLocality": "Daloa",
        "addressRegion": "Haut-Sassandra",
        "addressCountry": "CI",
      },
    },
    "areaServed": {
      "@type": "City",
      "name": zone.name,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": zone.lat,
        "longitude": zone.lng,
      },
    },
    "serviceType": "Fabrication et livraison de préfabriqués béton",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `Produits Béton livrés à ${zone.name}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
      />
      <JsonLdBreadcrumb
        items={[
          { name: locale === "fr" ? "Accueil" : "Home", url: `${siteUrl}/${locale}` },
          { name: locale === "fr" ? "Zones de livraison" : "Delivery Zones", url: `${siteUrl}/${locale}#zones` },
          { name: zone.name, url: `${siteUrl}/${locale}/zones/${zone.slug}` },
        ]}
      />
      <ZoneClient zone={zone} lang={locale} />
    </>
  );
}
