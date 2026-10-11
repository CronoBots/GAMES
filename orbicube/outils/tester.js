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
    const ctx = await b.newContext({ ...devices[appareil] });
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/sw\.js/.test(m.text())) erreurs.push(m.text()); });
    await p.goto(URL);
    await p.waitForTimeout(1200);

    (await p.textContent(".devise")).includes("cube 3×3") ? ok("accueil sans la marque") : faute("devise inattendue");
    (await p.isVisible("#btnBoutique")) ? ok("bouton « Jeu complet » sur l'accueil (version d'essai)") : faute("bouton d'achat absent");

    await p.tap("#btnJouer"); await p.waitForTimeout(1600);
    (await p.isVisible("#jeu.actif")) ? ok("le premier niveau se lance") : faute("pas d'écran de jeu");
    (await p.isVisible("#bulle")) ? ok("bulle du tutoriel") : faute("pas de tutoriel au niveau 1-1");
    (await resoudre(p)) ? ok("niveau 1-1 résolu, fenêtre de victoire") : faute("victoire non atteinte");
    const d1 = await debordements(p); d1.length ? faute("débordement : " + d1) : ok("rien ne déborde");

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
  await b.close();
  serveur.fermer();
  console.log(fautes ? "\n" + fautes + " faute(s)." : "\nParcours réussi sur les trois téléphones.");
  process.exit(fautes ? 1 : 0);
})();
