// src/lib/generer-pdf.ts — Moteur de Génération de Devis & Factures Proforma 2CGC
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { LOGO_2CGC_BASE64 } from '@/lib/logo-base64';

export interface LignePDF {
  nom: string;
  specification?: string;
  quantite: number;
  prix: number;
  unite?: string;
}

export interface DevisData {
  reference: string;
  date: string;
  typeDoc?: 'proforma' | 'devis';
  client: {
    nom: string;
    entreprise?: string;
    telephone?: string;
    email: string;
    codePostal?: string;
    adresse?: string;
  };
  lignes: LignePDF[];
  recap: {
    totalHT: number;
    remiseTaux?: number;
    remiseMontant?: number;
    netHT?: number;
    tva: number;
    totalTTC: number;
    totalCO2?: number;
  };
  conditions?: {
    delaiLivraison?: string;
    validiteJours?: number;
    modalitePaiement?: string;
  };
}

// Formatage FCFA standard
export function formatFCFA(montant: number): string {
  return Math.round(montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

// Convertisseur de montant numérique en lettres en français (avec FCFA)
export function nombreEnLettres(n: number): string {
  const entier = Math.round(n);
  if (entier === 0) return 'zéro';

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
  const ados = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  function convertirCentaines(num: number): string {
    let res = '';
    const c = Math.floor(num / 100);
    const reste = num % 100;

    if (c === 1) res += 'cent ';
    else if (c > 1) res += unites[c] + ' cent' + (reste === 0 ? 's ' : ' ');

    if (reste >= 10 && reste <= 19) {
      res += ados[reste - 10] + ' ';
    } else {
      const d = Math.floor(reste / 10);
      const u = reste % 10;
      if (d === 7) {
        res += 'soixante-' + (u === 1 ? 'et-onze ' : ados[u] + ' ');
      } else if (d === 9) {
        res += 'quatre-vingt-' + ados[u] + ' ';
      } else {
        if (d > 0) res += dizaines[d] + (u === 1 && d < 8 ? ' et ' : (u > 0 ? '-' : ' '));
        if (u > 0) res += unites[u] + ' ';
      }
    }
    return res.trim();
  }

  const milliards = Math.floor(entier / 1000000000);
  const millions = Math.floor((entier % 1000000000) / 1000000);
  const milliers = Math.floor((entier % 1000000) / 1000);
  const reste = entier % 1000;

  let resultat = '';
  if (milliards > 0) resultat += (milliards === 1 ? 'un milliard ' : convertirCentaines(milliards) + ' milliards ');
  if (millions > 0) resultat += (millions === 1 ? 'un million ' : convertirCentaines(millions) + ' millions ');
  if (milliers > 0) resultat += (milliers === 1 ? 'mille ' : convertirCentaines(milliers) + ' mille ');
  if (reste > 0) resultat += convertirCentaines(reste);

  const texte = resultat.trim();
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function genererPDF(data: DevisData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const typeTitre = data.typeDoc === 'devis' ? 'DEVIS ESTIMATIF' : 'FACTURE PROFORMA';
  const prefixRef = data.reference.startsWith('DEV-') || data.reference.startsWith('PRO-') 
    ? data.reference 
    : `PRO-${data.reference}`;

  const dateDoc = new Date(data.date || Date.now());
  const dateValidite = new Date(dateDoc.getTime() + (data.conditions?.validiteJours || 30) * 86400000);

  // =============================================
  // 1. BANDEAU SUPÉRIEUR EXÉCUTIF 2CGC (PAGE 1)
  // =============================================
  // Fond principal bleu marine 2CGC
  doc.setFillColor(0, 43, 91); // #002B5B
  doc.rect(0, 0, 210, 46, 'F');

  // Liseré or décoratif
  doc.setFillColor(255, 215, 0); // #FFD700
  doc.rect(0, 46, 210, 2.5, 'F');

  // Logo officiel 2CGC translucide sans fond blanc
  try {
    doc.addImage(LOGO_2CGC_BASE64, 'PNG', 10, 8, 24, 18);
  } catch (e) {
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2CGC', 22, 20, { align: 'center' });
  }

  // Raison sociale & Titres
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CHEICKNA CONSTRUCTION & GÉNIE CIVIL', 38, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text('SARL Unipersonnel au capital de 1.000.000 FCFA', 38, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.text('RCCM : CI DAL 2013 B. 20779 • Compte Contribuables CC N° : 8104005 C', 38, 24);
  doc.text('Régime : RÉEL SIMPLIFIÉ Centre des impôts de Daloa 2', 38, 29);
  doc.text('Siège : Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa', 38, 34);
  doc.text('Tél : +225 07 07 62 17 99 / 07 07 85 76 29 • Email : cheicknaconstruction@gmail.com', 38, 39);
  doc.text('Compte Bancaire : BSIC Daloa — RIB : CI154 08521 029041500015 04', 38, 44);

  // =============================================
  // 2. EN-TÊTE DOCUMENT & DESTINATAIRE
  // =============================================
  // Cadre Document (Gauche)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 53, 90, 39, 3, 3, 'F');
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 53, 90, 39, 3, 3, 'S');

  doc.setFillColor(0, 43, 91);
  doc.roundedRect(12, 53, 90, 8.5, 3, 3, 'F');
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(typeTitre, 16, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Réf. Document :', 16, 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(prefixRef, 46, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Date d\'émission :', 16, 74);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateDoc.toLocaleDateString('fr-FR'), 46, 74);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Validité offre :', 16, 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${dateValidite.toLocaleDateString('fr-FR')} (${data.conditions?.validiteJours || 30} jours)`, 46, 80);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Devise :', 16, 86);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Francs CFA (XOF)', 46, 86);

  // Cadre Client (Droite)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, 53, 90, 39, 3, 3, 'F');
  doc.setDrawColor(255, 215, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(108, 53, 90, 39, 3, 3, 'S');

  doc.setFillColor(255, 215, 0);
  doc.roundedRect(108, 53, 90, 8.5, 3, 3, 'F');
  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENT / DONNEUR D\'ORDRE B2B', 112, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const nomClient = data.client.entreprise || data.client.nom || 'Client Particulier';
  doc.text(nomClient.toUpperCase(), 112, 68);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Contact : ${data.client.nom || nomClient}`, 112, 74);
  doc.text(`Tél / WhatsApp : ${data.client.telephone || 'Non renseigné'}`, 112, 80);
  doc.text(`Lieu livraison / Chantier : ${data.client.codePostal || data.client.adresse || 'Daloa & Région'}`, 112, 86);

  // =============================================
  // 3. TABLEAU DES ARTICLES (AUTOTABLE)
  // =============================================
  const tableData = data.lignes.map((l, index) => [
    (index + 1).toString().padStart(2, '0'),
    l.nom,
    l.specification || 'Norme B50/B60 - Vibré haute densité',
    l.quantite.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    formatFCFA(l.prix),
    formatFCFA(l.quantite * l.prix),
  ]);

  autoTable(doc, {
    startY: 97,
    margin: { top: 22, bottom: 26, left: 12, right: 12 },
    head: [['N°', 'Désignation des Matériaux & Ouvrages', 'Spécifications Techniques', 'Qté', 'P.U. HT', 'Montant HT']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 43, 91],
      textColor: [255, 215, 0],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 58, fontStyle: 'bold', textColor: [0, 43, 91] },
      2: { cellWidth: 54, fontSize: 7.5, textColor: [71, 85, 105] },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (dataArg: any) => {
      // Header récurrent pour les pages 2+
      if (dataArg.pageNumber > 1) {
        doc.setFillColor(0, 43, 91);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setFillColor(255, 215, 0);
        doc.rect(0, 15, 210, 1, 'F');
        doc.setTextColor(255, 215, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)', 12, 10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${typeTitre} N° ${prefixRef}`, 198, 10, { align: 'right' });
      }
    }
  });

  // =============================================
  // 4. RÉCAPITULATIF FINANCIER & ARRÊTÉ EN LETTRES
  // =============================================
  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Si l'espace restant sur la page est insuffisant pour les totaux + signatures, créer une nouvelle page
  if (finalY + 95 > 275) {
    doc.addPage();
    finalY = 22;
  }

  // Encadré Conditions & Modalités (Gauche)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, finalY, 98, 45, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, finalY, 98, 45, 2.5, 2.5, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONDITIONS GÉNÉRALES & RÈGLEMENT', 16, finalY + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('• Modalité : Acompte 50% à la commande, solde avant déchargement.', 16, finalY + 12);
  doc.text('• Domiciliation : BSIC Daloa — RIB : CI154 08521 029041500015 04', 16, finalY + 17);
  doc.text('• CC N° : 8104005 C • Régime : RÉEL SIMPLIFIÉ Daloa 2', 16, finalY + 22);
  doc.text('• Délai de livraison : 24h à 72h ouvrées selon ordre de passage.', 16, finalY + 27);
  doc.text('• Manutention : Camion-grue 2CGC sur chantier accessible.', 16, finalY + 32);

  if (data.recap.totalCO2) {
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text(`🌱 Empreinte carbone estimée du lot : ${data.recap.totalCO2.toFixed(1)} kg CO2e`, 16, finalY + 39);
  }

  // Tableau Totaux Financiers (Droite)
  const xTotauxLabel = 118;
  const xTotauxVal = 198;

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total Brut HT :', xTotauxLabel, finalY + 5);
  doc.text(formatFCFA(data.recap.totalHT), xTotauxVal, finalY + 5, { align: 'right' });

  // Remise éventuelle
  let yDecalage = finalY + 11;
  if (data.recap.remiseMontant && data.recap.remiseMontant > 0) {
    doc.setTextColor(185, 28, 28);
    doc.text(`Remise Commerciale (-${data.recap.remiseTaux || 0}%) :`, xTotauxLabel, yDecalage);
    doc.text(`- ${formatFCFA(data.recap.remiseMontant)}`, xTotauxVal, yDecalage, { align: 'right' });
    yDecalage += 6;

    doc.setTextColor(71, 85, 105);
    doc.text('Net Commercial HT :', xTotauxLabel, yDecalage);
    doc.text(formatFCFA(data.recap.netHT || (data.recap.totalHT - data.recap.remiseMontant)), xTotauxVal, yDecalage, { align: 'right' });
    yDecalage += 6;
  }

  doc.setTextColor(71, 85, 105);
  doc.text('TVA Collectée (18%) :', xTotauxLabel, yDecalage);
  doc.text(formatFCFA(data.recap.tva), xTotauxVal, yDecalage, { align: 'right' });
  yDecalage += 7;

  // Boîte Total TTC Dorée & Marine (Largeur 84mm parfaitement ajustée)
  const xBoxStart = 114;
  const boxWidth = 84;
  doc.setFillColor(0, 43, 91);
  doc.roundedRect(xBoxStart, yDecalage - 3, boxWidth, 13, 2, 2, 'F');
  doc.setFillColor(255, 215, 0);
  doc.rect(xBoxStart, yDecalage + 9, boxWidth, 1, 'F');

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NET À PAYER TTC :', xBoxStart + 4, yDecalage + 5.5);

  doc.setFontSize(10.5);
  doc.text(formatFCFA(data.recap.totalTTC), xBoxStart + boxWidth - 4, yDecalage + 5.5, { align: 'right' });

  // Arrêté en lettres (Obligation fiscale et bancaire en CI)
  const yLettres = Math.max(finalY + 48, yDecalage + 15);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, yLettres, 184, 11, 2, 2, 'F');
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, yLettres, 184, 11, 2, 2, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ARRÊTÉ DU PRÉSENT DEVIS :', 16, yLettres + 4.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(15, 23, 42);
  const montantLettres = nombreEnLettres(data.recap.totalTTC);
  doc.text(`« Arrêtée la présente facture proforma à la somme de : ${montantLettres} Francs CFA TTC. »`, 16, yLettres + 8.5);

  // =============================================
  // 5. CACHET OFFICIEL & SIGNATURE DIRECTION
  // =============================================
  const ySignature = yLettres + 14;

  // Mention client bon pour accord
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Mention obligatoire du client :', 20, ySignature + 4);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('« Bon pour accord et commande ferme »', 20, ySignature + 9);
  doc.text('Date et signature du client :', 20, ySignature + 15);

  // Cadre cachet Direction 2CGC (Centré)
  const xSignCenter = 152;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.setFontSize(8.5);
  doc.text('Pour CHEICKNA CONSTRUCTION & GÉNIE CIVIL', xSignCenter, ySignature + 4, { align: 'center' });
  doc.setFontSize(8);
  doc.text('La Direction Générale', xSignCenter, ySignature + 9, { align: 'center' });

  // Simulation cachet circulaire officiel certifié
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.6);
  doc.circle(xSignCenter, ySignature + 22, 12.5);
  doc.setLineWidth(0.2);
  doc.circle(xSignCenter, ySignature + 22, 10.5);
  doc.setFontSize(5);
  doc.setTextColor(0, 43, 91);
  doc.text('2CGC SARL — DALOA', xSignCenter, ySignature + 18, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('CERTIFIÉ CONFORME', xSignCenter, ySignature + 22, { align: 'center' });
  doc.setFontSize(5);
  doc.text('KEITA BOUBACAR', xSignCenter, ySignature + 25, { align: 'center' });

  // =============================================
  // 6. PIED DE PAGE LÉGAL (TOUTES LES PAGES)
  // =============================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, 282, 198, 282);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      '2CGC — SARL Unipersonnel au capital de 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C',
      105,
      286,
      { align: 'center' }
    );
    doc.text(
      'Régime : RÉEL SIMPLIFIÉ Daloa 2 • BSIC Daloa RIB : CI154 08521 029041500015 04 • Tél : +225 07 07 62 17 99 / 07 07 85 76 29',
      105,
      290,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 43, 91);
    doc.text(`Page ${i} / ${totalPages}`, 198, 286, { align: 'right' });
  }

  // Sauvegarde automatique du PDF
  const nomFichier = `2CGC_Proforma_${prefixRef.replace(/\s+/g, '_')}.pdf`;
  doc.save(nomFichier);
  return nomFichier;
}