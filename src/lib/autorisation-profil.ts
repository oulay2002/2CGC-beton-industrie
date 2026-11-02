// src/lib/autorisation-profil.ts — Qui a le droit d'ecrire quel profil.
//
// Cette decision vivait en ligne dans la route POST /api/profiles, repartie en
// trois conditions successives. L'une d'elles ne s'armait que si une session
// existait, si bien qu'une requete anonyme traversait tout le controle et
// atteignait l'`upsert`, lequel ecrase la ligne en cas de conflit d'adresse :
// il suffisait de poster l'email d'un compte et un mot de passe pour s'en
// emparer. La regle est isolee ici pour etre couverte par des tests.

import type { SessionPayload } from './session';

export type RoleProfil = 'client' | 'dirigeant' | 'chef_usine' | 'chauffeur';

export type DecisionProfil =
  /** Ecriture libre : creation comme mise a jour. */
  | { verdict: 'autorise'; peutMettreAJour: true; peutEcrireChampsCommerciaux: true }
  /** Mise a jour de sa propre ligne, sans toucher aux champs commerciaux. */
  | { verdict: 'autorise'; peutMettreAJour: true; peutEcrireChampsCommerciaux: false }
  /** Creation seule : si l'adresse est deja prise, la requete doit echouer. */
  | { verdict: 'autorise'; peutMettreAJour: false; peutEcrireChampsCommerciaux: false }
  | { verdict: 'refuse'; statut: 403; motif: string };

/**
 * @param session  Session verifiee, ou `null` pour une requete anonyme.
 * @param email    Adresse visee, deja normalisee en minuscules.
 * @param role     Role demande pour la ligne ecrite.
 */
export function deciderEcritureProfil(
  session: SessionPayload | null,
  email: string,
  role: RoleProfil,
): DecisionProfil {
  const estDirigeant = session?.role === 'dirigeant';

  // Le dirigeant administre les comptes : rien ne lui est ferme.
  if (estDirigeant) {
    return { verdict: 'autorise', peutMettreAJour: true, peutEcrireChampsCommerciaux: true };
  }

  // Creer un compte interne est une elevation de privileges.
  if (role !== 'client') {
    return {
      verdict: 'refuse',
      statut: 403,
      motif: 'Seul un dirigeant authentifie peut creer un compte collaborateur.',
    };
  }

  // Requete anonyme : c'est l'auto-inscription. Elle cree, elle n'ecrase pas.
  if (!session) {
    return { verdict: 'autorise', peutMettreAJour: false, peutEcrireChampsCommerciaux: false };
  }

  // Le test porte sur l'adresse, non sur le role : un chauffeur ou un chef
  // d'usine n'est pas plus fonde qu'un client a toucher le profil d'autrui.
  if (session.email.toLowerCase() !== email) {
    return { verdict: 'refuse', statut: 403, motif: 'Modification non autorisee.' };
  }

  // Sa propre ligne, mais pas son propre role.
  if (role !== session.role) {
    return { verdict: 'refuse', statut: 403, motif: 'Modification de role non autorisee.' };
  }

  return { verdict: 'autorise', peutMettreAJour: true, peutEcrireChampsCommerciaux: false };
}

/**
 * Faut-il exiger un changement de mot de passe a la premiere connexion ?
 *
 * La regle manquait a la creation de profil : le drapeau y etait pose sans
 * condition des qu'un mot de passe accompagnait la requete. Un visiteur qui
 * s'inscrivait avec son propre mot de passe se voyait donc somme d'en
 * changer, et un compte cree pour une demonstration devenait inutilisable
 * sans detour par cet ecran — ce qui s'est produit en presentation client.
 *
 * Le principe est simple : on n'exige le changement que d'un mot de passe
 * qu'une autre personne a choisi a votre place.
 *
 * @param session           Session de l'auteur de la requete, ou `null`.
 * @param email             Adresse du profil ecrit, en minuscules.
 * @param exigerChangement  Choix explicite du dirigeant. `undefined` laisse
 *                          la regle decider.
 */
export function exigerChangementMotDePasse(
  session: SessionPayload | null,
  email: string,
  exigerChangement?: boolean,
): boolean {
  // Un dirigeant qui tranche explicitement a le dernier mot : il peut lever
  // l'exigence pour un compte de demonstration, ou la reposer.
  if (session?.role === 'dirigeant' && exigerChangement !== undefined) {
    return exigerChangement;
  }

  const estSoiMeme = (session?.email ?? '').toLowerCase() === email.toLowerCase();
  return session?.role === 'dirigeant' && !estSoiMeme;
}
