// Captures pour l'App Store et Google Play :  npm run captures
// Joue de vraies scènes du jeu, puis les met en page avec un titre, aux tailles exigées par les stores.
//   ressources/captures/<format>/1-accueil.png …   (format : iphone-6.9, ipad-13, android)
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const servir = require("./serveur");
const NAV = fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {};
const SORTIE = path.join(__dirname, "..", "ressources", "captures");

// tailles finales exigées (largeur × hauteur en pixels) et écran simulé
const FORMATS = [
  { nom: "iphone-6.9", w: 1320, h: 2868, vue: { width: 440, height: 956 }, dpr: 3 },
  { nom: "ipad-13", w: 2064, h: 2752, vue: { width: 1032, height: 1376 }, dpr: 2 },
  { nom: "android", w: 1080, h: 1920, vue: { width: 360, height: 640 }, dpr: 3 },
];
const SCENES = [
  { id: "1-accueil", titre: "Le cube 3×3,<br>cercle par cercle" },
  { id: "2-tour", titre: "Glissez un cercle :<br>douze pastilles tournent" },
  { id: "3-campagne", titre: "60 niveaux,<br>six mondes" },
  { id: "4-victoire", titre: "Trois étoiles<br>en un minimum de coups" },
  { id: "5-defi", titre: "Un nouveau défi<br>chaque jour" },
];
// une progression crédible pour les écrans de campagne (rien n'est affiché qui n'existe pas dans le jeu)
function progression() {
  const niveaux = {};
  const et = [3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 1, 3, 3, 2, 3, 3, 3, 3, 3, 2, 3, 2, 3, 3];
  [[1, 10], [2, 10], [3, 10], [4, 10], [5, 3]].forEach(([w, n]) => { for (let i = 1; i <= n; i++) niveaux[w + "-" + i] = { etoiles: et[(w * 10 + i) % et.length], coups: 3, temps: 20000, sansIndice: true }; });
  return { v: 1, niveaux, achat: true, tips: { geste: 1, toucher: 1, pastille: 1, indice: 1, vue: 1, tranche: 1 }, succes: { premier: 1, m1: 1 },
    stats: { tours: 412, tranches: 60, resolus: 28, indices: 2, meilleur: {} }, jours: {}, serie: 4, dernierJour: "",
    options: { son: false, vib: false, vitesse: 1, palette: "classique", cube: true, pave: false, horaire: true, maj: 1 } };
}

async function scene(p, id) {
  const tap = (s) => p.locator(s).first().click();
  if (id === "1-accueil") { await p.waitForTimeout(2600); return; }
  if (id === "3-campagne") { await tap("#btnJouer"); await p.waitForTimeout(1400); return; }
  if (id === "5-defi") { await tap("#btnJour"); await p.waitForTimeout(3200); return; }
  // niveau 5-4 de l'orbite complète, saisi au milieu d'un tour
  await tap("#btnJouer"); await p.waitForTimeout(700);
  await p.locator(".monde").nth(4).click(); await p.waitForTimeout(700);
  await p.locator(".niveau").nth(3).click(); await p.waitForTimeout(3000);
  if (id === "2-tour") {
    await p.keyboard.press("U"); await p.waitForTimeout(110); return;
  }
  // victoire : la solution la plus courte, jouée au clavier sans indice, pour un « Parfait » à trois étoiles
  const sol = await p.evaluate(() => window.__orbicube.solution());
  for (const m of sol) { await p.keyboard.press(m.length > 1 ? "Shift+" + m[0] : m[0]); await p.waitForTimeout(420); }
  // fenêtre de victoire posée, étoiles tombées, confettis finis
  await p.waitForTimeout(3600);
}

// document.fonts.ready n'attend pas une police que rien n'a encore demandée : on la demande explicitement
async function chargerPolices(page) {
  await page.evaluate(() => Promise.all(["800 40px Unbounded", "italic 400 30px 'STIX Two Text'"].map((f) => document.fonts.load(f))));
  const ok = await page.evaluate(() => document.fonts.check("800 40px Unbounded"));
  if (!ok) throw new Error("police Unbounded non chargée");
}

function miseEnPage(f, titre, image, polices) {
  const marge = Math.round(f.w * 0.07), haut = Math.round(f.h * 0.2), ecranH = f.h - haut - marge, ecranW = Math.round(ecranH * f.vue.width / f.vue.height);
  const fs1 = Math.round(f.w * (f.nom === "ipad-13" ? 0.05 : 0.068));
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${polices}"><style>
    html,body{margin:0;width:${f.w}px;height:${f.h}px;overflow:hidden;background:radial-gradient(90% 60% at 50% 0%,#2a1f5c 0%,#07070c 70%);}
    h1{margin:0;position:absolute;top:0;left:${marge}px;right:${marge}px;height:${haut}px;display:flex;align-items:center;justify-content:center;text-align:center;
      font:800 ${fs1}px/1.15 Unbounded,system-ui,sans-serif;letter-spacing:.02em;color:#fff;}
    img{position:absolute;left:50%;top:${haut}px;transform:translateX(-50%);width:${ecranW}px;height:${ecranH}px;border-radius:${Math.round(f.w * 0.05)}px;
      box-shadow:0 0 0 ${Math.round(f.w * 0.008)}px #2b2840, 0 ${Math.round(f.w * 0.03)}px ${Math.round(f.w * 0.08)}px rgba(0,0,0,.6);}
  </style></head><body><h1>${titre}</h1><img src="data:image/png;base64,${image.toString("base64")}"></body></html>`;
}

(async () => {
  const serveur = await servir();
  const b = await chromium.launch(NAV);
  // `node outils/captures.js banniere` ne refait que la bannière
  for (const f of process.argv[2] === "banniere" ? [] : FORMATS) {
    fs.mkdirSync(path.join(SORTIE, f.nom), { recursive: true });
    for (const s of SCENES) {
      const ctx = await b.newContext({ viewport: f.vue, deviceScaleFactor: f.dpr, isMobile: f.nom !== "ipad-13" || true, hasTouch: true, reducedMotion: "no-preference" });
      const prog = progression();
      await ctx.addInitScript((v) => { try { if (!sessionStorage.getItem("cap")) { localStorage.setItem("orbicube-v1", v); sessionStorage.setItem("cap", "1"); } } catch (e) {} }, JSON.stringify(prog));
      const p = await ctx.newPage();
      await p.goto(serveur.url + "index.html?capture");
      await p.waitForTimeout(800);
      await scene(p, s.id);
      const brut = await p.screenshot();
      const page = await b.newPage({ viewport: { width: f.w, height: f.h }, deviceScaleFactor: 1 });
      await page.setContent(miseEnPage(f, s.titre, brut, serveur.url + "polices/polices.css"));
      await chargerPolices(page);
      await page.waitForTimeout(200);
      const fichier = path.join(SORTIE, f.nom, s.id + ".png");
      await page.screenshot({ path: fichier });
      console.log(path.relative(path.join(__dirname, ".."), fichier), f.w + "×" + f.h);
      await page.close(); await ctx.close();
    }
  }
  // bannière Google Play (1024 × 500, obligatoire) : le plateau vivant de l'accueil et le nom
  {
    const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(serveur.url + "index.html?capture");
    await p.waitForTimeout(2600);
    await p.addStyleTag({ content: "#ciel{display:none}html,body,#app{background:transparent!important}" });
    await p.waitForTimeout(100);
    const logo = await p.locator("#logo").screenshot({ omitBackground: true });
    await ctx.close();
    const page = await b.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${serveur.url}polices/polices.css"><style>
      html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:radial-gradient(70% 90% at 25% 30%,#2a1f5c 0%,#07070c 75%);}
      img{position:absolute;left:40px;top:25px;width:450px;height:450px}
      div{position:absolute;left:510px;right:40px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px}
      b{font:800 56px/1 Unbounded,sans-serif;letter-spacing:.04em;white-space:nowrap;background:linear-gradient(100deg,#fff,#d9ceff 40%,#a58bff);-webkit-background-clip:text;background-clip:text;color:transparent}
      i{font:italic 400 30px/1.3 "STIX Two Text",serif;color:#c9c6dc}
    </style></head><body><img src="data:image/png;base64,${logo.toString("base64")}"><div><b>ORBICUBE</b><i>le cube 3×3,<br>cercle par cercle</i></div></body></html>`);
    await chargerPolices(page);
    await page.waitForTimeout(200);
    const fichier = path.join(SORTIE, "banniere-google-play.png");
    await page.screenshot({ path: fichier });
    console.log(path.relative(path.join(__dirname, ".."), fichier), "1024×500");
  }
  await b.close(); serveur.fermer();
})();
