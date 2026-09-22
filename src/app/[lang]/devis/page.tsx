import type { Metadata } from "next";
import DevisClient from "./DevisClient";
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
    ? "Devis Gratuit en Ligne | Calculateur Prix Briques & Béton — 2CGC"
    : "Free Online Quote | Concrete Blocks & Pavers Estimator — 2CGC";
  const description = isFr
    ? "Générez votre devis proforma en ligne pour briques, agglos, hourdis et pavés. Calcul automatique HT/TTC, TVA 18%, export PDF immédiat et envoi WhatsApp direct."
    : "Generate your online proforma quote for concrete blocks, floor beams and pavers. Automatic calculation, 18% VAT, instant PDF export, direct WhatsApp contact.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/devis`,
      languages: {
        fr: `${siteUrl}/fr/devis`,
        en: `${siteUrl}/en/devis`,
        "x-default": `${siteUrl}/fr/devis`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/devis`,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      locale: isFr ? "fr_CI" : "en_US",
      type: "website",
    },
  };
}

export default async function DevisPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return (
    <>
      <JsonLdService lang={locale} serviceType="devis" />
      <DevisClient lang={locale} />
    </>
  );
}
