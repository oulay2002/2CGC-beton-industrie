// src/lib/faq-data.ts — Données FAQ partagées (affichage + Schema.org FAQPage)

export interface FaqItem {
  cat: string;
  q: { fr: string; en: string };
  a: { fr: string; en: string };
}

export const FAQ_CATEGORIES = [
  { id: "toutes", label: { fr: "Toutes les questions", en: "All questions" }, icon: "🔍" },
  { id: "produits", label: { fr: "Produits & Normes", en: "Products & Standards" }, icon: "🧱" },
  { id: "devis", label: { fr: "Devis & Commandes", en: "Quotes & Orders" }, icon: "🧮" },
  { id: "livraison", label: { fr: "Livraison & Chantier", en: "Delivery & Site" }, icon: "🚚" },
  { id: "paiement", label: { fr: "Paiement & B2B", en: "Payment & B2B" }, icon: "💳" },
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    cat: "livraison",
    q: {
      fr: "Quels sont les délais de livraison sur chantier ?",
      en: "What are the delivery lead times to construction sites?",
    },
    a: {
      fr: "Nos livraisons sont assurées sous 48 à 72 heures ouvrées après confirmation de votre commande. Pour les chantiers situés à Daloa et ses environs immédiats, des départs express sous 24h peuvent être programmés selon le volume disponible en usine.",
      en: "Our deliveries are fulfilled within 48 to 72 business hours after order confirmation. For sites located in Daloa and its immediate surroundings, express departures under 24 hours can be scheduled depending on available factory inventory.",
    },
  },
  {
    cat: "produits",
    q: {
      fr: "Quelle est la résistance mécanique des briques et agglos 2CGC ?",
      en: "What is the mechanical strength of 2CGC concrete blocks?",
    },
    a: {
      fr: "Nos briques pleines 20x20x50 et 15x20x50 bénéficient d'une résistance à la compression certifiée B60 (60 bars), convenant parfaitement aux murs porteurs et structures R+1, R+2 et plus. Nos briques creuses sont testées à la norme B50 pour les cloisons et élévations standard.",
      en: "Our solid 20x20x50 and 15x20x50 blocks feature certified B60 (60 bar) compressive strength, perfectly suited for load-bearing walls and multi-story buildings. Our hollow blocks are tested to the B50 standard for partitions and standard wall elevation.",
    },
  },
  {
    cat: "devis",
    q: {
      fr: "Comment obtenir un devis officiel et le télécharger en PDF ?",
      en: "How to get an official proforma quote and download it as PDF?",
    },
    a: {
      fr: "Vous pouvez utiliser notre configurateur de devis en ligne en sélectionnant vos produits et quantités : le montant HT, la TVA (18%) et le total TTC sont calculés instantanément, et vous pouvez télécharger votre devis PDF officiel ou le transmettre directement sur WhatsApp à nos dirigeants.",
      en: "You can use our online quotation configurator by selecting your products and quantities: the pre-tax amount, VAT (18%) and total TTC are calculated instantly. You can then download your official PDF invoice or send it directly via WhatsApp to our directors.",
    },
  },
  {
    cat: "produits",
    q: {
      fr: "Quelle est la différence entre les hourdis français et américains ?",
      en: "What is the difference between French and American type floor beams (hourdis)?",
    },
    a: {
      fr: "Les hourdis type français (hauteurs 12 cm et 15 cm) possèdent un profil traditionnel à alvéoles droites adapté aux poutrelles standard. Les hourdis type américain (16 cm et 20 cm) offrent des sections plus épaisses pour planchers à plus grande portée et charges lourdes.",
      en: "French-type floor beams (12 cm and 15 cm heights) feature a traditional straight-void profile designed for standard floor joists. American-type beams (16 cm and 20 cm) offer thicker sections for longer spans and heavier floor loads.",
    },
  },
  {
    cat: "livraison",
    q: {
      fr: "Livrez-vous en dehors de Daloa et à l'intérieur du pays ?",
      en: "Do you deliver outside Daloa and nationwide across Ivory Coast?",
    },
    a: {
      fr: "Oui, notre flotte approvisionne l'ensemble de la région du Haut-Sassandra (Issia, Vavoua, Zoukougbeu) ainsi que les grands axes vers Yamoussoukro, Bouaké, San Pedro et Abidjan. Les frais de transport sont calculés au plus juste selon la distance kilométrique et le cubage.",
      en: "Yes, our dedicated fleet supplies the entire Haut-Sassandra region (Issia, Vavoua, Zoukougbeu) as well as major axes towards Yamoussoukro, Bouaké, San Pedro and Abidjan. Transport costs are calculated accurately based on distance and volume.",
    },
  },
  {
    cat: "paiement",
    q: {
      fr: "Quels sont les moyens de paiement acceptés ?",
      en: "What payment methods are accepted?",
    },
    a: {
      fr: "Nous acceptons les virements bancaires sur notre compte officiel BSIC Daloa (RIB : CI154 08521 029041500015 04), les chèques certifiés d'entreprises à l'ordre de 2CGC SARL, ainsi que les règlements en agence. Les professionnels enregistrés en compte B2B peuvent convenir d'échéances adaptées.",
      en: "We accept bank transfers to our official BSIC Daloa account (RIB: CI154 08521 029041500015 04), certified corporate checks payable to 2CGC SARL, and on-site payments. Registered B2B clients can agree on milestone-based credit terms.",
    },
  },
  {
    cat: "paiement",
    q: {
      fr: "Les factures comportent-elles la TVA déductible ?",
      en: "Do your invoices include deductible VAT?",
    },
    a: {
      fr: "Absolument. 2CGC est une SARL enregistrée sous le régime fiscal du Réel Simplifié (Centre des Impôts de Daloa 2, Compte Contribuable N° 8104005 C). Toutes nos factures mentionnent la TVA légale de 18% récupérable par les entreprises de BTP.",
      en: "Absolutely. 2CGC is registered under the 'Réel Simplifié' tax regime (Daloa 2 Tax Center, Tax ID N° 8104005 C). All our invoices state the official 18% VAT recoverable by construction companies.",
    },
  },
  {
    cat: "devis",
    q: {
      fr: "Vendez-vous aux particuliers ou uniquement aux entreprises ?",
      en: "Do you sell to private homeowners or exclusively to businesses?",
    },
    a: {
      fr: "Nous accueillons aussi bien les particuliers construisant leur maison individuelle que les entreprises de BTP et promoteurs. Quel que soit le volume, vous bénéficiez de la même qualité industrielle garantie.",
      en: "We welcome private individuals building their private residences as warmly as commercial contractors and property developers. Regardless of order volume, you benefit from the same guaranteed industrial concrete quality.",
    },
  },
];
