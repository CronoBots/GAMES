# Le serveur du classement d'Orbicube

Le classement, le pseudo, le code de récupération et la sauvegarde passent par **une seule fonction**
Supabase (`fonction/index.ts`) et **trois tables** (`schema.sql`). Pas de compte joueur : un identifiant
tiré au hasard, un jeton propre au téléphone et un code de récupération (`ORBI-XXXX-XXXX-XXXX`).

| Fichier | Rôle |
|---|---|
| `schema.sql` | tables `joueurs`, `scores`, `signalements` ; RLS activé sans politique : seul le serveur y touche |
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
   service ne va jamais dans le jeu** (le vérificateur le refuse).
4. Dans `www/config.js` > `classement` : `url` = `https://<projet>.supabase.co/functions/v1/orbicube`,
   `cle` = la clé **publiable** du projet (`sb_publishable_…`).
5. Ménage (facultatif) : planifier `select menage_scores();` une fois par jour (extension pg_cron), qui
   efface les scores des défis de plus de 60 jours, comme le promet la politique de confidentialité.

## Ce que le serveur garde, et ne garde pas

Il garde : l'identifiant, le pseudo, le rang, l'expérience, les étoiles, les voies dorées, l'étape du sans
fin, le pack soutien (liseré doré), les scores des défis et la sauvegarde. **Il ne garde pas** : de nom,
d'adresse électronique, de compte Apple ou Google, ni le code de récupération en clair (son empreinte
SHA-256 seulement). Profil > « Supprimer mes données » efface la ligne du joueur et tout ce qui en dépend.

## Modération

Le filtre refuse les mots grossiers à l'enregistrement. « Signaler ce pseudo » : à trois signalements de
joueurs différents, le pseudo redevient « Player » et des chiffres. Pour renommer un pseudo à la main :
`update joueurs set pseudo = 'Player12345' where lower(pseudo) = lower('…');`
