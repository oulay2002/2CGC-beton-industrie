// src/lib/zones-data.ts — Données des zones de livraison pour le SEO local

export interface ZoneData {
  slug: string;
  aliases?: string[];
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
  // --- NOUVELLES ZONES DESSERVIES (GRAND OUEST, MARAHOUÉ & WORODOUGOU) ---
  {
    slug: "guiglo",
    aliases: ["gioglo"],
    name: "Guiglo",
    region: "Cavally",
    lat: 6.5439,
    lng: -7.4939,
    distanceFromDaloa: 135,
    deliveryDelay: { fr: "Livraison sous 48h", en: "Delivery within 48h" },
    description: {
      fr: "Chef-lieu de la région du Cavally dans l'ouest ivoirien. 2CGC approvisionne les chantiers de Guiglo en briques et hourdis depuis Daloa.",
      en: "Capital of the Cavally region in western Ivory Coast. 2CGC supplies construction sites in Guiglo with blocks and floor beams from Daloa.",
    },
    metaTitle: {
      fr: "Briques & Préfabriqués Béton à Guiglo | 2CGC Daloa",
      en: "Concrete Blocks & Precast in Guiglo | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques pleines, creuses, hourdis et pavés à Guiglo sous 48h depuis l'usine 2CGC Daloa. Qualité B60 certifiée, devis gratuit.",
      en: "Delivery of solid, hollow blocks, floor beams and pavers to Guiglo within 48h from 2CGC Daloa. Certified B60 quality, free quote.",
    },
    heroTitle: {
      fr: "Béton Préfabriqué Livré à Guiglo",
      en: "Precast Concrete Delivered to Guiglo",
    },
    heroSubtitle: {
      fr: "135 km depuis Daloa · Région du Cavally · Livraison sous 48h",
      en: "135 km from Daloa · Cavally Region · Delivery within 48h",
    },
    localContent: {
      fr: "Guiglo, carrefour stratégique du Cavally et du Grand Ouest ivoirien, connaît un développement soutenu de ses infrastructures publiques et résidentielles. 2CGC assure l'approvisionnement des chantiers de Guiglo et de ses environs en briques pleines B60, hourdis de plancher et pavés carrossables, avec une livraison sécurisée par camion-grue sous 48h depuis notre usine de Daloa.",
      en: "Guiglo, strategic crossroads of Cavally and the Grand West, experiences steady infrastructure and residential growth. 2CGC provides supply to Guiglo sites with B60 solid blocks, floor beams, and drivable pavers delivered by crane-truck within 48h from our Daloa plant.",
    },
  },
  {
    slug: "duekoue",
    name: "Duékoué",
    region: "Guémon",
    lat: 6.7417,
    lng: -7.3497,
    distanceFromDaloa: 100,
    deliveryDelay: { fr: "Livraison sous 24–48h", en: "Delivery within 24–48h" },
    description: {
      fr: "Carrefour commercial majeur de la région du Guémon et porte du Grand Ouest. 2CGC dessert tous les chantiers de Duékoué en briques et pavés certifiés B60.",
      en: "Major commercial crossroads of the Guémon region. 2CGC serves all construction sites in Duékoué with certified B60 blocks and pavers.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Duékoué | Livraison Rapide — 2CGC",
      en: "Precast Concrete in Duékoué | Fast Delivery — 2CGC",
    },
    metaDescription: {
      fr: "Fournisseur de briques, hourdis et pavés pour Duékoué. Livraison 24–48h depuis l'usine 2CGC Daloa (100 km). Norme B60, devis proforma en ligne.",
      en: "Supplier of blocks, floor beams and pavers for Duékoué. 24–48h delivery from 2CGC Daloa (100 km). B60 standard, online quote.",
    },
    heroTitle: {
      fr: "Fournisseur Béton de Référence à Duékoué",
      en: "Leading Concrete Supplier in Duékoué",
    },
    heroSubtitle: {
      fr: "100 km depuis Daloa · Axe direct · Livraison sous 24–48h",
      en: "100 km from Daloa · Direct route · Delivery within 24–48h",
    },
    localContent: {
      fr: "Située à 100 km de Daloa sur l'axe principal du Grand Ouest, la ville de Duékoué bénéficie d'une liaison logistique directe avec l'usine 2CGC. Nos camions approvisionnent rapidement les chantiers résidentiels, commerciaux et industriels de la région du Guémon avec des matériaux certifiés B60 prêts pour les élévations porteuses et fondations.",
      en: "Located 100 km from Daloa on the main western axis, Duékoué benefits from direct logistics links with the 2CGC factory. Our trucks promptly supply residential, commercial and industrial sites across Guémon with certified B60 materials ready for load-bearing elevations and foundations.",
    },
  },
  {
    slug: "danane",
    name: "Danané",
    region: "Tonkpi",
    lat: 7.2596,
    lng: -8.1550,
    distanceFromDaloa: 270,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Pôle commercial et frontalier du Tonkpi aux portes du Libéria et de la Guinée. 2CGC assure la livraison de matériaux de construction et préfabriqués béton à Danané.",
      en: "Commercial and cross-border hub of Tonkpi bordering Liberia and Guinea. 2CGC delivers building materials and precast concrete to Danané.",
    },
    metaTitle: {
      fr: "Briques & Matériaux Béton à Danané | 2CGC Daloa",
      en: "Concrete Blocks & Materials in Danané | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Livraison de préfabriqués béton à Danané (Tonkpi) sous 48–72h. Briques pleines B60, hourdis, pavés depuis l'usine 2CGC de Daloa. Devis gratuit.",
      en: "Precast concrete delivery to Danané (Tonkpi) within 48–72h. B60 solid blocks, floor beams, pavers from 2CGC Daloa factory. Free quote.",
    },
    heroTitle: {
      fr: "Matériaux Béton Livrés à Danané",
      en: "Concrete Materials Delivered to Danané",
    },
    heroSubtitle: {
      fr: "270 km depuis Daloa · Région du Tonkpi · Livraison sous 48–72h",
      en: "270 km from Daloa · Tonkpi Region · Delivery within 48–72h",
    },
    localContent: {
      fr: "Danané, pôle d'échanges frontalier du Tonkpi, requiert des matériaux de construction robustes et durables. 2CGC achemine ses briques pleines, hourdis de plancher et pavés carrossables pour accompagner les projets d'édification d'immeubles, de villas et d'infrastructures à Danané.",
      en: "Danané, a vital border trade center in Tonkpi, demands durable building materials. 2CGC ships solid blocks, floor beams and drivable pavers to support construction of buildings, villas and infrastructure in Danané.",
    },
  },
  {
    slug: "man",
    name: "Man",
    region: "Tonkpi",
    lat: 7.4125,
    lng: -7.5538,
    distanceFromDaloa: 190,
    deliveryDelay: { fr: "Livraison sous 48h", en: "Delivery within 48h" },
    description: {
      fr: "Chef-lieu du district des Montagnes et métropole de l'ouest ivoirien. 2CGC dessert les chantiers de Man avec sa flotte dédiée.",
      en: "Capital of the Montagnes district and western metropolis. 2CGC serves construction sites in Man with its dedicated fleet.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Man | Briques & Hourdis — 2CGC",
      en: "Precast Concrete in Man | Blocks & Floor Beams — 2CGC",
    },
    metaDescription: {
      fr: "Fabricant et fournisseur de préfabriqués béton pour la ville de Man. Livraison sous 48h depuis Daloa. Briques B60, hourdis, pavés autobloquants.",
      en: "Precast concrete manufacturer for Man. 48h delivery from Daloa. B60 blocks, floor beams, interlocking pavers. Free online quote.",
    },
    heroTitle: {
      fr: "Votre Partenaire Béton pour les Chantiers de Man",
      en: "Your Concrete Partner for Man Construction Sites",
    },
    heroSubtitle: {
      fr: "190 km depuis Daloa · District des Montagnes · Livraison sous 48h",
      en: "190 km from Daloa · Montagnes District · Delivery within 48h",
    },
    localContent: {
      fr: "La ville aux 18 montagnes connaît un dynamisme architectural fort avec la construction de complexes hôteliers, résidences et bâtiments administratifs. 2CGC approvisionne les professionnels et particuliers de Man en briques pleines B60, hourdis légers pour planchers et pavés autobloquants, transportés et déchargés avec camion-grue sur site.",
      en: "Man, the city of 18 mountains, is undergoing major architectural growth with hotels, residences and public buildings. 2CGC supplies professionals and private builders in Man with B60 solid blocks, lightweight floor beams, and interlocking pavers, with crane-truck unloading on site.",
    },
  },
  {
    slug: "blolequin",
    name: "Bloléquin",
    region: "Cavally",
    lat: 6.5714,
    lng: -8.0033,
    distanceFromDaloa: 195,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Ville carrefour de la région du Cavally à l'ouest de Guiglo. 2CGC livre briques et agglos certifiés sur vos chantiers à Bloléquin.",
      en: "Crossroads city in the Cavally region west of Guiglo. 2CGC delivers certified blocks to your construction sites in Bloléquin.",
    },
    metaTitle: {
      fr: "Matériaux Béton à Bloléquin | 2CGC depuis Daloa",
      en: "Concrete Materials in Bloléquin | 2CGC from Daloa",
    },
    metaDescription: {
      fr: "Fourniture et livraison de briques, hourdis et pavés à Bloléquin sous 48–72h depuis l'usine 2CGC Daloa. Devis personnalisé et transport sur chantier.",
      en: "Supply and delivery of blocks, floor beams and pavers to Bloléquin within 48–72h from 2CGC Daloa. Custom quote and jobsite transport.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton Livrés à Bloléquin",
      en: "Precast Concrete Delivered to Bloléquin",
    },
    heroSubtitle: {
      fr: "195 km depuis Daloa · Cavally · Livraison sous 48–72h",
      en: "195 km from Daloa · Cavally · Delivery within 48–72h",
    },
    localContent: {
      fr: "Bloléquin, ville carrefour de la région du Cavally sur la route internationale, bénéficie des solutions de préfabrication béton industrielle 2CGC. Nos briques et pavés sont formulés pour résister aux contraintes climatiques et mécaniques des chantiers de l'extrême ouest.",
      en: "Bloléquin, a junction city in Cavally along the international highway, benefits from 2CGC industrial precast concrete solutions. Our blocks and pavers are engineered to withstand climate and mechanical demands in the western corridor.",
    },
  },
  {
    slug: "zouan-hounien",
    aliases: ["zouan-hein"],
    name: "Zouan-Hounien",
    region: "Tonkpi",
    lat: 6.9192,
    lng: -8.2131,
    distanceFromDaloa: 300,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Bassin minier et agricole du Tonkpi. 2CGC approvisionne les projets d'infrastructures et bâtiments à Zouan-Hounien en béton préfabriqué.",
      en: "Mining and agricultural basin of Tonkpi. 2CGC supplies infrastructure and building projects in Zouan-Hounien with precast concrete.",
    },
    metaTitle: {
      fr: "Béton Préfabriqué à Zouan-Hounien | 2CGC Daloa",
      en: "Precast Concrete in Zouan-Hounien | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques industrielles B60, hourdis et pavés à Zouan-Hounien sous 48–72h depuis Daloa. 2CGC, spécialiste du BTP en Côte d'Ivoire.",
      en: "Industrial B60 blocks, floor beams and pavers delivered to Zouan-Hounien within 48–72h from Daloa. 2CGC construction specialist.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton pour Zouan-Hounien",
      en: "Precast Concrete for Zouan-Hounien",
    },
    heroSubtitle: {
      fr: "300 km depuis Daloa · Région du Tonkpi · Grands projets",
      en: "300 km from Daloa · Tonkpi Region · Large projects",
    },
    localContent: {
      fr: "Avec son activité économique et minière florissante, Zouan-Hounien exige des matériaux de haute technicité. 2CGC répond aux besoins des entreprises minières, prestataires de travaux et promoteurs avec des briques B60 certifiées et des pavés haute densité pour voiries lourdes.",
      en: "With its flourishing economic and mining activity, Zouan-Hounien demands high-spec building materials. 2CGC meets the needs of mining firms, contractors and developers with certified B60 blocks and heavy-duty pavers.",
    },
  },
  {
    slug: "toulepleu",
    name: "Toulépleu",
    region: "Cavally",
    lat: 6.5794,
    lng: -8.4314,
    distanceFromDaloa: 245,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Département frontalier du Cavally dans l'extrême ouest. 2CGC assure la livraison sécurisée de préfabriqués béton pour tous vos chantiers à Toulépleu.",
      en: "Border department of Cavally in the extreme west. 2CGC ensures safe delivery of precast concrete for all jobsites in Toulépleu.",
    },
    metaTitle: {
      fr: "Livraison Briques & Béton à Toulépleu | 2CGC Daloa",
      en: "Concrete & Block Delivery to Toulépleu | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Briques, agglos, hourdis et pavés livrés à Toulépleu sous 48–72h depuis l'usine 2CGC Daloa. Devis gratuit, déchargement camion-grue sur chantier.",
      en: "Blocks, floor beams and pavers delivered to Toulépleu within 48–72h from 2CGC Daloa factory. Free quote, crane unloading on site.",
    },
    heroTitle: {
      fr: "Matériaux Béton Haute Résistance à Toulépleu",
      en: "High-Strength Concrete Materials in Toulépleu",
    },
    heroSubtitle: {
      fr: "245 km depuis Daloa · Cavally · Livraison sous 48–72h",
      en: "245 km from Daloa · Cavally · Delivery within 48–72h",
    },
    localContent: {
      fr: "Pour désenclaver les projets de construction à Toulépleu et garantir un niveau de qualité irréprochable, 2CGC met à disposition sa logistique industrielle. Nos briques et hourdis sont acheminés directement sur site pour les édifices publics, écoles, infrastructures et résidences privées.",
      en: "To support construction projects in Toulépleu with top industrial quality, 2CGC provides heavy-duty logistics. Our blocks and floor beams are brought directly to jobsites for public buildings, schools, infrastructure, and private homes.",
    },
  },
  {
    slug: "seguela",
    name: "Séguéla",
    region: "Worodougou",
    lat: 7.9611,
    lng: -6.6731,
    distanceFromDaloa: 140,
    deliveryDelay: { fr: "Livraison sous 48h", en: "Delivery within 48h" },
    description: {
      fr: "Chef-lieu de la région du Worodougou et grand pôle économique du nord-ouest. 2CGC dessert Séguéla en briques pleines B60, hourdis et pavés.",
      en: "Capital of the Worodougou region and economic hub of the northwest. 2CGC serves Séguéla with B60 solid blocks, floor beams and pavers.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Séguéla | 2CGC depuis Daloa",
      en: "Precast Concrete in Séguéla | 2CGC from Daloa",
    },
    metaDescription: {
      fr: "Livraison de briques pleines B60, hourdis et pavés à Séguéla sous 48h depuis Daloa (140 km). Tarifs usine, qualité industrielle certifiée.",
      en: "Delivery of B60 solid blocks, floor beams and pavers to Séguéla within 48h from Daloa (140 km). Factory pricing, certified industrial quality.",
    },
    heroTitle: {
      fr: "Fournisseur Béton pour Séguéla et le Worodougou",
      en: "Concrete Supplier for Séguéla and Worodougou",
    },
    heroSubtitle: {
      fr: "140 km depuis Daloa · Axe Vavoua–Séguéla · Livraison sous 48h",
      en: "140 km from Daloa · Vavoua–Séguéla route · Delivery within 48h",
    },
    localContent: {
      fr: "Séguéla, métropole en plein essor minier et urbain dans le Worodougou, est reliée directement à Daloa via l'axe bitumé de Vavoua. 2CGC fournit les briques de fondation B60, hourdis de plancher et pavés autobloquants nécessaires aux grands travaux d'aménagement de Séguéla.",
      en: "Séguéla, a booming mining and urban center in Worodougou, connects directly to Daloa via the paved Vavoua road. 2CGC supplies B60 foundation blocks, floor beams and pavers needed for major building works in Séguéla.",
    },
  },
  {
    slug: "gonate",
    aliases: ["konate"],
    name: "Gonaté",
    region: "Haut-Sassandra",
    lat: 6.9833,
    lng: -6.2833,
    distanceFromDaloa: 22,
    deliveryDelay: { fr: "Livraison express sous 24h", en: "Express delivery within 24h" },
    description: {
      fr: "Sous-préfecture du Haut-Sassandra à 22 km de Daloa sur l'axe Bouaflé. Livraison express sous 24h garantie pour tous vos chantiers.",
      en: "Subprefecture of Haut-Sassandra 22 km from Daloa on the Bouaflé road. Guaranteed express delivery within 24h for all jobsites.",
    },
    metaTitle: {
      fr: "Briques & Béton à Gonaté | Livraison Express 24h — 2CGC",
      en: "Blocks & Concrete in Gonaté | Express 24h Delivery — 2CGC",
    },
    metaDescription: {
      fr: "Livraison express 24h de briques, agglos, hourdis et pavés à Gonaté. Usine 2CGC Daloa à seulement 22 km. Tarifs directs usine.",
      en: "Express 24h delivery of blocks, floor beams and pavers to Gonaté. 2CGC Daloa factory just 22 km away. Direct factory prices.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton Livrés à Gonaté en Express",
      en: "Precast Concrete Delivered Express to Gonaté",
    },
    heroSubtitle: {
      fr: "22 km depuis l'usine Daloa · Livraison express 24h",
      en: "22 km from Daloa factory · 24h express delivery",
    },
    localContent: {
      fr: "À seulement 22 km de nos installations de Daloa sur la route nationale vers Bouaflé, Gonaté bénéficie d'une réactivité logistique maximale. Les chantiers de construction y sont livrés en quelques heures avec nos briques B60, hourdis et pavés au meilleur tarif transport du marché.",
      en: "Only 22 km from our Daloa plant on the national road to Bouaflé, Gonaté enjoys ultra-fast delivery. Construction sites are supplied within hours with our B60 blocks, floor beams and pavers at minimal freight costs.",
    },
  },
  {
    slug: "bonon",
    name: "Bonon",
    region: "Marahoué",
    lat: 6.9272,
    lng: -6.0467,
    distanceFromDaloa: 55,
    deliveryDelay: { fr: "Livraison sous 24h", en: "Delivery within 24h" },
    description: {
      fr: "Ville carrefour dynamique de la Marahoué entre Daloa et Bouaflé. 2CGC assure un approvisionnement rapide sous 24h pour tous vos chantiers à Bonon.",
      en: "Dynamic crossroads city in Marahoué between Daloa and Bouaflé. 2CGC provides fast delivery within 24h to all jobsites in Bonon.",
    },
    metaTitle: {
      fr: "Briques & Matériaux Béton à Bonon | 2CGC Daloa",
      en: "Concrete Blocks & Materials in Bonon | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Fournisseur de briques pleines, creuses, hourdis et pavés à Bonon sous 24h depuis Daloa (55 km). Qualité certifiée B60, devis proforma immédiat.",
      en: "Supplier of blocks, floor beams and pavers to Bonon within 24h from Daloa (55 km). Certified B60 quality, instant proforma quote.",
    },
    heroTitle: {
      fr: "Matériaux Béton Livrés à Bonon",
      en: "Concrete Materials Delivered to Bonon",
    },
    heroSubtitle: {
      fr: "55 km depuis Daloa · Axe A6 direct · Livraison sous 24h",
      en: "55 km from Daloa · Direct A6 route · Delivery within 24h",
    },
    localContent: {
      fr: "Située sur le corridor Daloa–Yamoussoukro à 55 km de l'usine 2CGC, Bonon connaît une forte croissance de ses constructions privées, commerciales et agricoles. 2CGC y livre sous 24 heures l'ensemble de ses gammes de blocs béton et pavés avec déchargement sécurisé sur chantier.",
      en: "Located on the Daloa–Yamoussoukro corridor 55 km from the 2CGC plant, Bonon experiences rapid growth in private and commercial construction. 2CGC delivers its full range of concrete blocks and pavers within 24 hours.",
    },
  },
  {
    slug: "bediala",
    name: "Bédiala",
    region: "Haut-Sassandra",
    lat: 7.1511,
    lng: -6.2978,
    distanceFromDaloa: 40,
    deliveryDelay: { fr: "Livraison express sous 24h", en: "Express delivery within 24h" },
    description: {
      fr: "Important carrefour du Haut-Sassandra au nord-est de Daloa. 2CGC approvisionne rapidement les chantiers de Bédiala en briques et hourdis.",
      en: "Important crossroads of Haut-Sassandra northeast of Daloa. 2CGC rapidly supplies Bédiala construction sites with blocks and floor beams.",
    },
    metaTitle: {
      fr: "Préfabriqués Béton à Bédiala | Livraison 24h — 2CGC",
      en: "Precast Concrete in Bédiala | 24h Delivery — 2CGC",
    },
    metaDescription: {
      fr: "Livraison de briques, agglos et hourdis à Bédiala sous 24h depuis l'usine 2CGC Daloa (40 km). Qualité B60 certifiée, devis gratuit.",
      en: "Delivery of blocks and floor beams to Bédiala within 24h from 2CGC Daloa (40 km). Certified B60 quality, free quote.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton pour Bédiala",
      en: "Precast Concrete for Bédiala",
    },
    heroSubtitle: {
      fr: "40 km depuis Daloa · Haut-Sassandra · Livraison 24h",
      en: "40 km from Daloa · Haut-Sassandra · 24h delivery",
    },
    localContent: {
      fr: "À seulement 40 km au nord-est de Daloa, Bédiala profite de notre proximité immédiate pour recevoir briques pleines, briques creuses et hourdis sous 24h ouvrées. Notre service logistique dessert régulièrement les maîtres d'œuvre et particuliers de la commune.",
      en: "Just 40 km northeast of Daloa, Bédiala benefits from our immediate proximity to receive solid blocks, hollow blocks and floor beams within 24 business hours. Our logistics team regularly serves builders across the commune.",
    },
  },
  {
    slug: "zuenoula",
    aliases: ["zenoula"],
    name: "Zuénoula",
    region: "Marahoué",
    lat: 7.4267,
    lng: -6.0494,
    distanceFromDaloa: 100,
    deliveryDelay: { fr: "Livraison sous 24–48h", en: "Delivery within 24–48h" },
    description: {
      fr: "Grand centre urbain et agro-industriel de la Marahoué. 2CGC livre ses préfabriqués béton haute performance sur les chantiers de Zuénoula.",
      en: "Major urban and agro-industrial center of Marahoué. 2CGC delivers high-performance precast concrete to Zuénoula construction sites.",
    },
    metaTitle: {
      fr: "Briques & Béton à Zuénoula | 2CGC Daloa",
      en: "Concrete & Blocks in Zuénoula | 2CGC Daloa",
    },
    metaDescription: {
      fr: "Fournisseur de briques B60, hourdis et pavés pour Zuénoula. Livraison 24–48h depuis l'usine 2CGC Daloa. Tarifs direct usine, devis en ligne.",
      en: "Supplier of B60 blocks, floor beams and pavers for Zuénoula. 24–48h delivery from 2CGC Daloa. Factory direct prices, online quote.",
    },
    heroTitle: {
      fr: "Béton Préfabriqué Livré à Zuénoula",
      en: "Precast Concrete Delivered to Zuénoula",
    },
    heroSubtitle: {
      fr: "100 km depuis Daloa · Marahoué · Livraison sous 24–48h",
      en: "100 km from Daloa · Marahoué · Delivery within 24–48h",
    },
    localContent: {
      fr: "Bassin agro-industriel de premier plan dans la Marahoué, Zuénoula fait appel aux préfabriqués 2CGC pour ses entrepôts, logements de fonction, commerces et résidences. Nos blocs B60 certifiés garantissent la solidité d'édifices soumis à un usage intensif.",
      en: "A premier agro-industrial basin in Marahoué, Zuénoula relies on 2CGC precast products for warehouses, staff housing, shops and residences. Our certified B60 blocks guarantee structural durability under intensive use.",
    },
  },
  {
    slug: "kani",
    name: "Kani",
    region: "Worodougou",
    lat: 8.4828,
    lng: -6.6025,
    distanceFromDaloa: 200,
    deliveryDelay: { fr: "Livraison sous 48–72h", en: "Delivery within 48–72h" },
    description: {
      fr: "Département du Worodougou au nord de Séguéla. 2CGC approvisionne les chantiers de Kani en préfabriqués béton industriels certifiés B60.",
      en: "Worodougou department north of Séguéla. 2CGC supplies Kani jobsites with industrial B60-certified precast concrete.",
    },
    metaTitle: {
      fr: "Matériaux Béton à Kani | Livraison depuis Daloa — 2CGC",
      en: "Concrete Materials in Kani | Delivery from Daloa — 2CGC",
    },
    metaDescription: {
      fr: "Briques pleines, hourdis et pavés livrés à Kani (Worodougou) sous 48–72h depuis Daloa. Usine 2CGC, normes certifiées, devis en ligne.",
      en: "Solid blocks, floor beams and pavers delivered to Kani within 48–72h from Daloa. 2CGC plant, certified standards, online quote.",
    },
    heroTitle: {
      fr: "Préfabriqués Béton pour les Chantiers de Kani",
      en: "Precast Concrete for Kani Construction Sites",
    },
    heroSubtitle: {
      fr: "200 km depuis Daloa · Région du Worodougou · Livraison 48–72h",
      en: "200 km from Daloa · Worodougou Region · 48–72h delivery",
    },
    localContent: {
      fr: "Située au nord de Séguéla dans le Worodougou, la ville de Kani est approvisionnée par les camions 2CGC pour tous travaux de génie civil et de bâtiment. Notre capacité de production industrielle permet d'acheminer des volumes importants de briques et de pavés dans des délais maîtrisés.",
      en: "Located north of Séguéla in Worodougou, Kani is supplied by 2CGC trucks for civil engineering and building projects. Our industrial production capacity allows us to ship large volumes of blocks and pavers on dependable schedules.",
    },
  },
];

export const getZoneBySlug = (slug: string): ZoneData | undefined => {
  const normalized = slug.toLowerCase().trim();
  return ZONES.find(
    (z) => z.slug === normalized || z.aliases?.some((a) => a.toLowerCase() === normalized)
  );
};

export const getZoneSlugs = (): string[] => {
  const slugs: string[] = [];
  for (const z of ZONES) {
    slugs.push(z.slug);
    if (z.aliases) {
      slugs.push(...z.aliases);
    }
  }
  return slugs;
};

