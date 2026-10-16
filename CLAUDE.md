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
| un succès | sa clé dans `www/config.js` > `succesStores` (iOS et Android), sa ligne dans `docs/lancement.md` 3 bis (1 000 points Apple au plus), son image (`npm run icones`) : le vérificateur contrôle les quatre |
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
- **Le minimum de données** : depuis le classement (décision du client, le 14/10/2026), le serveur garde un
  identifiant tiré au hasard, un pseudo, les scores et la sauvegarde ; ni nom, ni e-mail, ni compte Apple ou Google,
  ni le code de récupération en clair. Rien n'est envoyé avant la première victoire, et « Supprimer mes données »
  efface tout. Toute donnée de plus change `www/confidentialite.html` et les questionnaires des stores
  (`docs/lancement.md` 6). Ajouter de la publicité ou de l'analyse impose en plus un consentement RGPD : décision
  du client, pas une optimisation.
- **Le jeu ne dépend d'aucun réseau** : polices embarquées, pas de CDN. Le classement est le seul appel réseau :
  sans adresse dans `config.js` ou sans connexion, tout se replie sans bruit et les scores attendent (`PROG.envois`). Un fichier ajouté va aussi
  dans `www/sw.js` : `FICHIERS` pour le code (cache de la version `V`), `FICHIERS_MEDIAS` pour images, polices et musique
  (cache `MEDIAS`, gardé d'une publication à l'autre : changer son nom quand un média change). Le vérificateur contrôle les polices.

## Ce qu'il faut savoir du code d'Orbicube

- **Cubes 2×2 et 4×4** (le client, le 16/10/2026 : « pour un 2×2, il suffit de 3×2 orbites ; pour un 4×4, 3×4 ») : trois familles
  de N orbites. `construireCube(n)` (coordonnées de −DEMI à DEMI, demi-entiers en 2 et 4), `mvDe(n)` (R L U D F B extérieures,
  r l u d f b intérieures en 4×4), `rayonsTaille(n)` (plateau remis à l'étendue du 3×3), `poserTaille(n)` reconstruit tout ;
  partout les couches vont de −DEMI à DEMI et s'indexent `L+DEMI`. Le centre d'une face sans pastille du milieu est la moyenne de
  ses pastilles. Pièces ×1,4 en 2×2, ×0,76 en 4×4. **Seulement en Jeu libre** (choix de taille en tête de la fenêtre,
  `fenetreLibre`, `PROG.options.tailleLibre`) : 2×2 gratuit (3, 6, 9, 12 coups), 4×4 avec le jeu complet (8, 14, 20, 30) ;
  records à part (`cleRecord` : « t2-3 »…). `lancer` pose la taille de la partie, `montrer` remet le 3×3 hors du jeu. Le 3×3
  reste celui d'origine (le vérificateur le rejoue). `?capture` : `__orbicube.jouer(nom)`, `taille()`.
- **Dispositions des orbites** (le client, le 16/10/2026 : « acheter d'autres présentations des orbites ») : `DISPOS` (Trèfle, la
  disposition d'origine ; **Anneau**, les six faces en couronne : centres à 0,32 au lieu de 0,5336, le tout agrandi de 1,155),
  style `dispo` (onglet Formes, « Disposition des orbites » ; Anneau dans le pack Formes et à l'unité). `poserGeo(id)` recalcule
  tout ce qui dérive de la géométrie (`RAY`, `CEN`, `S[].xy`, `CENTRE_FACE`, `FORME`, `RAYON_FACE`, `DELTA`, `PAS`) ; `changerGeo`
  redessine les plateaux. L'aperçu de la boutique pose la disposition regardée, `montrer` remet la disposition portée en
  quittant la boutique. Les facettes gardent un angle d'au moins `min` (50° Trèfle, inchangé ; 65° Anneau, `ecarter`).
  Le vérificateur et le parcours de test jouent le Trèfle.
- La géométrie : trois familles de trois cercles concentriques (une par axe). Une facette
  est au croisement de deux cercles. **Les pastilles d'un cercle ne sont pas réparties
  régulièrement** : celle qui franchit un des deux grands vides parcourt plus d'un demi-tour.
  `delta()` donne à chacune son vrai déplacement dans le sens du cercle. Prendre le chemin le plus
  court (`normA`) les faisait tourner à contresens et rendait le pas d'un quart de tour nul, ce qui
  figeait le glisser en boucle infinie. Le vérificateur rejoue les 18 tours.
- **Quel cercle porte quelle couche** (le client, le 16/10/2026, d'après une autre app sur le même principe) : la couche +1 d'une
  famille est sur son **petit** cercle, la couche −1 sur le grand (`RAY[DEMI-L]`, partout : placement, dessin, saisie, indice,
  notes). Le petit cercle entoure ainsi la face qu'il fait tourner (U, R, F, au centre de leur famille), le grand longe la face
  extérieure (D, L, B), et les trois faces du centre sont celles du petit cube au-dessus, **dans le même sens**. Avant, c'était
  l'inverse (le grand cercle tournait la face du centre, dessinée en miroir). Le moteur, les mélanges et les niveaux n'ont pas
  changé. Le test des gestes glisse sur le petit cercle (U) ; `outils/icones.py` place les pastilles de la même façon.
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
  autour de la verticale, haut/bas pour la face du dessous, calé au quart de tour au lâcher (`PIVOT`), **puis revenu seul à sa vue de jeu** 0,9 s plus tard (`revenir`, le client, le
  16/10/2026 : tourné, il ne correspondait plus aux orbites) : le pivot sert à regarder les faces cachées.
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
  **Style par défaut des pastilles : celui du monde** (le client, le 14/10/2026 : que le cube ne jure pas avec le décor ;
  « couleur, modèle, forme, opacité, motif, taille »). Palette « Couleurs du monde » (`PAL_THEME`, une par thème, les six
  teintes du cube dans l'ordre classique, accordées au décor ; `PALETTES.monde` lit `THEME_COURANT`, posé par `accent`/
  `accentTheme` via `suivreTheme` ; menus = thème 2) et forme « Style du monde » (id `astral`, `pastilleMonde`, `LOOK_THEME`) :
  corps de verre sombre teinté du monde, liseré de la couleur du monde, pastille plus ronde et plus petite en dégradé presque
  opaque, arête claire, motif par décor (cristal, givre, braise, étincelle). Le petit cube et celui du médaillon suivent
  (`dessinerCube`, `LK`). « Classique » et « Facettes » (corps noir, cube de compétition) restent des choix gratuits.
  Migrations une fois : `PROG.options.pal2` (classique → monde), `sty3` (facettes → astral). **Depuis le 16/10/2026, la forme
  par défaut redevient « Facettes »** (le client), première de la liste ; `sty4` remet une seule fois « Style du monde » sur
  Facettes. **Depuis le 16/10/2026, la palette par défaut est « Classique »** (les couleurs de la vidéo, le client), première de la
  liste ; `pal3` remet une seule fois « Couleurs du monde » sur Classique. **Traînées plus visibles en jeu** (le client : « ne se voient
  pas fort ») : hors accueil sobre, 1,6 fois plus longues et 1,7 fois plus opaques (`FT`, plafonné à 1).
  **Pour donner envie et comprendre** (le client, le 14/10/2026) : phrase d'accueil (gagner en jouant ou acheter), compteur de
  collection sur chaque onglet (« 4/8 »), fiche avec une phrase par style (`DESC_STYLE`) et, pour un style à gagner, sa barre de
  progression (`progresStyle`) ; badge « Nouveau » sur les styles gagnés pas encore vus (`PROG.stylesVus`, `nouveauxStyles`) et
  point doré sur le rond Boutique de l'accueil ; « Valeur à l'unité » sur chaque pack et édition, jamais de prix barré (directive Omnibus, audit du 16/10/2026 ; `prixSomme`, calculé avec
  les prix du store, rien d'affiché si un prix manque) ; un style acheté seul est porté aussitôt ; ampoules expliquées ; pied
  de page rassurant (paiement par le store, restaurable). Le style
  porté est dans `PROG.options` et lu par `STY` (recalculé par `appliquerOptions`, un style reperdu retombe sur le premier) ;
  les achats dans `PROG.droits` (jamais perdus par `fusion`, gardés par « Tout effacer »). Le dessin (`dessiner`, `pastille`,
  `couleurOrbite`, `confettis(v)`) lit les styles du plateau (`pal`, `forme`, `trainee`, `orbite`) ou `STY`. Le pont natif
  (`src/natif.js`) : `prixProduits`, `droits`, `acheterProduit`. Produits et droits : `docs/lancement.md` 3 quater ; prix
  d'attente : `www/config.js` > `prixPacks`. Pas de monnaie virtuelle ni de tirage au hasard (décision du 13/10/2026).
  Pack soutien : liseré doré sur la puce du rang et le Profil (« Mécène d'Orbicube »).
- **Fin de niveau** : les six faces s'illuminent l'une après l'autre et le cube fait un tour sur
  lui-même (`PIVOT` n'est animé que là ; 1,5 s autour de la verticale, dans l'inclinaison du jeu, sans le relever ; la
  fenêtre de victoire attend 1,7 s pour qu'on le voie, le client le 16/10/2026) ; « Revoir ma partie » rejoue le mélange puis les coups (`revoir()`). La fenêtre de victoire porte en tête où l'on est (`.vic-ou` : « Monde 3 · Niveau 22 », « Défi du jour »…,
  capitales espacées de la couleur du monde, le client : « de façon pro »). Puis (le client : « pas optimisée du tout ») : gains côte à côte
  (`.vic-gains`), résultat en **deux cartes comme la fiche du niveau** (chiffre, « objectif », étoiles), « Revoir ma partie » en
  simple lien (`.vic-lien`), et les **confettis derrière la fenêtre** (`#confettis` z-index 19 : ils couvraient chiffres et boutons).
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
- **Le gain principal du jeu complet, ce sont les 9 orbites** (le client, le 16/10/2026) : la fenêtre d'achat (`ouvrirBoutique`)
  s'ouvre sur « Débloquez les 9 orbites » avec leur dessin (`SVG_NEUF`, `.achat-hero`), puis la raison qui l'a ouverte
  (`POURQUOI`) et les avantages, les orbites d'abord ; même ordre dans la boutique (édition intégrale, Orbicube complet),
  les options et la carte réservée (« Avec les 9 orbites · jeu complet »).
  **Dans la boutique, le jeu complet est tout en haut, à part** (le client, le 16/10/2026 : « perdu dans les packs ») :
  carte « Le jeu complet » (`#boutJeu`, les 9 orbites, bouton « Orbicube complet ») seule ; ensuite « Styles » : quatre
  onglets Couleurs, Formes, Effets et **Packs** (le client, le 16/10/2026 : « rassembler les packs dans un onglet », puis
  « l'édition intégrale doit être dans les packs », « les aides doivent être dans les packs » : Édition intégrale,
  Collection, les trois packs puis les aides à acheter, compteur « n/3 », sans aperçu). **Offres groupées en grandes cartes**
  (le client : « pas bien présentées ») : l'intégrale montre ses deux parts (le jeu complet + tous les styles), la collection
  la vignette de ses onze styles, chacune avec son économie en pourcentage (`economie`, rien si un prix manque).
  **Le pack soutien devient un pourboire** (« Soutenir le développeur » depuis l'audit du 16/10/2026 : Apple réserve le don aux organismes reconnus ; section « Faire avancer Orbicube », en bas de l'onglet Packs : il
  finance les optimisations ; même produit `orbicube_soutien`, même liseré doré). Compteurs sous les noms. **Sur la carte de la campagne**, le jeu complet se pose comme un monde entre le
  dernier monde gratuit et le premier payant (`.parc-jeu`, item `t:"j"` de `buildParcours`) ; il disparaît après l'achat.
  Le titre « Débloquez les 9 orbites » prend toute la largeur de la carte et ne se coupe jamais au milieu d'un mot
  (le client : « or-bites ») : pas de césure, taille selon l'écran.
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
  `avancerMissions`), +30 XP chacune, une ampoule pour les trois. Les anciens « ciels » par rang ont disparu avec le décor CraftPix (code retiré). La tuile **Défis** ouvre le défi du jour et celui de la **semaine**
  (`semaineDef`, 14 coups, deux ampoules la première fois). **Relax** (`relaxDef`, depuis Jeu libre) : 8 coups,
  sans chrono, compteur ni étoiles. Écran **Profil** par la puce du rang, au centre de la barre du haut de l'accueil
  (anneau d'expérience, titre, puis une cible et « 1/3 » pour les missions du jour, dorés à 3/3). Les joueurs d'avant le rang reçoivent une fois l'expérience
  de leurs niveaux déjà finis (`rattraperXp`, `PROG.xpInit`). Le bouton principal porte deux lignes (l'action, puis
  où l'on en est) et le total d'étoiles à droite, puis une fine barre de la campagne (niveaux finis sur le total, `.prog-camp`, cachée
  avant le premier niveau) : plus de phrase sous le bouton ni de bande du rang. Le rang reste dans la puce du haut
  (deux progressions distinctes). Les niveaux s'affichent en numéro continu (`numNiveau`, « Niveau 26 »), comme sur la carte.
- **Faces terminées** : halo discret de leur couleur sous leurs neuf pastilles (`RAYON_FACE`), sur le plateau de jeu.
- **Une note par cercle** (le client, le 16/10/2026, vu dans une vidéo) : `sonTour` joue la note de son orbite (`NOTES`, gamme
  pentatonique de do, trois notes par famille, du grave à l'aigu) en timbre de kalimba ; chaque quart de tour d'un glisser
  la rejoue. **Palette Classique** aux couleurs du cube de cette vidéo, relevées sur les captures du client (#F59A38, #F2665A,
  #F7D44C, #F2F2EF, #38C987, #4C8DF0) ; le logo les reprend (`COUL_LOGO`).
- **Musique** (`Musique`, `www/audio/nuit-dorbites.m4a`, générée par le client avec Suno sous licence
  commerciale) : AAC 96 kb/s (l'Opus d'origine ne se lit pas sur iPhone), **lue en flux** par deux lecteurs `<audio>`
  branchés dans Web Audio qui se relaient avec un fondu enchaîné de 6 s (décodée d'un bloc, elle prenait 95 Mo sur iPhone), démarre au premier geste, se coupe en arrière-plan, baisse sous la victoire. Le Chromium
  des tests n'a pas l'AAC : son échec de décodage doit rester silencieux.
- **Ampoules**, appelées **« aides »** à l'écran depuis le 16/10/2026 (le client ; en, nl « hints », de « Hilfen », es « ayudas » ;
  le code et les produits des stores gardent `amp`/`ampoules`) (le client, le 11/10/2026 ; pas de vidéo publicitaire, qui imposerait pub, suivi et RGPD) :
  un indice coûte une ampoule (`ampoules()`, `depenserAmpoule()`), 3 au départ. **Rendues rares le 15/10/2026** (le client :
  « trop facilement obtenues, ça gâche la difficulté ») : +1 quand les quatre missions du jour sont réussies, +2 pour les
  quatre grandes missions, +1 par monde terminé, +1 à chaque palier de la route du rang (tous les cinq rangs, plus à chaque
  rang), +1 par semaine de série, la voie dorée ; le jeu complet en offre une par jour ; à zéro, une revient après 30 min
  (`RECHARGE_AMP`). Plus rien pour un défi réussi (de l'XP seulement), un 3★ + 3★, les rangs 10 et 20. Fusion par `ampMaj`.
- **Les coups joués ne s'affichent jamais** (le client, le 15/10/2026 : recopiés, ils rejoueraient un défi au pavé et
  écraseraient les scores) : `#notation` ne montre que la consigne avant le premier coup. Sur un **défi classé** (jour,
  semaine, `defiClasse`) : ni pavé de notation (`majPave`), ni clavier (sauf `?capture`, pour les tests), ni « Revoir ma
  partie ». Le parcours de test lit le dernier coup par `window.__orbicube.dernier()` (accès de capture seulement).
- **Accueil** (le client, le 13/10/2026) : titre « ORBICUBE » en capitales fines très espacées (Jost 300,
  `.marque`, lueur d'accent, sans ellipse). **Jost remplace Unbounded partout** (`--f-titre`, graisses 600 et 700 embarquées,
  aussi dans `confidentialite.html` et `outils/captures.js`) ; Unbounded est retirée du dépôt. **Deux familles seulement depuis le 16/10/2026** (passe de design) : Jost pour les titres, les chiffres et les
  étiquettes en capitales (`--f-chiffre` = Jost ; JetBrains Mono est retirée), Instrument Sans pour le texte ; chiffres tabulaires partout. **Le cube au sommet de l'orbite du haut** (le cube au
  centre était trop petit et touchait les pastilles) : un seul visuel, le plateau prend la place libre et le cube se pose
  sur le sommet du cercle du haut (1,617 unité au-dessus du centre), dans un **médaillon** (`#medaillon` : disque sombre
  qui masque le trait, fin anneau d'accent, halo) pour ne pas le confondre avec une pièce du plateau. Tailles en `ECH` :
  `MEDAILLON` 0,92, `CUBE_LOGO` 0,7, disque en verre fumé ; `Logo.demarrer` réserve au-dessus du plateau la moitié
  du médaillon qui dépasse plus `AIR`, pour un espace égal sous le titre et au-dessus du bouton.
  **Logo sobre** (`opts.sobre`, accueil seulement) : cercle actif en fin trait d'accent (pas le blanc épais du jeu),
  orbites plus fines, traînées, lueurs des pièces et comète deux fois plus discrètes, plateau à 96 % ; sur l'accueil,
  le ciel animé baisse ses étoiles et n'envoie qu'une étoile filante pâle toutes les 6 à 12 s.
  **Menu du bas** : le bouton principal en pilule (accent, sans gloss plastique), puis un **dock** de raccourcis ronds
  (`.dock`, icône + nom, **sans sous-titre** depuis le 16/10/2026, le client ; les badges restent : Défis avec le nombre de missions
  qui restent, Classement, Jeu libre, Succès, et « Boutique » en doré dès le premier niveau fini). Plus de bouton musique sur l'accueil : il est dans les options.
  **Le bouton principal en pilule est celui de tout le jeu** (fenêtres de pause, victoire, boutique…), avec des boutons
  secondaires en pilule de verre sombre au contour d'accent, texte centré (`.fenetre .bouton`).
  **Écran de jeu au même langage** : boutons à icône seule (`.ico`, partout) en ronds de verre au contour d'accent,
  Annuler/Rejouer en pilules de verre, Niveaux/Accueil en petits ronds avec leur nom dessous (bloc en fin de feuille de style).
- **Campagne** : le titre de l'écran est dans la police du titre ORBICUBE (Jost 300 en capitales espacées, le client, le
  16/10/2026) ; **en haut de la carte, « À suivre… »** (`.parc-fin`, item `t:"f"`) annonce les mondes des prochaines mises à
  jour ; le chemin et la voie dorée du dernier monde s'y prolongent en pointillés qui s'effacent (`suiteC`, `suiteV`,
  dégradés `fonduSuite`). L'en-tête de chaque monde et la pastille du haut montrent les deux totaux (`chronoMonde`, `etoilesChrono`).
  **Nœuds de niveau** (le client, le 14/10/2026 : « tout ») : la couleur d'un monde sur la carte est celle de son décor
  (`THEME_ACC[themeFond(w)-1]`, comme en jeu ; l'ancienne palette `ACCENTS` donnait du lilas au monde vert). Bouton de 66 px avec une **bille** de 56 px en verre sombre,
  la couleur du monde en reflet et sur l'anneau (`.bille` ; l'aplat de couleur et les orbites en filigrane ont été refusés), les **étoiles de coups en
  arc au-dessus** (`.arc`), les **étoiles de temps en trois arcs bleus** sur le bas de l'anneau (`anneauTemps`). États :
  à jouer plus grand, pulsant (anneau qui grandit : transform/opacity, aucun repeint), étiquette « Jouer » (hors du bouton, dans `sects`) ; parfait (3 + 3) anneau doré ;
  verrouillé plus petit et gris ; expert en **losange doré**. Un toucher ouvre la **fiche du niveau** (`ficheNiveau` :
  objectif, record, étoiles, « Jouer ») au lieu de lancer : deux cartes Coups et Temps (record en grand, « objectif » dessous),
  aux couleurs du monde. La carte (`accentCarte` : le monde où l'on en est) et la fiche prennent la couleur du décor ;
  `montrer` rend le lilas à l'accueil et aux menus (le client : « menu toujours mauve »). Au retour d'une victoire, les nouvelles étoiles apparaissent
  une à une (`DERNIER`, posé par `victoire`). Le chemin entre deux niveaux finis passe en trait plein de la couleur du
  monde, coupé au bord des billes. Niveaux et experts verrouillés : cadenas (doré sur les losanges), opacité 72 % (le client :
  « un peu plus visibles »). **Toucher un niveau fermé** ouvre une notification en bas de l'écran (`#avis`, `avisVerrou`,
  `raisonVerrou`) aux couleurs du monde : ce qu'il faut faire pour l'ouvrir (niveau d'avant, fin du chemin pour la voie
  dorée, expert d'avant, étoiles du monde avec une barre de progression) ; un toucher ou 4 s la referment. Sous la phrase
  de chaque monde (réécrites pour dire ce qui change), une ligne « N orbites · a à b coups » (`.parc-meta`). Les décorations tiennent dans le bouton : le test des débordements reste exigeant. Options : les réglages à plusieurs choix
  (`.ligne.empile`) prennent toute la largeur du cadre.
- **Écrans de menu** (profil, options, succès, aide) : le contenu défile derrière l'en-tête jusqu'aux bords de l'écran
  (zones de sécurité comprises) ; l'en-tête flotte sur un fondu sombre (bloc en fin de feuille de style, le client, le 13/10/2026).
- **Logo** : **l'icône de l'app et l'écran de démarrage natif sont le logo premium** (le client, le 16/10/2026 : « je n'aime
  pas celui actuel », puis « le cube au milieu et quelques orbites avec les facettes autour, faisant comprendre le jeu ») :
  le plateau du jeu résolu (ses neuf orbites, une couleur par famille, la plus grande appuyée ; ses facettes en losanges) et,
  au centre, un cube 3×3 en perspective (corps noir, pastilles arrondies) aux couleurs des faces voisines (jaune, vert,
  orange), sur un ciel violet étoilé (`logo_premium`, `rendre_premium` dans `outils/icones.py`).
  Les trois anneaux (`ANNEAUX`) ne servent plus qu'au logo du mélange (`.anneaux`). **L'écran de chargement web montre les neuf orbites du plateau** (`.orbites`, SVG, un éclat de
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
  est fini, puis l'un après l'autre (`niveauOuvert` exige TOUJOURS le chemin fini : un expert gagné sous une ancienne
  règle ouvrait le suivant, plus grand et cliquable, le client l'a vu), en option, sans jamais bloquer le monde suivant (`mondeOuvert`,
  `mondeFini` lisent le huitième). La victoire du huitième niveau propose « Expert 1 » en second bouton doré. Sur la carte (le client : « la forme inverse », mais pas
  « trop symétrique ») : le chemin garde sa vague naturelle mais jamais au centre (`vague` : au moins 42 % de l'amplitude),
  la voie dorée est sa forme inverse resserrée à 86 % (`inv`), partie du niveau 1 avec le chemin pour le monde 1, puis **continue d'un monde à l'autre** (le client : la voie d'un monde
  part du dernier expert du monde d'avant, `finVoie` ; la pastille « Voie dorée » n'est qu'au monde 1) ; l'expert j se pose sur elle, à la
  hauteur du niveau 2j+2 (un tous les deux niveaux, le client : ils se collaient), donc de l'autre côté, jamais sur un nœud (le parcours de test exige
  70 px entre deux nœuds). Les lacets réguliers en miroir parfait ont été refusés. **Tant que le chemin du monde n'est
  pas fini, la voie dorée est discrète** (trait atténué `.voie-discrete`, nœuds `.discret` à 55 % : le client la voulait moins effacée) et ses nœuds ne montrent
  qu'un éclat doré, ni « E1 » ni étoiles. La pastille « Voie dorée » est petite, posée sur la bifurcation depuis le
  niveau 1 (`t:"x"`). La condition d'étoiles d'un monde n'est plus écrite sous sa description : le bandeau la montre.
- **Récompense de la voie dorée** (le client, le 14/10/2026 : « tout ») : finir le dernier expert d'un monde (`voieFinie`)
  ouvre un **style exclusif, jamais vendu** (`ouv:{voie:w}` ; Émeraude, Sillage, Écailles, Améthyste, Supernova, Nébuleuse,
  Éclats, Couronne, du monde 1 au 8 ; `styleVoie`), donne 3 ampoules en tout (`J.voie`), pose une **couronne** sur le
  bandeau du monde et illumine sa voie en trait d'or plein (coupé au bord des nœuds) ; la voie du monde 8 donne le titre
  « Maître des orbites » au Profil. Dans la boutique, ces styles montrent « Exclusif : se gagne en finissant la voie dorée
  du monde N » et une barre des experts gagnés. Succès « Voie dorée » (`voies`, les huit voies ; `orbicube.voiedoree`,
  image `ressources/succes/*/voies.png`). `npm run icones` réécrit aussi les icônes de l'app (mêmes images, autres
  octets) : ne committer que ce qui a vraiment changé.
- **Mémoire de la carte sur iPhone** (Safari fermait la page, « un problème est survenu à plusieurs reprises ») : chaque
  bande d'image d'un monde (4 par monde) était un calque de carte graphique (`will-change`) ; à 8 mondes, 48 calques,
  ≈ 760 Mo. Désormais pas de `will-change` sur les bandes ni sur leurs calques parents, et `parcParallax` ne garde
  affichées que les bandes à moins d'un demi-écran de la vue. **Fluidité** (le client : « pas fluide », puis « les étoiles doivent
  bouger aussi ») : la nébuleuse, les planètes et les étoiles bougent (`PARC_VIT`), seules les bandes à l'écran (à un quart
  d'écran près) deviennent un calque GPU (`translate3d` + `will-change` posés par `parcParallax`, au plus 9) ; les
  météores restent fixes (les faire bouger aussi : 37 calques, 46 images/s) ; le ciel animé (`Ciel`) ne se
  redessine pas sous la carte ; `parcParallax` ne cherche rien dans la page à chaque image (`PARC_BANDES`, listées une
  fois par carte) et ne touche un style que s'il change. Mesuré, processeur ralenti ×4 : 37 → 52 images/s avec les étoiles en mouvement. Le parcours de test exige au plus
  12 bandes affichées. Nœuds « E1 » à « E4 ». Le chemin numérote 1 à 64 sans eux (`numNiveau`, `nomNiveau`).
- **Vraie progression** (le client : deux niveaux de suite se ressemblaient ; « trouver le bon compromis
  difficulté/progression/orbites ») : une orbite de plus par monde ; dans un monde, un coup de plus tous les deux niveaux
  (les trois premiers montent d'un coup chacun), pente plus raide avec les orbites ; chaque monde repart un peu plus bas
  que la fin du précédent ; les experts partent de la fin du chemin (monde 1 : 1→5, experts 5→7 ; monde 8 : 5→12, experts
  12→18). « Un coup de plus à chaque niveau » a été essayé et retiré : 8 coups sur 2 orbites, trop dur. Le chemin
  ne raccourcit jamais, un seul niveau à un coup, et `genererMelange` refuse qu'une orbite revienne dans une suite de coups sur un même axe (U D U′
  vaudrait D) ; le vérificateur contrôle les trois. Graine `orbicube3-` ; `CAMPAGNE` reste 2 (jeu pas encore sorti :
  les essais du client gardent leurs étoiles).
- **Mondes 1 à 4 allégés** (le client, le 16/10/2026 : « légèrement plus facile ») : un coup de moins en haut du chemin et sur la
  voie dorée (monde 1 : 1→4, experts 4→6 ; monde 4 : 3→6, experts 6→9) ; empreinte du vérificateur mise à jour.
- **Mode test « Unscoop »** (le client, le 16/10/2026) : ce pseudo ouvre tout ce qui s'achète et tous les mondes (`createur()`,
  lu dans `complet`, `aDroit`, `mondeOuvert`), sans rien écrire dans la sauvegarde ; seulement si `config.js` > `modeTest` est
  vrai. **À passer à false avant les stores** (Apple : contenu payant ouvert sans achat), rappelé dans `docs/lancement.md` 7.
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
- **Démarrage** (mesuré le 16/10/2026, processeur ralenti ×4 : `demarrer` 380 → 235 ms) : sous l'écran de chargement, les
  plateaux décoratifs ne dessinent que leur première image (`CHARGEMENT`) ; le petit cube du jeu ne se dessine pas hors du jeu
  (`dessinerMini`) ; `numeroter` relance les animations d'entrée en un seul calcul de mise en page ; le logo de l'accueil
  dessine 2 pixels par point au plus (`dprMax`).
- Pas d'effet `shadowBlur` du canvas sur le plateau : trop lent sur téléphone, il figeait le jeu.
  Les halos sont des traits translucides superposés (`halo()`).
- **Les langues** : le français est la source. Un observateur traduit tout texte qui apparaît à
  l'écran en le cherchant tel quel dans `www/langues.js` (modèles « Monde {0} » pour les nombres).
  On écrit donc le jeu en français, et on ajoute la phrase à la table : pas d'appel de traduction
  à semer dans le code. Les paragraphes d'aide à balises se traduisent en blocs (`data-html`).
- **Les succès des stores** passent par `plugins/succes-natifs` ; sans module ni configuration,
  tout se replie sans bruit. Le module natif n'a jamais été compilé ici : la première build Xcode
  et Android Studio le validera. **21 succès** (le client, le 16/10/2026 : « des succès, notamment qui nécessitent le jeu
  complet ») : neuf demandent le jeu complet (`complet:1` dans `SUCCES` : m3, m5, m6, p60, expert, voies, neuf, semaine, elite),
  marqués « Jeu complet » (`.suc-jc`) tant qu'il n'est pas acheté. 995 points Apple sur 1 000 (rééquilibrés le 16/10/2026 : la somme dépassait 1 145) ; plus de place pour un
  succès sans en rééquilibrer d'autres. `PROG.tips.missionsJour` / `elite` notent les quatre missions réussies.
- **Classement du jeu** (le client, le 14/10/2026 : un classement interne, pseudo « PlayerX » modifiable, stats visibles
  des autres, et il doit marcher sans Game Center) : serveur Supabase dans `orbicube/serveur/` (`LISEZMOI.md` : une
  fonction `orbicube`, trois tables à RLS fermé). Pas de compte : `PROG.compte` = identifiant, jeton du téléphone, code de
  récupération (`ORBI-XXXX-XXXX-XXXX`, empreinte seule sur le serveur) et pseudo ; créé **avec l'accord du joueur** (`PROG.clAccord`, bouton « Apparaître au classement » dans la victoire d'un défi ou carte de
  l'onglet Classement ; changer de pseudo, afficher son code ou signaler le valent) ; dans l'app sans serveur, le classement est masqué (`body.sans-cl`) ;
  « Masquer ce joueur » sur une fiche (`PROG.masques`, sur ce téléphone seulement) ; créé à la première victoire acceptée
  (`assurerCompte`) avec le « Player1234 » déjà affiché (`pseudoLocal`). Le code rend pseudo, progression (sauvegarde
  envoyée au plus une fois par minute, `sauverNuage`) et achats (RevenueCat `logIn` avec l'identifiant, `NATIF.identifier`) ;
  le saisir ailleurs change le jeton, l'ancien téléphone reçoit 401 « ailleurs » et se détache (`detache`). **Les scores des
  défis sont vérifiés** : le serveur rejoue les coups (`J.hist` en notation) sur le mélange du défi avec sa copie du moteur
  (`serveur/fonction/moteur.js`, que le vérificateur compare au jeu). Écran `#classement` (onglets Jour, Semaine, Sans fin,
  Étoiles, Rang ; sa ligne « Vous » en bas si hors des 50), fiche publique limitée (`profilPublic` : pseudo, cadre, rang,
  étoiles, voies, sans fin, défis ; « Signaler »), pseudo changé par le crayon de la carte du Profil (la puce de l'accueil
  affiche le pseudo et ouvre le Profil), filtre des pseudos (`serveur/fonction/filtre.js`), trois signalements = pseudo
  « Player ». Profil > « Mon profil de joueur » : code, « Utiliser un code », « Supprimer mes données » (`classementOff`).
  `npm run tester` joue tout contre `outils/classement-essai.js` (faux serveur en mémoire, mêmes réponses). **Mise en
  ligne en attente** : la limite de deux projets Supabase gratuits est atteinte (le client doit libérer une place) ;
  `www/config.js` > `classement` reste vide d'ici là, et l'écran dit « ouvrira avec la sortie du jeu ».
- **Espace joueur** (`#joueur`, le client, le 15/10/2026 : « on s'y perd entre le profil, les missions et les défis »,
  « intuitif, compréhensible et professionnel ») : **un seul écran, trois onglets** en commande segmentée dans l'en-tête
  (`#jOnglets`, `ouvrirJoueur(o, depuis)`, `ongletJoueur`, `JOUEUR.o`) : **Aujourd'hui** (`#pJour`, `rafraichirDefis`, le client, le 15/10/2026 :
  « défi du jour, mission du jour, ça porte à confusion », « avec les récompenses de chacun », « que ça donne envie ») :
  **deux sortes de missions** (le client, le 15/10/2026 : « les gratuites rapportent moins, celles du jeu complet plus » ;
  « 4 missions mais un bonus pour 3, pas logique ») : **Missions du jour**, pour tous (le défi du jour + 3 missions `MISSIONS`
  à +40 XP, renouvelées chaque jour, bonus +1 ampoule quand les QUATRE sont réussies) et **Missions élite** (« Grandes missions » jusqu'au 16/10/2026, le client : « il faut appeler ça autrement »), avec le jeu
  complet (le défi de la semaine + 3 missions longues `MISSIONS_SEM` à +150 XP qui cumulent la semaine, renouvelées le
  lundi, bonus +2 ampoules quand les quatre sont réussies, `AMP_BONUS_SEM`). Sans achat, les missions élite se montrent derrière un
  cadenas avec leurs récompenses (`.df-reserve`, lignes `verrou` qui mènent à la boutique, un bouton « Débloquer ») et
  n'avancent pas (`avancerMissions`). **Le défi est une mission de la liste** (`defi` / `defiSem`, `fixe`, toujours en tête,
  `tirerMissions` ; son XP et ses ampoules viennent de la victoire, `gainsMission` ne fait que les afficher) ; une liste
  d'avant cette règle est tirée à nouveau. `missionsSemaine` (`PROG.missionsSem`, graine `missions-sem-<semaine>`),
  `lignesMissions` les affiche ; compteur x/4, barre dorée, une phrase d'explication les trois premiers jours.
  « Un défi en moins de N s » ne compte que les défis (un niveau d'un coup la rendait gratuite) ; `jours` compte les défis
  du jour réussis pour la première fois.
  Les XP affichées sont arrondies vers le bas du gain réel (`xpVictoire`) : ne jamais promettre plus que ce qui tombe.
  Une mission d'une seule fois n'affiche ni « 0/1 » ni barre. **Chaque objectif est un bouton** (`objectif(…, jeu, k)`,
  flèche « › ») qui mène où il se joue (`MISSIONS[].jeu` : `campagne` → bouton Jouer, `libre` → Jeu libre ; le défi du jour
  le lance, même réussi pour le rejouer) ; le gros bouton « Jouer le défi du jour » n'existe que tant qu'il n'est pas joué.
  La victoire dit ce qu'elle a accompli (`J.objectifs`, `objectifsGagnes` : « Objectif accompli · Défi du jour +1 +100 XP »)
  et la ligne s'allume au retour dans Aujourd'hui (`OBJ_NEUFS`, lueur sans changement de taille : un `scale` débordait au
  test). Le rond Défis de l'accueil porte le **nombre d'objectifs qui restent** (`#jourPoint.nb`, rien à 4/4). La phrase
  d'explication ne s'affiche que les trois premiers jours (`PROG.objVu`). Missions courtes (« Une partie en jeu libre ») ;
  « Réussir le défi du jour » n'est plus une mission (redite du premier objectif ; une liste du jour qui la contenait est
  retirée par `missionsDuJour`) ; **Classement** (`#pClassement`,
  `chargerClassement`, sous-onglets Jour à Rang, ligne « Vous » épinglée) ; **Profil** (`#pProfil`, `rafraichirProfil` : carte
  d'identité avec pseudo modifiable, récompenses du rang `#grpRecomp` avec une phrase sur la façon de monter, « Compte »).
  **Chaque chose à un seul endroit** (le client, le 15/10/2026 : « espacement, répétition, logique ») : plus de podium
  dans Aujourd'hui (l'onglet Classement le montre), plus de « Votre rang » ni d'encadré « prochaine récompense » (la route
  la montre en doré), plus de « Comment monter » en quatre lignes.
  Entrées : la puce du haut de l'accueil → Profil, le rond Défis → Aujourd'hui, le rond Classement → Classement,
  « Voir le classement » après un défi → Classement. Les anciens écrans `#profil`, `#defis`, `#classement` n'existent plus.
  Lire le classement ne crée jamais de profil (le test le vérifie) : seule une victoire, un pseudo changé, un signalement
  ou « Afficher » le code le font.
- **Route du rang** (le client, le 14/10/2026 : « à quoi sert le niveau ? ») : `ROUTE`, un style à gagner tous les cinq rangs
  (Hexagones 5, Poussière d'étoiles 10, Crépuscule 15, Nacre 20, Abysses 25, Braises 30, Solaire 35, Or rose 40), un cadre
  autour du pseudo à chaque titre (`CADRES`, `cadreDe`, `poserCadre` : bronze, argent, or, étoilé, cristal, légendaire ; sur la
  puce, la carte du Profil et au classement), et une aide à chaque palier (depuis le 15/10/2026, plus d'aides
  quotidiennes aux rangs 10 et 20 : `ampoulesDuJour` ne donne que celle du jeu complet). Liste au Profil (`routeHTML`, onglet Profil de l'espace joueur). **Chaque palier montre
  l'aperçu de sa récompense** (le client, le 16/10/2026 : « sinon on ne comprend pas » ; `ROUTE[].v` : vignette du style par
  `vignette`, cadre en anneau `.rt-cadre`). **Trois paliers réservés au jeu complet** (`jc` : palettes Prisme 12, Cosmos 22,
  Céleste 32, `ouv:{rang,complet}`) : sans achat, cadenas doré et « Jeu complet », un toucher ouvre l'achat (`POURQUOI.rang`) ;
  `paliers()` ne compte que ceux qu'on peut gagner (aide du palier, « prochaine » récompense).
- **Classements des stores** (le client, le 11/10/2026 : « on fera comme tu le dis ») — **remplacés à l'écran par le
  classement du jeu le 14/10/2026** ; l'envoi continue sans bruit s'ils existent : par Game Center et Google Play Jeux,
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
- **Mise à jour de la version web** (le client, le 15/10/2026 : « je ne vois pas les optimisations ») : sur iPhone, le jeu posé
  sur l'écran d'accueil revient de l'arrière-plan sans se recharger. `majWeb` demande une mise à jour du service worker à
  chaque retour au premier plan et recharge la page quand la nouvelle version prend la main, jamais en pleine partie
  (`RECHARGER`, appliqué par `montrer` au retour hors du jeu). Le numéro de publication (`V` de `sw.js`, lu dans le nom du
  cache) s'affiche sous les options (`#optPub`, « v153 ») : demander au client ce numéro quand il ne voit pas un changement.
- `?capture` dans l'adresse expose `window.__orbicube.solution()`, pour `outils/captures.js` seulement.
