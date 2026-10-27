# -*- coding: utf-8 -*-
"""Insere les trois agglos double alveoles dans la brochure PDF 2CGC.

La brochure a ete mise en page ailleurs et sa source n'est pas disponible.
Les cotes dessinees sur chaque photo (« 45cm », « 20cm ») y sont des images
superposees, absentes des visuels du site : tout regenerer depuis les donnees
du catalogue ferait donc perdre ce travail.

L'intervention est donc chirurgicale. Les blocs d'origine sont recopies en
vectoriel avec `show_pdf_page`, qui preserve texte, traits et cotes ; seules
les trois nouvelles lignes sont dessinees, a la grille et a la typographie
relevees sur la page 2 (Calibri Bold 14, prix en rouge pur).

Reorganisation au passage : les briques s'arretaient au milieu de la page 2,
les hourdis commencaient sur la meme page. Les trois agglos prennent la suite
des briques, et Hourdis 15 passe en tete de la section des hourdis.

    avant   p2 : 12P, 12C, 10C, Hourdis 15     p3 : Hourdis 12, 16, 20
    apres   p2 : 12P, 12C, 10C, Agglo 20       p3 : Agglo 15, Agglo 12, Hourdis 15
                                               p4 : Hourdis 12, 16, 20
"""
import sys
import pymupdf

SRC = 'public/catalogue-produits-2cgc.pdf'
MODELE = 1                      # page 2 : son en-tete et son pied servent de reference
L, H = 595.3, 841.9             # A4 portrait, en points

COLS = [72, 157, 320, 433, 492, 561]      # type | image | dimensions | poids | prix
ROWS = [133, 307, 447, 611, 732]          # quatre lignes, hauteurs inegales
HAUT_ENTETE = 133.0
HAUT_PIED = 732.0

POLICE = 'C:/Windows/Fonts/calibrib.ttf'
TAILLE = 14
NOIR = (0, 0, 0)
ROUGE = (1, 0, 0)
TRAIT = (74 / 255, 68 / 255, 68 / 255)
EPAISSEUR = 0.9

# Les trois references, dans l'ordre ou elles apparaitront.
AGGLOS = {
    20: (['AGGLO 20', 'DOUBLE', 'ALVÉOLES'], '450x200x200mm', '20 kg', '485 FCFA',
         'public/images/produits/agglo-double-20.jpg'),
    15: (['AGGLO 15', 'DOUBLE', 'ALVÉOLES'], '450x150x200mm', '16 kg', '320 FCFA',
         'public/images/produits/agglo-double-15.jpg'),
    12: (['AGGLO 12', 'DOUBLE', 'ALVÉOLES'], '450x120x200mm', '14 kg', '285 FCFA',
         'public/images/produits/agglo-double-12.jpg'),
}


def recopier(page, src, y0, y1, dest_y0=None):
    """Recopie en vectoriel la bande [y0, y1] de la page modele."""
    clip = pymupdf.Rect(0, y0, L, y1)
    dy = 0 if dest_y0 is None else dest_y0 - y0
    cible = pymupdf.Rect(0, y0 + dy, L, y1 + dy)
    page.show_pdf_page(cible, src, MODELE, clip=clip)


MESURE = pymupdf.Font(fontfile=POLICE)


def centrer(page, texte, x0, x1, y, couleur, police):
    larg = MESURE.text_length(texte, fontsize=TAILLE)
    page.insert_text((x0 + (x1 - x0 - larg) / 2, y), texte,
                     fontsize=TAILLE, fontname=police, fontfile=POLICE, color=couleur)


def dessiner_ligne(page, y0, y1, cle, police):
    """Trace une ligne du tableau : bordures, visuel, libelles."""
    lignes_nom, dims, poids, prix, image = AGGLOS[cle]

    for x in COLS:                                  # traits verticaux
        page.draw_line(pymupdf.Point(x, y0), pymupdf.Point(x, y1),
                       color=TRAIT, width=EPAISSEUR)
    for y in (y0, y1):                              # traits horizontaux
        page.draw_line(pymupdf.Point(COLS[0], y), pymupdf.Point(COLS[-1], y),
                       color=TRAIT, width=EPAISSEUR)

    # Visuel, ajuste dans la colonne « images » avec une marge.
    marge = 4
    case = pymupdf.Rect(COLS[1] + marge, y0 + marge, COLS[2] - marge, y1 - marge)
    page.insert_image(case, filename=image, keep_proportion=True)

    milieu = (y0 + y1) / 2
    # Nom sur trois lignes, centre verticalement.
    depart = milieu - (len(lignes_nom) - 1) * TAILLE * 0.6 + TAILLE * 0.35
    for i, mot in enumerate(lignes_nom):
        centrer(page, mot, COLS[0], COLS[1], depart + i * TAILLE * 1.2, NOIR, police)

    base = milieu + TAILLE * 0.35
    centrer(page, dims, COLS[2], COLS[3], base, NOIR, police)
    centrer(page, poids, COLS[3], COLS[4], base, NOIR, police)
    centrer(page, prix, COLS[4], COLS[5], base, ROUGE, police)


def main(sortie):
    src = pymupdf.open(SRC)
    out = pymupdf.open()
    police = 'calibrib'

    # Page 1 : inchangee.
    out.insert_pdf(src, from_page=0, to_page=0)

    # Page 2 : en-tete et trois premieres lignes recopies, Agglo 20 en 4e.
    p2 = out.new_page(width=L, height=H)
    p2.insert_font(fontname=police, fontfile=POLICE)
    recopier(p2, src, 0, ROWS[3])
    dessiner_ligne(p2, ROWS[3], ROWS[4], 20, police)
    recopier(p2, src, HAUT_PIED, H)

    # Page 3 : deux agglos, puis Hourdis 15 recupere de l'ancienne page 2.
    p3 = out.new_page(width=L, height=H)
    p3.insert_font(fontname=police, fontfile=POLICE)
    recopier(p3, src, 0, HAUT_ENTETE)
    dessiner_ligne(p3, ROWS[0], ROWS[1], 15, police)
    dessiner_ligne(p3, ROWS[1], ROWS[2], 12, police)
    hauteur_h15 = ROWS[4] - ROWS[3]
    recopier(p3, src, ROWS[3], ROWS[4], dest_y0=ROWS[2])
    recopier(p3, src, HAUT_PIED, H)

    # Pages suivantes : inchangees.
    out.insert_pdf(src, from_page=2, to_page=src.page_count - 1)

    out.set_metadata({'title': 'Catalogue Produits 2CGC CHEICKNA',
                      'author': '2CGC Cheickna Construction & Genie Civil',
                      'subject': 'Prefabriques beton — briques, hourdis, paves'})
    out.save(sortie, garbage=4, deflate=True)
    print('%d pages -> %s  (Hourdis 15 replace en %.0f..%.0f)'
          % (out.page_count, sortie, ROWS[2], ROWS[2] + hauteur_h15))


if __name__ == '__main__':
    main(sys.argv[1])
