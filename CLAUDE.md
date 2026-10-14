# GAMES

Les jeux de CronoBots, un dossier par jeu. Le premier : `orbicube/`.

## Méthode

- **Langue** : tout en français, réponses, interface, commentaires de code et messages de commit.
- **Git** : on committe et on pousse sur `main`, comme dans les autres dépôts du client. Pas de
  pull request sauf demande.
- **Pas de maquette** : on code dans le jeu, on vérifie, on pousse ; le client corrige sur la vraie page.
- **Ne rien toucher au dépôt `groups`** depuis une session consacrée aux jeux (demande expresse du client).

## Avant chaque commit sur Orbicube

| Touché | À lancer, résultat exigé |
|---|---|
| tout | `npm run verifier` → « Tout est en ordre. » (code 0) |
| `www/` | `npm run tester` → « Parcours réussi sur les trois téléphones et dans les cinq langues. » |
| `src/natif.js` | `npm run construire`, et committer `www/natif.js` avec : la CI refuse un pont pas à jour |
| une version publiée | même numéro dans `package.json` et `www/config.js` ; `V` incrémenté dans `www/sw.js` |
| un texte affiché | sa ligne dans `www/langues.js`, en cinq langues : `npm run tester` signale toute phrase affichée sans traduction |
| un succès | sa clé dans `www/config.js` > `succesStores` (iOS et Android), sa ligne dans `docs/lancement.md` 3 bis, son image (`npm run icones`) |
| l'aspect du jeu | **ne pas** régénérer les captures en passant : `npm run captures` et le montage se font seulement quand le client valide **définitivement** le design, et sur sa demande |

Un contrôle qui ne peut pas échouer ne contrôle rien : chaque contrôle du vérificateur a été
éprouvé en sabotant une copie (marque, clé secrète, police hors cache, pont périmé, pastille à
contresens). Un contrôle neuf s'éprouve de la même façon avant d'être cru.

## Règles qui ne se discutent pas

- **« Rubik's Cube » est une marque déposée.** Elle ne s'écrit ni dans le jeu, ni dans la fiche des
  stores, ni dans les pubs : on dit « le cube 3×3 ». Le vérificateur relit `www/` et
  `docs/fiche-store.md`.
- **Aucune clé secrète** dans le dépôt. Seules les clés *publiques* du SDK RevenueCat
  (`appl_…`, `goog_…`) vont dans `www/config.js`. Une clé `sk_…` fait échouer le vérificateur.
- **Aucune donnée personnelle** : le jeu ne collecte rien, et la politique de confidentialité le
  promet. Ajouter de la publicité ou de l'analyse change la politique, les fiches des stores et
  impose un consentement RGPD : décision du client, pas une optimisation.
- **Le jeu ne dépend d'aucun réseau** : polices embarquées, pas de CDN. Une police ou un fichier
  ajouté va aussi dans la liste `FICHIERS` de `www/sw.js` (le vérificateur le contrôle pour les polices).

## Ce qu'il faut savoir du code d'Orbicube

- La géométrie : trois familles de trois cercles concentriques (une par axe). Une facette
  est au croisement de deux cercles. **Les pastilles d'un cercle ne sont pas réparties
  régulièrement** : celle qui franchit un des deux grands vides parcourt plus d'un demi-tour.
  `delta()` donne à chacune son vrai déplacement dans le sens du cercle. Prendre le chemin le plus
  court (`normA`) les faisait tourner à contresens et rendait le pas d'un quart de tour nul, ce qui
  figeait le glisser en boucle infinie. Le vérificateur rejoue les 18 tours.
- **Les proportions des cercles** (`RAY`, `ECART`) sont relevées sur la visualisation de référence du
  client (11/10/2026) : cercles grands par rapport à l'écart de leurs centres, milieu vide, neuf
  pastilles de chaque face bien groupées. Une recherche qui maximise seulement l'écart minimal entre
  pastilles casse les faces en anneau : ne pas la reprendre. Ces deux constantes sont recopiées dans
  `outils/icones.py` et `outils/tester.js` (geste le long de U) : les changer aux trois endroits.
- **Le cube en perspective est au centre de la ligne des coups et du temps** (le client, le 11/10/2026,
  « l'endroit optimal ») : le plateau prend d'abord la largeur moins 14 px de chaque côté, et `redimJeu()` donne au cube la
  hauteur qui reste (`--cube`, de 64 à 124 px depuis le 13/10/2026 : à 150 il volait la vedette au plateau). **Le plateau
  ne bouge pas, c'est le cube qui descend** (le client) : son bas à 28 px au-dessus du plus grand cercle jouable de la
  famille du haut (`redimJeu`, position du canevas lue SANS sa transformation `.brouille`), centré entre titre et cercle
  s'il manque de place ; `.jinfo` passe au-dessus du canevas pour que le cube reste manipulable. Pas en filigrane : des couleurs derrière les pastilles
  se confondraient avec elles.
- **Le plateau se manipule en glissant** : un simple appui sur un cercle ne tourne rien (le parcours de test
  le vérifie). **Le cube en perspective pivote au doigt** (redemandé par le client le 11/10/2026) : gauche/droite
  autour de la verticale, haut/bas pour la face du dessous, calé au quart de tour au lâcher (`PIVOT`).
- **Facettes** (option « Pastilles », par défaut) : chaque pastille est un losange dont les côtés suivent les
  deux cercles qui se croisent sous elle (`FORME`, tangentes) ; pendant un tour, une pastille qui glisse
  sur un cercle garde un côté collé à ce cercle (sa tangente) et seul l'autre angle passe de celui du départ à
  celui de l'arrivée ; une face qui pivote sur son centre choisit l'appariement de ses côtés une fois, sur
  l'arrivée (`formeA`). Le choisir à chaque image le faisait basculer à mi-course. Les croisements font au moins 50°.
- **Deux sortes d'étoiles** (le client, le 11/10/2026) : de coups (`etoilesPour`) et de temps
  (`etoilesTempsPour`, objectif `(par×4+6) s`, trois sous l'objectif, deux sous le double). Le chrono part
  au premier contact avec le plateau et avance seul (`majTemps`, toutes les 250 ms).
- **Boutique** (`#boutique`, le client, le 13/10/2026 : « le plus professionnellement possible ») : écran ouvert par le
  rond doré du dock (« Boutique », dès le premier niveau fini depuis le 14/10/2026 ; son prix tant que le jeu n'est pas complet, puis « Styles ») et par
  Options > Styles (le dock n'affiche plus de prix, le client le 14/10/2026). **En haut la vitrine, en bas toutes les offres**
  (Édition intégrale ou Collection, Orbicube complet, Collection, les 3 packs, ampoules, soutien). **Aperçu en direct** sur un
  vrai plateau (`ApercuP`, fixe sous les onglets — collant, il recouvrait les vignettes ; un style regardé n'est pas porté), avec
  sa **fiche** (`#apercuFiche` : Porté, Porter, condition à gagner, ou **achat à l'unité** et lien vers le pack) ; rayons Couleurs /
  Formes / Effets (traînée, orbites, victoire) en vignettes dessinées (`vignette`), ampoules, pack soutien, restauration.
  **Catalogue** : `STYLES` (ouverture : libre, `etoiles`, `chrono`, `rang` ou `pack`), `PACKS` (produit des stores + droit
  RevenueCat ; éditions groupées = plusieurs droits ; ampoules consommables créditées par `crediterAmpoules` ; **chaque style
  d'un pack s'achète aussi seul** : `PACKS.s_<id>`, produit `orbicube_style_<id>`, droit `style_<id>`, 0,99 €). Chaque ligne de pack
  montre son **contenu exact** (`contenuPack` : vignette et nom de chaque style ; puces des packs pour les éditions groupées).
  **Les palettes du pack Couleurs quittent les six teintes du cube** (le client, le 14/10/2026 : trop ressemblantes) : chacune
  a son ambiance (Aurore, Galaxie, Glace, Joyaux), six couleurs distinctes ; leur vignette montre leurs teintes typiques.
  **Pour donner envie et comprendre** (le client, le 14/10/2026) : phrase d'accueil (gagner en jouant ou acheter), compteur de
  collection sur chaque onglet (« 4/8 »), fiche avec une phrase par style (`DESC_STYLE`) et, pour un style à gagner, sa barre de
  progression (`progresStyle`) ; badge « Nouveau » sur les styles gagnés pas encore vus (`PROG.stylesVus`, `nouveauxStyles`) et
  point doré sur le rond Boutique de l'accueil ; prix barré « au lieu de » sur chaque pack et édition (`prixSomme`, calculé avec
  les prix du store, rien d'affiché si un prix manque) ; un style acheté seul est porté aussitôt ; ampoules expliquées ; pied
  de page rassurant (paiement par le store, restaurable). Le style
  porté est dans `PROG.options` et lu par `STY` (recalculé par `appliquerOptions`, un style reperdu retombe sur le premier) ;
  les achats dans `PROG.droits` (jamais perdus par `fusion`, gardés par « Tout effacer »). Le dessin (`dessiner`, `pastille`,
  `couleurOrbite`, `confettis(v)`) lit les styles du plateau (`pal`, `forme`, `trainee`, `orbite`) ou `STY`. Le pont natif
  (`src/natif.js`) : `prixProduits`, `droits`, `acheterProduit`. Produits et droits : `docs/lancement.md` 3 quater ; prix
  d'attente : `www/config.js` > `prixPacks`. Pas de monnaie virtuelle ni de tirage au hasard (décision du 13/10/2026).
  Pack soutien : liseré doré sur la puce du rang et le Profil (« Mécène d'Orbicube »).
- **Fin de niveau** : les six faces s'illuminent l'une après l'autre et le cube fait un tour sur
  lui-même (`PIVOT` n'est animé que là) ; « Revoir ma partie » rejoue le mélange puis les coups (`revoir()`).
- **Couleur d'accent par monde** (`ACCENTS`, `accent(w)`) : variable CSS `--acc` (triplet r,g,b) et
  `ACC` pour le canevas (cercle saisi, vague de victoire). Accueil, défi et jeu libre : le lilas.
  **Les orbites du plateau** (trait fin + halo léger, au repos comme à la sélection/au tour) prennent cette
  couleur d'accent (`ACC` pour le halo, `ACC_CLAIR` pour le trait) — décision client 12/10/2026, remplace
  l'ancien trait blanc. L'indice reste doré, l'orbite interdite grise.
- **Décor en image (thèmes CraftPix)** : menu et jeu ont un fond fixe plein écran (`#fondMonde`, composites
  `img/fond-1…4.webp`, cover, étoiles animées `#ciel` par-dessus) comme la campagne. Menu = thème aléatoire
  (`FOND_ACC`) ; **l'accueil compose son propre décor** (le client, le 13/10/2026) : la nébuleuse seule `bg-2`
  (`poserFond(t,true)`) et les deux planètes détachées (`img/planete-verte|rousse.webp`, `.astres`) de part et d'autre
  du médaillon, à moitié hors de l'écran, en lente dérive : plus rien derrière le titre, les pièces ni les boutons ;
  **trois petits astéroïdes** détachés (`img/asteroide-1…3.webp`, `.roc`) dans les marges libres, à l'accueil ET en jeu
  (le client, le 13/10/2026), jamais sur le plateau, le titre ni les boutons ; jeu = thème du monde courant (`J.fond`, `themeFond(w)=(w%4)+1`), **nébuleuse seule** `bg-N` elle aussi
  (`poserFond(t,true)`, le client, le 13/10/2026 : les planètes et astéroïdes des composites passaient sous le plateau ;
  les `fond-N` ne servent plus). En jeu comme à l'accueil, le ciel animé est baissé et n'envoie qu'une étoile filante pâle à la fois. La campagne
  (`#parcours`) garde ses fonds en couches parallaxe par-dessus.
- **Ce que l'achat ouvre, dit clairement** (le client, le 14/10/2026 : « Jeu libre », pas « Partie libre » ; donner envie
  d'acheter) : sans achat, le jeu libre n'a que « Facile » sur les orbites du dernier monde gratuit (`orbitesLibres`,
  `libresGratuits`) ; Moyen/Difficile/Expert, Sans fin, Relax et le **défi de la semaine** sont dans une carte dorée
  « Avec le jeu complet » (`carteReserve` : cadenas, une phrase par mode, bouton Débloquer et prix) qui mène à la boutique.
  Le défi du jour reste gratuit (habitude, ampoules ; six orbites : un avant-goût).
- **Sans fin** (`sansFinDef(k)`, depuis Jeu libre) : étape k = mélange de k+2 coups (25 au plus), record
  `PROG.stats.sansFin` ; au-delà de l'étape 5, le jeu complet. **Partager** le défi du jour : `partager()`,
  un résumé texte (coups, temps, étoiles) par la feuille de partage du téléphone ou le presse-papiers.
- **Progression** (le client, le 11/10/2026 : « un jeu qu'on lance quelques minutes ou dans lequel on s'investit ») :
  le **rang** vient de l'expérience (`PROG.xp`, `rangDe`, `xpPour(r)=60+40r`, titres `RANGS`), gagnée à chaque cube
  résolu (`xpVictoire` : longueur puis étoiles ; défis en plus la première fois ; campagne rejouée à moitié) ; chaque
  rang donne une ampoule. **Trois missions du jour** tirées de la date (`MISSIONS`, `missionsDuJour`,
  `avancerMissions`), +30 XP chacune, une ampoule pour les trois. **Ciels** (`CIELS`, `appliquerCiel`, classes
  `ciel-…` sur `body`) ouverts par rang : **désactivés depuis le décor CraftPix** (le fond image masque le body) —
  sélecteur des options masqué, code encore présent, à nettoyer. La tuile **Défis** ouvre le défi du jour et celui de la **semaine**
  (`semaineDef`, 14 coups, deux ampoules la première fois). **Relax** (`relaxDef`, depuis Jeu libre) : 8 coups,
  sans chrono, compteur ni étoiles. Écran **Profil** par la puce du rang, au centre de la barre du haut de l'accueil
  (anneau d'expérience, titre, puis une cible et « 1/3 » pour les missions du jour, dorés à 3/3). Les joueurs d'avant le rang reçoivent une fois l'expérience
  de leurs niveaux déjà finis (`rattraperXp`, `PROG.xpInit`). Le bouton principal porte deux lignes (l'action, puis
  où l'on en est) et le total d'étoiles à droite, puis une fine barre de la campagne (niveaux finis sur le total, `.prog-camp`, cachée
  avant le premier niveau) : plus de phrase sous le bouton ni de bande du rang. Le rang reste dans la puce du haut
  (deux progressions distinctes). Les niveaux s'affichent en numéro continu (`numNiveau`, « Niveau 26 »), comme sur la carte.
- **Faces terminées** : halo discret de leur couleur sous leurs neuf pastilles (`RAYON_FACE`), sur le plateau de jeu.
- **Musique** (`Musique`, `www/audio/nuit-dorbites.m4a`, générée par le client avec Suno sous licence
  commerciale) : AAC 96 kb/s (l'Opus d'origine ne se lit pas sur iPhone), boucle Web Audio avec fondu
  enchaîné de 6 s, démarre au premier geste, se coupe en arrière-plan, baisse sous la victoire. Le Chromium
  des tests n'a pas l'AAC : son échec de décodage doit rester silencieux.
- **Ampoules** (le client, le 11/10/2026 ; pas de vidéo publicitaire, qui imposerait pub, suivi et RGPD) :
  un indice coûte une ampoule (`ampoules()`, `depenserAmpoule()`), 3 au départ ; +1 au défi du jour réussi,
  +1 par monde terminé, +1 à la première fois 3★ de coups et 3★ de temps sur un niveau ; le jeu complet en
  offre une par jour ; à zéro, une revient après 10 min (`RECHARGE_AMP`). Fusion par `ampMaj`.
- **Accueil** (le client, le 13/10/2026) : titre « ORBICUBE » en capitales fines très espacées (Jost 300,
  `.marque`, lueur d'accent, sans ellipse). **Jost remplace Unbounded partout** (`--f-titre`, graisses 600 et 700 embarquées,
  aussi dans `confidentialite.html` et `outils/captures.js`) ; Unbounded est retirée du dépôt. **Le cube au sommet de l'orbite du haut** (le cube au
  centre était trop petit et touchait les pastilles) : un seul visuel, le plateau prend la place libre et le cube se pose
  sur le sommet du cercle du haut (1,617 unité au-dessus du centre), dans un **médaillon** (`#medaillon` : disque sombre
  qui masque le trait, fin anneau d'accent, halo) pour ne pas le confondre avec une pièce du plateau. Tailles en `ECH` :
  `MEDAILLON` 0,92, `CUBE_LOGO` 0,7, disque en verre fumé ; `Logo.demarrer` réserve au-dessus du plateau la moitié
  du médaillon qui dépasse plus `AIR`, pour un espace égal sous le titre et au-dessus du bouton.
  **Logo sobre** (`opts.sobre`, accueil seulement) : cercle actif en fin trait d'accent (pas le blanc épais du jeu),
  orbites plus fines, traînées, lueurs des pièces et comète deux fois plus discrètes, plateau à 96 % ; sur l'accueil,
  le ciel animé baisse ses étoiles et n'envoie qu'une étoile filante pâle toutes les 6 à 12 s.
  **Menu du bas** : le bouton principal en pilule (accent, sans gloss plastique), puis un **dock** de raccourcis ronds
  (`.dock`, icône + nom + état : Défis avec un point doré tant que le défi du jour n'est pas joué, « +1 ampoule » dessous, Jeu libre, Succès,
  et « Boutique » en doré dès le premier niveau fini). Plus de bouton musique sur l'accueil : il est dans les options.
  **Le bouton principal en pilule est celui de tout le jeu** (fenêtres de pause, victoire, boutique…), avec des boutons
  secondaires en pilule de verre sombre au contour d'accent, texte centré (`.fenetre .bouton`).
  **Écran de jeu au même langage** : boutons à icône seule (`.ico`, partout) en ronds de verre au contour d'accent,
  Annuler/Rejouer en pilules de verre, Niveaux/Accueil en petits ronds avec leur nom dessous (bloc en fin de feuille de style).
- **Campagne** : chaque niveau montre deux rangées d'étoiles (coups dorées, temps bleues), l'en-tête de chaque monde
  et la pastille du haut les deux totaux (`chronoMonde`, `etoilesChrono`). Options : les réglages à plusieurs choix
  (`.ligne.empile`) prennent toute la largeur du cadre.
- **Écrans de menu** (profil, options, succès, aide) : le contenu défile derrière l'en-tête jusqu'aux bords de l'écran
  (zones de sécurité comprises) ; l'en-tête flotte sur un fondu sombre (bloc en fin de feuille de style, le client, le 13/10/2026).
- **Logo** : les trois anneaux (`ANNEAUX` dans `outils/icones.py`) pour l'icône, le démarrage natif et le logo du
  mélange (`.anneaux`). **L'écran de chargement web montre les neuf orbites du plateau** (`.orbites`, SVG, un éclat de
  couleur par orbite, sans filtre CSS) puis se dissout sur l'accueil (le client, le 13/10/2026) ; les médailles des succès gardent le plateau. Accueil : la devise disparaît après le
  premier niveau, le rond « Boutique » n'apparaît qu'après le premier niveau fini. Quand la suite de la campagne est payante, le bouton
  principal dit « Campagne » (et non « Continuer ») et la ligne dessous le dit.
- **Le mélange ne se montre jamais** (le client, le 11/10/2026) : au lancement, le plateau se trouble en tournant
  (`.brouille`, flou, posé SANS transition dans `lancer()` : sinon le plateau et le cube se voyaient nets puis disparaissaient), les couleurs changent hors de vue puis il se dévoile. Animer les coups un par un permettait
  de les rejouer à l'envers. Seul « Revoir ma partie », après la victoire, rejoue le mélange.
- **Campagne : huit mondes, une orbite de plus à chaque monde** (le client, le 14/10/2026 : « logique », et le joueur qui
  veut toutes les orbites doit acheter) : 2, 3, 4, 5 orbites gratuites (U R, +F, +D, +L), puis 6, 7, 8 et les 9 avec le jeu
  complet (`mondesGratuits: 4`). Le vérificateur contrôle l'orbite de plus par monde (chacun garde celles du précédent),
  aucun monde gratuit à neuf orbites, et l'empreinte des 64 niveaux du chemin. Campagne refaite = **nouvelle graine**
  (`orbicube2-<monde>-<niveau>`) et `CAMPAGNE=2` : `fusion` ne reprend pas les niveaux d'une sauvegarde d'une autre
  campagne (achats, expérience et succès, si).
- **Niveaux experts** : 12 niveaux par monde, 96 en tout ; les huit premiers font le chemin (`BASE`), les quatre derniers
  (`estExpert`) forment **une voie dorée parallèle** (le client, le 14/10/2026) : ils s'ouvrent quand le chemin du monde
  est fini, puis l'un après l'autre (`niveauOuvert`), en option, sans jamais bloquer le monde suivant (`mondeOuvert`,
  `mondeFini` lisent le huitième). La victoire du huitième niveau propose « Expert 1 » en second bouton doré. Sur la carte (le client : « la forme inverse », mais pas
  « trop symétrique ») : le chemin garde sa vague naturelle mais jamais au centre (`vague` : au moins 42 % de l'amplitude),
  la voie dorée est sa forme inverse resserrée à 86 % (`inv`), partie du niveau 1 avec le chemin ; l'expert j se pose sur elle, à la
  hauteur du niveau 2j+3 ou 2j+4 (le plus écarté), donc de l'autre côté, jamais sur un nœud (le parcours de test exige
  70 px entre deux nœuds). Les lacets réguliers en miroir parfait ont été refusés. **Tant que le chemin du monde n'est
  pas fini, la voie dorée est discrète** (trait pâle `.voie-discrete`, nœuds `.discret` à 24 %) et ses nœuds ne montrent
  qu'un éclat doré, ni « E1 » ni étoiles. La pastille « Voie dorée » est petite, posée sur la bifurcation depuis le
  niveau 1 (`t:"x"`). La condition d'étoiles d'un monde n'est plus écrite sous sa description : le bandeau la montre.
- **Mémoire de la carte sur iPhone** (Safari fermait la page, « un problème est survenu à plusieurs reprises ») : chaque
  bande d'image d'un monde (4 par monde) était un calque de carte graphique (`will-change`) ; à 8 mondes, 48 calques,
  ≈ 760 Mo. Désormais pas de `will-change` sur les bandes ni sur leurs calques parents, et `parcParallax` ne garde
  affichées que les bandes à moins d'un demi-écran de la vue (≈ 11 calques, ≈ 140 Mo). Le parcours de test exige au plus
  12 bandes affichées. Nœuds « E1 » à « E4 ». Le chemin numérote 1 à 64 sans eux (`numNiveau`, `nomNiveau`).
- **Vraie progression** (le client : deux niveaux de suite se ressemblaient ; « trouver le bon compromis
  difficulté/progression/orbites ») : une orbite de plus par monde ; dans un monde, un coup de plus tous les deux niveaux
  (les trois premiers montent d'un coup chacun), pente plus raide avec les orbites ; chaque monde repart un peu plus bas
  que la fin du précédent ; les experts partent de la fin du chemin (monde 1 : 1→5, experts 5→7 ; monde 8 : 5→12, experts
  12→18). « Un coup de plus à chaque niveau » a été essayé et retiré : 8 coups sur 2 orbites, trop dur. Le chemin
  ne raccourcit jamais, un seul niveau à un coup, et `genererMelange` refuse qu'une orbite revienne dans une suite de coups sur un même axe (U D U′
  vaudrait D) ; le vérificateur contrôle les trois. Graine `orbicube3-` ; `CAMPAGNE` reste 2 (jeu pas encore sorti :
  les essais du client gardent leurs étoiles).
- **Mondes gratuits et étoiles** : le monde 3 demande en plus des étoiles de coups (jaunes), le monde 4 des étoiles de
  temps (bleues), comptées sur toute la campagne, achat ou non. **Règle unique** (le client : logique, jamais 100 %) : deux
  étoiles par niveau du chemin des mondes d'avant (`MONDES[w].etoiles` = 2, `seuilEtoiles` : 32 puis 48), le vérificateur
  refuse plus des trois quarts. Un monde déjà commencé reste
  ouvert. La carte, l'accueil (`mondeAttend`) et la victoire disent ce qui manque.
- Les niveaux de campagne sont tirés d'une graine fixe (`orbicube-<monde>-<niveau>`) : changer
  `genererMelange()` change tous les niveaux des joueurs. Ne le faire qu'avec une nouvelle graine.
- La progression est dans `localStorage` (clé `orbicube-v1`) et, sur téléphone, dans
  `Preferences` (iOS peut vider le stockage web). `fusion()` réconcilie les deux.
- **Cadence** (mesuré le 11/10/2026, processeur ralenti ×4) : un plateau qui ne fait que pulser (indice) et les
  plateaux décoratifs (`lent` : logo de l'accueil, aide) se redessinent à 30 images/s ; un tour, un glisser ou un effet
  gardent la pleine cadence (`Ticker.tic`). Le petit cube n'est redessiné que s'il change (`dessinerMini.cle`).
  Occupation du fil : jeu avec indice 73 % → 32 %, accueil 45 % → 26 %. Pendant le mélange, le logo des trois
  anneaux (`.anneaux`) tourne sur le plateau troublé.
- Pas d'effet `shadowBlur` du canvas sur le plateau : trop lent sur téléphone, il figeait le jeu.
  Les halos sont des traits translucides superposés (`halo()`).
- **Les langues** : le français est la source. Un observateur traduit tout texte qui apparaît à
  l'écran en le cherchant tel quel dans `www/langues.js` (modèles « Monde {0} » pour les nombres).
  On écrit donc le jeu en français, et on ajoute la phrase à la table : pas d'appel de traduction
  à semer dans le code. Les paragraphes d'aide à balises se traduisent en blocs (`data-html`).
- **Les succès des stores** passent par `plugins/succes-natifs` ; sans module ni configuration,
  tout se replie sans bruit. Le module natif n'a jamais été compilé ici : la première build Xcode
  et Android Studio le validera.
- **Classements** (le client, le 11/10/2026 : « on fera comme tu le dis ») : par Game Center et Google Play Jeux,
  **pas de compte à nous** (la politique de confidentialité ne change pas). `CLASSEMENTS` (jour, semaine, sansfin,
  etoiles), identifiants dans `www/config.js` > `classementsStores`, contrôlés par le vérificateur ; envoi à la victoire
  et à la connexion (`envoyerClassements`), chrono en millisecondes (le module iOS le passe en centièmes). Bouton
  « Classements » du Profil et « Voir le classement » dans la fenêtre de victoire des défis et du sans fin, visibles
  seulement connecté. Procédure dans `docs/lancement.md` 3 ter.
- **Un geste vaut au plus un coup, compté au lâcher** (le client, le 11/10/2026) : pendant le
  glisser, les quarts de tour franchis sont posés sur le plateau mais pas comptés ; au lâcher,
  `finirGeste()` lit la rotation nette : 0 (aller-retour, tour complet) = aucun coup, un quart =
  `U`/`U′`, un demi-tour = `U2`, un seul coup comme dans la notation du cube. Clavier et pavé
  restent un quart de tour = un coup.
- `?capture` dans l'adresse expose `window.__orbicube.solution()`, pour `outils/captures.js` seulement.
