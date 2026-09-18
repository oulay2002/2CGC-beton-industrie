import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://2cgc.ci';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dirigeant/',
          '/usine/',
          '/chauffeur/',
          '/client/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
