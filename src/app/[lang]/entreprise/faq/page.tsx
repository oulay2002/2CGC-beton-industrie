import FaqClient from "./FaqClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function FAQPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <FaqClient lang={locale} />;
}
