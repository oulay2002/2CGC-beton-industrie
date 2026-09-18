import TempsChantierClient from "./TempsChantierClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function TempsChantierPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <TempsChantierClient lang={locale} />;
}
