// Pont entre le jeu (www/index.html, sans bundler) et le téléphone.
// Compilé par `npm run construire` en www/natif.js, qui expose window.Natif.
// Dans un navigateur, tout se replie : Natif.natif vaut false et chaque fonction rend une valeur neutre.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Purchases } from '@revenuecat/purchases-capacitor';

const natif = Capacitor.isNativePlatform();
// notre module (plugins/succes-natifs) : Game Center sur iOS, Google Play Jeux sur Android
const SuccesNatifs = registerPlugin('SuccesNatifs');
const plateforme = Capacitor.getPlatform(); // 'ios', 'android' ou 'web'
const cfg = () => window.ORBICUBE_CONFIG || {};

// Les achats passent par RevenueCat : un seul code pour l'App Store et Google Play,
// la restauration des achats et la vérification des reçus côté serveur.
let pret = null;
function configurer() {
  if (!natif) return Promise.resolve(false);
  if (pret) return pret;
  const cles = cfg().revenuecat || {};
  const cle = plateforme === 'ios' ? cles.ios : cles.android;
  if (!cle) return (pret = Promise.resolve(false));
  pret = Purchases.configure({ apiKey: cle }).then(() => true).catch(() => false);
  return pret;
}
function droitActif(info) {
  const droit = cfg().droit || 'complet';
  return !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[droit]);
}
function paquet() {
  return Purchases.getOfferings().then((o) => (o.current && o.current.availablePackages[0]) || null);
}

window.Natif = {
  natif,
  plateforme,
  // force : 'leger', 'fort' ou 'succes'
  vibrer(force) {
    if (!natif) return false;
    const p = force === 'succes'
      ? Haptics.notification({ type: NotificationType.Success })
      : Haptics.impact({ style: force === 'fort' ? ImpactStyle.Medium : ImpactStyle.Light });
    p.catch(() => {});
    return true;
  },
  // Preferences survit quand le système vide le stockage web (iOS le fait quand la place manque)
  lire(cle) {
    return natif ? Preferences.get({ key: cle }).then((r) => r.value).catch(() => null) : Promise.resolve(null);
  },
  ecrire(cle, valeur) {
    if (natif) Preferences.set({ key: cle, value: valeur }).catch(() => {});
  },
  demarrer() {
    if (!natif) return;
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (plateforme === 'android') StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
  },
  surRetour(fn) {
    if (natif) App.addListener('backButton', fn);
  },
  quitter() {
    if (natif) App.exitApp();
  },
  achatsDisponibles() {
    return configurer();
  },
  // le prix dans la devise du joueur, tel que le store l'affiche ; null s'il est inconnu
  prix() {
    return configurer()
      .then((ok) => (ok ? paquet().then((p) => (p ? p.product.priceString : null)) : null))
      .catch(() => null);
  },
  // true, false, ou null quand le store ne répond pas (on garde alors ce qu'on savait)
  etatAchat() {
    return configurer()
      .then((ok) => (ok ? Purchases.getCustomerInfo().then((r) => droitActif(r.customerInfo)) : null))
      .catch(() => null);
  },
  acheter() {
    return configurer().then((ok) => {
      if (!ok) return { ok: false, erreur: 'indisponible' };
      return paquet()
        .then((p) => {
          if (!p) return { ok: false, erreur: 'produit' };
          return Purchases.purchasePackage({ aPackage: p }).then((r) => ({ ok: droitActif(r.customerInfo) }));
        })
        .catch((e) => ({ ok: false, annule: !!(e && e.userCancelled), erreur: 'store' }));
    });
  },
  // Succès des stores. Chaque fonction se tait sans module ou sans configuration : les succès restent alors locaux.
  succesDisponibles() {
    return natif && Capacitor.isPluginAvailable('SuccesNatifs');
  },
  succesConnecter() {
    if (!this.succesDisponibles()) return Promise.resolve(false);
    return SuccesNatifs.connecter().then((r) => !!(r && r.connecte)).catch(() => false);
  },
  succesDebloquer(id) {
    if (!this.succesDisponibles() || !id) return Promise.resolve(false);
    return SuccesNatifs.debloquer({ id }).then(() => true).catch(() => false);
  },
  succesAfficher() {
    if (!this.succesDisponibles()) return Promise.resolve(false);
    return SuccesNatifs.afficher().then(() => true).catch(() => false);
  },
  // Classements : valeur entière ; temps = vrai pour un chrono en millisecondes (le plus petit gagne)
  classementEnvoyer(id, valeur, temps) {
    if (!this.succesDisponibles() || !id) return Promise.resolve(false);
    return SuccesNatifs.envoyerScore({ id, valeur: Math.round(valeur), temps: !!temps }).then(() => true).catch(() => false);
  },
  classementsAfficher(id) {
    if (!this.succesDisponibles()) return Promise.resolve(false);
    return SuccesNatifs.afficherClassements({ id: id || '' }).then(() => true).catch(() => false);
  },
  restaurer() {
    return configurer()
      .then((ok) => (ok ? Purchases.restorePurchases().then((r) => ({ ok: droitActif(r.customerInfo), droits: droitsActifs(r.customerInfo) })) : { ok: false, erreur: 'indisponible' }))
      .catch(() => ({ ok: false, erreur: 'store' }));
  },
  // Boutique : plusieurs produits (packs de styles, éditions groupées, ampoules). Chaque pack est un « entitlement »
  // RevenueCat ; une édition groupée en active plusieurs. Les ampoules sont consommables : le jeu les crédite lui-même.
  // ids → { id: prix dans la devise du joueur } ; {} quand le store ne répond pas
  prixProduits(ids) {
    return configurer()
      .then((ok) => (ok ? produits(ids).then((l) => { const m = {}; l.forEach((p) => { m[p.identifier] = p.priceString; }); return m; }) : {}))
      .catch(() => ({}));
  },
  // les droits actifs (identifiants d'entitlements), ou null quand le store ne répond pas
  droits() {
    return configurer()
      .then((ok) => (ok ? Purchases.getCustomerInfo().then((r) => droitsActifs(r.customerInfo)) : null))
      .catch(() => null);
  },
  acheterProduit(id) {
    return configurer().then((ok) => {
      if (!ok) return { ok: false, erreur: 'indisponible' };
      return produits([id])
        .then((l) => {
          const p = l.find((x) => x.identifier === id);
          if (!p) return { ok: false, erreur: 'produit' };
          return Purchases.purchaseStoreProduct({ product: p }).then((r) => ({ ok: true, droits: droitsActifs(r.customerInfo) }));
        })
        .catch((e) => ({ ok: false, annule: !!(e && e.userCancelled), erreur: 'store' }));
    });
  },
};
function droitsActifs(info) {
  return Object.keys((info && info.entitlements && info.entitlements.active) || {});
}
function produits(ids) {
  // NON_SUBSCRIPTION : achats uniques et consommables (Android l'exige ; iOS l'ignore)
  return Purchases.getProducts({ productIdentifiers: ids, type: 'NON_SUBSCRIPTION' }).then((r) => (r && r.products) || []);
}
