import { MetadataRoute } from "next";
import { ZONES } from "@/lib/zones-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2cgc.ci";
  const lastModified = new Date();

  // Liste des chemins de base indexables
  const subPaths = [
    "",
    "/catalogue",
    "/devis",
    "/contact",
    "/calculateurs",
    "/calculateurs/blocs-m2",
    "/calculateurs/temps-chantier",
    "/entreprise/qui-sommes-nous",
    "/entreprise/pourquoi-nous-choisir",
    "/entreprise/partenaires",
    "/entreprise/faq",
    "/politique-confidentialite",
    "/cgu",
  ];

  // Ajouter les pages locales (zones géographiques de livraison)
  const zonePaths = ZONES.map((z) => `/zones/${z.slug}`);
  const allPaths = [...subPaths, ...zonePaths];

  const languages = ["fr", "en"] as const;
  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    for (const lang of languages) {
      let priority = 0.7;
      let changeFrequency:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never" = "weekly";

      if (path === "") {
        priority = 1.0;
        changeFrequency = "daily";
      } else if (path === "/catalogue" || path === "/devis") {
        priority = 0.95;
        changeFrequency = "daily";
      } else if (path.startsWith("/zones/")) {
        priority = 0.9;
        changeFrequency = "weekly";
      } else if (path.startsWith("/calculateurs") || path.startsWith("/entreprise")) {
        priority = 0.85;
        changeFrequency = "weekly";
      } else if (path === "/contact") {
        priority = 0.8;
        changeFrequency = "monthly";
      } else if (path === "/politique-confidentialite" || path === "/cgu") {
        priority = 0.3;
        changeFrequency = "monthly";
      }

      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            fr: `${baseUrl}/fr${path}`,
            en: `${baseUrl}/en${path}`,
          },
        },
      });
    }
  }

  return entries;
}
