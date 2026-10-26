/**
 * Valeurs dependantes de l'instant present.
 *
 * Ces appels sont impurs : deux evaluations successives donnent des resultats
 * differents. Les invoquer pendant le rendu ferait diverger le HTML du serveur
 * de celui du navigateur, et changerait l'affichage a chaque re-rendu sans
 * raison. Les regrouper ici les sort du corps des composants : ils ne sont
 * appeles que depuis des gestionnaires d'evenements et des effets.
 */

/** Millisecondes depuis l'epoque, pour un identifiant local ou un horodatage. */
export function maintenant(): number {
  return Date.now();
}

/** Instant present, pour les champs qui stockent une date complete. */
export function dateCourante(): Date {
  return new Date();
}

/** Heure au format court francais, tel qu'affiche dans les fils de discussion. */
export function heureCourte(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Duree aleatoire entre deux bornes, en millisecondes. */
export function delaiEntre(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs);
}
