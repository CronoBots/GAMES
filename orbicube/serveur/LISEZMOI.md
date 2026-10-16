# Le serveur du classement d'Orbicube

Le classement, le pseudo, le code de récupération et la sauvegarde passent par **une seule fonction**
Supabase (`fonction/index.ts`) et **trois tables** (`schema.sql`). Pas de compte joueur : un identifiant
tiré au hasard, un jeton propre au téléphone et un code de récupération (`ORBI-XXXX-XXXX-XXXX`).

| Fichier | Rôle |
|---|---|
| `schema.sql` | tables `joueurs`, `scores`, `signalements`, `limites` (débit, sans adresse IP) ; RLS activé sans politique : seul le serveur y touche |
| `fonction/index.ts` | la fonction `orbicube` : inscrire, recuperer, pseudo, stats, score, classement, profil, signaler, sauver, supprimer |
| `fonction/moteur.js` | le moteur du cube, recopié du jeu : il rejoue les coups des défis avant de les classer |
| `fonction/filtre.js` | le filtre des pseudos (cinq langues, chiffres déguisés) |

`npm run verifier` contrôle que `moteur.js` donne les mêmes défis que le jeu, et qu'il accepte la vraie
solution et refuse une fausse. `npm run tester` joue tout le parcours contre `outils/classement-essai.js`,
un faux serveur en mémoire qui répond comme la fonction.

## Mise en ligne **[vous, puis Claude]**

1. **Un projet Supabase à part** (pas celui d'un autre client), région *Europe (Irlande)* : la politique de
   confidentialité le dit. Le plan gratuit suffit pour les essais ; il **met le projet en pause après 7 jours
   sans appel**, donc passez au plan Pro avant la sortie.
2. Appliquer `schema.sql` (éditeur SQL, ou Claude par l'outil Supabase).
3. Déployer la fonction sous le nom **`orbicube`**, avec les trois fichiers de `fonction/`, **sans
   vérification de JWT** (`verify_jwt: false`) : elle a sa propre authentification (identifiant + jeton).
   `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis à la fonction par Supabase : **la clé de
   service ne va jamais dans le jeu** (le vérificateur le refuse, même cachée dans un JWT).
   Ajouter le secret **`POIVRE`** (Edge Functions > Secrets) : une longue chaîne au hasard, **avant le premier
   joueur** et sans jamais la changer ensuite (elle sert à l'empreinte des codes de récupération et des jetons :
   la changer rendrait tous les codes inutilisables).
4. Dans `www/config.js` > `classement` : `url` = `https://<projet>.supabase.co/functions/v1/orbicube`,
   `cle` = la clé **publiable** du projet (`sb_publishable_…`).
5. **Ménage (obligatoire)** : activer l'extension **pg_cron** (Database > Extensions) *avant* d'appliquer
   `schema.sql`, qui planifie alors `menage_scores()` chaque nuit : scores des défis de plus de 60 jours,
   compteurs de débit passés, profils sans visite depuis deux ans (la politique de confidentialité le promet).

## Ce que le serveur garde, et ne garde pas

Il garde : l'identifiant, le pseudo, le rang, l'expérience, les étoiles, les voies dorées, l'étape du sans
fin, le pack soutien (liseré doré), les scores des défis et la sauvegarde. **Il ne garde pas** : de nom,
d'adresse électronique, de compte Apple ou Google, ni le code de récupération en clair (son empreinte
SHA-256 seulement). Profil > « Supprimer mes données » efface la ligne du joueur et tout ce qui en dépend.

## Modération

Le filtre refuse les mots grossiers à l'enregistrement. « Signaler ce pseudo » : à trois signalements de
joueurs différents, le pseudo redevient « Player » et des chiffres. Pour renommer un pseudo à la main :
`update joueurs set pseudo = 'Player12345' where lower(pseudo) = lower('…');`

## Ce que le serveur refuse

- **Un défi hors de sa période** : un défi du jour n'est classé que tant qu'il est en cours quelque part sur Terre
  (UTC+14 à UTC−12), un défi de la semaine de même ; ni préparé des jours à l'avance, ni rejoué après.
- **Des coups faux ou trop rapides** : les coups sont rejoués sur le mélange ; moins de 200 ms par coup ou
  moins de 2 s en tout sont refusés.
- **Des statistiques impossibles** : étoiles bornées à 288 de chaque sorte (96 niveaux), voies à 8 ; le rang
  se recalcule à partir de l'expérience.
- **Les achats dans la sauvegarde** : achats, droits et aides sont retirés avant d'enregistrer (ils viennent du
  store) ; 80 Ko au plus, 100 Ko par requête.
- **Les rafales** : inscriptions (120/min pour tous), essais de code (60/min), scores (60/h), sauvegardes
  (30/h), statistiques (30/h), pseudos (10/jour) par joueur. Aucune adresse IP n'est gardée.
- **Les signalements en série** : il faut un jour d'ancienneté et un défi réussi pour signaler, cinq fois
  par jour au plus.
- **Les pseudos déguisés** : normalisés (NFKC), lettres latines et chiffres seulement (un « а » cyrillique
  ne passe plus pour un « a »).
- **Les origines inconnues** (CORS) : l'app iOS et Android et `cronobots.github.io` seulement.
