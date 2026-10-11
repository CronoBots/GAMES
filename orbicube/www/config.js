// Réglages de publication d'Orbicube. Modifier ici, sans toucher au jeu.
window.ORBICUBE_CONFIG = {
  version: "1.0.0",

  // "essai"   : gratuit au téléchargement, les mondes gratuits puis un achat unique débloque tout.
  // "complet" : tout est ouvert (application vendue payante sur le store, ou version de démonstration).
  modele: "essai",
  mondesGratuits: 2,          // mondes jouables sans achat (sur 6)
  libresGratuits: [5],        // niveaux de partie libre jouables sans achat (5, 10, 15, 25)

  // Prix affiché tant que le store n'a pas répondu (le vrai prix vient du store, dans la devise du joueur).
  prixAffiche: "2,99 €",

  // RevenueCat : clés PUBLIQUES du SDK (elles sont faites pour être dans l'app), à copier depuis
  // app.revenuecat.com > Project settings > API keys. Vides = achats désactivés.
  revenuecat: { ios: "", android: "" },
  droit: "complet",           // identifiant de l'« entitlement » RevenueCat

  // Liens affichés dans la version web (laisser vides tant que l'app n'est pas publiée).
  liens: { appStore: "", googlePlay: "", confidentialite: "confidentialite.html" }
};
