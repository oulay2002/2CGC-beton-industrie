import ContactClient from "./ContactClient";
import { type Locale, hasLocale } from "@/lib/dictionaries";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "fr") as Locale;
  return <ContactClient lang={locale} />;
}
