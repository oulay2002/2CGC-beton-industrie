import CatalogueClient from "./CatalogueClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <CatalogueClient lang={locale} />;
}
