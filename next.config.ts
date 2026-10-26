import type { NextConfig } from "next";

// ─── Content-Security-Policy ────────────────────────────────────────────────
// Choix assumé : CSP statique plutôt que CSP à nonce.
// La variante à nonce recommandée par Next.js impose un rendu dynamique sur
// chaque page ; or ce site tire tout son référencement de pages statiques
// (catalogue, ~50 pages de zones, FAQ). On conserve donc le SSG et on accepte
// 'unsafe-inline' sur les scripts.
//
// Portée réelle de cette CSP : elle bloque le chargement de scripts depuis des
// origines tierces non listées, les iframes non autorisées, l'exfiltration vers
// des domaines inconnus et l'injection de <base>. Elle ne bloque pas un script
// inline injecté — cette protection-là repose sur l'échappement systématique
// des entrées (cf. api/devis/auto-dispatch).
const POSTHOG_HOSTS = 'https://*.posthog.com https://*.i.posthog.com';
const ANALYTICS_HOSTS = 'https://www.googletagmanager.com https://www.google-analytics.com';

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ANALYTICS_HOSTS} ${POSTHOG_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${POSTHOG_HOSTS} ${ANALYTICS_HOSTS}`,
  "frame-src 'self' https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

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
          {
            key: "Content-Security-Policy",
            value: CSP, // Restreint les origines de scripts, d'iframes et de requêtes sortantes
          },
        ],
      },
    ];
  },
};

export default nextConfig;
