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
| Mondes | 1 et 2 (20 niveaux) | les 6 (60 niveaux) |
| Défi du jour | oui | oui |
| Partie libre | Facile | Facile, Moyen, Difficile, Expert |
| Publicité | aucune | aucune |

- **Prix conseillé : 2,99 €.** C'est le prix courant d'un jeu de réflexion complet. Le joueur voit
  le prix dans sa devise : il vient du store.
- **Pas de publicité** : l'application ne collecte aucune donnée personnelle. Pas de bandeau de
  consentement RGPD, une fiche de confidentialité courte, de meilleures notes.
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
   - Prix : 2,99 €
   - Nom affiché : « Orbicube complet ». Description : « Les 6 mondes et toute la partie libre. »
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
  2. l'achat débloque les mondes 3 à 6 et la partie libre ;
  3. désinstaller, réinstaller, puis *Options > Restaurer* : tout revient ;
  4. le mode avion : le jeu se joue, la boutique dit que le store ne répond pas ;
  5. le bouton retour d'Android : il ferme les fenêtres, met en pause, remonte, puis quitte ;
  6. les retours haptiques sur iPhone.

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
- Collecte de données : pas de données personnelles collectées par le jeu. Pour les achats,
  RevenueCat traite un identifiant anonyme et l'historique d'achat : déclarez-les selon le guide
  « App Privacy » de RevenueCat (*Purchases* et *Identifiers*, non liés à l'identité, sans
  suivi publicitaire).
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
  second achat), un classement du défi du jour, l'anglais pour viser le monde entier.
