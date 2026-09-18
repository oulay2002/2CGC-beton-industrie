import HomeClient from "./HomeClient";
import type { Locale } from "@/lib/dictionaries";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  return <HomeClient lang={lang as Locale} dict={dict.home} />;
}
