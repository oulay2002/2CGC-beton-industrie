import type { Metadata } from "next";
import FaqClient from "./FaqClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";
import JsonLdFaq from "@/components/JsonLdFaq";

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
    ? "FAQ Béton & Construction | Questions Fréquentes — 2CGC Daloa"
    : "Concrete & Construction FAQ | Frequently Asked Questions — 2CGC Daloa";
  const description = isFr
    ? "Toutes les réponses à vos questions techniques sur les préfabriqués béton 2CGC : délais de livraison, résistance B60, paiement B2B, devis proforma et TVA 18%."
    : "All answers to your technical questions on 2CGC precast concrete: delivery times, B60 strength, B2B payment terms, proforma quotes and 18% VAT.";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/entreprise/faq`,
      languages: {
        fr: `${siteUrl}/fr/entreprise/faq`,
        en: `${siteUrl}/en/entreprise/faq`,
        "x-default": `${siteUrl}/fr/entreprise/faq`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/entreprise/faq`,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      locale: isFr ? "fr_CI" : "en_US",
      type: "website",
    },
  };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return (
    <>
      <JsonLdFaq lang={locale} />
      <FaqClient lang={locale} />
    </>
  );
}
