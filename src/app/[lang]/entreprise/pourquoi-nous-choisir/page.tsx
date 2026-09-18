import PourquoiNousChoisirClient from "./PourquoiNousChoisirClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function PourquoiNousChoisirPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <PourquoiNousChoisirClient lang={locale} />;
}
