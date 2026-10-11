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

    (await p.textContent(".devise")).includes("cube 3×3") ? ok("accueil sans la marque") : faute("devise inattendue");
    (await p.isHidden("#btnBoutique")) ? ok("pastille « Jeu complet » discrète tant que le monde 1 n'est pas fini") : faute("pastille d'achat affichée trop tôt");
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

    // les mondes 3 à 6 mènent à la boutique
    await p.tap('#fenetre [data-a="menu"]'); await p.waitForTimeout(500);
    await p.tap("#niveaux [data-retour]"); await p.waitForTimeout(500);
    const payes = await p.$$eval(".monde.paye", (l) => l.length);
    payes === 4 ? ok("4 mondes réservés au jeu complet") : faute(payes + " mondes réservés au lieu de 4");
    await p.tap(".monde.paye"); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("Orbicube complet") ? ok("un monde réservé ouvre la boutique") : faute("la boutique ne s'ouvre pas");
    (await p.textContent("#fenetre")).includes("dans l’application") ? ok("version web : l'achat renvoie vers l'application") : faute("texte web de la boutique absent");
    await p.tap('#fenetre [data-a="x"]'); await p.waitForTimeout(300);

    // partie libre « Moyen » réservée, « Facile » ouverte
    await p.tap("#mondes [data-retour]"); await p.waitForTimeout(400);
    await p.tap("#btnLibre"); await p.waitForTimeout(300);
    await p.tap('#fenetre [data-a="10"]'); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("partie libre fait partie") ? ok("partie libre « Moyen » réservée") : faute("« Moyen » n'est pas réservé");
    await p.tap('#fenetre [data-a="x"]'); await p.waitForTimeout(300);

    // options : groupe Achat et lien de confidentialité
    await p.tap("#btnOptions"); await p.waitForTimeout(400);
    (await p.isVisible("#grpAchat")) ? ok("options : groupe Achat") : faute("groupe Achat absent");
    (await p.getAttribute("#lienConf", "href")) === "confidentialite.html" ? ok("lien vers la politique de confidentialité") : faute("lien de confidentialité");
    const d2 = await debordements(p); d2.length ? faute("débordement dans les options : " + d2) : ok("options sans débordement");

    // après achat, tout s'ouvre et la progression survit au rechargement
    await p.evaluate(() => { const k = "orbicube-v1", v = JSON.parse(localStorage.getItem(k)); v.achat = true; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.waitForTimeout(1200);
    (await p.isHidden("#btnBoutique")) ? ok("jeu complet : le bouton d'achat disparaît") : faute("bouton d'achat toujours là");
    await p.tap("#btnJouer"); await p.waitForTimeout(500);
    const restants = await p.$$eval(".monde.paye", (l) => l.length);
    restants === 0 ? ok("jeu complet : plus aucun monde réservé, progression gardée") : faute(restants + " mondes encore réservés");

    // paysage
    if (appareil === "iPhone 13") {
      await p.setViewportSize({ width: 844, height: 390 });
      await p.tap("#mondes [data-retour]"); await p.waitForTimeout(400);
      await p.tap("#btnJour"); await p.waitForTimeout(2200);
      const d3 = await debordements(p); d3.length ? faute("débordement en paysage : " + d3) : ok("défi du jour en paysage, sans débordement");
    }
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
      window.__envoyes = []; window.__connexions = 0;
      window.Natif = { natif: true, plateforme: "ios", vibrer: () => true, lire: () => Promise.resolve(null), ecrire() {}, demarrer() {}, surRetour() {}, quitter() {},
        achatsDisponibles: () => Promise.resolve(true), prix: () => Promise.resolve("3,49 €"), etatAchat: () => Promise.resolve(null),
        acheter: () => new Promise((ok) => setTimeout(() => ok({ ok: true }), 200)), restaurer: () => Promise.resolve({ ok: false, erreur: "aucun" }),
        succesDisponibles: () => true, succesConnecter: () => { window.__connexions++; return Promise.resolve(true); },
        succesDebloquer: (id) => { window.__envoyes.push(id); return Promise.resolve(true); }, succesAfficher: () => { window.__affiche = true; return Promise.resolve(true); } };` }));
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    await p.goto(URL + "?capture"); await p.waitForTimeout(1200);
    (await p.textContent("#prixAccueil")) === "3,49 €" ? ok("le prix vient du store (3,49 €)") : faute("prix du store non affiché");
    await p.click("#btnJouer"); await p.waitForTimeout(1800);
    for (const m of await p.evaluate(() => window.__orbicube.solution())) { await p.keyboard.press(m.length > 1 ? "Shift+" + m[0] : m[0]); await p.waitForTimeout(450); }
    await p.waitForTimeout(2200);
    const envoyes = await p.evaluate(() => window.__envoyes);
    envoyes.includes("orbicube.premier") ? ok("succès « Premier tour » déclaré à Game Center (orbicube.premier)") : faute("succès non déclaré : " + JSON.stringify(envoyes));
    await p.reload(); await p.waitForTimeout(1200);
    const renvoi = await p.evaluate(() => ({ c: window.__connexions, e: window.__envoyes }));
    renvoi.c === 1 && renvoi.e.includes("orbicube.premier") ? ok("à l'ouverture : connexion, puis renvoi des succès déjà gagnés") : faute("pas de renvoi à l'ouverture : " + JSON.stringify(renvoi));
    await p.click("#btnSucces"); await p.waitForTimeout(400);
    (await p.isVisible("#btnSuccesStore")) && (await p.textContent("#btnSuccesStore")).includes("Game Center") ? ok("bouton « Game Center » sur l'écran des succès") : faute("bouton Game Center absent");
    await p.click("#btnSuccesStore"); await p.waitForTimeout(200);
    (await p.evaluate(() => window.__affiche)) ? ok("le bouton ouvre la liste de Game Center") : faute("le bouton n'ouvre rien");
    await p.click("#succes [data-retour]"); await p.waitForTimeout(400);
    await p.click("#btnJouer"); await p.waitForTimeout(600); await p.click(".monde.paye"); await p.waitForTimeout(400);
    (await p.textContent("#fenetre")).includes("3,49 €") ? ok("la boutique affiche le prix du store") : faute("prix absent de la boutique");
    await p.click('#fenetre [data-a="acheter"]'); await p.waitForTimeout(1400);
    (await p.isHidden("#btnBoutique")) ? ok("achat réussi : le jeu complet est débloqué") : faute("l'achat ne débloque rien");
    (await p.$$eval(".monde.paye", (l) => l.length)) === 0 ? ok("après l'achat, plus aucun monde réservé") : faute("des mondes restent réservés après l'achat");
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
      const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === "hidden" || e.classList.contains("onde")) return false;
      return r.right > innerWidth + 1 || (e.matches("button,.bouton,.action,h2,h3,b,span,select") && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "hidden" && !e.closest(".notation"));
    }).map((e) => (e.id || e.className || e.tagName) + " « " + (e.textContent || "").trim().slice(0, 30) + " »"))).forEach((x) => debord.add(ou + " : " + x));
    const go = async (sel, t = 450) => { const el = await p.$(sel); if (el && await el.isVisible()) { await el.click(); await p.waitForTimeout(t); return true; } return false; };
    const fermer = async () => { for (const a of ["x", "non", "reprendre", "menu"]) if (await go(`#fenetre [data-a="${a}"]`)) return; };
    await go("#btnOptions"); await p.selectOption("#optLangue", langue); await p.waitForTimeout(300); await mesurer("options");
    await go("#btnEffacer"); await mesurer("effacer"); await fermer(); await go("#btnRestaurer"); await go("#options [data-retour]");
    await mesurer("accueil");
    await go("#btnJouer", 1800); await mesurer("niveau 1-1"); await go("#bulleOk"); await go("#btnPause"); await mesurer("pause"); await fermer();
    for (const m of await p.evaluate(() => window.__orbicube.solution())) { await p.keyboard.press(m.length > 1 ? "Shift+" + m[0] : m[0]); await p.waitForTimeout(450); }
    await p.waitForTimeout(2200); await mesurer("victoire"); await go('#fenetre [data-a="suivant"]', 2000);
    await go("#btnIndice", 400); await mesurer("indice"); await go('#fenetre [data-a="oui"]'); await go("#btnPause"); await go('#fenetre [data-a="niveaux"]', 600); await mesurer("niveaux");
    await go("#niveaux [data-retour]"); await mesurer("mondes"); await go(".monde.paye"); await mesurer("boutique"); await fermer();
    await go("#mondes [data-retour]"); await go("#btnLibre"); await mesurer("partie libre"); await go('#fenetre [data-a="25"]'); await fermer();
    await go("#btnJour", 2500); await mesurer("défi du jour"); await go("#btnPause"); await go('#fenetre [data-a="accueil"]');
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
