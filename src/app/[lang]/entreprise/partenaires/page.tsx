import PartenairesClient from "./PartenairesClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function PartenairesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <PartenairesClient lang={locale} />;
}
