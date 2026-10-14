// Version web (PWA) : tout le jeu est mis en cache pour se jouer hors ligne.
// Incrémenter V à chaque publication, sinon les joueurs gardent l'ancienne version.
var V = "orbicube-v141";
var FICHIERS = ["./", "index.html", "config.js", "natif.js", "langues.js", "manifest.webmanifest", "confidentialite.html",
  "img/fond-1.webp", "img/fond-2.webp", "img/fond-3.webp", "img/fond-4.webp",
  "img/bg-1.webp", "img/bg-2.webp", "img/bg-3.webp", "img/bg-4.webp",
  "img/planets-1.webp", "img/planets-2.webp", "img/planets-3.webp", "img/planets-4.webp",
  "img/stars-1.webp", "img/stars-2.webp", "img/stars-3.webp", "img/stars-4.webp",
  "img/meteors-1.webp", "img/meteors-2.webp", "img/meteors-3.webp", "img/meteors-4.webp", "img/planete-verte.webp", "img/planete-rousse.webp", "img/asteroide-1.webp", "img/asteroide-2.webp", "img/asteroide-3.webp",
  "icones/favicon.png", "icones/apple-touch-icon.png", "icones/icon-192.png", "icones/icon-512.png", "icones/icon-maskable-512.png",
  "polices/polices.css", "polices/Jost-normal-300.woff2", "polices/Jost-normal-600.woff2", "polices/Jost-normal-700.woff2",
  "polices/STIXTwoText-normal-400.woff2", "polices/STIXTwoText-italic-400.woff2",
  "polices/InstrumentSans-normal-400.woff2", "polices/InstrumentSans-normal-500.woff2",
  "polices/InstrumentSans-normal-600.woff2", "polices/InstrumentSans-normal-700.woff2",
  "polices/JetBrainsMono-normal-500.woff2", "polices/JetBrainsMono-normal-700.woff2", "audio/nuit-dorbites.m4a"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// réseau d'abord pour la page (une mise à jour arrive au premier rechargement), cache d'abord pour le reste
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var page = e.request.mode === "navigate";
  if (page) {
    e.respondWith(fetch(e.request).then(function (r) {
      if (r.ok) { var c = r.clone(); caches.open(V).then(function (k) { k.put("index.html", c); }); }
      return r;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
