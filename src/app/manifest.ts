import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '2CGC - Cheickna Construction & Génie Civil',
    short_name: '2CGC BTP',
    description: "Application officielle 2CGC : préfabriqués béton, calculateurs de chantier, devis proforma et suivi des commandes à Daloa et en Côte d'Ivoire.",
    start_url: '/',
    display: 'standalone',
    background_color: '#002B5B',
    theme_color: '#002B5B',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'fr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity', 'shopping'],
    shortcuts: [
      {
        name: 'Catalogue Produits',
        short_name: 'Catalogue',
        description: 'Parcourir les briques, pavés, bordures et hourdis 2CGC',
        url: '/catalogue',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Demande de Devis',
        short_name: 'Devis',
        description: 'Établir une facture proforma instantanée',
        url: '/devis',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Calculateurs Chantier',
        short_name: 'Calculateurs',
        description: 'Calculer le nombre de briques ou blocs nécessaires au m²',
        url: '/calculateurs',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Espace Client',
        short_name: 'Mon Espace',
        description: 'Suivre mes commandes et bons de livraison',
        url: '/client',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
