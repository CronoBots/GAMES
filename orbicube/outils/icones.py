"""Génère toutes les icônes et l'écran de démarrage d'Orbicube depuis la géométrie du jeu.

    python3 outils/icones.py

Sorties :
  www/icones/   favicon, apple-touch-icon, icônes PWA (192, 512, maskable)
  ressources/   icon.png (1024, App Store et Google Play), icon-foreground.png et icon-background.png
                (icône adaptative Android), splash.png et splash-dark.png (2732) pour `npx @capacitor/assets generate`
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUL = ["#FF7F1E", "#E5383B", "#FFD60A", "#F3F2EC", "#1FB25A", "#1E88E5"]  # R L U D F B, comme le jeu
FOND_HAUT, FOND_BAS = (34, 24, 72), (7, 7, 12)

# --- la géométrie du plateau, identique à index.html ---
RAY = [0.65, 0.845, 1.04]
CEN = [(math.cos(math.radians(d)) / math.sqrt(3), math.sin(math.radians(d)) / math.sqrt(3)) for d in (-30, 90, 210)]


def inter(c1, r1, c2, r2):
    dx, dy = c2[0] - c1[0], c2[1] - c1[1]
    d = math.hypot(dx, dy)
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    h = math.sqrt(r1 * r1 - a * a)
    mx, my = c1[0] + a * dx / d, c1[1] + a * dy / d
    return [(mx - h * dy / d, my + h * dx / d), (mx + h * dy / d, my - h * dx / d)]


def pastilles():
    out = []
    for x in (-1, 0, 1):
        for y in (-1, 0, 1):
            for z in (-1, 0, 1):
                p = (x, y, z)
                for a in range(3):
                    if abs(p[a]) != 1:
                        continue
                    b, c = (a + 1) % 3, (a + 2) % 3
                    pts = inter(CEN[b], RAY[p[b] + 1], CEN[c], RAY[p[c] + 1])
                    pts.sort(key=lambda q: math.hypot(q[0] - CEN[a][0], q[1] - CEN[a][1]))
                    face = 2 * a + (0 if p[a] > 0 else 1)  # R L U D F B
                    out.append((pts[0] if p[a] > 0 else pts[1], face))
    return out


def hexa(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def fond(taille, transparent=False):
    if transparent:
        return Image.new("RGBA", (taille, taille), (0, 0, 0, 0))
    # dégradé calculé petit puis agrandi : identique à l'œil, cent fois plus rapide
    n = 256
    im = Image.new("RGBA", (n, n))
    px = im.load()
    cx, cy = n * 0.5, n * 0.18
    for j in range(n):
        for i in range(n):
            t = min(1.0, math.hypot(i - cx, j - cy) / (n * 1.05))
            px[i, j] = tuple(int(FOND_HAUT[k] + (FOND_BAS[k] - FOND_HAUT[k]) * t) for k in range(3)) + (255,)
    return im.resize((taille, taille), Image.BICUBIC)


def plateau(im, echelle_rel, decal_y=0.0):
    """Dessine les neuf cercles et les 54 pastilles résolues, centrés, sur l'image (sur-échantillonnée)."""
    T = im.size[0]
    E = T * echelle_rel / 3.2
    OX, OY = T / 2, T / 2 + 0.145 * E + decal_y * T
    vers = lambda q: (OX + q[0] * E, OY - q[1] * E)
    halo = Image.new("RGBA", im.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    d = ImageDraw.Draw(im)
    for a in range(3):
        c = vers(CEN[a])
        for r in RAY:
            R = r * E
            hd.ellipse([c[0] - R, c[1] - R, c[0] + R, c[1] + R], outline=(165, 139, 255, 120), width=max(2, int(E * 0.05)))
            d.ellipse([c[0] - R, c[1] - R, c[0] + R, c[1] + R], outline=(110, 104, 170, 255), width=max(1, int(E * 0.016)))
    rp = E * 0.072
    for q, f in pastilles():
        x, y = vers(q)
        hd.ellipse([x - rp * 2, y - rp * 2, x + rp * 2, y + rp * 2], fill=hexa(COUL[f]) + (70,))
    halo = halo.filter(ImageFilter.GaussianBlur(T * 0.012))
    im.alpha_composite(halo)
    d = ImageDraw.Draw(im)
    for q, f in pastilles():
        x, y = vers(q)
        d.ellipse([x - rp, y - rp, x + rp, y + rp], fill=hexa(COUL[f]) + (255,), outline=(0, 0, 0, 120), width=max(1, int(rp * 0.18)))
        g = rp * 0.34
        d.ellipse([x - rp * 0.3 - g, y - rp * 0.32 - g, x - rp * 0.3 + g, y - rp * 0.32 + g], fill=(255, 255, 255, 80))
    return im


def rendre(taille, echelle_rel, transparent=False, sur=3):
    T = taille * sur
    im = plateau(fond(T, transparent), echelle_rel)
    return im.resize((taille, taille), Image.LANCZOS)


def ecrire(im, chemin, opaque=True):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    (im.convert("RGB") if opaque else im).save(chemin, "PNG", optimize=True)
    print(os.path.relpath(chemin, RACINE), im.size[0])


def main():
    w = os.path.join(RACINE, "www", "icones")
    r = os.path.join(RACINE, "ressources")
    grande = rendre(1024, 0.9)  # App Store : carré plein, sans transparence ni coins arrondis
    ecrire(grande, os.path.join(r, "icon.png"))
    ecrire(rendre(1024, 0.74, transparent=True), os.path.join(r, "icon-foreground.png"), opaque=False)  # zone sûre Android
    ecrire(fond(1024), os.path.join(r, "icon-background.png"))
    for nom, t in (("favicon.png", 64), ("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        ecrire(grande.resize((t, t), Image.LANCZOS), os.path.join(w, nom))
    ecrire(rendre(512, 0.76), os.path.join(w, "icon-maskable-512.png"))
    # écran de démarrage : fond de nuit, petit plateau au centre
    S = 2732
    splash = Image.new("RGBA", (S, S), FOND_BAS + (255,))
    logo = rendre(900, 0.95, transparent=True)
    splash.alpha_composite(logo, ((S - 900) // 2, (S - 900) // 2))
    ecrire(splash, os.path.join(r, "splash.png"))
    ecrire(splash, os.path.join(r, "splash-dark.png"))


if __name__ == "__main__":
    main()
