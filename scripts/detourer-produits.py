"""Detoure les photos du catalogue pour le carrousel du hero.

Les photos sont prises sur fond blanc de studio. Le hero est bleu nuit : il
faut donc retirer le fond. Un simple seuil de luminance mangerait les aretes
du beton, presque aussi claires que le fond ; on part des bords de l'image
et on ne retire que le blanc qui leur est relie. Une alveole eclairee, au
coeur du bloc, reste.

Sortie en WebP avec couche alpha : trois a quatre fois plus leger qu'un PNG,
pour une page d'accueil chargee depuis un telephone.

    python scripts/detourer-produits.py
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "public/images/produits"
CIBLE = RACINE / "public/images/produits-detoures"
CIBLE.mkdir(parents=True, exist_ok=True)

# Association reprise du catalogue en ligne (src/lib/catalogue-agglos.ts),
# ou elle est deja verifiee : identifiant de reference -> photo.
PHOTOS = {
    "1": "page_0_img_12.jpeg",
    # "2" (20 creux) : photo surexposee, arete ebrechee. Retiree de l'anneau
    # le 14/11/2026 a la demande du client, en attendant une nouvelle prise.
    "3": "page_0_img_14.jpeg",
    "4": "page_0_img_15.jpeg",
    "5": "page_1_img_12.jpeg",
    "6": "page_1_img_13.jpeg",
    "7": "page_1_img_14.jpeg",
    "25": "agglo-double-12.jpg",
    "26": "agglo-double-15.jpg",
    "27": "agglo-double-20.jpg",
}

# Mesure sur les photos : le beton plafonne vers 228 de luminance, le fond
# de studio depasse 245. Le seuil se tient entre les deux.
SEUIL = 238


def detourer(chemin: Path) -> Image.Image:
    img = Image.open(chemin).convert("RGBA")
    a = np.asarray(img).astype(np.float32)
    deja_transparent = a[:, :, 3] < 128
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    h, w = lum.shape

    clair = (lum > SEUIL) | deja_transparent
    fond = np.zeros((h, w), bool)
    file = deque()
    for x in range(w):
        for y in (0, h - 1):
            if clair[y, x] and not fond[y, x]:
                fond[y, x] = True
                file.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if clair[y, x] and not fond[y, x]:
                fond[y, x] = True
                file.append((y, x))
    while file:
        y, x = file.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and clair[ny, nx] and not fond[ny, nx]:
                fond[ny, nx] = True
                file.append((ny, nx))

    alpha = Image.fromarray(np.where(fond, 0, 255).astype(np.uint8))
    # Un leger flou du masque evite l'escalier sur les aretes obliques.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.9))
    img.putalpha(alpha)

    # Recadrage sur le sujet, avec une marge pour l'ombre portee du CSS.
    boite = img.getbbox()
    if boite:
        m = 6
        img = img.crop((max(0, boite[0] - m), max(0, boite[1] - m),
                        min(w, boite[2] + m), min(h, boite[3] + m)))
    return img


if __name__ == "__main__":
    for ident, nom in PHOTOS.items():
        src = SOURCE / nom
        if not src.exists():
            print(f"  {ident:>3s}  {nom} introuvable")
            continue
        im = detourer(src)
        sortie = CIBLE / f"agglo-{ident}.webp"
        im.save(sortie, "WEBP", quality=88, method=6)
        print(f"  {ident:>3s}  {nom:22s} -> {sortie.name:16s} {im.width}x{im.height}  {sortie.stat().st_size // 1024:3d} Ko")
    print("->", CIBLE)
