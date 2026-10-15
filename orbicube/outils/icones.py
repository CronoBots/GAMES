"""Génère toutes les icônes et l'écran de démarrage d'Orbicube depuis la géométrie du jeu.

    python3 outils/icones.py

Sorties :
  www/icones/   favicon, apple-touch-icon, icônes PWA (192, 512, maskable)
  ressources/   icon.png (1024, App Store et Google Play), icon-foreground.png et icon-background.png
                (icône adaptative Android), splash.png et splash-dark.png (2732) pour `npx @capacitor/assets generate`
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUL = ["#FF6A00", "#D7192C", "#FFD500", "#F5F5F0", "#00A651", "#0B5FD6"]  # R L U D F B, comme le jeu
FOND_HAUT, FOND_BAS = (34, 24, 72), (7, 7, 12)

# --- la géométrie du plateau, identique à index.html ---
RAY = [0.7296, 0.904, 1.0835]
ECART = 0.5336
CEN = [(math.cos(math.radians(d)) * ECART, math.sin(math.radians(d)) * ECART) for d in (-30, 90, 210)]


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


# --- le logo : les trois anneaux de l'écran de chargement (le client, le 11/10/2026) ---
# Mêmes cercles que le SVG de #chargement (rayon 34 dans un carré de 120, centres en triangle), arcs de 253°
# figés à trois angles différents, comme un instant de l'animation, avec leur lueur.
ANNEAUX = [((0, -12), (165, 139, 255), 200), ((-10.4, 6), (76, 201, 240), 320), ((10.4, 6), (255, 107, 157), 80)]


def fond_logo(taille):
    n = 256
    im = Image.new("RGBA", (n, n))
    px = im.load()
    for j in range(n):
        for i in range(n):
            t = min(1.0, math.hypot(i - n * 0.5, j - n * 0.47) / (n * 0.62))
            px[i, j] = tuple(int(c0 + (c1 - c0) * t) for c0, c1 in zip((27, 22, 54), (7, 7, 12))) + (255,)
    return im.resize((taille, taille), Image.BICUBIC)


def anneaux(im, echelle_rel):
    T = im.size[0]
    u = T * echelle_rel / 92.0          # les anneaux tiennent dans 92 unités
    ox, oy = T / 2, T / 2 + 3 * u       # centre optique (le triangle est un peu plus haut que bas)
    lueur = Image.new("RGBA", im.size, (0, 0, 0, 0))
    lg = ImageDraw.Draw(lueur)
    d = ImageDraw.Draw(im)
    for (cx, cy), coul, debut in ANNEAUX:
        R = 34 * u
        boite = [ox + cx * u - R, oy + cy * u - R, ox + cx * u + R, oy + cy * u + R]
        lg.arc(boite, debut, debut + 253, fill=coul + (150,), width=max(3, int(9 * u)))
    lueur = lueur.filter(ImageFilter.GaussianBlur(T * 0.025))
    im.alpha_composite(lueur)
    d = ImageDraw.Draw(im)
    for (cx, cy), coul, debut in ANNEAUX:
        R = 34 * u
        boite = [ox + cx * u - R, oy + cy * u - R, ox + cx * u + R, oy + cy * u + R]
        d.arc(boite, debut, debut + 253, fill=coul + (255,), width=max(2, int(3.6 * u)))
        # bouts arrondis, comme stroke-linecap:round
        for ang in (debut, debut + 253):
            x, y = ox + cx * u + R * math.cos(math.radians(ang)), oy + cy * u + R * math.sin(math.radians(ang))
            w = 1.8 * u
            d.ellipse([x - w, y - w, x + w, y + w], fill=coul + (255,))
    return im


# --- le logo premium de l'app (le client, le 16/10/2026 : « je n'aime pas celui actuel ») ---
# un cube 3×3 résolu en perspective, corps noir et pastilles arrondies (Facettes, le style par défaut du jeu), au centre du
# plateau du jeu, sur un ciel violet profond étoilé
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(len(a)))

def fond_premium(T):
    n=256; im=Image.new("RGBA",(n,n)); px=im.load()
    for j in range(n):
        for i in range(n):
            t=min(1.0,math.hypot(i-n*0.5,j-n*0.42)/(n*0.7))
            px[i,j]=lerp((44,28,96),(5,5,14),t**0.9)+(255,)
    im=im.resize((T,T),Image.BICUBIC)
    # nébuleuses douces
    neb=Image.new("RGBA",(T,T),(0,0,0,0)); d=ImageDraw.Draw(neb)
    for (x,y,r,c) in [(0.25,0.3,0.32,(120,80,255,70)),(0.78,0.72,0.3,(60,170,255,55)),(0.7,0.2,0.22,(255,90,170,40))]:
        d.ellipse([T*(x-r),T*(y-r),T*(x+r),T*(y+r)],fill=c)
    neb=neb.filter(ImageFilter.GaussianBlur(T*0.09)); im.alpha_composite(neb)
    # étoiles
    rnd=random.Random(7); st=Image.new("RGBA",(T,T),(0,0,0,0)); d=ImageDraw.Draw(st)
    for k in range(70):
        x,y=rnd.random()*T,rnd.random()*T; r=T*(0.0012+rnd.random()*0.0028); a=int(90+rnd.random()*150)
        d.ellipse([x-r,y-r,x+r,y+r],fill=(255,255,255,a))
    im.alpha_composite(st)
    return im

def poly_arrondi(d,pts,fill,inset_r):
    d.polygon(pts,fill=fill)
    # coins adoucis : un trait de la même couleur, joint rond
    d.line(pts+[pts[0]],fill=fill,width=int(inset_r*2),joint="curve")
    for p in pts: d.ellipse([p[0]-inset_r,p[1]-inset_r,p[0]+inset_r,p[1]+inset_r],fill=fill)

def retrecir(pts,k):
    cx=sum(p[0] for p in pts)/len(pts); cy=sum(p[1] for p in pts)/len(pts)
    return [(cx+(p[0]-cx)*k,cy+(p[1]-cy)*k) for p in pts]

def cube(im,cx,cy,s,cols=((245,245,240),(0,166,81),(215,25,44))):
    """cube isométrique : arête s ; corps noir, pastilles arrondies (Facettes, le style par défaut)."""
    d=ImageDraw.Draw(im)
    c30=math.cos(math.radians(30)); 
    top=(cx,cy-s); 
    # sommets
    A=(cx,cy-s); B=(cx+s*c30,cy-s/2); C=(cx,cy); D=(cx-s*c30,cy-s/2)   # face du haut A B C D
    E=(cx+s*c30,cy+s/2); F=(cx,cy+s); G=(cx-s*c30,cy+s/2)
    # ombre portée
    sh=Image.new("RGBA",im.size,(0,0,0,0)); sd=ImageDraw.Draw(sh)
    sd.ellipse([cx-s*1.0,cy+s*0.95,cx+s*1.0,cy+s*1.25],fill=(0,0,0,150)); sh=sh.filter(ImageFilter.GaussianBlur(s*0.12)); im.alpha_composite(sh)
    d=ImageDraw.Draw(im)
    corps=(12,12,18,255); rr=s*0.03
    for f in ([A,B,C,D],[D,C,F,G],[C,B,E,F]): poly_arrondi(d,f,corps,rr)
    faces=[([A,B,C,D],cols[0],1.0),([D,C,F,G],cols[1],0.86),([C,B,E,F],cols[2],0.72)]
    hl=Image.new("RGBA",im.size,(0,0,0,0)); hd=ImageDraw.Draw(hl)
    for pts,col,lum in faces:
        P0,P1,P2,P3=pts  # P0->P1 et P0->P3 : les deux directions de la face
        u=((P1[0]-P0[0])/3,(P1[1]-P0[1])/3); v=((P3[0]-P0[0])/3,(P3[1]-P0[1])/3)
        for a in range(3):
            for b in range(3):
                o=(P0[0]+u[0]*a+v[0]*b,P0[1]+u[1]*a+v[1]*b)
                q=[o,(o[0]+u[0],o[1]+u[1]),(o[0]+u[0]+v[0],o[1]+u[1]+v[1]),(o[0]+v[0],o[1]+v[1])]
                q=retrecir(q,0.80)
                c=tuple(int(x*lum) for x in col)+(255,)
                poly_arrondi(d,retrecir(q,0.93),c,s*0.022)
                # reflet : le haut de la pastille plus clair
                # reflet : un dégradé blanc du haut de la pastille vers le bas
                qq=retrecir(q,0.86); xs=[p[0] for p in qq]; ys=[p[1] for p in qq]
                x0,y0,x1,y1=int(min(xs)),int(min(ys)),int(max(xs))+1,int(max(ys))+1
                m=Image.new("L",(x1-x0,y1-y0),0); ImageDraw.Draw(m).polygon([(p[0]-x0,p[1]-y0) for p in qq],fill=255)
                g=Image.new("L",(1,256)); g.putdata([int((90 if lum==1 else 70)*max(0,1-j/150)**1.6) for j in range(256)]); g=g.resize((x1-x0,y1-y0))
                blanc=Image.new("RGBA",(x1-x0,y1-y0),(255,255,255,0)); blanc.putalpha(ImageChops.multiply(g,m))
                hl.alpha_composite(blanc,(x0,y0))
    hl=hl.filter(ImageFilter.GaussianBlur(s*0.004)); im.alpha_composite(hl)
    # arêtes claires
    d=ImageDraw.Draw(im)
    for p,q in [(D,C),(C,B),(C,F)]: d.line([p,q],fill=(255,255,255,40),width=max(1,int(s*0.012)))
    return im

# le logo (2e version, le client, le 16/10/2026 : « le cube au milieu et quelques orbites avec les facettes autour, faisant
# comprendre le mieux possible le jeu ») : le plateau du jeu, ses neuf orbites (une couleur par famille, la plus grande
# appuyée) et ses facettes en losanges, résolu ; au centre le cube, qui porte les couleurs des faces voisines
# les couleurs de la palette Classique du jeu (le client, le 16/10/2026)
COUL_LOGO = ["#FF9014", "#FD5440", "#FCCD30", "#F2F5F0", "#21B86F", "#3282FC"]
ORB=[(255,207,74),(178,130,255),(92,200,255)]   # une couleur par famille d'orbites

def stickers():
    out=[]
    for x in (-1,0,1):
        for y in (-1,0,1):
            for z in (-1,0,1):
                p=(x,y,z)
                for a in range(3):
                    if abs(p[a])!=1: continue
                    b,c=(a+1)%3,(a+2)%3
                    pts=inter(CEN[b],RAY[p[b]+1],CEN[c],RAY[p[c]+1])
                    pts.sort(key=lambda q: math.hypot(q[0]-CEN[a][0],q[1]-CEN[a][1]))
                    q=pts[0] if p[a]>0 else pts[1]
                    out.append((q,2*a+(0 if p[a]>0 else 1),(b,p[b]+1),(c,p[c]+1)))
    return out

def logo_premium(T,ech=0.33,transparent=False,rcube=0.46,mode="A"):
    im=Image.new("RGBA",(T,T),(0,0,0,0)) if transparent else fond_premium(T); E=T*ech; O=(T/2,T/2+T*0.02)
    V=lambda q:(O[0]+q[0]*E,O[1]-q[1]*E)
    lu=Image.new("RGBA",(T,T),(0,0,0,0)); ld=ImageDraw.Draw(lu); tr=Image.new("RGBA",(T,T),(0,0,0,0)); td=ImageDraw.Draw(tr)
    for a in range(3):
        c=V(CEN[a])
        for i,r in enumerate(RAY):
            if mode=="B" and i!=2: continue
            R=r*E; fort=(i==2)
            col=ORB[a]
            ld.ellipse([c[0]-R,c[1]-R,c[0]+R,c[1]+R],outline=col+((150 if fort else 60),),width=int(T*(0.016 if fort else 0.008)))
            td.ellipse([c[0]-R,c[1]-R,c[0]+R,c[1]+R],outline=col+((255 if fort else 150),),width=max(2,int(T*(0.006 if fort else 0.0028))))
    lu=lu.filter(ImageFilter.GaussianBlur(T*0.01)); im.alpha_composite(lu); im.alpha_composite(tr)
    # facettes : losanges aux côtés tangents aux deux cercles qui se croisent sous elles
    d=ImageDraw.Draw(im); hl=Image.new("RGBA",(T,T),(0,0,0,0)); hd=ImageDraw.Draw(hl)
    h=0.068
    for q,f,(b,ib),(c,icc) in stickers():
        if math.hypot(*q)<rcube: continue
        if mode=="B" and ib!=2 and icc!=2: continue
        def tg(C):
            dx,dy=q[0]-C[0],q[1]-C[1]; n=math.hypot(dx,dy); return (-dy/n,dx/n)
        t1,t2=tg(CEN[b]),tg(CEN[c])
        pts=[(q[0]+h*(s1*t1[0]+s2*t2[0]),q[1]+h*(s1*t1[1]+s2*t2[1])) for s1,s2 in ((1,1),(1,-1),(-1,-1),(-1,1))]
        P=[V(p) for p in pts]
        # ombre / liseré sombre puis la couleur
        poly_arrondi(d,retrecir(P,1.12),(8,8,14,255),T*0.004)
        poly_arrondi(d,P,hexa(COUL_LOGO[f])+(255,),T*0.004)
        hd.polygon([P[0],P[1],P[3]] if False else retrecir(P,0.55),fill=(255,255,255,40))
    hl=hl.filter(ImageFilter.GaussianBlur(T*0.003)); im.alpha_composite(hl)
    # le cube au centre, avec un halo
    s=rcube*E*0.98
    g=Image.new("RGBA",(T,T),(0,0,0,0)); gd=ImageDraw.Draw(g); gd.ellipse([O[0]-s*1.05,O[1]-s*1.05,O[0]+s*1.05,O[1]+s*1.05],fill=(10,8,24,150)); g=g.filter(ImageFilter.GaussianBlur(s*0.18)); im.alpha_composite(g)
    cube(im,O[0],O[1]+s*0.02,s,(hexa(COUL_LOGO[2]),hexa(COUL_LOGO[4]),hexa(COUL_LOGO[0])))   # U, F, R : les faces voisines du plateau
    return im

def rendre_premium(taille, ech, transparent=False, sur=3):
    return logo_premium(taille * sur, ech, transparent).resize((taille, taille), Image.LANCZOS)


def rendre_logo(taille, echelle_rel, transparent=False, sur=3):
    T = taille * sur
    im = anneaux(Image.new("RGBA", (T, T), (0, 0, 0, 0)) if transparent else fond_logo(T), echelle_rel)
    return im.resize((taille, taille), Image.LANCZOS)


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
    grande = rendre_premium(1024, 0.33)  # App Store : carré plein, sans transparence ni coins arrondis
    ecrire(grande, os.path.join(r, "icon.png"))
    ecrire(rendre_premium(1024, 0.25, transparent=True), os.path.join(r, "icon-foreground.png"), opaque=False)  # zone sûre Android
    ecrire(fond_premium(1024), os.path.join(r, "icon-background.png"))
    for nom, t in (("favicon.png", 64), ("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        ecrire(grande.resize((t, t), Image.LANCZOS), os.path.join(w, nom))
    ecrire(rendre_premium(512, 0.27), os.path.join(w, "icon-maskable-512.png"))
    # écran de démarrage : le logo de l'app sur le noir du jeu, puis l'écran de chargement prend le relais
    S = 2732
    splash = Image.new("RGBA", (S, S), (7, 7, 12, 255))
    logo = rendre_premium(1400, 0.2, transparent=True)   # une toile large : le halo ne doit pas être rogné
    splash.alpha_composite(logo, ((S - 1400) // 2, (S - 1400) // 2))
    ecrire(splash, os.path.join(r, "splash.png"))
    ecrire(splash, os.path.join(r, "splash-dark.png"))


# --- images des succès (Game Center : 1024 × 1024 ; Google Play Jeux : 512 × 512) ---
# Une médaille par succès : le plateau, un cercle allumé en or propre au succès, et 1 à 3 étoiles selon sa valeur.
SUCCES = [("premier", 10), ("m1", 25), ("m3", 50), ("m5", 75), ("m6", 100), ("p10", 50), ("pm", 75),
          ("p60", 100), ("eclair", 50), ("jour", 25), ("serie3", 75), ("expert", 100), ("axes", 50), ("tours", 100),
          ("voies", 100), ("missions", 10), ("fidele", 25), ("rang10", 25), ("neuf", 25), ("semaine", 25),
          ("elite", 50)]
OR, OR_CLAIR = (255, 207, 74), (255, 236, 170)


def etoile(d, cx, cy, r, couleur):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=couleur)


def medaille(index, points, taille=1024, sur=2):
    T = taille * sur
    im = fond(T)
    d = ImageDraw.Draw(im)
    # anneau de la médaille
    m = T * 0.04
    d.ellipse([m, m, T - m, T - m], outline=OR + (255,), width=int(T * 0.035))
    d.ellipse([m + T * 0.05, m + T * 0.05, T - m - T * 0.05, T - m - T * 0.05], outline=(255, 207, 74, 90), width=int(T * 0.008))
    # le plateau, plus petit, et le cercle propre à ce succès en or
    E = T * 0.62 / 3.2
    OX, OY = T / 2, T / 2 + 0.145 * E - T * 0.05
    vers = lambda q: (OX + q[0] * E, OY - q[1] * E)
    a_, L_ = index % 3, index // 3 % 3 - 1
    for a in range(3):
        c = vers(CEN[a])
        for L, r in zip((-1, 0, 1), RAY):
            R = r * E
            allume = (a, L) == (a_, L_)
            d.ellipse([c[0] - R, c[1] - R, c[0] + R, c[1] + R], outline=(OR + (255,)) if allume else (90, 86, 140, 255),
                      width=int(E * (0.06 if allume else 0.018)))
    rp = E * 0.075
    for q, f in pastilles():
        x, y = vers(q)
        d.ellipse([x - rp, y - rp, x + rp, y + rp], fill=hexa(COUL[f]) + (255,), outline=(0, 0, 0, 120), width=max(1, int(rp * 0.18)))
    # étoiles : 1 (≤ 25 points), 2 (≤ 75), 3 (100)
    n = 1 if points <= 25 else 2 if points <= 75 else 3
    for k in range(n):
        x = T / 2 + (k - (n - 1) / 2) * T * 0.11
        etoile(d, x, T * 0.84, T * 0.045, OR_CLAIR + (255,))
    return im.resize((taille, taille), Image.LANCZOS)


def images_succes():
    r = os.path.join(RACINE, "ressources", "succes")
    for i, (cle, points) in enumerate(SUCCES):
        im = medaille(i, points)
        ecrire(im, os.path.join(r, "apple", cle + ".png"))
        ecrire(im.resize((512, 512), Image.LANCZOS), os.path.join(r, "google", cle + ".png"))


if __name__ == "__main__":
    main()
    images_succes()
