'use client';

// src/lib/use-fermeture-modale.ts — Fermeture d'une boite modale.
//
// Les treize fenetres superposees du projet ne se fermaient que par leur
// bouton dedie : ni la touche Echap, ni un clic sur le fond assombri. Ce sont
// pourtant les deux gestes qu'un utilisateur tente en premier, et leur absence
// donne le sentiment d'etre bloque — ce qui s'est verifie sur le journal du
// CRM, impossible a quitter autrement qu'en rechargeant la page.
//
// Le crochet pose aussi le verrou de defilement : sans lui, la page continue
// de defiler derriere la boite, ce qui fait perdre sa position de lecture.

import { useEffect } from 'react';

/**
 * @param ouverte  Etat d'ouverture de la boite.
 * @param fermer   Ce qu'il faut appeler pour la refermer.
 */
export function useFermetureModale(ouverte: boolean, fermer: () => void): void {
  useEffect(() => {
    if (!ouverte) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };

    document.addEventListener('keydown', surTouche);

    // Le defilement de la page est suspendu tant que la boite est ouverte, et
    // restitue tel quel ensuite — y compris si une autre regle l'avait deja fixe.
    const defilementInitial = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = defilementInitial;
    };
  }, [ouverte, fermer]);
}

/**
 * Gestionnaire a poser sur le fond assombri : ne ferme que si le clic a eu
 * lieu sur le fond lui-meme, jamais sur la boite qu'il porte.
 */
export function fermerSiFond(fermer: () => void) {
  return (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) fermer();
  };
}
