// Formatage monétaire FCFA (sans décimales, avec espaces comme séparateurs de milliers)
export function formatFCFA(montant: number): string {
  return Math.round(montant).toLocaleString('fr-FR') + ' FCFA';
}

// Formatage d'une date ISO en date locale française
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

// Calcul TVA (18% — taux UEMOA/CEMOA applicable en Côte d'Ivoire)
export const TVA_RATE = 0.18;

export function calculerTTC(montantHT: number): number {
  return montantHT * (1 + TVA_RATE);
}

export function calculerTVA(montantHT: number): number {
  return montantHT * TVA_RATE;
}
