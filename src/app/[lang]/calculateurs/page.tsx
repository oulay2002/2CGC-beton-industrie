import CalculateursClient from "./CalculateursClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function CalculateursPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <CalculateursClient lang={locale} />;
}
