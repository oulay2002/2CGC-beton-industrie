import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* En-têtes de sécurité renforcés contre les attaques web (XSS, Clickjacking, MIME Sniffing, Data Leak) */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Empêche l'intégration dans des iframes malveillantes (Anti-Clickjacking)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Empêche l'interprétation d'en-têtes MIME falsifiés
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Protège les fuites d'URL référentes
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Active le filtre anti-XSS des navigateurs
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()", // Restreint l'accès matériel non autorisé
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Force le chiffrement HTTPS (Anti-MITM)
          },
        ],
      },
    ];
  },
};

export default nextConfig;
