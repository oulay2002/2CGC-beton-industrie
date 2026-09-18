// src/lib/import-export-clients.ts — Module d'import CSV/Excel & d'impression PDF/CSV de la base clients 2CGC
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { CompteUtilisateur, UserRole, genererMotDePasse } from './auth-context';

export interface ClientImportData {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  role?: UserRole;
  tarifSpecial?: number;
  pointsFidelite?: number;
  dateCreation?: string;
  password?: string;
}

export interface ResultatImportClients {
  ajoutes: CompteUtilisateur[];
  ignoresDoublons: number;
  erreurs: string[];
}

/**
 * Parse un contenu de fichier texte CSV (séparateurs ';' ou ',') pour extraire les clients
 */
export function parserCSVEntrants(contenuTexte: string): ClientImportData[] {
  const lignes = contenuTexte.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lignes.length < 2) return [];

  // Détection du délimiteur (; ou , ou tab)
  const premierLigne = lignes[0];
  const delim = premierLigne.includes(';') ? ';' : premierLigne.includes('\t') ? '\t' : ',';

  // Nettoyage et normalisation des en-têtes
  const colonnes = premierLigne.split(delim).map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const idxNom = colonnes.findIndex(c => c.includes('nom') || c.includes('contact') || c.includes('client'));
  const idxEntreprise = colonnes.findIndex(c => c.includes('entreprise') || c.includes('societe') || c.includes('société') || c.includes('raison'));
  const idxEmail = colonnes.findIndex(c => c.includes('mail') || c.includes('courriel'));
  const idxTel = colonnes.findIndex(c => c.includes('tel') || c.includes('phone') || c.includes('whatsapp') || c.includes('mobile'));
  const idxRemise = colonnes.findIndex(c => c.includes('remise') || c.includes('tarif') || c.includes('special') || c.includes('pourcent'));

  const resultats: ClientImportData[] = [];

  for (let i = 1; i < lignes.length; i++) {
    const rawCols = lignes[i].split(delim).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (rawCols.length === 0 || (rawCols.length === 1 && !rawCols[0])) continue;

    const nom = (idxNom !== -1 ? rawCols[idxNom] : '') || rawCols[0] || 'Client Partenaire';
    const entreprise = (idxEntreprise !== -1 ? rawCols[idxEntreprise] : '') || nom;
    let email = (idxEmail !== -1 ? rawCols[idxEmail] : '').toLowerCase();
    const tel = (idxTel !== -1 ? rawCols[idxTel] : '') || '+225 07 00 00 00';
    const remise = idxRemise !== -1 ? parseFloat(rawCols[idxRemise].replace(',', '.')) : 0;

    // Si pas d'email fourni, génération automatique d'un email 2CGC unique pour permettre la connexion
    if (!email || !email.includes('@')) {
      const cleanNom = nom.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSuffix = Date.now().toString().slice(-4) + i;
      email = `${cleanNom || 'client'}.${uniqueSuffix}@client-2cgc.ci`;
    }

    resultats.push({
      nom,
      entreprise,
      email,
      telephone: tel,
      role: 'client',
      tarifSpecial: isNaN(remise) ? 0 : remise,
      pointsFidelite: 100, // Points de bienvenue
      dateCreation: new Date().toISOString().split('T')[0],
      password: genererMotDePasse(nom),
    });
  }

  return resultats;
}

/**
 * Exporte et déclenche le téléchargement d'un modèle CSV type pour faciliter l'import
 */
export function telechargerModeleCSV() {
  const entetes = ['Nom Complet', 'Entreprise / Raison Sociale', 'Email', 'Telephone / WhatsApp', 'Remise Commerciale %'];
  const exemples = [
    ['M. Drissa Koné', 'BTP Afrique SARL', 'contact@btp-afrique.com', '+225 07 12 34 56', '5'],
    ['Mme Fatou Traoré', 'Ivoire Promotion Immobilière', 'fatou.traore@ivoire-promo.ci', '+225 05 44 33 22', '3'],
    ['M. Kouamé Yao', 'Génie Route CI', 'kouame.yao@gr-ci.com', '+225 07 88 99 00', '10'],
    ['Société SOCOBA', 'SOCOBA Daloa', 'appro@socoba.ci', '+225 07 07 85 76 00', '5'],
  ];

  const csvContent = '\uFEFF' + [entetes.join(';'), ...exemples.map(e => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Modele_Import_Anciens_Clients_2CGC.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Impression officielle de la base de données clients en PDF (Mise en page certifiée 2CGC)
 */
import { LOGO_2CGC_BASE64 } from '@/lib/logo-base64';

export function imprimerBaseClientsPDF(clients: CompteUtilisateur[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // En-tête bleu marine 2CGC (Page 1)
  doc.setFillColor(0, 43, 91);
  doc.rect(0, 0, 297, 36, 'F');

  // Liseré or
  doc.setFillColor(255, 215, 0);
  doc.rect(0, 36, 297, 2.5, 'F');

  // Logo 2CGC transparent sans fond blanc
  try {
    doc.addImage(LOGO_2CGC_BASE64, 'PNG', 12, 6, 20, 16);
  } catch (e) {
    doc.setTextColor(0, 43, 91);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2CGC', 22, 17, { align: 'center' });
  }

  // Titre & Société
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC SARL Unipersonnel)', 36, 14);

  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Capital 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C • Régime : RÉEL SIMPLIFIÉ Daloa 2', 36, 20);
  doc.text('Tél : +225 07 07 62 17 99 / 07 07 85 76 29 • Email : cheicknaconstruction@gmail.com • BSIC Daloa RIB : CI154 08521 029041500015 04', 36, 26);

  // Cartouche Titre du document
  doc.setTextColor(0, 43, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RÉPERTOIRE OFFICIEL DES CLIENTS & COMPTES PROFESSIONNELS B2B', 14, 46);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Édition Direction Générale & Commerciale — Document officiel arrêté au ${dateStr} • Total : ${clients.length} comptes enregistrés`, 14, 52);

  // Construction du tableau
  const tableData = clients.map((c, idx) => [
    (idx + 1).toString(),
    c.nom,
    c.entreprise || '—',
    c.email,
    c.telephone || 'Non renseigné',
    c.role === 'client' ? 'Client B2B / Pro' : c.role,
    c.tarifSpecial ? `${c.tarifSpecial}%` : 'Standard',
    c.pointsFidelite ? `${c.pointsFidelite} pts` : '—',
    c.dateCreation || '2026',
  ]);

  autoTable(doc, {
    startY: 56,
    margin: { top: 22, bottom: 20, left: 14, right: 14 },
    head: [['N°', 'Nom & Prénoms', 'Entreprise / Raison Sociale', 'Email de Connexion', 'Téléphone / WhatsApp', 'Statut', 'Tarif Négocié', 'Fidélité', 'Créé le']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [0, 43, 91],
      textColor: [255, 215, 0],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 45 },
      3: { cellWidth: 48 },
      4: { cellWidth: 32 },
      5: { halign: 'center', cellWidth: 26 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 24 },
    },
    didDrawPage: function (data: any) {
      if (data.pageNumber > 1) {
        doc.setFillColor(0, 43, 91);
        doc.rect(0, 0, 297, 14, 'F');
        doc.setFillColor(255, 215, 0);
        doc.rect(0, 14, 297, 1, 'F');
        doc.setTextColor(255, 215, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)', 14, 9);
        doc.setTextColor(255, 255, 255);
        doc.text(`RÉPERTOIRE CLIENTS B2B — PAGE ${data.pageNumber}`, 283, 9, { align: 'right' });
      }

      // Pied de page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `2CGC SARL — Registre Confidentiel Interne Clientèle • Page ${data.pageNumber} sur ${pageCount}`,
        148,
        202,
        { align: 'center' }
      );
    },
  });

  doc.save(`2CGC_Repertoire_Clients_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export de la base client en CSV pour Excel
 */
export function exporterBaseClientsCSV(clients: CompteUtilisateur[]) {
  const entetes = ['N°', 'Nom', 'Entreprise', 'Email', 'Telephone', 'Role', 'Remise Speciale %', 'Points Fidelite', 'Date Inscription'];
  const lignes = clients.map((c, i) => [
    i + 1,
    `"${(c.nom || '').replace(/"/g, '""')}"`,
    `"${(c.entreprise || '').replace(/"/g, '""')}"`,
    `"${c.email}"`,
    `"${c.telephone || ''}"`,
    `"${c.role}"`,
    c.tarifSpecial || 0,
    c.pointsFidelite || 0,
    `"${c.dateCreation || ''}"`,
  ].join(';'));

  const csvContent = '\uFEFF' + [entetes.join(';'), ...lignes].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `2CGC_Base_Clients_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
