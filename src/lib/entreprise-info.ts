// src/lib/entreprise-info.ts — Informations Officielles & Légales de l'Entreprise 2CGC

export const ENTREPRISE_INFO = {
  raisonSociale: 'CHEICKNA CONSTRUCTION & GÉNIE CIVIL',
  sigle: '2CGC',
  formeJuridique: 'SARL Unipersonnel',
  formeJuridiqueComplete: 'SARL Unipersonnel au capital de 1.000.000 FCFA',
  capitalSocial: '1.000.000 FCFA',
  capitalSocialNumerique: 1000000,

  // Adresse & Siège
  adresseLigne: 'Quartier Commerce non loin de la Pharmacie Appaul',
  boitePostale: 'BP 129 Daloa',
  ville: 'Daloa',
  region: 'Haut-Sassandra',
  pays: 'Côte d\'Ivoire',
  adresseComplete: 'Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa (Côte d\'Ivoire)',

  // Contacts Téléphoniques & Digitaux
  telephone1: '+225 07 07 62 17 99',
  telephone2: '+225 07 07 85 76 29',
  telephonesFormat: '+225 07 07 62 17 99 / +225 07 07 85 76 29',
  telephonesIndicatif: '+225 07 07 62 17 99 / +225 07 07 85 76 29',
  telephoneMobileDG: '+225 07 07 62 17 99',
  emailOfficiel: 'cheicknaconstruction@gmail.com',
  siteWeb: process.env.NEXT_PUBLIC_SITE_URL || 'https://2cgc-industrie.com',


  // Immatriculation, Fiscalité & Juridique
  rccm: 'CI DAL 2013 B. 20779',
  numeroRC: 'CI DAL 2013 B. 20779',
  regimeImposition: 'REEL SIMPLIFIE Centre des impôts de Daloa 2',
  centreImpots: 'Centre des impôts de Daloa 2',
  compteContribuable: '8104005 C',
  ccNumero: '8104005 C',

  // Coordonnées Bancaires (RIB)
  banque: 'BSIC Daloa',
  banqueNomComplet: 'Banque Sahélo-Saharienne pour l\'Investissement et le Commerce (BSIC) — Agence Daloa',
  compteBancaire: 'CI154 08521 029041500015 04',
  rib: 'CI154 08521 029041500015 04',

  // Dirigeants
  directeurGeneral: 'KEITA BOUBACAR',
  directionCommerciale: 'Keita Dambou',

  // Horaires
  horaires: 'Lun–Sam : 7h–18h',

  // Google Business & Avis
  googleReviewUrl:
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    'https://www.google.com/search?q=2CGC+Cheickna+Construction+Daloa+avis',
  googleBusinessUrl:
    process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL ||
    'https://maps.google.com/?q=2CGC+Cheickna+Construction+Daloa',
};

export default ENTREPRISE_INFO;
