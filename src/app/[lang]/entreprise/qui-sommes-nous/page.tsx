import QuiSommesNousClient from "./QuiSommesNousClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function QuiSommesNousPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <QuiSommesNousClient lang={locale} />;
}
