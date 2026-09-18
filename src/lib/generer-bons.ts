// src/lib/generer-bons.ts — Moteur de Génération de Bons de Commande (BC) & Bons de Livraison (BL) 2CGC
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { LOGO_2CGC_BASE64 } from '@/lib/logo-base64';
import { nombreEnLettres } from './generer-pdf';

export interface ArticleBon {
  nom: string;
  specification?: string;
  quantite: number;
  prix?: number;
  unite?: string;
}

export interface BonData {
  reference: string;
  date: string;
  client: { nom: string; entreprise: string; email: string; telephone: string; adresse: string };
  articles: ArticleBon[];
  total?: number;
  type: 'commande' | 'livraison';
  numeroBon?: string;
  dateLivraisonPrevue?: string;
  chauffeur?: string;
  immatriculation?: string;
  signatureClientDataUrl?: string;
}

function formatFCFA(montant: number): string {
  return Math.round(montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export function genererBonCommande(data: BonData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const refBC = data.reference.startsWith('BC-') ? data.reference : `BC-${data.reference.replace(/^CMD-/, '')}`;
  const dateDoc = new Date(data.date || Date.now());

  // =============================================
  // 1. BANDEAU SUPÉRIEUR EXÉCUTIF 2CGC
  // =============================================
  doc.setFillColor(0, 43, 91); // #002B5B
  doc.rect(0, 0, 210, 46, 'F');

  doc.setFillColor(255, 215, 0); // #FFD700
  doc.rect(0, 46, 210, 2.5, 'F');

  // Logo officiel 2CGC sans fond blanc (PNG transparent)
  try {
    doc.addImage(LOGO_2CGC_BASE64, 'PNG', 10, 8, 24, 18);
  } catch (e) {
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2CGC', 22, 20, { align: 'center' });
  }

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
  doc.text('Quartier Commerce non loin de la Pharmacie Appaul BP 129 Daloa • Tél : +225 07 07 62 17 99 / 07 07 85 76 29', 38, 29);
  doc.text('Régime : RÉEL SIMPLIFIÉ Daloa 2 • BSIC Daloa RIB : CI154 08521 029041500015 04', 38, 34);
  doc.text('Email : cheicknaconstruction@gmail.com • Usine de fabrication béton vibré haute densité', 38, 39);

  // =============================================
  // 2. EN-TÊTE BON DE COMMANDE
  // =============================================
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
  doc.text('BON DE COMMANDE OFFICIEL', 16, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('N° Commande :', 16, 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(refBC, 46, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Date d\'émission :', 16, 74);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateDoc.toLocaleDateString('fr-FR'), 46, 74);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Statut usine :', 16, 80);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ Validé & Programmé', 46, 80);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Devise :', 16, 86);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Francs CFA (XOF)', 46, 86);

  // Bloc Client
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
  doc.text('CLIENT / FACTURÉ À', 112, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const nomClient = data.client.entreprise || data.client.nom;
  doc.text(nomClient.toUpperCase(), 112, 68);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.text(`Contact : ${data.client.nom}`, 112, 74);
  doc.text(`Tél / WhatsApp : ${data.client.telephone || 'Non renseigné'}`, 112, 80);
  doc.text(`Adresse livraison : ${data.client.adresse || 'Daloa / Chantier'}`, 112, 86);

  // =============================================
  // 3. TABLEAU DES ARTICLES (AUTOTABLE)
  // =============================================
  const tableData = data.articles.map((a, idx) => [
    (idx + 1).toString().padStart(2, '0'),
    a.nom,
    a.specification || 'Béton haute performance B50/B60',
    a.quantite.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    a.prix ? formatFCFA(a.prix) : 'Inclus',
    a.prix ? formatFCFA(a.quantite * a.prix) : '-'
  ]);

  autoTable(doc, {
    startY: 97,
    margin: { top: 22, bottom: 26, left: 12, right: 12 },
    head: [['N°', 'Désignation Matériaux & Agglomérés', 'Spécification Technique', 'Quantité', 'P.U. HT', 'Montant HT']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 43, 91], textColor: [255, 215, 0], fontStyle: 'bold', fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 64, fontStyle: 'bold', textColor: [0, 43, 91] },
      2: { cellWidth: 50, fontSize: 7.5, textColor: [71, 85, 105] },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (dataArg: any) => {
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
        doc.text(`BON DE COMMANDE N° ${refBC}`, 198, 10, { align: 'right' });
      }
    }
  });

  // =============================================
  // 4. TOTAUX & ÉCHÉANCIER DE PAIEMENT
  // =============================================
  let finalY = (doc as any).lastAutoTable.finalY + 6;
  if (finalY + 95 > 275) {
    doc.addPage();
    finalY = 22;
  }

  const totalTTC = data.total || 0;
  const acompte50 = Math.round(totalTTC * 0.5);
  const solde50 = totalTTC - acompte50;

  // Encadré Échéancier Règlement (Gauche)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, finalY, 98, 42, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, finalY, 98, 42, 2.5, 2.5, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ÉCHÉANCIER & MODALITÉS DE PAIEMENT', 16, finalY + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text(`• Acompte de 50% à la commande : ${formatFCFA(acompte50)}`, 16, finalY + 13);
  doc.text(`• Solde de 50% à la livraison sur site : ${formatFCFA(solde50)}`, 16, finalY + 19);
  doc.text('• Domiciliation bancaire : BSIC Daloa', 16, finalY + 25);
  doc.text('  RIB : CI154 08521 029041500015 04', 16, finalY + 30);
  doc.text('• Flotte 2CGC : Déchargement camion-grue inclus.', 16, finalY + 36);

  // Totaux (Droite)
  if (totalTTC > 0) {
    const xBoxBC = 114;
    const boxBCWidth = 84;
    doc.setFillColor(0, 43, 91);
    doc.roundedRect(xBoxBC, finalY + 10, boxBCWidth, 14, 2, 2, 'F');
    doc.setFillColor(255, 215, 0);
    doc.rect(xBoxBC, finalY + 23, boxBCWidth, 1, 'F');

    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL DE LA COMMANDE :', xBoxBC + 4, finalY + 19);
    doc.setFontSize(10.5);
    doc.text(formatFCFA(totalTTC), xBoxBC + boxBCWidth - 4, finalY + 19, { align: 'right' });
  }

  // Arrêté en lettres
  const yLettres = finalY + 46;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, yLettres, 184, 11, 2, 2, 'F');
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, yLettres, 184, 11, 2, 2, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ARRÊTÉ DU BON DE COMMANDE :', 16, yLettres + 4.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(15, 23, 42);
  const montantLettres = nombreEnLettres(totalTTC);
  doc.text(`« Arrêté le présent bon de commande à la somme de : ${montantLettres} Francs CFA TTC. »`, 16, yLettres + 8.5);

  // =============================================
  // 5. CACHET & DOUBLE SIGNATURE
  // =============================================
  const ySignature = yLettres + 14;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Visa & Signature du Client Réceptionnaire :', 20, ySignature + 4);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('« Bon pour commande et accord des CGV »', 20, ySignature + 9);

  const xSignCenterBC = 152;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.setFontSize(8.5);
  doc.text('Pour CHEICKNA CONSTRUCTION & GÉNIE CIVIL', xSignCenterBC, ySignature + 4, { align: 'center' });
  doc.setFontSize(8);
  doc.text('La Direction Commerciale', xSignCenterBC, ySignature + 9, { align: 'center' });

  // Simulation cachet circulaire officiel
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.6);
  doc.circle(xSignCenterBC, ySignature + 22, 12);
  doc.setLineWidth(0.2);
  doc.circle(xSignCenterBC, ySignature + 22, 10);
  doc.setFontSize(5);
  doc.setTextColor(0, 43, 91);
  doc.text('2CGC SARL — DALOA', xSignCenterBC, ySignature + 18, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('DIRECTION COMMERCIALE', xSignCenterBC, ySignature + 22, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('COMMANDE VALIDÉE', xSignCenterBC, ySignature + 25, { align: 'center' });

  // Pied de page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 282, 198, 282);
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC) • SARL Unipersonnel • RCCM CI DAL 2013 B. 20779 • CC N° 8104005 C', 105, 286, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 43, 91);
    doc.text(`Page ${i} / ${totalPages}`, 198, 286, { align: 'right' });
  }

  doc.save(`2CGC_Bon_Commande_${refBC}.pdf`);
}

export function genererBonLivraison(data: BonData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const refBL = data.numeroBon || (data.reference.startsWith('BL-') ? data.reference : `BL-${data.reference.replace(/^CMD-/, '')}`);
  const dateDoc = new Date(data.date || Date.now());

  // =============================================
  // 1. BANDEAU SUPÉRIEUR EXÉCUTIF 2CGC
  // =============================================
  doc.setFillColor(0, 43, 91);
  doc.rect(0, 0, 210, 46, 'F');

  doc.setFillColor(255, 215, 0);
  doc.rect(0, 46, 210, 2.5, 'F');

  // Logo officiel 2CGC sans fond blanc (PNG transparent)
  try {
    doc.addImage(LOGO_2CGC_BASE64, 'PNG', 10, 8, 24, 18);
  } catch (e) {
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2CGC', 22, 20, { align: 'center' });
  }

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
  doc.text('Usine & Parc à Béton : Daloa Quartier Commerce non loin de la Pharmacie Appaul', 38, 29);
  doc.text('Tél : +225 07 07 62 17 99 / 07 07 85 76 29 • Flotte de Camions-Grues 15 Tonnes', 38, 34);
  doc.text('Email : cheicknaconstruction@gmail.com • Contrôle qualité continu B50/B60', 38, 39);

  // =============================================
  // 2. BLOC DOCUMENT & DESTINATAIRE / LOGISTIQUE
  // =============================================
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 53, 90, 40, 3, 3, 'F');
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 53, 90, 40, 3, 3, 'S');

  doc.setFillColor(0, 43, 91);
  doc.roundedRect(12, 53, 90, 8.5, 3, 3, 'F');
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BORDEREAU DE LIVRAISON OFFICIEL', 16, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('N° de Bordereau :', 16, 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(refBL, 48, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Date expédition :', 16, 74);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateDoc.toLocaleDateString('fr-FR'), 48, 74);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Réf. Commande :', 16, 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.reference, 48, 80);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 43, 91);
  doc.text('Heure de départ :', 16, 86);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} GMT`, 48, 86);

  // Bloc Destinataire & Transporteur
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, 53, 90, 40, 3, 3, 'F');
  doc.setDrawColor(255, 215, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(108, 53, 90, 40, 3, 3, 'S');

  doc.setFillColor(255, 215, 0);
  doc.roundedRect(108, 53, 90, 8.5, 3, 3, 'F');
  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESTINATAIRE & FLOTTE TRANSPORT', 112, 59);

  doc.setTextColor(0, 43, 91);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const nomClient = data.client.entreprise || data.client.nom;
  doc.text(nomClient.toUpperCase(), 112, 68);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.text(`Chantier : ${data.client.adresse || 'Daloa & Environs'}`, 112, 74);
  doc.text(`Chauffeur : ${data.chauffeur || 'M. Kouadio (Flotte 2CGC)'}`, 112, 80);
  doc.text(`Véhicule : ${data.immatriculation || 'Camion Plateau 15T 2CGC'}`, 112, 86);

  // =============================================
  // 3. TABLEAU DES ARTICLES À RÉCEPTIONNER
  // =============================================
  const tableData = data.articles.map((a, idx) => [
    (idx + 1).toString().padStart(2, '0'),
    a.nom,
    a.quantite.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    '[  ] Conforme',
    '[  ] RAS'
  ]);

  autoTable(doc, {
    startY: 98,
    margin: { top: 22, bottom: 26, left: 12, right: 12 },
    head: [['N°', 'Désignation des Matériaux Enlevés usine', 'Qté Chargée', 'Contrôle Réception', 'État Colisage']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 43, 91], textColor: [255, 215, 0], fontStyle: 'bold', fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 92, fontStyle: 'bold', textColor: [0, 43, 91] },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 32, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' }
    },
    styles: { fontSize: 8.5, cellPadding: 3.5, valign: 'middle' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (dataArg: any) => {
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
        doc.text(`BON DE LIVRAISON N° ${refBL}`, 198, 10, { align: 'right' });
      }
    }
  });

  // =============================================
  // 4. ÉMARGEMENT & SIGNATURE CONTRADICTOIRE
  // =============================================
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 55 > 275) {
    doc.addPage();
    finalY = 22;
  }

  // Signature Chauffeur
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, finalY, 88, 46, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, finalY, 88, 46, 2.5, 2.5, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('VISA PESÉE & SORTIE USINE 2CGC', 16, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('Matériel pesé et conforme à la pesée usine', 16, finalY + 13);
  doc.text(`Chauffeur : ${data.chauffeur || 'Flotte 2CGC'}`, 16, finalY + 19);
  doc.text('Signature & Visa usine :', 16, finalY + 26);

  // Simulation cachet Usine
  doc.setDrawColor(0, 43, 91);
  doc.setLineWidth(0.4);
  doc.circle(75, finalY + 31, 8.5);
  doc.setFontSize(4);
  doc.setTextColor(0, 43, 91);
  doc.text('BASCULE 2CGC', 75, finalY + 30, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('SORTIE CONFORME', 75, finalY + 32, { align: 'center' });

  // Signature Client & Émargement Tactile
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, finalY, 90, 46, 2.5, 2.5, 'F');
  doc.setDrawColor(255, 215, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(108, finalY, 90, 46, 2.5, 2.5, 'S');

  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ÉMARGEMENT & RÉCEPTION CLIENT', 112, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('Mention : « Reçu complet et sans réserve »', 112, finalY + 13);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 112, finalY + 19);

  if (data.signatureClientDataUrl) {
    try {
      doc.addImage(data.signatureClientDataUrl, 'PNG', 112, finalY + 21, 45, 18);
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text('✓ Signature électronique certifiée sur mobile', 112, finalY + 42);
    } catch {
      doc.text('Signature enregistrée', 112, finalY + 26);
    }
  } else {
    doc.text('Nom, signature et cachet du réceptionnaire :', 112, finalY + 26);
  }

  // Pied de page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 282, 198, 282);
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('2CGC SARL Unipersonnel • RCCM CI DAL 2013 B. 20779 • CC N° 8104005 C • BP 129 Daloa • Tél : +225 07 07 62 17 99 / 07 07 85 76 29', 105, 286, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 43, 91);
    doc.text(`Page ${i} / ${totalPages}`, 198, 286, { align: 'right' });
  }

  doc.save(`2CGC_Bon_Livraison_${refBL}.pdf`);
}