// Réglages de publication d'Orbicube. Modifier ici, sans toucher au jeu.
window.ORBICUBE_CONFIG = {
  version: "1.0.0",

  // "essai"   : gratuit au téléchargement, les mondes gratuits puis un achat unique débloque tout.
  // "complet" : tout est ouvert (application vendue payante sur le store, ou version de démonstration).
  modele: "essai",
  mondesGratuits: 4,          // mondes jouables sans achat (sur 8) : de 2 à 5 orbites ; les neuf à la fois, jamais gratuites
  libresGratuits: [5],        // niveaux de partie libre jouables sans achat (5, 10, 15, 25)

  // Prix affiché tant que le store n'a pas répondu (le vrai prix vient du store, dans la devise du joueur).
  prixAffiche: "4,99 €",
  // Boutique : prix affichés tant que le store n'a pas répondu (mêmes clés que PACKS dans index.html ; style = un style
  // d'un pack acheté seul).
  // Les produits et leurs droits RevenueCat sont décrits dans docs/lancement.md, section 3 quater.
  prixPacks: { style: "0,99 €", couleurs: "1,99 €", formes: "1,99 €", effets: "1,99 €", collection: "3,99 €", integrale: "7,99 €",
    soutien: "2,99 €", amp10: "0,99 €", amp30: "1,99 €" },

  // RevenueCat : clés PUBLIQUES du SDK (elles sont faites pour être dans l'app), à copier depuis
  // app.revenuecat.com > Project settings > API keys. Vides = achats désactivés.
  revenuecat: { ios: "", android: "" },
  droit: "complet",           // identifiant de l'« entitlement » RevenueCat

  // Succès des stores : identifiant de chacun des 14 succès du jeu dans Game Center (iOS) et Google Play Jeux
  // (Android). Les identifiants Apple sont choisis par nous et créés tels quels dans App Store Connect ;
  // ceux de Google sont donnés par la Play Console à la création (« CgkI… ») : à recopier ici.
  // Un identifiant vide = ce succès reste local sur cette plateforme. Voir docs/lancement.md, section 3 bis.
  succesStores: {
    ios: {
      premier: "orbicube.premier", m1: "orbicube.monde1", m3: "orbicube.tranches", m5: "orbicube.orbite",
      m6: "orbicube.grandmaitre", p10: "orbicube.precision", pm: "orbicube.perfectionniste", p60: "orbicube.sansfaute",
      eclair: "orbicube.eclair", jour: "orbicube.rendezvous", serie3: "orbicube.serie3", expert: "orbicube.expert",
      axes: "orbicube.troisaxes", tours: "orbicube.milletours"
    },
    android: {
      premier: "", m1: "", m3: "", m5: "", m6: "", p10: "", pm: "", p60: "",
      eclair: "", jour: "", serie3: "", expert: "", axes: "", tours: ""
    }
  },

  // Classements de Game Center et de Google Play Jeux : défi du jour (temps), défi de la semaine (temps),
  // sans fin (étape la plus haute) et total des étoiles (coups + temps). Android : identifiants de la Play Console.
  classementsStores: {
    ios: { jour: "orbicube.classement.jour", semaine: "orbicube.classement.semaine", sansfin: "orbicube.classement.sansfin", etoiles: "orbicube.classement.etoiles" },
    android: { jour: "", semaine: "", sansfin: "", etoiles: "" }
  },

  // Liens affichés dans la version web (laisser vides tant que l'app n'est pas publiée).
  liens: { appStore: "", googlePlay: "", confidentialite: "confidentialite.html" }
};
