import DevisClient from "./DevisClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function DevisPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <DevisClient lang={locale} />;
}
