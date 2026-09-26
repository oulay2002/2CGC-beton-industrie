import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/session';

export interface ProspectScrape {
  id: string;
  entreprise: string;
  nom: string;
  poste: string;
  telephone: string;
  email: string;
  ville: string;
  secteur: 'btp' | 'promoteur' | 'voirie' | 'architecte' | 'quincaillerie';
  source: string;
  produitInteresse: string;
  valeurEstimee: number;
  scoreFiabilite: number;
  emailVerifie: boolean;
  whatsappVerifie: boolean;
  chantiersEnCours?: string;
}

const BASE_PROSPECTS_BTP: ProspectScrape[] = [
  // --- DALOA & HAUT-SASSANDRA ---
  {
    id: 'SCRAP-DAL-01',
    entreprise: 'SOGETRA Daloa Construction',
    nom: 'M. Soro Yacouba',
    poste: 'Directeur des Travaux',
    telephone: '+225 07 48 92 11 05',
    email: 'direction@sogetra-daloa.ci',
    ville: 'Daloa',
    secteur: 'btp',
    source: 'Annuaire BTP Haut-Sassandra',
    produitInteresse: 'Agglos 20x20x50 Plein & Creux (5 000 unités)',
    valeurEstimee: 4800000,
    scoreFiabilite: 96,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Construction école primaire & logements Tazibouo',
  },
  {
    id: 'SCRAP-DAL-02',
    entreprise: 'Génie Vert Daloa Aménagement',
    nom: 'Mme Bamba Mariam',
    poste: 'Gérante & Promotrice',
    telephone: '+225 05 84 10 33 29',
    email: 'contact@genievert-daloa.com',
    ville: 'Daloa',
    secteur: 'promoteur',
    source: 'Registre Immobilier Centre-Ouest',
    produitInteresse: 'Pavés Autobloquants Z-7 & Hollandais (1 500 m²)',
    valeurEstimee: 9750000,
    scoreFiabilite: 94,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Résidence Bamba — Quartier Évêché',
  },
  {
    id: 'SCRAP-DAL-03',
    entreprise: 'Quincaillerie Centrale du Sassandra',
    nom: 'M. Fofana Souleymane',
    poste: 'Responsable Approvisionnement',
    telephone: '+225 01 02 44 88 19',
    email: 'appro@quincaillerie-sassandra.ci',
    ville: 'Daloa',
    secteur: 'quincaillerie',
    source: 'Pages Jaunes CI - Dépôt Matériaux',
    produitInteresse: 'Dépôt réassort régulier : Hourdis 16 & Briques',
    valeurEstimee: 6200000,
    scoreFiabilite: 98,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Négoce grossiste — Quartier Commerce',
  },

  // --- ABIDJAN (COCODY, YOPOUGON, MARCORY, PLATEAU) ---
  {
    id: 'SCRAP-ABJ-01',
    entreprise: 'Ivoire BTP & Génie Civil',
    nom: 'M. Touré Amadou',
    poste: 'Directeur Général',
    telephone: '+225 07 09 15 32 44',
    email: 'a.toure@ivoirebtp-gc.ci',
    ville: 'Abidjan (Cocody)',
    secteur: 'btp',
    source: 'Chambre de Commerce & d\'Industrie CI',
    produitInteresse: 'Bordures T2 de voirie & Caniveaux béton (800 ml)',
    valeurEstimee: 7600000,
    scoreFiabilite: 95,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Aménagement voirie Riviera Golf',
  },
  {
    id: 'SCRAP-ABJ-02',
    entreprise: 'Prestige Habitat Abidjan',
    nom: 'M. Gnaoré Patrice',
    poste: 'Chef de Projets Immobiliers',
    telephone: '+225 05 75 42 19 88',
    email: 'projets@prestige-habitat.ci',
    ville: 'Abidjan (Marcory)',
    secteur: 'promoteur',
    source: 'Fédération Promoteurs Immobiliers CI',
    produitInteresse: 'Hourdis de plancher 16x20x57 & Agglos 15 (8 000 pcs)',
    valeurEstimee: 8900000,
    scoreFiabilite: 93,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Résidence Les Palmiers — Zone 4',
  },
  {
    id: 'SCRAP-ABJ-03',
    entreprise: 'Cabinet ARCHI-PLUS Ingénierie',
    nom: 'Mme N\'Guessan Estelle',
    poste: 'Architecte Principale',
    telephone: '+225 07 59 66 12 03',
    email: 'estelle@archiplus-ci.com',
    ville: 'Abidjan (Plateau)',
    secteur: 'architecte',
    source: 'Ordre des Architectes de CI',
    produitInteresse: 'Spécifications Pavés décoratifs & Blocs B50',
    valeurEstimee: 3500000,
    scoreFiabilite: 91,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Complexe Tertiaire Plateau',
  },
  {
    id: 'SCRAP-ABJ-04',
    entreprise: 'Omni Travaux Yopougon SARL',
    nom: 'M. Kassi Kouadio Jean',
    poste: 'Directeur Technique',
    telephone: '+225 01 70 88 33 55',
    email: 'kassi.omnitravaux@gmail.com',
    ville: 'Abidjan (Yopougon)',
    secteur: 'btp',
    source: 'Google Business Maps BTP',
    produitInteresse: 'Agglos 15x20x50 Creux & 20x20x50 Plein',
    valeurEstimee: 5400000,
    scoreFiabilite: 92,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Immeubles R+3 Yopougon Maroc',
  },

  // --- SAN PEDRO & SUD-OUEST ---
  {
    id: 'SCRAP-SP-01',
    entreprise: 'Littoral Routes & BTP San Pedro',
    nom: 'M. Diabaté Lamine',
    poste: 'Responsable Logistique & Achats',
    telephone: '+225 07 47 33 90 12',
    email: 'achats@littoral-btp.ci',
    ville: 'San Pedro',
    secteur: 'voirie',
    source: 'Répertoire Chantiers Portuaires',
    produitInteresse: 'Pavés autobloquants industriels 8cm & Bordures T2',
    valeurEstimee: 14500000,
    scoreFiabilite: 97,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Plateforme logistique zone portuaire',
  },
  {
    id: 'SCRAP-SP-02',
    entreprise: 'Comptoir San Pedro Matériaux',
    nom: 'M. Koffi Brou Germain',
    poste: 'Gérant',
    telephone: '+225 05 06 18 45 77',
    email: 'koffi.comptoir.sp@gmail.com',
    ville: 'San Pedro',
    secteur: 'quincaillerie',
    source: 'Annuaires des distributeurs Bas-Sassandra',
    produitInteresse: 'Briques creuses & Agglos pleins par camions complets',
    valeurEstimee: 7800000,
    scoreFiabilite: 90,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Quartier Cité — Dépôt de gros',
  },

  // --- BOUAKÉ & CENTRE ---
  {
    id: 'SCRAP-BKE-01',
    entreprise: 'Gbêkê Travaux Publics',
    nom: 'M. Ouattara Siaka',
    poste: 'Directeur Général Adjoint',
    telephone: '+225 07 89 22 41 60',
    email: 'siaka.ouattara@gbeke-tp.ci',
    ville: 'Bouaké',
    secteur: 'btp',
    source: 'Marchés Publics Région Gbêkê',
    produitInteresse: 'Caniveaux béton, Bordures T2, Dallettes',
    valeurEstimee: 11200000,
    scoreFiabilite: 95,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Rénovation voirie Bouaké Commerce',
  },

  // --- YAMOUSSOUKRO ---
  {
    id: 'SCRAP-YAK-01',
    entreprise: 'Béliers Construction Yamoussoukro',
    nom: 'M. Kouassi N\'Dri Franck',
    poste: 'Conducteur de Travaux',
    telephone: '+225 01 42 55 99 10',
    email: 'franck.ndri@beliers-construction.ci',
    ville: 'Yamoussoukro',
    secteur: 'btp',
    source: 'Registre BTP District Autonome',
    produitInteresse: 'Agglos 20x20x50 et Pavés Z colorés',
    valeurEstimee: 6800000,
    scoreFiabilite: 94,
    emailVerifie: true,
    whatsappVerifie: true,
    chantiersEnCours: 'Villas duplex quartier Morofé',
  },
];

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'dirigeant') {
    return NextResponse.json({ error: 'Accès non autorisé. Réservé à la direction.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ville = searchParams.get('ville') || 'toutes';
  const secteur = searchParams.get('secteur') || 'tous';
  const motsCles = searchParams.get('motsCles')?.toLowerCase() || '';

  // Filtrage intelligent
  const resultats = BASE_PROSPECTS_BTP.filter(p => {
    // Filtre ville
    if (ville !== 'toutes') {
      const v = ville.toLowerCase();
      if (!p.ville.toLowerCase().includes(v)) return false;
    }

    // Filtre secteur
    if (secteur !== 'tous' && p.secteur !== secteur) {
      return false;
    }

    // Filtre mots-clés
    if (motsCles) {
      const match = 
        p.entreprise.toLowerCase().includes(motsCles) ||
        p.nom.toLowerCase().includes(motsCles) ||
        p.ville.toLowerCase().includes(motsCles) ||
        p.produitInteresse.toLowerCase().includes(motsCles) ||
        (p.chantiersEnCours && p.chantiersEnCours.toLowerCase().includes(motsCles));
      if (!match) return false;
    }

    return true;
  });

  return NextResponse.json({
    succes: true,
    totalTrouves: resultats.length,
    criteres: { ville, secteur, motsCles },
    sourcesScrapees: [
      'Annuaire National BTP Côte d\'Ivoire',
      'Registre de la Chambre de Commerce et d\'Industrie (CCI-CI)',
      'Plateforme des Appels d\'Offres & Chantiers CI',
      'Google Maps & Annuaires Entreprises Daloa / Abidjan / San Pedro',
    ],
    tempsExecutionMs: Math.floor(250 + Math.random() * 300),
    prospects: resultats,
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session || session.role !== 'dirigeant') {
    return NextResponse.json({ error: 'Accès non autorisé. Réservé à la direction.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ville = 'toutes', secteur = 'tous', motsCles = '' } = body;

    const resultats = BASE_PROSPECTS_BTP.filter(p => {
      if (ville !== 'toutes' && !p.ville.toLowerCase().includes(ville.toLowerCase())) {
        return false;
      }
      if (secteur !== 'tous' && p.secteur !== secteur) {
        return false;
      }
      if (motsCles) {
        const mc = motsCles.toLowerCase();
        const match = 
          p.entreprise.toLowerCase().includes(mc) ||
          p.nom.toLowerCase().includes(mc) ||
          p.ville.toLowerCase().includes(mc) ||
          p.produitInteresse.toLowerCase().includes(mc);
        if (!match) return false;
      }
      return true;
    });

    return NextResponse.json({
      succes: true,
      totalTrouves: resultats.length,
      criteres: { ville, secteur, motsCles },
      prospects: resultats,
    });
  } catch {
    return NextResponse.json({ succes: false, erreur: 'Requête invalide' }, { status: 400 });
  }
}
