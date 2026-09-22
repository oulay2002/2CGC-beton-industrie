import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import ChatBot from "@/components/ChatBot";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnalyticsScripts from "@/components/Analytics";
import PwaRegister from "@/components/PwaRegister";
import MobileBottomNav from "@/components/MobileBottomNav";
import SyncLang from "@/components/SyncLang";
import JsonLd from "@/components/JsonLd";
import IntroSplash from "@/components/IntroSplash";
import ReviewPrompt from "@/components/ReviewPrompt";
import { locales, type Locale, getDictionary, hasLocale } from "@/lib/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const dict = await getDictionary(locale);
  const isFr = locale === "fr";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc.ci";
  const ogTitle = isFr
    ? "2CGC Cheickna Construction | Préfabriqués Béton & Génie Civil Daloa"
    : "2CGC Cheickna Construction | Precast Concrete & Civil Engineering Daloa";
  const ogDesc = isFr
    ? "Fabricant leader de briques pleines & creuses, hourdis de plancher et pavés autobloquants à Daloa (Côte d'Ivoire). Devis immédiat, calculateurs de chantier et livraison express."
    : "Leading manufacturer of solid & hollow blocks, floor beams and interlocking pavers in Daloa (Ivory Coast). Instant quote, jobsite calculators and fast delivery.";

  return {
    title: {
      default: dict.meta.title,
      template: "%s | 2CGC BTP Daloa",
    },
    description: dict.meta.description,
    keywords: isFr
      ? [
          "préfabriqués béton Daloa",
          "briques agglos Côte d'Ivoire",
          "brique 20 creuse Daloa",
          "brique 15 pleine",
          "hourdis plancher béton",
          "pavés autobloquants prix Daloa",
          "matériaux de construction Haut-Sassandra",
          "devis béton Daloa",
          "2CGC Cheickna",
          "usine béton Côte d'Ivoire",
        ]
      : [
          "precast concrete Ivory Coast",
          "concrete blocks Daloa",
          "hollow block 20 Daloa",
          "floor beams concrete",
          "interlocking pavers Ivory Coast",
          "building materials Haut-Sassandra",
          "construction quote Daloa",
          "2CGC Cheickna",
        ],
    authors: [{ name: "2CGC - Cheickna Construction et Génie Civil" }],
    creator: "2CGC BTP",
    publisher: "2CGC",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: "/fr",
        en: "/en",
        "x-default": "/fr",
      },
    },
    openGraph: {
      type: "website",
      locale: isFr ? "fr_CI" : "en_US",
      alternateLocale: isFr ? ["en_US"] : ["fr_CI"],
      url: `${siteUrl}/${locale}`,
      title: ogTitle,
      description: ogDesc,
      siteName: "2CGC - Cheickna Construction & Génie Civil",
      images: [
        {
          url: "/logo-2cgc.png",
          width: 800,
          height: 600,
          alt: "Logo officiel 2CGC - Cheickna Construction et Génie Civil Daloa",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: ["/logo-2cgc.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  const dict = await getDictionary(locale);

  return (
    <AuthProvider>
      <IntroSplash />
      <JsonLd lang={locale} />
      <SyncLang lang={locale} />
      <Navigation lang={locale} dict={dict.nav} entrepriseLinks={dict.entrepriseLinks} />
      <div className="pt-20 pb-16 md:pb-0 min-h-screen flex flex-col justify-between">
        <div>{children}</div>
        <Footer lang={locale} dict={dict.footer} />
      </div>
      <ChatBot />
      <ReviewPrompt delayMs={45000} />
      <MobileBottomNav />
      <PwaRegister />
      <AnalyticsScripts />
    </AuthProvider>
  );
}
