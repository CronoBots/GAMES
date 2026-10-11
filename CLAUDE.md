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
| l'aspect du jeu | `npm run captures` si les captures des stores ne le montrent plus |

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
  hauteur qui reste (`--cube`, de 64 à 150 px). Pas en filigrane : des couleurs derrière les pastilles
  se confondraient avec elles.
- **Seul le plateau se manipule, et seulement en glissant** (le client, le 11/10/2026) : un simple appui
  sur un cercle ne tourne rien (il ne tournait que dans un sens), et le cube en perspective est une
  image fixe qui suit les tours (`pointer-events:none`). Le parcours de test vérifie l'appui à vide.
- **Deux sortes d'étoiles** (le client, le 11/10/2026) : de coups (`etoilesPour`) et de temps
  (`etoilesTempsPour`, objectif `(par×4+6) s`, trois sous l'objectif, deux sous le double). Le chrono part
  au premier contact avec le plateau et avance seul (`majTemps`, toutes les 250 ms).
- **Apparences** (`APPARENCES`, `APP_TEMPS`) : Classique et Contraste ouvertes, Pastel à 45 ★ de coups,
  Néon à 45 ★ de temps ; une apparence choisie puis reperdue (progression effacée) retombe sur Classique.
- **Fin de niveau** : les six faces s'illuminent l'une après l'autre et le cube fait un tour sur
  lui-même (`PIVOT` n'est animé que là) ; « Revoir ma partie » rejoue le mélange puis les coups (`revoir()`).
- **Couleur d'accent par monde** (`ACCENTS`, `accent(w)`) : variable CSS `--acc` (triplet r,g,b) et
  `ACC` pour le canevas (cercle saisi, vague de victoire). Accueil, défi et partie libre : le lilas.
- **Sans fin** (`sansFinDef(k)`, depuis Partie libre) : étape k = mélange de k+2 coups (25 au plus), record
  `PROG.stats.sansFin` ; au-delà de l'étape 5, le jeu complet. **Partager** le défi du jour : `partager()`,
  un résumé texte (coups, temps, étoiles) par la feuille de partage du téléphone ou le presse-papiers.
- **Faces terminées** : halo discret de leur couleur sous leurs neuf pastilles (`RAYON_FACE`), sur le plateau de jeu.
- **Musique** (`Musique`, `www/audio/nuit-dorbites.m4a`, générée par le client avec Suno sous licence
  commerciale) : AAC 96 kb/s (l'Opus d'origine ne se lit pas sur iPhone), boucle Web Audio avec fondu
  enchaîné de 6 s, démarre au premier geste, se coupe en arrière-plan, baisse sous la victoire. Le Chromium
  des tests n'a pas l'AAC : son échec de décodage doit rester silencieux.
- Les niveaux de campagne sont tirés d'une graine fixe (`orbicube-<monde>-<niveau>`) : changer
  `genererMelange()` change tous les niveaux des joueurs. Ne le faire qu'avec une nouvelle graine.
- La progression est dans `localStorage` (clé `orbicube-v1`) et, sur téléphone, dans
  `Preferences` (iOS peut vider le stockage web). `fusion()` réconcilie les deux.
- Pas d'effet `shadowBlur` du canvas sur le plateau : trop lent sur téléphone, il figeait le jeu.
  Les halos sont des traits translucides superposés (`halo()`).
- **Les langues** : le français est la source. Un observateur traduit tout texte qui apparaît à
  l'écran en le cherchant tel quel dans `www/langues.js` (modèles « Monde {0} » pour les nombres).
  On écrit donc le jeu en français, et on ajoute la phrase à la table : pas d'appel de traduction
  à semer dans le code. Les paragraphes d'aide à balises se traduisent en blocs (`data-html`).
- **Les succès des stores** passent par `plugins/succes-natifs` ; sans module ni configuration,
  tout se replie sans bruit. Le module natif n'a jamais été compilé ici : la première build Xcode
  et Android Studio le validera.
- **Un geste vaut au plus un coup, compté au lâcher** (le client, le 11/10/2026) : pendant le
  glisser, les quarts de tour franchis sont posés sur le plateau mais pas comptés ; au lâcher,
  `finirGeste()` lit la rotation nette : 0 (aller-retour, tour complet) = aucun coup, un quart =
  `U`/`U′`, un demi-tour = `U2`, un seul coup comme dans la notation du cube. Clavier et pavé
  restent un quart de tour = un coup.
- `?capture` dans l'adresse expose `window.__orbicube.solution()`, pour `outils/captures.js` seulement.
