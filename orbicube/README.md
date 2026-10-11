# Orbicube

Le cube 3×3 joué en faisant tourner neuf cercles. Chaque tranche du cube est un cercle, chaque
facette une pastille posée au croisement des deux cercles qui peuvent la déplacer.

- 60 niveaux en 6 mondes, un défi du jour, une partie libre chronométrée, 14 succès
- gratuit pour les mondes 1 et 2, **un achat unique** (« Orbicube complet ») pour le reste
- sans publicité, sans compte, sans collecte de données, jouable hors ligne
- application iOS et Android par [Capacitor](https://capacitorjs.com), achats par [RevenueCat](https://www.revenuecat.com)

**Pour publier : [`docs/lancement.md`](docs/lancement.md)**, toute la marche à suivre.
Textes des stores : [`docs/fiche-store.md`](docs/fiche-store.md).

## Organisation

| Chemin | Rôle |
|---|---|
| `www/index.html` | tout le jeu : HTML, CSS et JavaScript, sans bundler |
| `www/config.js` | les réglages de publication : modèle gratuit/payant, mondes gratuits, prix affiché, clés RevenueCat |
| `src/natif.js` | le pont avec le téléphone (haptique, sauvegarde, barre d'état, retour Android, achats), compilé en `www/natif.js` |
| `www/polices/` | les polices, embarquées : l'app ne dépend d'aucun réseau |
| `www/sw.js`, `www/manifest.webmanifest` | la version web installable et hors ligne |
| `www/confidentialite.html` | la politique de confidentialité, en français et en anglais |
| `capacitor.config.json` | l'identité de l'app (`com.cronobots.orbicube`) et l'écran de démarrage |
| `ressources/` | icônes, écran de démarrage, captures et bannière des stores |
| `outils/` | vérificateur, test de parcours, générateurs d'icônes et de captures |

## Commandes

```bash
npm install
npm run servir        # le jeu dans le navigateur : http://localhost:8080
npm run construire    # recompile www/natif.js après une modification de src/natif.js
npm run verifier      # contrôles rapides (syntaxe, marque, secrets, hors ligne, géométrie, 60 niveaux)
npm run tester        # parcours complet sur iPhone 13, iPhone SE et Pixel 7 simulés
npm run icones        # régénère les icônes et l'écran de démarrage
npm run captures      # régénère les 15 captures et la bannière des stores
npm run cap:sync      # recopie le jeu dans les projets iOS et Android
```

`npm run tester` et `npm run captures` demandent Chromium : `npx playwright install chromium`.

L'intégration continue (`.github/workflows/orbicube.yml`) lance le vérificateur et le test de
parcours à chaque modification, et peut publier la version web sur GitHub Pages.
