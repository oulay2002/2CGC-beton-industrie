import type { Metadata } from "next";
import CatalogueClient from "./CatalogueClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";
import JsonLdService from "@/components/JsonLdService";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const isFr = locale === "fr";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc.ci";

  const title = isFr
    ? "Catalogue Préfabriqués Béton | Briques, Hourdis, Pavés — 2CGC Daloa"
    : "Precast Concrete Catalog | Blocks, Floor Beams, Pavers — 2CGC Daloa";
  const description = isFr
    ? "Consultez notre catalogue complet de préfabriqués béton à Daloa : briques pleines 15/20 B60, briques creuses, hourdis de plancher et pavés autobloquants. Fiches techniques et tarifs."
    : "Explore our complete precast concrete catalog in Daloa: B60 solid blocks 15/20, hollow blocks, floor beams, and interlocking pavers. Technical specs and prices.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/catalogue`,
      languages: {
        fr: `${siteUrl}/fr/catalogue`,
        en: `${siteUrl}/en/catalogue`,
        "x-default": `${siteUrl}/fr/catalogue`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/catalogue`,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      locale: isFr ? "fr_CI" : "en_US",
      type: "website",
    },
  };
}

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return (
    <>
      <JsonLdService lang={locale} serviceType="catalogue" />
      <CatalogueClient lang={locale} />
    </>
  );
}
