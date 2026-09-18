import BlocsM2Client from "./BlocsM2Client";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function BlocsM2Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <BlocsM2Client lang={locale} />;
}
