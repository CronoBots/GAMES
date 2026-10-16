// Version web (PWA) : tout le jeu est mis en cache pour se jouer hors ligne.
// Incrémenter V à chaque publication, sinon les joueurs gardent l'ancienne version.
var V = "orbicube-v185";
// les médias (images, polices, musique) changent rarement : leur cache survit aux publications, on ne les retélécharge
// pas à chaque version (audit du 16/10/2026 : 5 Mo à chaque mise à jour). Changer MEDIAS quand l'un d'eux change.
var MEDIAS = "orbicube-medias-2";
var FICHIERS = ["index.html", "config.js", "natif.js", "langues.js", "manifest.webmanifest", "confidentialite.html"];
var FICHIERS_MEDIAS = [
  "img/bg-1.webp", "img/bg-2.webp", "img/bg-3.webp", "img/bg-4.webp",
  "img/planets-1.webp", "img/planets-2.webp", "img/planets-3.webp", "img/planets-4.webp",
  "img/stars-1.webp", "img/stars-2.webp", "img/stars-3.webp", "img/stars-4.webp",
  "img/meteors-1.webp", "img/meteors-2.webp", "img/meteors-3.webp", "img/meteors-4.webp", "img/planete-verte.webp", "img/planete-rousse.webp", "img/asteroide-1.webp", "img/asteroide-2.webp", "img/asteroide-3.webp",
  "icones/favicon.png", "icones/apple-touch-icon.png", "icones/icon-192.png",
  "polices/polices.css", "polices/Jost-normal-300.woff2", "polices/Jost-normal-600.woff2", "polices/Jost-normal-700.woff2",
  "polices/STIXTwoText-normal-400.woff2", "polices/STIXTwoText-italic-400.woff2",
  "polices/InstrumentSans.woff2", "audio/nuit-dorbites.m4a"];
// cache:"reload" : on prend le fichier au serveur, jamais au cache HTTP du navigateur (sinon une publication pouvait
// remettre en cache l'ancien langues.js)
function remplir(nom, liste, seulementManquants) {
  return caches.open(nom).then(function (c) {
    return Promise.all(liste.map(function (f) {
      return (seulementManquants ? c.match(f) : Promise.resolve(null)).then(function (deja) {
        if (deja) return;
        return fetch(new Request(f, { cache: "reload" })).then(function (r) { if (!r.ok) throw new Error(f); return c.put(f, r); });
      });
    }));
  });
}
self.addEventListener("install", function (e) {
  e.waitUntil(Promise.all([remplir(V, FICHIERS, false), remplir(MEDIAS, FICHIERS_MEDIAS, true)])
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V && k !== MEDIAS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// la page : réseau d'abord, mais au plus 2,5 s (sur un réseau lent, l'écran restait noir 8 s) ; le reste : cache d'abord
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    var reseau = fetch(e.request).then(function (r) {
      if (r.ok) { var c = r.clone(); caches.open(V).then(function (k) { k.put("index.html", c); }); }
      return r;
    });
    e.respondWith(new Promise(function (ok) {
      var fini = false;
      function cache() { return caches.match("index.html"); }
      var minuterie = setTimeout(function () { cache().then(function (r) { if (r && !fini) { fini = true; ok(r); } }); }, 2500);
      reseau.then(function (r) { if (!fini) { fini = true; clearTimeout(minuterie); ok(r); } })
        .catch(function () { cache().then(function (r) { if (!fini) { fini = true; clearTimeout(minuterie); ok(r || Response.error()); } }); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || fetch(e.request); }));
});
