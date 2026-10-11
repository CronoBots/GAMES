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
| `www/` | `npm run tester` → « Parcours réussi sur les trois téléphones. » |
| `src/natif.js` | `npm run construire`, et committer `www/natif.js` avec : la CI refuse un pont pas à jour |
| une version publiée | même numéro dans `package.json` et `www/config.js` ; `V` incrémenté dans `www/sw.js` |
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
- Les niveaux de campagne sont tirés d'une graine fixe (`orbicube-<monde>-<niveau>`) : changer
  `genererMelange()` change tous les niveaux des joueurs. Ne le faire qu'avec une nouvelle graine.
- La progression est dans `localStorage` (clé `orbicube-v1`) et, sur téléphone, dans
  `Preferences` (iOS peut vider le stockage web). `fusion()` réconcilie les deux.
- Pas d'effet `shadowBlur` du canvas sur le plateau : trop lent sur téléphone, il figeait le jeu.
  Les halos sont des traits translucides superposés (`halo()`).
- `?capture` dans l'adresse expose `window.__orbicube.solution()`, pour `outils/captures.js` seulement.
