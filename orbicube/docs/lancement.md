# Lancer Orbicube sur l'App Store et Google Play

La marche à suivre, dans l'ordre, du dépôt jusqu'au premier euro. Ce qui demande votre
identité, votre carte bancaire ou un Mac est marqué **[vous]**. Le reste est prêt dans ce dépôt.

Les montants et les règles des stores sont ceux connus au moment de l'écriture (octobre 2026).
Ils changent : vérifiez-les sur les pages officielles au moment de vous inscrire.

---

## 0. Le modèle économique choisi

**Gratuit à télécharger, un achat unique pour tout débloquer.**

| | Gratuit | Orbicube complet (achat unique) |
|---|---|---|
| Mondes | 1 à 4, de 2 à 5 orbites (48 niveaux, experts compris ; le 3 demande 32 étoiles de coups, le 4 48 étoiles de temps : deux par niveau du chemin d'avant) | les 8, jusqu’aux 9 orbites (96 niveaux) |
| Défi du jour | oui | oui |
| Défi de la semaine | non | oui |
| Jeu libre | Facile, sur 5 orbites | Facile, Moyen, Difficile, Expert, Sans fin, Relax, sur les 9 orbites |
| Publicité | aucune | aucune |

- **Prix : 4,99 €** (décision du client, le 13/10/2026). Le joueur voit
  le prix dans sa devise : il vient du store.
- **Pas de publicité, pas de suivi.** Depuis le classement du jeu (le client, le 14/10/2026), le serveur garde
  un pseudo, un identifiant tiré au hasard et les scores (section 3 quinquies) : pas de bandeau de consentement
  (ni publicité ni suivi), mais une politique de confidentialité qui le dit et des questionnaires à jour (section 6).
- **La boutique** (le client, le 13/10/2026) vend aussi, en option, des **packs de styles** (couleurs, formes
  des pastilles, effets), deux éditions groupées, des **aides** et un **don** (« Faire un don », ex-pack soutien) : voir 3 quater. Les
  styles ne changent rien au jeu ; une partie se gagne aussi en jouant (étoiles, rang).
- **Changer de modèle** ne demande aucun code : `www/config.js`.
  - `modele: "complet"` : tout est ouvert. Choisissez ce réglage pour vendre l'application payante
    sur le store (par exemple 3,99 €), sans achat intégré.
  - `mondesGratuits` : le nombre de mondes jouables sans achat.

---

## 1. Le statut en Belgique **[vous]**

Vendre une application est une activité d'indépendant, souvent **à titre complémentaire**
à côté d'un emploi salarié. À faire **avant** la première vente :

1. **Guichet d'entreprise** : numéro d'entreprise (BCE) et activité « édition de logiciels ».
2. **Caisse d'assurances sociales** : affiliation en complémentaire. Les cotisations dépendent
   des revenus, et sont faibles tant que le bénéfice est faible.
3. **TVA** : la franchise des petites entreprises dispense de facturer la TVA sous un seuil de
   chiffre d'affaires annuel (25 000 € en 2025). Apple et Google vendent eux-mêmes au joueur et
   reversent la TVA du pays : vous facturez Apple et Google, pas les joueurs.
4. **Impôts** : les revenus se déclarent comme bénéfices d'indépendant.

> À faire confirmer par un comptable ou par le guichet d'entreprise : ces points dépendent de
> votre situation, et je ne suis pas en mesure de les garantir.

**Union européenne, statut de « commerçant ».** Apple et Google demandent, pour vendre dans l'UE,
de déclarer si l'on est un commerçant au sens du règlement sur les services numériques (DSA). Si
oui, une **adresse, un téléphone et une adresse électronique** s'affichent publiquement sur la
fiche du store. Prévoyez une adresse professionnelle (une boîte postale, par exemple) si vous ne
voulez pas montrer votre domicile.

---

## 2. Les comptes **[vous]**

| Compte | Coût | Délai | Remarque |
|---|---|---|---|
| Apple Developer Program | 99 $ par an | 1 à 2 jours | Pour un compte à votre nom, aucun numéro D-U-N-S n'est demandé. |
| Google Play Console | 25 $, une fois | quelques jours, avec une vérification d'identité | Un compte personnel récent doit faire **tester l'app par au moins 12 personnes pendant 14 jours** avant de publier en production. Commencez tôt. |
| RevenueCat | gratuit jusqu'à un certain revenu mensuel | immédiat | Gère les achats des deux stores avec un seul code, la restauration et la vérification des reçus. |

Adhérez au **Small Business Program** d'Apple : la commission passe de 30 % à **15 %** sous
1 million de dollars de revenus par an. Chez Google, les 15 % s'appliquent d'office sur le
premier million.

---

## 3. Les produits à créer **[vous]**

Un seul produit, avec le **même identifiant partout** : `orbicube_complet`.

1. **App Store Connect** > votre app > Achats intégrés > **Non consommable**
   - Identifiant produit : `orbicube_complet`
   - Prix : 4,99 €
   - Nom affiché : « Orbicube complet ». Description : « Les 8 mondes et tout le jeu libre. »
   - Une capture de la boutique pour la vérification (`npm run captures`, ou une capture du téléphone).
2. **Google Play Console** > Monétiser > Produits > **Produits intégrés à l'application**
   - Identifiant : `orbicube_complet`, même nom, même prix.
3. **RevenueCat** (app.revenuecat.com)
   - Un projet « Orbicube » et deux apps : iOS (identifiant de paquet `com.cronobots.orbicube`)
     et Android (nom de paquet identique).
   - **Entitlement** `complet`, auquel on attache le produit `orbicube_complet` des deux stores.
   - **Offering** `default` (celle marquée « current ») avec **un seul package** qui contient ce produit.
   - Copiez les deux **clés publiques du SDK** (elles commencent par `appl_` et `goog_`) dans
     `www/config.js` > `revenuecat`. Ce sont des clés faites pour être dans l'application.
     **Jamais une clé secrète `sk_`** : `npm run verifier` refuse d'en laisser passer une.

Le jeu lit le prix, achète, restaure et vérifie le droit « complet » par `src/natif.js`.

---

## 3 bis. Les succès dans Game Center et Google Play Jeux **[vous]**

Les 21 succès du jeu sont aussi déclarés au service de jeu du téléphone : Game Center sur
iPhone, Google Play Jeux sur Android. Le joueur les retrouve dans l'app Jeux d'Apple ou dans
Google Play Jeux, avec la bannière « Succès déverrouillé » du système. Le code est prêt :
`plugins/succes-natifs` (Swift et Java), branché par `src/natif.js`. Sans configuration, rien
ne change : les succès restent dans le jeu.

**Les succès à créer**, avec les images de `ressources/succes/` (`apple/` en 1024 × 1024,
`google/` en 512 × 512). Les points totalisent 995 sur les 1 000 qu'Apple autorise. Neuf succès demandent le jeu complet
(m3, m5, m6, p60, expert, voies, neuf, semaine, elite) : le jeu les marque « Jeu complet » tant qu'il n'est pas acheté.

| Clé du jeu | Identifiant Apple | Nom | Description | Points |
|---|---|---|---|---|
| premier | `orbicube.premier` | Premier tour | Résoudre le premier niveau. | 10 |
| m1 | `orbicube.monde1` | Initié | Terminer le monde 1. | 25 |
| m3 | `orbicube.tranches` | Trancheur | Terminer le monde des tranches. | 50 |
| m5 | `orbicube.orbite` | En orbite | Terminer le monde 5. | 75 |
| m6 | `orbicube.grandmaitre` | Grand maître | Terminer toute la campagne. | 100 |
| p10 | `orbicube.precision` | Précision | Trois étoiles sur 10 niveaux. | 50 |
| pm | `orbicube.perfectionniste` | Perfectionniste | Trois étoiles sur tout un monde. | 75 |
| p60 | `orbicube.sansfaute` | Sans faute | Toutes les étoiles de la campagne. | 100 |
| eclair | `orbicube.eclair` | Éclair | Résoudre un niveau d'au moins 3 coups en moins de 10 secondes. | 50 |
| jour | `orbicube.rendezvous` | Rendez-vous | Réussir un défi du jour. | 25 |
| serie3 | `orbicube.serie3` | Trois jours de suite | Réussir le défi du jour trois jours d'affilée. | 75 |
| expert | `orbicube.expert` | Expert | Résoudre une partie de 25 coups en jeu libre. | 100 |
| axes | `orbicube.troisaxes` | Trois axes | Tourner M, E et S dans une même partie résolue. | 50 |
| tours | `orbicube.milletours` | Mille tours | Tourner les cercles 1 000 fois. | 100 |
| voies | `orbicube.voiedoree` | Voie dorée | Finir la voie dorée des huit mondes. | 100 |
| missions | `orbicube.missions` | Mission accomplie | Réussir les quatre missions du jour. | 10 |
| fidele | `orbicube.fidele` | Fidèle | Réussir sept défis du jour. | 25 |
| rang10 | `orbicube.habitue` | Habitué | Atteindre le rang 10. | 25 |
| neuf | `orbicube.neuforbites` | Neuf orbites | Résoudre un niveau sur les neuf orbites. | 25 |
| semaine | `orbicube.granddefi` | Grand défi | Réussir un défi de la semaine. | 25 |
| elite | `orbicube.elite` | Élite | Réussir les quatre missions élite d'une semaine. | 50 |

Les noms et descriptions traduits sont dans `www/langues.js` : recopiez-les dans chaque langue
de la fiche. Aucun succès n'est caché.

**iPhone, Game Center**
1. App Store Connect > votre app > **Game Center** : activez-le, puis **Succès** > créez les 21
   avec exactement les identifiants Apple du tableau (ils sont déjà dans `www/config.js`).
2. Xcode > *Signing & Capabilities* > **+ Capability > Game Center**.
3. À la première ouverture, iOS demande au joueur de se connecter à Game Center ; ensuite c'est automatique.

**Android, Google Play Jeux**
1. Play Console > votre app > **Services de jeux Play** > Configuration : créez le projet de jeu
   et reliez-le à l'app (Google vous guide pour les identifiants OAuth et l'empreinte SHA-1 de la
   clé de signature).
2. **Succès** > créez les 14. Google donne à chacun un identifiant de la forme `CgkI…` :
   recopiez-les dans `www/config.js` > `succesStores.android`, en face de la bonne clé.
3. Copiez l'**ID du projet** (un nombre) dans `android/app/src/main/res/values/strings.xml` :
   `<string name="game_services_project_id" translatable="false">123456789012</string>`.
4. Publiez les succès (bouton *Publier* des services de jeux), sinon seuls les testeurs les voient.

**À vérifier sur un vrai téléphone** : gagner le niveau 1-1 fait apparaître la bannière du
système ; *Succès > Game Center* (ou *Google Play Jeux*) ouvre la liste ; réinstaller l'app et la
rouvrir ne fait rien perdre (les succès déjà gagnés sont renvoyés, sans double bannière).

> Le module natif n'a pas pu être compilé dans l'environnement où il a été écrit (ni Xcode ni
> Android Studio). `npm run tester` vérifie tout le branchement côté jeu avec un téléphone
> simulé ; la première compilation dans Xcode et Android Studio est le vrai test du module.

## 3 ter. Les classements dans Game Center et Google Play Jeux **[facultatif]**

**Remplacés dans le jeu par le classement d'Orbicube** (section 3 quinquies, le client, le 14/10/2026) : le Profil
et la victoire des défis ouvrent désormais le classement du jeu. Le jeu envoie encore ses résultats à Game Center
et Google Play Jeux s'ils existent ; sans eux, rien ne se passe. Inutile de les créer, sauf si vous voulez aussi
les classements du téléphone. Ce qui suit reste valable dans ce cas.

Décidé le 11/10/2026 : pas de compte à nous, les classements passent par le service de jeu du
téléphone. Le joueur n'a rien à créer, aucune donnée ne nous parvient, et la politique de
confidentialité ne change pas. Même module que les succès (`plugins/succes-natifs`). Sans
configuration, rien ne change : le bouton « Classements » du Profil reste caché.

| Clé du jeu | Identifiant Apple | Nom | Format | Classement | Récurrence (Apple) |
|---|---|---|---|---|---|
| jour | `orbicube.classement.jour` | Défi du jour | Temps écoulé, au centième | le plus petit gagne | quotidienne, à minuit |
| semaine | `orbicube.classement.semaine` | Défi de la semaine | Temps écoulé, au centième | le plus petit gagne | hebdomadaire, le lundi |
| sansfin | `orbicube.classement.sansfin` | Sans fin | Entier | le plus grand gagne | aucune |
| etoiles | `orbicube.classement.etoiles` | Étoiles | Entier (sur 360 : coups + temps) | le plus grand gagne | aucune |

Le jeu envoie un chrono en millisecondes : le module le convertit en centièmes pour Game Center,
et Google Play Jeux attend des millisecondes. À la connexion, les meilleurs résultats déjà faits
(étoiles, sans fin, défi du jour et de la semaine en cours) sont renvoyés ; le service garde le meilleur.

**iPhone** : App Store Connect > votre app > **Game Center** > **Classements** > créez les quatre,
avec exactement les identifiants du tableau (déjà dans `www/config.js` > `classementsStores.ios`).
Les deux défis sont des classements **récurrents** (iOS 14 et plus) : quotidien et hebdomadaire.

**Android** : Play Console > **Services de jeux Play** > **Classements** > créez les quatre (format
*Temps* pour les défis, *Numérique* sinon ; ordre « plus petit » pour les défis). Google donne à
chacun un identifiant `CgkI…` : recopiez-les dans `www/config.js` > `classementsStores.android`.
Google Play Jeux propose de lui-même les vues du jour, de la semaine et de tous les temps.
Publiez-les, sinon seuls les testeurs les voient.

**À vérifier sur un vrai téléphone** : réussir le défi du jour puis « Voir le classement » ouvre le
classement du jour avec son temps ; Profil > « Classements » ouvre la liste des quatre.

---

## 3 quinquies. Le classement du jeu **[vous, puis Claude]**

Le client, le 14/10/2026 : un classement dans le jeu, sans compte Apple ni Google, avec un pseudo « Player… »
modifiable, un profil public limité (pseudo, rang, étoiles, voies dorées, records) et un code de récupération qui
rend pseudo, achats et progression sur un autre téléphone. Tout est dans `serveur/` : lire `serveur/LISEZMOI.md`.

**[vous]** : libérer une place de projet gratuit chez Supabase (la limite de deux projets actifs est atteinte),
ou passer l'organisation au plan Pro. **[Claude]** : créer le projet « Orbicube » (Irlande), appliquer
`schema.sql`, déployer la fonction, remplir `www/config.js` > `classement`.

**RevenueCat** : le jeu se connecte à RevenueCat avec l'identifiant du profil de joueur (`Purchases.logIn`) ;
c'est ce qui permet au code de récupération de rendre les achats sur un autre téléphone, même avec un autre
compte du store. Dans RevenueCat > Project settings > *Restore behavior*, gardez « Transfer to new App User ID ».

**À vérifier sur un vrai téléphone** : réussir le défi du jour, « Voir le classement », changer de pseudo,
noter le code, le saisir sur un second téléphone (pseudo, progression et achats reviennent ; le premier est détaché).

---

## 3 ter. Les langues

Le jeu parle **français, anglais, néerlandais, allemand et espagnol**. Il prend la langue du
téléphone, et le joueur peut la changer dans *Options > Langue*. Déclarez ces cinq langues sur
les deux stores, avec les textes de [`fiche-store.md`](fiche-store.md).

---

## 3 quater. Les produits de la boutique **[vous]**

Mêmes outils que pour `orbicube_complet` (App Store Connect, Google Play Console, RevenueCat). Les identifiants
sont ceux de `PACKS` dans `www/index.html` ; les prix affichés en attendant le store, ceux de `www/config.js` >
`prixPacks`.

| Produit (même identifiant sur les deux stores) | Type | Prix conseillé | Droits RevenueCat (entitlements) |
|---|---|---|---|
| `orbicube_pack_couleurs` « Palettes cosmiques » | Non consommable | 1,99 € | `pack_couleurs` |
| `orbicube_pack_formes` « Formes précieuses » | Non consommable | 1,99 € | `pack_formes` |
| `orbicube_pack_effets` « Effets stellaires » | Non consommable | 1,99 € | `pack_effets` |
| `orbicube_collection` « Collection complète » | Non consommable | 3,99 € | `pack_couleurs`, `pack_formes`, `pack_effets` |
| `orbicube_integrale` « Édition intégrale » | Non consommable | 7,99 € | `complet`, `pack_couleurs`, `pack_formes`, `pack_effets` |
| `orbicube_soutien` « Faire un don » | Non consommable | 2,99 € | `soutien` |
| `orbicube_ampoules_10` « 10 aides » | **Consommable** | 0,99 € | aucun : le jeu crédite les aides |
| `orbicube_ampoules_30` « 30 aides » | **Consommable** | 1,99 € | aucun |
| `orbicube_style_<id>` : chaque style d'un pack, **à l'unité** (11 produits, voir ci-dessous) | Non consommable | 0,99 € | `style_<id>` |

Les 11 styles vendus aussi à l'unité (le client, le 14/10/2026 : « chaque élément peut être acheté séparément ») :
`aurore`, `galaxie`, `glace`, `joyaux` (couleurs) ; `gemmes`, `etoiles`, `cristaux` (formes) ; `comete`, `argent`,
`arcenciel`, `feux` (effets). Produit `orbicube_style_aurore`, droit `style_aurore`, et ainsi de suite. Un style s'ouvre
avec son propre droit **ou** celui de son pack : le pack reste plus avantageux dès deux styles.

- Dans RevenueCat, **attachez chaque produit à ses droits** : un produit groupé à plusieurs droits. C'est ce qui
  ouvre tout d'un coup avec l'Édition intégrale. Les produits n'ont pas besoin d'être dans l'*offering*.
- Les consommables ne se restaurent pas (règle des stores) : c'est normal.
- Captures pour la vérification d'Apple : une par produit, depuis l'écran Boutique.

## 4. Construire l'application

Sur votre ordinateur, avec Node 20 ou plus récent. Pour iOS, il faut un **Mac avec Xcode**.
Pour Android, **Android Studio**.

```bash
cd orbicube
npm install
npm run construire          # compile le pont natif (www/natif.js)
npm run verifier            # doit répondre « Tout est en ordre. »
npx cap add ios             # une seule fois : crée le projet Xcode (dossier ios/)
npx cap add android         # une seule fois : crée le projet Android (dossier android/)
npx @capacitor/assets generate --iconBackgroundColor '#07070c' --splashBackgroundColor '#07070c'
                            # icônes et écrans de démarrage, depuis ressources/
npm run cap:sync            # recopie www/ dans les deux projets
npm run cap:ios             # ouvre Xcode
npm run cap:android         # ouvre Android Studio
```

**Dans Xcode** (onglet *Signing & Capabilities*) :
- choisissez votre équipe Apple Developer ;
- ajoutez la capacité **In-App Purchase** ;
- appareils : *iPhone* seul, ou *iPhone + iPad*. Si vous gardez l'iPad, il faut aussi les
  captures iPad (déjà prêtes) ;
- orientation : portrait et paysage, les deux fonctionnent.

**Faire reconnaître Orbicube comme un jeu** (mode Jeu du téléphone, app Jeux d'Apple, tableau de bord de jeu
d'Android) :
- iPhone : dans `ios/App/App/Info.plist`, ajoutez la clé `LSApplicationCategoryType` avec la valeur
  `public.app-category.puzzle-games`, et choisissez **Jeux > Réflexion** comme catégorie dans App Store Connect.
  Avec iOS 18 et plus récent, le **mode Jeu** s'active alors tout seul au lancement (moins de tâches de fond,
  manettes et AirPods plus réactifs) ; le jeu apparaît aussi dans l'app **Jeux** avec ses succès Game Center.
- Android : dans `android/app/src/main/AndroidManifest.xml`, sur la balise `<application>`, ajoutez
  `android:appCategory="game"`, et choisissez la catégorie **Jeux > Réflexion** dans la Play Console : le tableau
  de bord de jeu et les modes de jeu du téléphone s'appliquent.

**Dans Android Studio** : *Build > Generate Signed App Bundle*. Créez une clé de signature et
**gardez-la en lieu sûr** : sans elle, plus aucune mise à jour n'est possible. Activez aussi
la signature par Google Play.

Après chaque modification du jeu : `npm run cap:sync`, puis reconstruire.

---

## 5. Tester l'achat avant de publier **[vous]**

- **iOS** : TestFlight avec un compte *Sandbox* (App Store Connect > Utilisateurs > Sandbox).
  L'achat est simulé, gratuit.
- **Android** : piste de **test interne**, avec votre adresse dans les *testeurs de licence*.
  L'achat est simulé.
- À vérifier sur un vrai téléphone :
  1. monde 3 → la boutique s'ouvre, avec le bon prix ;
  2. l'achat débloque les mondes 5 à 8, tout le jeu libre et le défi de la semaine ;
  3. désinstaller, réinstaller, puis *Options > Restaurer* : tout revient ;
  4. le mode avion : le jeu se joue, la boutique dit que le store ne répond pas ;
  5. le bouton retour d'Android : il ferme les fenêtres, met en pause, remonte, puis quitte ;
  6. les retours haptiques sur iPhone ;
  7. la boutique : prix de chaque pack dans la devise du store, achat d'un pack (ses styles s'ouvrent), Édition
     intégrale (tout s'ouvre, mondes compris), 10 aides (créditées), puis *Restaurer* après réinstallation (les
     packs reviennent, pas les aides).

---

## 6. La fiche des stores

Tous les textes, en français et en anglais, sont dans [`fiche-store.md`](fiche-store.md).

| Élément | Où |
|---|---|
| Icône 1024 × 1024 (App Store) | `ressources/icon.png` |
| Icône 512 × 512 (Google Play) | `www/icones/icon-512.png` |
| Bannière 1024 × 500 (Google Play) | `ressources/captures/banniere-google-play.png` |
| Captures iPhone 6,9" (1320 × 2868) | `ressources/captures/iphone-6.9/` |
| Captures iPad 13" (2064 × 2752) | `ressources/captures/ipad-13/` |
| Captures Android (1080 × 1920) | `ressources/captures/android/` |
| Politique de confidentialité | `www/confidentialite.html` : à publier en ligne, voir ci-dessous |

**La politique de confidentialité doit avoir une adresse web.** Le plus simple : GitHub Pages.
Le flux `.github/workflows/orbicube.yml` publie `orbicube/www` (le jeu jouable dans le
navigateur, et la page `confidentialite.html`) une fois Pages activé dans
*Settings > Pages > Source : GitHub Actions*. Sur un dépôt privé, Pages demande un abonnement
GitHub payant ; sinon, hébergez la seule page `confidentialite.html` ailleurs. **Complétez
l'adresse de contact** dans la page avant de la publier.

**Questionnaires des stores** (réponses pour cette version) :
- Âge : 4+ (Apple), PEGI 3 / Tout public (Google). Aucune violence, aucun achat aléatoire.
- Publicité : non.
- Achats intégrés : oui, un non consommable.
- Collecte de données (depuis le classement, le 14/10/2026) :
  - **Apple « App Privacy »** : *Identifiers > User ID* (l'identifiant tiré au hasard), *User Content > Other
    User Content* (le pseudo), *Usage Data > Product Interaction* et *Other Data* (scores, étoiles, sauvegarde),
    *Purchases > Purchase History* (RevenueCat). Usage : **App Functionality**. Lié à l'identité : **non**
    (pas de nom ni d'e-mail). Suivi (*tracking*) : **non**.
  - **Google « Sécurité des données »** : *Identifiants de l'appareil ou autres > ID utilisateur*, *Activité dans
    l'appli > Autre contenu généré par l'utilisateur* (pseudo) et *Interactions avec l'appli* (scores), *Infos
    financières > Historique d'achats*. Collecté, non partagé, chiffré en transit, **suppression possible depuis
    l'appli** (Profil > « Supprimer mes données »), finalité : fonctionnalités de l'appli.
  - **Contenu généré par les utilisateurs** (Apple 1.2, Google UGC) : les pseudos. Filtre à l'enregistrement,
    « Signaler ce pseudo » sur chaque fiche, renommage à trois signalements (`serveur/LISEZMOI.md`).
- Chiffrement (Apple) : aucun chiffrement propre → « Non ».

---

## 7. Avant de soumettre

- [ ] `npm run verifier` → « Tout est en ordre. »
- [ ] `npm run tester` → « Parcours réussi sur les trois téléphones. »
- [ ] Version identique dans `package.json`, `www/config.js` ; `V` incrémenté dans `www/sw.js`.
- [ ] Clés RevenueCat publiques dans `www/config.js`.
- [ ] Adresse de contact remplie dans `www/confidentialite.html`, page publiée en ligne.
- [ ] Aucune mention de la marque « Rubik's » nulle part. C'est une marque déposée : une fiche qui
      la cite peut être refusée ou retirée. `npm run verifier` le contrôle dans le jeu et la fiche.
- [ ] Testé sur un vrai iPhone et un vrai Android (section 5).
- [ ] Note pour la vérification Apple : « Le jeu complet se débloque par un achat non
      consommable depuis le monde 3 ou depuis Options. Le bouton Restaurer est dans Options. »

---

## 8. Après le lancement

- **La vidéo fait les ventes.** La vidéo qui a inspiré le jeu dépasse 80 000 « j'aime ».
  Publiez des formats courts (TikTok, Reels, Shorts) du plateau qui se mélange puis se résout,
  avec le nom du jeu et « gratuit sur iPhone et Android ». Une vidéo par semaine, au moins au
  début.
- **La démo web** (GitHub Pages, CrazyGames, itch.io) permet d'essayer sans installer. Dans
  `config.js`, `liens.appStore` et `liens.googlePlay` renvoient alors vers les stores.
- **Les chiffres à suivre** (App Store Connect et Play Console, sans rien ajouter au jeu) :
  rétention à 1 jour et à 7 jours, part des joueurs qui achètent, note moyenne.
- **Les mises à jour qui comptent** : de nouveaux mondes (un pack de 20 niveaux peut devenir un
  second achat), un classement du défi du jour dans Game Center et Google Play Jeux (le module de
  succès est la bonne base pour l'ajouter).

## 9. À faire plus tard

- **Succès liés aux étoiles de temps** (demandé par le client le 11/10/2026, reporté à après le
  lancement) : par exemple « Contre-la-montre » (60 étoiles de temps) et « Éclair absolu » (180).
  Chacun demande les mêmes étapes que les 14 premiers : sa ligne dans `SUCCES` (`www/index.html`),
  son identifiant dans `config.js` > `succesStores` (iOS et Android), sa fiche dans App Store Connect
  et la Play Console (section 3 bis), son image (`npm run icones`), et ses traductions.
