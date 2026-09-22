// src/lib/zones-data.ts — Données des zones de livraison pour le SEO local

export interface ZoneData {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  distanceFromDaloa: number; // km
  deliveryDelay: { fr: string; en: string };
  description: { fr: string; en: string };
  metaTitle: { fr: string; en: string };
  metaDescription: { fr: string; en: string };
  heroTitle: { fr: string; en: string };
  heroSubtitle: { fr: string; en: string };
  localContent: { fr: string; en: string };
}

export const ZONES: ZoneData[] = [
  {
    slug: "daloa",
    name: "Daloa",
    region: "Haut-Sassandra",
    lat: 6.8774,
    lng: -6.4502,
    distanceFromDaloa: 0,
    deliveryDelay: { fr: "Livraison express sous 24h", en: "Express delivery within 24h" },
    description: {
      fr: "Siège de 2CGC et usine principale de préfabrication béton. Livraison directe depuis notre parc industriel du Quartier Commerce.",
      en: "2CGC headquarters and main precast concrete factory. Direct delivery from our industrial park in the Commerce district.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Daloa | Briques, Hourdis, Pavés — 2CGC",
      en: "Precast Concrete in Daloa | Blocks, Floor Beams, Pavers — 2CGC",
    },
    metaDescription: {
      fr: "2CGC, fabricant de briques pleines & creuses, hourdis et pavés autobloquants à Daloa. Usine industrielle, livraison express 24h, devis gratuit en ligne. Normes B60 certifiées.",
      en: "2CGC, manufacturer of solid & hollow blocks, floor beams and interlocking pavers in Daloa. Industrial factory, 24h express delivery, free online quote. Certified B60 standards.",
    },
    heroTitle: {
      fr: "Votre Fournisseur Béton de Référence à Daloa",
      en: "Your Leading Concrete Supplier in Daloa",
    },
    heroSubtitle: {
      fr: "Usine de préfabrication industrielle · Livraison express 24h · Depuis 2013",
      en: "Industrial precast factory · 24h express delivery · Since 2013",
    },
    localContent: {
      fr: "Implantée au Quartier Commerce de Daloa depuis 2013, l'usine 2CGC CHEICKNA produit plus de 50 000 blocs par mois grâce à sa presse hydraulique de dernière génération. Nos clients à Daloa bénéficient d'une livraison directe depuis le parc industriel, avec un déchargement camion-grue sur chantier. Nous approvisionnons les grands projets immobiliers du Haut-Sassandra : résidences, commerces, bâtiments publics et infrastructures routières.",
      en: "Located in the Commerce district of Daloa since 2013, the 2CGC CHEICKNA factory produces over 50,000 blocks per month using state-of-the-art hydraulic press technology. Our Daloa customers benefit from direct delivery from the industrial park, with crane-truck unloading on site. We supply major real estate projects in Haut-Sassandra: residences, commercial buildings, public facilities and road infrastructure.",
    },
  },
  {
    slug: "yamoussoukro",
    name: "Yamoussoukro",
    region: "Bélier",
    lat: 6.8206,
    lng: -5.2764,
    distanceFromDaloa: 130,
    deliveryDelay: { fr: "Livraison sous 48h", en: "Delivery within 48h" },
    description: {
      fr: "Capitale politique de la Côte d'Ivoire, en pleine expansion immobilière. 2CGC approvisionne les chantiers de Yamoussoukro en briques et hourdis depuis Daloa.",
      en: "Political capital of Ivory Coast, experiencing major real estate growth. 2CGC supplies construction sites in Yamoussoukro with blocks and floor beams from Daloa.",
    },
    metaTitle: {
      fr: "Livraison Briques & Béton à Yamoussoukro | 2CGC depuis Daloa",
      en: "Block & Concrete Delivery to Yamoussoukro | 2CGC from Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques, hourdis et pavés à Yamoussoukro sous 48h depuis l'usine 2CGC Daloa. Devis gratuit, tarifs compétitifs, flotte camion-grue dédiée.",
      en: "Delivery of blocks, floor beams and pavers to Yamoussoukro within 48h from the 2CGC Daloa factory. Free quote, competitive pricing, dedicated crane-truck fleet.",
    },
    heroTitle: {
      fr: "Béton Préfabriqué Livré à Yamoussoukro",
      en: "Precast Concrete Delivered to Yamoussoukro",
    },
    heroSubtitle: {
      fr: "130 km depuis Daloa · Livraison sous 48h · Flotte dédiée",
      en: "130 km from Daloa · Delivery within 48h · Dedicated fleet",
    },
    localContent: {
      fr: "La capitale politique ivoirienne connaît un essor immobilier remarquable. 2CGC accompagne les entreprises de BTP et promoteurs de Yamoussoukro avec des préfabriqués béton de qualité industrielle, livrés sous 48h directement sur chantier. Notre flotte camion-grue assure le transport sécurisé sur l'axe Daloa–Yamoussoukro. Nous fournissons briques pleines B60 pour murs porteurs, briques creuses pour cloisons, hourdis pour planchers et pavés autobloquants pour voiries et aménagements urbains.",
      en: "The Ivorian political capital is experiencing remarkable real estate growth. 2CGC supports construction companies and property developers in Yamoussoukro with industrial-quality precast concrete, delivered within 48h directly to the construction site. Our crane-truck fleet ensures secure transport on the Daloa–Yamoussoukro route. We supply B60 solid blocks for load-bearing walls, hollow blocks for partitions, floor beams and interlocking pavers for roads and urban developments.",
    },
  },
  {
    slug: "abidjan",
    name: "Abidjan",
    region: "District Autonome d'Abidjan",
    lat: 5.3600,
    lng: -4.0083,
    distanceFromDaloa: 380,
    deliveryDelay: { fr: "Livraison sous 72h", en: "Delivery within 72h" },
    description: {
      fr: "Capitale économique de la Côte d'Ivoire et plus grand marché du BTP. 2CGC livre ses préfabriqués béton sur les chantiers d'Abidjan.",
      en: "Economic capital of Ivory Coast and largest construction market. 2CGC delivers precast concrete to construction sites in Abidjan.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton Abidjan | Livraison Briques & Hourdis — 2CGC",
      en: "Precast Concrete Abidjan | Block & Beam Delivery — 2CGC",
    },
    metaDescription: {
      fr: "Fournisseur de briques, agglos, hourdis et pavés pour Abidjan. Livraison 72h depuis l'usine 2CGC Daloa. Qualité B60 certifiée, devis en ligne immédiat.",
      en: "Supplier of blocks, floor beams and pavers for Abidjan. 72h delivery from the 2CGC Daloa factory. Certified B60 quality, instant online quote.",
    },
    heroTitle: {
      fr: "Votre Fournisseur Béton pour les Chantiers d'Abidjan",
      en: "Your Concrete Supplier for Abidjan Construction Sites",
    },
    heroSubtitle: {
      fr: "380 km depuis Daloa · Livraison sous 72h · Grands volumes",
      en: "380 km from Daloa · Delivery within 72h · Large volumes",
    },
    localContent: {
      fr: "Abidjan, moteur économique de la Côte d'Ivoire, concentre les plus grands chantiers du pays. 2CGC approvisionne la capitale économique en préfabriqués béton de qualité industrielle : briques pleines B60 pour les immeubles R+3 et plus, hourdis pour planchers haute portée, et pavés autobloquants pour les aménagements urbains. Notre logistique optimisée sur l'axe Daloa–Abidjan garantit une livraison sous 72h pour les commandes de gros volumes.",
      en: "Abidjan, the economic engine of Ivory Coast, hosts the country's largest construction projects. 2CGC supplies the economic capital with industrial-quality precast concrete: B60 solid blocks for R+3 buildings and above, floor beams for high-span floors, and interlocking pavers for urban developments. Our optimized logistics on the Daloa–Abidjan route guarantee delivery within 72h for large volume orders.",
    },
  },
  {
    slug: "bouafle",
    name: "Bouaflé",
    region: "Marahoué",
    lat: 6.9904,
    lng: -5.7445,
    distanceFromDaloa: 85,
    deliveryDelay: { fr: "Livraison sous 24–48h", en: "Delivery within 24–48h" },
    description: {
      fr: "Ville stratégique sur l'axe Daloa–Yamoussoukro. 2CGC assure une couverture rapide des chantiers de Bouaflé et de la région de la Marahoué.",
      en: "Strategic city on the Daloa–Yamoussoukro route. 2CGC provides fast coverage of construction sites in Bouaflé and the Marahoué region.",
    },
    metaTitle: {
      fr: "Briques & Matériaux Béton à Bouaflé | 2CGC Daloa",
      en: "Blocks & Concrete Materials in Bouaflé | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques pleines, creuses, hourdis et pavés à Bouaflé sous 24–48h. Usine 2CGC Daloa, normes B60 certifiées, devis gratuit.",
      en: "Delivery of solid blocks, hollow blocks, floor beams and pavers to Bouaflé within 24–48h. 2CGC Daloa factory, certified B60 standards, free quote.",
    },
    heroTitle: {
      fr: "Matériaux de Construction Livrés à Bouaflé",
      en: "Building Materials Delivered to Bouaflé",
    },
    heroSubtitle: {
      fr: "85 km depuis Daloa · Livraison sous 24–48h",
      en: "85 km from Daloa · Delivery within 24–48h",
    },
    localContent: {
      fr: "Bouaflé, carrefour stratégique de la région de la Marahoué, bénéficie d'un approvisionnement rapide depuis notre usine de Daloa. Les chantiers de construction, rénovation et aménagement à Bouaflé sont livrés sous 24 à 48 heures en briques, hourdis et pavés de qualité industrielle. 2CGC accompagne les professionnels du BTP et les particuliers de Bouaflé avec des prix compétitifs et un service de livraison sur chantier.",
      en: "Bouaflé, a strategic crossroads in the Marahoué region, benefits from rapid supply from our Daloa factory. Construction, renovation and development sites in Bouaflé are delivered within 24 to 48 hours with industrial-quality blocks, floor beams and pavers. 2CGC supports construction professionals and individuals in Bouaflé with competitive prices and on-site delivery service.",
    },
  },
  {
    slug: "issia",
    name: "Issia",
    region: "Haut-Sassandra",
    lat: 6.4928,
    lng: -6.5877,
    distanceFromDaloa: 45,
    deliveryDelay: { fr: "Livraison express sous 24h", en: "Express delivery within 24h" },
    description: {
      fr: "Ville voisine de Daloa dans le Haut-Sassandra. Livraison express garantie pour tous les chantiers d'Issia.",
      en: "Neighboring city of Daloa in Haut-Sassandra. Guaranteed express delivery for all construction sites in Issia.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Issia | Livraison Express — 2CGC",
      en: "Precast Concrete in Issia | Express Delivery — 2CGC",
    },
    metaDescription: {
      fr: "Briques, hourdis et pavés livrés à Issia sous 24h depuis l'usine 2CGC Daloa. 45 km, livraison express, devis en ligne, qualité B60 certifiée.",
      en: "Blocks, floor beams and pavers delivered to Issia within 24h from the 2CGC Daloa factory. 45 km, express delivery, online quote, certified B60 quality.",
    },
    heroTitle: {
      fr: "Béton & Briques Livrés à Issia en Express",
      en: "Concrete & Blocks Delivered to Issia Express",
    },
    heroSubtitle: {
      fr: "45 km depuis Daloa · Livraison express 24h",
      en: "45 km from Daloa · 24h express delivery",
    },
    localContent: {
      fr: "À seulement 45 km de notre usine de Daloa, Issia bénéficie d'une livraison express sous 24 heures. Les chantiers d'Issia et de ses environs sont approvisionnés en briques pleines B60, briques creuses, hourdis français et américains, ainsi qu'en pavés autobloquants. Notre proximité nous permet d'offrir les meilleurs tarifs de livraison de la région du Haut-Sassandra.",
      en: "Just 45 km from our Daloa factory, Issia benefits from 24-hour express delivery. Construction sites in Issia and its surroundings are supplied with B60 solid blocks, hollow blocks, French and American floor beams, and interlocking pavers. Our proximity allows us to offer the best delivery rates in the Haut-Sassandra region.",
    },
  },
  {
    slug: "vavoua",
    name: "Vavoua",
    region: "Haut-Sassandra",
    lat: 7.3779,
    lng: -6.4735,
    distanceFromDaloa: 60,
    deliveryDelay: { fr: "Livraison sous 24–48h", en: "Delivery within 24–48h" },
    description: {
      fr: "Ville du Haut-Sassandra au nord de Daloa. 2CGC assure la livraison de matériaux de construction à Vavoua.",
      en: "Haut-Sassandra city north of Daloa. 2CGC delivers construction materials to Vavoua.",
    },
    metaTitle: {
      fr: "Matériaux Béton à Vavoua | Livraison depuis Daloa — 2CGC",
      en: "Concrete Materials in Vavoua | Delivery from Daloa — 2CGC",
    },
    metaDescription: {
      fr: "Livraison de briques et hourdis à Vavoua sous 24–48h. 2CGC Daloa, fabricant certifié de préfabriqués béton. Devis gratuit et livraison sur chantier.",
      en: "Delivery of blocks and floor beams to Vavoua within 24–48h. 2CGC Daloa, certified precast concrete manufacturer. Free quote and on-site delivery.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton pour Vavoua et sa Région",
      en: "Precast Concrete for Vavoua and Region",
    },
    heroSubtitle: {
      fr: "60 km depuis Daloa · Livraison sous 24–48h",
      en: "60 km from Daloa · Delivery within 24–48h",
    },
    localContent: {
      fr: "Vavoua, située à 60 km au nord de Daloa dans le Haut-Sassandra, est approvisionnée régulièrement par la flotte 2CGC. Les projets de construction et d'aménagement à Vavoua bénéficient de notre gamme complète de préfabriqués béton livrés sous 24 à 48 heures. De la brique pleine pour fondations au pavé décoratif pour cours et terrasses, 2CGC couvre tous les besoins de vos chantiers à Vavoua.",
      en: "Vavoua, located 60 km north of Daloa in Haut-Sassandra, is regularly supplied by the 2CGC fleet. Construction and development projects in Vavoua benefit from our full range of precast concrete delivered within 24 to 48 hours. From solid blocks for foundations to decorative pavers for courtyards and terraces, 2CGC covers all your construction needs in Vavoua.",
    },
  },
  {
    slug: "san-pedro",
    name: "San Pedro",
    region: "Bas-Sassandra",
    lat: 4.7485,
    lng: -6.6363,
    distanceFromDaloa: 280,
    deliveryDelay: { fr: "Livraison sous 72h", en: "Delivery within 72h" },
    description: {
      fr: "Port principal du sud-ouest ivoirien. 2CGC approvisionne les grands chantiers portuaires et immobiliers de San Pedro.",
      en: "Main port in southwestern Ivory Coast. 2CGC supplies major port and real estate projects in San Pedro.",
    },
    metaTitle: {
      fr: "Briques & Béton à San Pedro | Livraison 2CGC depuis Daloa",
      en: "Blocks & Concrete in San Pedro | 2CGC Delivery from Daloa",
    },
    metaDescription: {
      fr: "Fournisseur de préfabriqués béton pour San Pedro. Briques, hourdis, pavés livrés sous 72h depuis l'usine 2CGC Daloa. Qualité certifiée, devis en ligne.",
      en: "Precast concrete supplier for San Pedro. Blocks, floor beams, pavers delivered within 72h from the 2CGC Daloa factory. Certified quality, online quote.",
    },
    heroTitle: {
      fr: "Matériaux Béton pour San Pedro et le Bas-Sassandra",
      en: "Concrete Materials for San Pedro and Bas-Sassandra",
    },
    heroSubtitle: {
      fr: "280 km depuis Daloa · Livraison sous 72h · Grands volumes",
      en: "280 km from Daloa · Delivery within 72h · Large volumes",
    },
    localContent: {
      fr: "San Pedro, deuxième port de Côte d'Ivoire et pôle économique du Bas-Sassandra, connaît une croissance rapide des constructions. 2CGC fournit les chantiers de San Pedro en préfabriqués béton de qualité industrielle avec une livraison sous 72h. Notre capacité de production de plus de 50 000 blocs/mois nous permet de répondre aux commandes de gros volumes nécessaires aux projets portuaires, résidentiels et commerciaux de San Pedro.",
      en: "San Pedro, Ivory Coast's second port and economic hub of Bas-Sassandra, is experiencing rapid construction growth. 2CGC supplies San Pedro construction sites with industrial-quality precast concrete delivered within 72h. Our production capacity of over 50,000 blocks/month allows us to meet the large volume orders needed for San Pedro's port, residential and commercial projects.",
    },
  },
  {
    slug: "bouake",
    name: "Bouaké",
    region: "Gbêkê",
    lat: 7.6939,
    lng: -5.0308,
    distanceFromDaloa: 200,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Deuxième ville de Côte d'Ivoire. 2CGC dessert les chantiers de Bouaké avec sa gamme complète de préfabriqués.",
      en: "Second largest city in Ivory Coast. 2CGC serves Bouaké construction sites with its full range of precast products.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Bouaké | Livraison 2CGC depuis Daloa",
      en: "Precast Concrete in Bouaké | 2CGC Delivery from Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques, hourdis et pavés à Bouaké sous 48–72h depuis l'usine 2CGC Daloa. Deuxième ville du pays, 200 km, tarifs compétitifs.",
      en: "Delivery of blocks, floor beams and pavers to Bouaké within 48–72h from the 2CGC Daloa factory. Second largest city, 200 km, competitive pricing.",
    },
    heroTitle: {
      fr: "Béton Préfabriqué Livré à Bouaké",
      en: "Precast Concrete Delivered to Bouaké",
    },
    heroSubtitle: {
      fr: "200 km depuis Daloa · Livraison sous 48–72h",
      en: "200 km from Daloa · Delivery within 48–72h",
    },
    localContent: {
      fr: "Bouaké, deuxième ville de Côte d'Ivoire et carrefour du centre du pays, est desservie par 2CGC avec des livraisons régulières de préfabriqués béton sous 48 à 72 heures. Les entreprises de BTP et promoteurs immobiliers de Bouaké comptent sur notre qualité B60 certifiée pour leurs projets de construction. Du parpaing à l'hourdis en passant par les pavés autobloquants, tous nos produits sont disponibles pour la région de Gbêkê.",
      en: "Bouaké, Ivory Coast's second largest city and central crossroads, is served by 2CGC with regular deliveries of precast concrete within 48 to 72 hours. Construction companies and property developers in Bouaké rely on our certified B60 quality for their building projects. From blocks to floor beams and interlocking pavers, all our products are available for the Gbêkê region.",
    },
  },
];

export const getZoneBySlug = (slug: string): ZoneData | undefined =>
  ZONES.find((z) => z.slug === slug);

export const getZoneSlugs = (): string[] => ZONES.map((z) => z.slug);
