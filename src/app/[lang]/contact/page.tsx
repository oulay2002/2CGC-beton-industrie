import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const isFr = locale === "fr";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc-industrie.com";

  const title = isFr
    ? "Contactez 2CGC Daloa | Devis, Livraison Béton Côte d'Ivoire"
    : "Contact 2CGC Daloa | Quotes & Concrete Delivery Ivory Coast";
  const description = isFr
    ? "Contactez 2CGC Cheickna Construction à Daloa. Usine Quartier Commerce, téléphones +225 07 07 62 17 99 / +225 07 07 85 76 29, WhatsApp et formulaire de contact rapide."
    : "Contact 2CGC Cheickna Construction in Daloa. Factory in Commerce district, phones +225 07 07 62 17 99 / +225 07 07 85 76 29, WhatsApp and fast contact form.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/contact`,
      languages: {
        fr: `${siteUrl}/fr/contact`,
        en: `${siteUrl}/en/contact`,
        "x-default": `${siteUrl}/fr/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/contact`,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      locale: isFr ? "fr_CI" : "en_US",
      type: "website",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <ContactClient lang={locale} />;
}
