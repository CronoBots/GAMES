// Parcours complet sur téléphone simulé :  npm run tester   (code de retour 1 = faute)
// Demande Playwright et Chromium (npm i -g playwright, puis npx playwright install chromium).
const path = require("path");
const fs = require("fs");
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); } catch (e) {
  console.error("Playwright manque : npm i -g playwright && npx playwright install chromium"); process.exit(2);
}
// le jeu est servi en HTTP, comme sur le web et dans Capacitor (file:// bloque les polices préchargées)
const servir = require("./serveur");
let URL = "";
const NAV = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
let fautes = 0;
const ok = (m) => console.log("  ✓ " + m);
const faute = (m) => { console.log("  ✗ " + m); fautes++; };

async function debordements(p) {
  return p.evaluate(() => [...document.querySelectorAll(".ecran.actif *")].filter((e) => {
    // le décor de la carte (nébuleuses, anneaux, planètes…) et les planètes de l'accueil débordent volontairement du
    // cadre (rognées par leur conteneur) et ne sont pas interactifs
    if (e.closest(".parc-layer") || e.classList.contains("parc-fond") || e.closest(".astres")) return false;
    const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1;
  }).map((e) => e.id || e.className).slice(0, 3));
}
// joue le tour que l'indice montre, jusqu'à la victoire
async function resoudre(p) {
  for (let k = 0; k < 40; k++) {
    if (await p.$('#fenetre [data-a="rejouer"]')) return true;
    if (await p.isVisible("#voile")) {
      const oui = await p.$('#fenetre [data-a="oui"]');
      if (oui) await oui.tap();
      await p.waitForTimeout(400);
      continue;
    }
    const ind = await p.getAttribute("#plateau", "data-indice");
    if (!ind) {
      // la fenêtre de victoire arrive un peu après le dernier tour : on la laisse venir avant de demander un indice
      await p.waitForTimeout(1400);
      if ((await p.$('#fenetre [data-a="rejouer"]')) || (await p.isVisible("#voile"))) continue;
      await p.tap("#btnIndice"); await p.waitForTimeout(250); continue;
    }
    await p.evaluate(() => document.getElementById("plateau").removeAttribute("data-indice"));
    await p.keyboard.press(ind.length > 1 ? "Shift+" + ind[0] : ind[0]);
    await p.waitForTimeout(600);
  }
  return false;
}

(async () => {
  const serveur = await servir();
  URL = serveur.url + "index.html";
  const b = await chromium.launch(NAV);
  for (const appareil of ["iPhone 13", "iPhone SE", "Pixel 7"]) {
    console.log(appareil);
    const ctx = await b.newContext({ ...devices[appareil], locale: "fr-FR" });
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/sw\.js/.test(m.text())) erreurs.push(m.text()); });
    await p.goto(URL);
    await p.waitForTimeout(1200);

    !/rubik/i.test(await p.textContent("#accueil")) ? ok("accueil sans la marque") : faute("« Rubik » sur l'accueil");
    (await p.isHidden("#btnBoutique")) ? ok("rond « Boutique » caché tant qu'aucun niveau n'est fini") : faute("rond « Boutique » affiché avant le premier niveau");
    (await p.textContent("#ampNb")) === "3" ? ok("trois ampoules au départ") : faute("ampoules au départ : " + (await p.textContent("#ampNb")));

    await p.tap("#btnJouer"); await p.waitForTimeout(1600);
    (await p.isVisible("#jeu.actif")) ? ok("le premier niveau se lance") : faute("pas d'écran de jeu");
    (await p.isVisible("#bulle")) ? ok("bulle du tutoriel") : faute("pas de tutoriel au niveau 1-1");
    (await resoudre(p)) ? ok("niveau 1-1 résolu, fenêtre de victoire") : faute("victoire non atteinte");
    const d1 = await debordements(p); d1.length ? faute("débordement : " + d1) : ok("rien ne déborde");
    // « Revoir ma partie » rejoue les coups puis rend la fenêtre de victoire
    if (await p.$('#fenetre [data-a="revoir"]')) {
      await p.tap('#fenetre [data-a="revoir"]'); await p.waitForTimeout(400);
      const pendant = await p.isVisible("#voile");
      await p.waitForTimeout(3500);
      !pendant && (await p.isVisible('#fenetre [data-a="revoir"]')) ? ok("« Revoir ma partie » rejoue puis revient à la victoire") : faute("« Revoir ma partie » ne rejoue pas ou ne revient pas");
    } else faute("pas de bouton « Revoir ma partie »");
    // le premier cube résolu rapporte de l'expérience, que la bande du rang et le profil montrent
    const xp = await p.evaluate(() => JSON.parse(localStorage.getItem("orbicube-v1")).xp || 0);
    xp > 0 ? ok("le cube résolu rapporte " + xp + " XP") : faute("aucune expérience gagnée");

    // la carte de campagne : les mondes 5 à 8 (sections payantes) mènent à la boutique
    await p.tap('#fenetre [data-a="menu"]'); await p.waitForTimeout(600);
    const payes = await p.$$eval(".parc-sect.paye", (l) => l.length);
    const reserves = 8 - (await p.evaluate(() => (window.ORBICUBE_CONFIG || {}).mondesGratuits || 2));
    payes === reserves ? ok(reserves + " mondes réservés au jeu complet") : faute(payes + " mondes réservés au lieu de " + reserves);
    await p.tap(".parc-sect.paye"); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("Orbicube complet") ? ok("un monde réservé ouvre la boutique") : faute("la boutique ne s'ouvre pas");
    (await p.textContent("#fenetre")).includes("dans l’application") ? ok("version web : l'achat renvoie vers l'application") : faute("texte web de la boutique absent");
    await p.tap('#fenetre [data-a="x"]'); await p.waitForTimeout(300);

    // jeu libre : « Facile » ouvert sur les cinq orbites gratuites, le reste dans la carte « Avec le jeu complet »
    await p.tap("#parcours [data-retour]"); await p.waitForTimeout(400);
    await p.tap("#btnLibre"); await p.waitForTimeout(300);
    const lib = await p.evaluate(() => { const f = document.querySelector("#fenetre"); const fa = f.querySelector('[data-a="5"]'); return { facile: !!fa && !fa.closest(".reserve") && fa.textContent.includes("5 orbites"), carte: !!f.querySelector(".reserve") && f.querySelector(".reserve").textContent.includes("Avec le jeu complet"), reserves: [...f.querySelectorAll(".reserve [data-a]")].map((b) => b.dataset.a).join(",") }; });
    lib.facile && lib.carte && lib.reserves === "10,sansfin,relax,acheter" ? ok("jeu libre : Facile sur 5 orbites, le reste réservé et annoncé") : faute("jeu libre sans achat : " + JSON.stringify(lib));
    await p.tap('#fenetre [data-a="10"]'); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("jeu libre fait partie") ? ok("jeu libre « Moyen » réservée") : faute("« Moyen » n'est pas réservé");
    await p.tap('#fenetre [data-a="x"]'); await p.waitForTimeout(300);
    // défis : celui du jour est gratuit, celui de la semaine réservé au jeu complet
    await p.tap("#btnJour"); await p.waitForTimeout(300);
    const sem = await p.evaluate(() => { const f = document.querySelector("#fenetre"); return !!f.querySelector('.reserve [data-a="semaine"]') && !f.querySelector('[data-a="jour"]').closest(".reserve"); });
    await p.tap('#fenetre [data-a="semaine"]'); await p.waitForTimeout(400);
    sem && (await p.textContent("#fenetre")).includes("défi de la semaine fait partie") ? ok("défis : le jour gratuit, la semaine réservée au jeu complet") : faute("défi de la semaine pas réservé");
    await p.tap('#fenetre [data-a="x"]'); await p.waitForTimeout(300);

    // options : groupe Achat et lien de confidentialité
    await p.tap("#btnOptions"); await p.waitForTimeout(400);
    (await p.isVisible("#grpAchat")) ? ok("options : groupe Achat") : faute("groupe Achat absent");
    (await p.getAttribute("#lienConf", "href")) === "confidentialite.html" ? ok("lien vers la politique de confidentialité") : faute("lien de confidentialité");
    const d2 = await debordements(p); d2.length ? faute("débordement dans les options : " + d2) : ok("options sans débordement");

    // la boutique, depuis les options : un style ouvert se porte d'un toucher, celui d'un pack non acheté se regarde sans se porter
    await p.tap("#btnStylesOpt"); await p.waitForTimeout(700);
    (await p.isVisible("#boutique.actif")) && (await p.$$eval("#boutRayon .style", (l) => l.length)) === 8 ? ok("boutique : huit palettes en vitrine") : faute("boutique : rayon des couleurs absent");
    (await p.textContent('#boutRayons [data-r="palette"] .cpt')) === "2/8" ? ok("boutique : compteur de collection (2/8 palettes pour un débutant)") : faute("compteur de collection faux : " + (await p.textContent('#boutRayons [data-r="palette"] .cpt')));
    (await p.textContent("#pack-couleurs")).includes("au lieu de") && (await p.textContent("#pack-couleurs")).includes("3,96") ? ok("boutique : le pack montre ce que coûterait son contenu à l'unité (3,96 €)") : faute("prix barré du pack absent");
    await p.tap('.style[data-id="contraste"]'); await p.waitForTimeout(300);
    (await p.$('.style.porte[data-id="contraste"]')) ? ok("boutique : un style ouvert se porte d'un toucher") : faute("le style choisi n'est pas porté");
    await p.tap('.style[data-id="aurore"]'); await p.waitForTimeout(500);
    (await p.$('.style.porte[data-id="contraste"]')) && !(await p.$('.style.porte[data-id="aurore"]')) ? ok("boutique : un style d'un pack non acheté se regarde sans se porter") : faute("un style payant a été porté sans achat");
    const d3 = await debordements(p); d3.length ? faute("débordement dans la boutique : " + d3) : ok("boutique sans débordement");
    await p.tap("#boutRetour"); await p.waitForTimeout(400);

    // après achat, tout s'ouvre et la progression survit au rechargement
    await p.evaluate(() => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k)); v.achat = true; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.waitForTimeout(1200);
    (await p.textContent("#btnAchatOpt")) === "Débloqué" ? ok("jeu complet : l'achat est reconnu après rechargement") : faute("le jeu complet n'est pas reconnu");
    await p.tap("#btnJouer"); await p.waitForTimeout(600);
    const restants = await p.$$eval(".parc-sect.paye", (l) => l.length);
    restants === 0 ? ok("jeu complet : plus aucun monde réservé, progression gardée") : faute(restants + " mondes encore réservés");

    // niveaux experts : après le chemin du monde 1, le monde 2 ET le premier expert sont ouverts, le second expert attend le premier
    await p.evaluate(() => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k)); for (let i = 1; i <= 8; i++) v.niveaux["1-" + i] = { etoiles: 3, chrono: 3, coups: 1, temps: 9000, sansIndice: true }; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.waitForTimeout(1200);
    (await p.textContent("#jouerMonde")).includes("Niveau 9") ? ok("experts : le bouton principal mène au monde 2 (niveau 9), pas aux experts") : faute("bouton principal : " + (await p.textContent("#jouerMonde")));
    await p.tap("#btnJouer"); await p.waitForTimeout(600);
    const exp = await p.evaluate(() => { const n = (w, i) => document.querySelector('.parc-niv[data-w="' + w + '"][data-i="' + i + '"]'); return { m2: !n(1, 0).classList.contains("verrou"), e1: n(0, 8).classList.contains("expert") && !n(0, 8).classList.contains("verrou"), e2: n(0, 9).classList.contains("verrou"), titres: document.querySelectorAll(".parc-exp").length, total: document.querySelectorAll(".parc-niv").length, ecart: (() => { const q = [...document.querySelectorAll(".parc-niv")].map((e) => [parseFloat(e.style.left), parseFloat(e.style.top)]); let m = 1e9; q.forEach((a, i) => q.slice(i + 1).forEach((b) => { m = Math.min(m, Math.hypot(a[0] - b[0], a[1] - b[1])); })); return Math.round(m); })() }; });
    // mémoire de l'iPhone : la carte n'affiche que les bandes d'image proches de la vue (Safari fermait la page à 32 bandes)
    const bandes = await p.evaluate(() => [...document.querySelectorAll(".parc-bg,.parc-planets,.parc-starsb,.parc-meteorsb")].filter((e) => getComputedStyle(e).display !== "none").length);
    bandes <= 12 ? ok("carte : " + bandes + " bandes d'image affichées sur 32 (mémoire de l'iPhone)") : faute("carte : " + bandes + " bandes d'image affichées, Safari risque de fermer la page");
    exp.m2 && exp.e1 && exp.e2 && exp.titres === 8 && exp.total === 96 && exp.ecart >= 70 ? ok("experts : 96 niveaux, une voie dorée de quatre experts par monde (E1 ouvert au niveau 2), aucun nœud n'en touche un autre (" + exp.ecart + " px)") : faute("niveaux experts : " + JSON.stringify(exp));

    // monde 3 gratuit mais fermé par 32 étoiles de coups (deux par niveau du chemin d'avant) : 24 ne suffisent pas, 32 l'ouvrent
    const poser = (n1) => p.evaluate((n1) => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k)); for (let i = 1; i <= 8; i++) v.niveaux["1-" + i].etoiles = 2; for (let i = 1; i <= 8; i++) v.niveaux["2-" + i] = { etoiles: i <= n1 ? 3 : 1, chrono: 1, coups: 9, temps: 60000, sansIndice: true }; localStorage.setItem(k, JSON.stringify(v)); }, n1);
    await poser(0); await p.reload(); await p.waitForTimeout(1200);
    const att = await p.textContent("#jouerMonde");
    await p.tap("#btnJouer"); await p.waitForTimeout(600);
    const ferme = await p.evaluate(() => document.querySelector('.parc-niv[data-w="2"][data-i="0"]').classList.contains("verrou") && !!document.querySelector(".parc-cond"));
    att.includes("encore 8 étoiles de coups") && ferme ? ok("étoiles : le monde 3 attend 32 étoiles de coups (il en manque 8), l'accueil et la carte le disent") : faute("condition d'étoiles : « " + att + " », fermé " + ferme);
    await poser(4); await p.reload(); await p.waitForTimeout(1200); await p.tap("#btnJouer"); await p.waitForTimeout(600);
    (await p.evaluate(() => !document.querySelector('.parc-niv[data-w="2"][data-i="0"]').classList.contains("verrou"))) ? ok("étoiles : à 32 étoiles de coups, le monde 3 s'ouvre") : faute("le monde 3 reste fermé à 32 étoiles");

    // paysage
    if (appareil === "iPhone 13") {
      await p.setViewportSize({ width: 844, height: 390 });
      await p.tap("#parcours [data-retour]"); await p.waitForTimeout(400);
      await p.tap("#btnJour"); await p.waitForTimeout(300); await p.tap('#fenetre [data-a="jour"]'); await p.waitForTimeout(2200);
      const d3 = await debordements(p); d3.length ? faute("débordement en paysage : " + d3) : ok("défi du jour en paysage, sans débordement");
    }
    // la campagne refaite (huit mondes) ne reprend pas les niveaux d'une ancienne sauvegarde, mais garde l'achat
    await p.evaluate(() => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k)); v.campagne = 1; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.waitForTimeout(1200);
    (await p.textContent("#jouerTxt")) === "Jouer" && (await p.textContent("#btnAchatOpt")) === "Débloqué" ? ok("ancienne campagne : niveaux non repris, achat gardé") : faute("ancienne campagne : « " + (await p.textContent("#jouerTxt")) + " »");
    erreurs.length ? faute("erreurs : " + erreurs.join(" | ")) : ok("aucune erreur de script");
    await ctx.close();
  }
  // gestes au doigt : un geste ne compte qu'au lâcher, d'après la position finale du cercle
  {
    console.log("Gestes (iPhone 13)");
    const ctx = await b.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    await p.goto(URL); await p.waitForTimeout(1000);
    // la jeu libre est réservée au jeu complet : on débloque pour tester les gestes sur les neuf cercles
    await p.evaluate(() => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k) || "{}"); v.achat = true; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.waitForTimeout(1200);
    await p.click("#btnLibre"); await p.waitForTimeout(300); await p.click('#fenetre [data-a="5"]'); await p.waitForTimeout(2600);
    const bx = await (await p.$("#plateau")).boundingBox(), E = bx.width / 3.2, ox = bx.x + bx.width / 2, oy = bx.y + bx.width / 2 + 0.133 * E;
    const C = [0, 0.5336], R = 1.0835, pt = (a) => [ox + (C[0] + R * Math.cos(a)) * E, oy - (C[1] + R * Math.sin(a)) * E];
    const coups = async () => (await p.textContent("#jCoups")).split("/")[0].trim();
    // glisse lentement le long du cercle U, d'une suite d'angles (en radians, autour de son centre)
    const glisser = async (etapes) => { let a = -Math.PI / 2; await p.mouse.move(...pt(a)); await p.mouse.down();
      for (const d of etapes) { const n = Math.ceil(Math.abs(d) / 0.04); for (let i = 0; i < n; i++) { a += d / n; await p.mouse.move(...pt(a)); await p.waitForTimeout(12); } }
      await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(700); };
    await glisser([Math.PI / 2 * 1.1, -Math.PI / 2 * 1.1]);
    (await coups()) === "0" ? ok("un aller-retour d'un quart de tour ne compte aucun coup") : faute("aller-retour compté : " + (await coups()) + " coup(s)");
    await glisser([Math.PI * 1.03]);
    const nota = (await p.textContent("#notation")).trim();
    (await coups()) === "1" && /^U2$/.test(nota) ? ok("un demi-tour en un geste compte un coup, noté U2") : faute("demi-tour : " + (await coups()) + " coup(s), notation « " + nota + " »");
    await p.click("#btnAnnuler"); await p.waitForTimeout(900);
    (await coups()) === "0" ? ok("« Annuler » défait le demi-tour en entier") : faute("annuler le demi-tour laisse " + (await coups()) + " coup(s)");
    await p.mouse.click(...pt(-Math.PI / 2)); await p.waitForTimeout(700);
    (await coups()) === "0" ? ok("un simple appui sur un cercle ne tourne rien") : faute("un appui sur un cercle a joué " + (await coups()) + " coup(s)");
    await ctx.close();
  }

  // application simulée : un faux pont natif (iOS) pour éprouver le branchement des succès des stores et de l'achat
  {
    console.log("Application iOS simulée");
    const ctx = await b.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
    await ctx.route("**/natif.js", (r) => r.fulfill({ contentType: "text/javascript", body: `
      window.__envoyes = []; window.__connexions = 0; window.__scores = [];
      window.Natif = { natif: true, plateforme: "ios", vibrer: () => true, lire: () => Promise.resolve(null), ecrire() {}, demarrer() {}, surRetour() {}, quitter() {},
        achatsDisponibles: () => Promise.resolve(true), prix: () => Promise.resolve("3,49 €"), etatAchat: () => Promise.resolve(null),
        acheter: () => new Promise((ok) => setTimeout(() => ok({ ok: true }), 200)), restaurer: () => Promise.resolve({ ok: false, erreur: "aucun" }),
        prixProduits: () => Promise.resolve({ orbicube_pack_couleurs: "2,29 €" }), droits: () => Promise.resolve(null),
        acheterProduit: (id) => new Promise((ok) => setTimeout(() => ok({ ok: true, droits: id === "orbicube_pack_couleurs" ? ["pack_couleurs"] : id === "orbicube_style_galaxie" ? ["style_galaxie"] : [] }), 150)),
        succesDisponibles: () => true, succesConnecter: () => { window.__connexions++; return Promise.resolve(true); },
        succesDebloquer: (id) => { window.__envoyes.push(id); return Promise.resolve(true); }, succesAfficher: () => { window.__affiche = true; return Promise.resolve(true); },
        classementEnvoyer: (id, v, t) => { window.__scores.push([id, v, t]); return Promise.resolve(true); }, classementsAfficher: (id) => { window.__classement = id; return Promise.resolve(true); } };` }));
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.goto(URL + "?capture"); await p.waitForTimeout(1200);
    await p.click("#btnJouer"); await p.waitForTimeout(1800);
    for (const m of await p.evaluate(() => window.__orbicube.solution())) { await p.keyboard.press(m.length > 1 ? "Shift+" + m[0] : m[0]); await p.waitForTimeout(450); }
    await p.waitForTimeout(2200);
    const envoyes = await p.evaluate(() => window.__envoyes);
    envoyes.includes("orbicube.premier") ? ok("succès « Premier tour » déclaré à Game Center (orbicube.premier)") : faute("succès non déclaré : " + JSON.stringify(envoyes));
    await p.reload(); await p.waitForTimeout(1200);
    const renvoi = await p.evaluate(() => ({ c: window.__connexions, e: window.__envoyes }));
    renvoi.c === 1 && renvoi.e.includes("orbicube.premier") ? ok("à l'ouverture : connexion, puis renvoi des succès déjà gagnés") : faute("pas de renvoi à l'ouverture : " + JSON.stringify(renvoi));
    const scores = await p.evaluate(() => window.__scores);
    scores.some((s) => s[0] === "orbicube.classement.etoiles" && s[1] > 0) ? ok("total d'étoiles envoyé au classement de Game Center") : faute("classement des étoiles non envoyé : " + JSON.stringify(scores));
    await p.click("#btnRang"); await p.waitForTimeout(400);
    if (await p.isVisible("#btnClassements")) { await p.click("#btnClassements"); await p.waitForTimeout(200); }
    (await p.evaluate(() => window.__classement)) === "" ? ok("le Profil ouvre les classements de Game Center") : faute("bouton Classements absent ou inactif");
    await p.click("#profil [data-retour]"); await p.waitForTimeout(400);
    await p.click("#btnSucces"); await p.waitForTimeout(400);
    (await p.isVisible("#btnSuccesStore")) && (await p.textContent("#btnSuccesStore")).includes("Game Center") ? ok("bouton « Game Center » sur l'écran des succès") : faute("bouton Game Center absent");
    await p.click("#btnSuccesStore"); await p.waitForTimeout(200);
    (await p.evaluate(() => window.__affiche)) ? ok("le bouton ouvre la liste de Game Center") : faute("le bouton n'ouvre rien");
    await p.click("#succes [data-retour]"); await p.waitForTimeout(400);
    await p.click("#btnJouer"); await p.waitForTimeout(700); await p.click(".parc-sect.paye"); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("3,49 €") ? ok("la boutique affiche le prix du store") : faute("prix absent de la boutique");
    await p.click('#fenetre [data-a="acheter"]'); await p.waitForTimeout(1400);
    (await p.textContent("#btnAchatOpt")) === "Débloqué" ? ok("achat réussi : le jeu complet est débloqué") : faute("l'achat ne débloque rien");
    (await p.$$eval(".parc-sect.paye", (l) => l.length)) === 0 ? ok("après l'achat, plus aucun monde réservé") : faute("des mondes restent réservés après l'achat");
    // boutique : prix d'un pack venu du store, achat d'un pack (ses styles s'ouvrent), achat d'ampoules (créditées)
    await p.click("#parcours [data-retour]"); await p.waitForTimeout(400);
    await p.click("#btnOptions"); await p.waitForTimeout(400); await p.click("#btnStylesOpt"); await p.waitForTimeout(700);
    (await p.textContent("#pack-couleurs")).includes("2,29 €") ? ok("boutique : le prix du pack vient du store (2,29 €)") : faute("prix du pack absent");
    // un style seul : la fiche de l'aperçu le vend à l'unité, sans le reste du pack
    await p.click('.style[data-id="galaxie"]'); await p.waitForTimeout(500); await p.click('#apercuFiche [data-achat="s_galaxie"]'); await p.waitForTimeout(900);
    !(await p.$('.style.ferme[data-id="galaxie"]')) && (await p.$('.style.ferme[data-id="aurore"]')) ? ok("un style acheté seul s'ouvre, sans ouvrir le reste du pack") : faute("l'achat à l'unité ne marche pas");
    await p.click("#pack-couleurs [data-achat]"); await p.waitForTimeout(900);
    !(await p.$('.style.ferme[data-id="aurore"]')) && (await p.textContent("#pack-couleurs")).includes("Acquis") ? ok("pack acheté : ses palettes s'ouvrent") : faute("le pack acheté n'ouvre rien");
    const amp0 = +(await p.textContent("#boutAmpNb")); await p.click('[data-achat="amp10"]'); await p.waitForTimeout(900);
    +(await p.textContent("#boutAmpNb")) === amp0 + 10 ? ok("dix ampoules achetées sont créditées") : faute("ampoules non créditées : " + amp0 + " → " + (await p.textContent("#boutAmpNb")));
    erreurs.length ? faute("erreurs : " + erreurs.join(" | ")) : ok("aucune erreur de script");
    await ctx.close();
  }

  // chaque langue : tous les écrans et fenêtres sur le plus petit iPhone, phrases manquantes et textes qui débordent
  for (const langue of ["en", "nl", "de", "es"]) {
    console.log("Langue " + langue + " (iPhone SE)");
    const ctx = await b.newContext({ ...devices["iPhone SE"] });
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.goto(URL + "?capture");
    await p.waitForTimeout(1000);
    const debord = new Set();
    const mesurer = async (ou) => (await p.evaluate(() => [...document.querySelectorAll(".ecran.actif *, #fenetre *, #toast *")].filter((e) => {
      const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === "hidden" || e.classList.contains("onde") || e.closest(".parc-layer") || e.classList.contains("parc-fond") || e.closest(".astres")) return false;
      return r.right > innerWidth + 1 || (e.matches("button,.bouton,.action,h2,h3,b,span,select") && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "hidden" && !e.closest(".notation"));
    }).map((e) => (e.id || e.className || e.tagName) + " « " + (e.textContent || "").trim().slice(0, 30) + " »"))).forEach((x) => debord.add(ou + " : " + x));
    const go = async (sel, t = 450) => { const el = await p.$(sel); if (el && await el.isVisible()) { await el.click(); await p.waitForTimeout(t); return true; } return false; };
    const fermer = async () => { for (const a of ["x", "non", "reprendre", "menu"]) if (await go(`#fenetre [data-a="${a}"]`)) return; };
    await go("#btnOptions"); await p.selectOption("#optLangue", langue); await p.waitForTimeout(300); await mesurer("options");
    await go("#btnStylesOpt", 900); await mesurer("boutique couleurs"); await go('#boutRayons [data-r="forme"]'); await mesurer("boutique formes");
    await go('#boutRayons [data-r="effets"]'); await mesurer("boutique effets"); await go('.style[data-id="comete"]', 600); await mesurer("boutique, style d'un pack");
    await go('.style[data-id="poussiere"]', 600); await go("#boutRetour");
    await go("#btnEffacer"); await mesurer("effacer"); await fermer(); await go("#btnRestaurer"); await go("#options [data-retour]");
    await mesurer("accueil");
    await go("#btnJouer", 1800); await mesurer("niveau 1-1"); await go("#bulleOk"); await go("#btnPause"); await mesurer("pause"); await fermer();
    for (const m of await p.evaluate(() => window.__orbicube.solution())) { await p.keyboard.press(m.length > 1 ? "Shift+" + m[0] : m[0]); await p.waitForTimeout(450); }
    await p.waitForTimeout(2200); await mesurer("victoire"); await go('#fenetre [data-a="suivant"]', 2000);
    await go("#btnIndice", 400); await mesurer("indice"); await go('#fenetre [data-a="oui"]'); await go("#btnPause"); await go('#fenetre [data-a="niveaux"]', 600); await mesurer("niveaux");
    await mesurer("parcours"); await go(".parc-sect.paye"); await mesurer("boutique"); await fermer();
    await go("#parcours [data-retour]"); await go("#btnLibre"); await mesurer("jeu libre"); await go('#fenetre [data-a="10"]'); await mesurer("boutique jeu libre moyen"); await fermer();
    await go("#btnJour"); await mesurer("défis"); await go('#fenetre [data-a="semaine"]', 600); await mesurer("boutique défi de la semaine"); await fermer();
    await go("#btnLibre"); await go('#fenetre [data-a="relax"]'); await mesurer("boutique jeu libre"); await fermer();
    await go("#btnRang"); await mesurer("profil"); await go("#profil [data-retour]");
    await go("#btnSucces"); await mesurer("succès"); await go("#succes [data-retour]"); await go("#btnAide"); await mesurer("aide"); await go("#aide [data-retour]");
    await p.waitForTimeout(3200);
    const manques = await p.evaluate(() => window.__orbicube.manques());
    manques.length ? faute(manques.length + " phrase(s) sans traduction : " + manques.slice(0, 6).map((m) => "« " + m + " »").join(", ")) : ok("toutes les phrases affichées sont traduites");
    debord.size ? faute("textes qui débordent : " + [...debord].slice(0, 5).join(" | ")) : ok("aucun texte ne déborde sur 320 px");
    const jouer = await p.textContent("#jouerTxt");
    await go("#btnOptions"); await p.selectOption("#optLangue", "fr"); await p.waitForTimeout(300); await go("#options [data-retour]");
    (await p.textContent("#jouerTxt")) === "Continuer" && jouer !== "Continuer" ? ok("retour au français sans recharger (« " + jouer + " » → « Continuer »)") : faute("le retour au français ne retraduit pas l'écran");
    erreurs.length ? faute("erreurs : " + erreurs.join(" | ")) : ok("aucune erreur de script");
    await ctx.close();
  }
  await b.close();
  serveur.fermer();
  console.log(fautes ? "\n" + fautes + " faute(s)." : "\nParcours réussi sur les trois téléphones et dans les cinq langues.");
  process.exit(fautes ? 1 : 0);
})();
