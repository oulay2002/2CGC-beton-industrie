import HomeClient from "@/app/[lang]/HomeClient";
import { getDictionary } from "@/lib/dictionaries";

export default async function HomePage() {
  const dict = await getDictionary("fr");
  return <HomeClient lang="fr" dict={dict.home} />;
}