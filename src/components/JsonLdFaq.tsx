// src/components/JsonLdFaq.tsx — Schema.org FAQPage structured data
import type { Locale } from "@/lib/dictionaries";
import { FAQ_ITEMS } from "@/lib/faq-data";

interface JsonLdFaqProps {
  lang: Locale;
}

export default function JsonLdFaq({ lang }: JsonLdFaqProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      "name": item.q[lang],
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a[lang],
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
