// Contrôles à lancer avant chaque commit :  npm run verifier   (code de retour 1 = faute)
// Chaque contrôle a été éprouvé en sabotant une copie : il doit pouvoir échouer.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RACINE = path.join(__dirname, "..");
const WWW = path.join(RACINE, "www");
let fautes = 0;
const ok = (m) => console.log("  ✓ " + m);
const faute = (m) => { console.log("  ✗ " + m); fautes++; };

const html = fs.readFileSync(path.join(WWW, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const jeu = scripts[scripts.length - 1];

console.log("Syntaxe");
try { new vm.Script(jeu, { filename: "index.html" }); ok("script du jeu"); } catch (e) { faute("script du jeu : " + e.message); }
try { new vm.Script(fs.readFileSync(path.join(WWW, "config.js"), "utf8")); ok("config.js"); } catch (e) { faute("config.js : " + e.message); }

console.log("Configuration");
const fen = {};
vm.runInNewContext(fs.readFileSync(path.join(WWW, "config.js"), "utf8"), { window: fen });
const CFG = fen.ORBICUBE_CONFIG || {};
["essai", "complet"].includes(CFG.modele) ? ok("modèle « " + CFG.modele + " »") : faute("modele doit valoir essai ou complet");
CFG.mondesGratuits >= 1 && CFG.mondesGratuits <= 8 ? ok(CFG.mondesGratuits + " monde(s) gratuit(s)") : faute("mondesGratuits hors de 1 à 8");
const pkg = require(path.join(RACINE, "package.json"));
CFG.version === pkg.version ? ok("version " + pkg.version + " identique dans config.js et package.json") : faute("version différente : config.js " + CFG.version + ", package.json " + pkg.version);

console.log("Marque déposée");
// « Rubik's Cube » est une marque : elle ne doit apparaître ni dans le jeu ni dans les textes des stores
const aRelire = [];
(function parcourir(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) parcourir(p);
    else if (/\.(html|js|json|webmanifest|txt)$/.test(f)) aRelire.push(p);
  }
})(WWW);
aRelire.push(...["fiche-store.md"].map((f) => path.join(RACINE, "docs", f)).filter(fs.existsSync));
const marque = aRelire.filter((p) => /rubik/i.test(fs.readFileSync(p, "utf8")));
marque.length ? marque.forEach((p) => faute("« Rubik » dans " + path.relative(RACINE, p))) : ok(aRelire.length + " fichiers sans la marque");

console.log("Secrets");
// seules les clés PUBLIQUES du SDK RevenueCat (appl_…, goog_…) ont leur place dans l'app ; une clé secrète sk_ jamais
const fuites = [];
(function parcourir(d) {
  for (const f of fs.readdirSync(d)) {
    if (f === "node_modules" || f.startsWith(".git")) continue;
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) parcourir(p);
    else if (/\.(html|js|json|md|ts|yml)$/.test(f) && /\bsk_[A-Za-z0-9]{16,}/.test(fs.readFileSync(p, "utf8"))) fuites.push(p);
  }
})(RACINE);
fuites.length ? fuites.forEach((p) => faute("clé secrète RevenueCat dans " + path.relative(RACINE, p))) : ok("aucune clé secrète");

console.log("Fichiers hors ligne (sw.js)");
const sw = fs.readFileSync(path.join(WWW, "sw.js"), "utf8");
const liste = vm.runInNewContext(sw.match(/var FICHIERS = (\[[\s\S]*?\]);/)[1]);
const manquants = liste.filter((f) => f !== "./" && !fs.existsSync(path.join(WWW, f)));
manquants.length ? manquants.forEach((f) => faute("sw.js met en cache un fichier absent : " + f)) : ok(liste.length + " fichiers présents");
const polices = fs.readdirSync(path.join(WWW, "polices")).filter((f) => f.endsWith(".woff2"));
const oublies = polices.filter((f) => !liste.includes("polices/" + f));
oublies.length ? oublies.forEach((f) => faute("police absente du cache hors ligne : " + f)) : ok("toutes les polices en cache");
// chaque url() de la feuille des polices doit mener à un fichier, relativement à la feuille elle-même
const css = fs.readFileSync(path.join(WWW, "polices", "polices.css"), "utf8");
const casses = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]).filter((u) => !fs.existsSync(path.join(WWW, "polices", u)));
casses.length ? casses.forEach((u) => faute("polices.css pointe vers un fichier absent : " + u)) : ok("polices.css : chaque url() mène à son fichier");
fs.existsSync(path.join(WWW, "natif.js")) ? ok("natif.js construit") : faute("www/natif.js manque : npm run construire");
if (fs.existsSync(path.join(WWW, "natif.js")) && fs.statSync(path.join(RACINE, "src", "natif.js")).mtimeMs > fs.statSync(path.join(WWW, "natif.js")).mtimeMs + 1000)
  faute("src/natif.js est plus récent que www/natif.js : npm run construire");

console.log("Langues");
{
  const fenL = {};
  vm.runInNewContext(fs.readFileSync(path.join(WWW, "langues.js"), "utf8"), { window: fenL });
  const L = fenL.ORBICUBE_LANGUES, n = L.codes.length + 1, vues = new Set();
  let soucis = 0;
  for (const ligne of L.table) {
    const fr = ligne[0];
    if (ligne.length !== n || ligne.some((x) => typeof x !== "string" || !x.trim())) { faute("ligne incomplète : « " + fr + " »"); soucis++; continue; }
    if (vues.has(fr)) { faute("phrase en double : « " + fr + " »"); soucis++; }
    vues.add(fr);
    const marques = (x) => (x.match(/\{\d\}/g) || []).sort().join("");
    ligne.slice(1).forEach((x, i) => { if (marques(x) !== marques(fr)) { faute(L.codes[i] + " : variables différentes dans « " + fr + " »"); soucis++; } });
  }
  const aide = [...html.matchAll(/data-html="([^"]+)">([\s\S]*?)<\/p>/g)];
  for (const [, cle, fr] of aide) {
    const b = L.blocs[cle];
    if (!b || b.length !== L.codes.length) { faute("bloc d'aide « " + cle + " » sans ses traductions"); soucis++; continue; }
    const compte = (x) => (x.match(/<span class="m">/g) || []).length + "/" + (x.match(/<b>/g) || []).length;
    b.forEach((x, i) => { if (compte(x) !== compte(fr)) { faute(L.codes[i] + " : mise en forme différente dans le bloc « " + cle + " »"); soucis++; } });
  }
  if (!soucis) ok(L.table.length + " phrases et " + aide.length + " blocs d'aide en " + n + " langues (" + Object.keys(L.noms).join(", ") + ")");
}

console.log("Succès des stores");
{
  // seulement la liste SUCCES : d'autres tables du jeu (les ciels) ont la même forme
  const debutSucces = jeu.indexOf("var SUCCES=["), listeSucces = jeu.slice(debutSucces, jeu.indexOf("function idStore", debutSucces));
  const ids = [...listeSucces.matchAll(/\{id:"([a-z0-9]+)",nom:/g)].map((m) => m[1]);
  if (debutSucces < 0 || !ids.length) faute("liste des succès introuvable");
  const st = CFG.succesStores || {};
  let soucis = 0;
  for (const pf of ["ios", "android"]) {
    const m = st[pf] || {};
    const absents = ids.filter((i) => !(i in m)), en_trop = Object.keys(m).filter((i) => !ids.includes(i));
    if (absents.length || en_trop.length) { faute(pf + " : succès sans correspondance " + absents.concat(en_trop).join(", ")); soucis++; }
    const remplis = Object.values(m).filter(Boolean);
    if (new Set(remplis).size !== remplis.length) { faute(pf + " : deux succès partagent un identifiant"); soucis++; }
    if (pf === "ios" && remplis.some((v) => !/^[A-Za-z0-9._]+$/.test(v))) { faute("ios : identifiant Game Center invalide (lettres, chiffres, point, soulignement)"); soucis++; }
  }
  if (!soucis) ok(ids.length + " succès, chacun avec sa correspondance iOS et Android");
}

console.log("Classements des stores");
{
  const m = jeu.match(/var CLASSEMENTS=\[([^\]]*)\]/), ids = m ? [...m[1].matchAll(/"([a-z0-9]+)"/g)].map((x) => x[1]) : [];
  if (!ids.length) faute("liste des classements introuvable");
  const st = CFG.classementsStores || {};
  let soucis = 0;
  for (const pf of ["ios", "android"]) {
    const c = st[pf] || {};
    const ecart = ids.filter((i) => !(i in c)).concat(Object.keys(c).filter((i) => !ids.includes(i)));
    if (ecart.length) { faute(pf + " : classements sans correspondance " + ecart.join(", ")); soucis++; }
    const remplis = Object.values(c).filter(Boolean);
    if (new Set(remplis).size !== remplis.length) { faute(pf + " : deux classements partagent un identifiant"); soucis++; }
    if (pf === "ios" && remplis.some((v) => !/^[A-Za-z0-9._]+$/.test(v))) { faute("ios : identifiant de classement invalide"); soucis++; }
  }
  if (!soucis) ok(ids.length + " classements, chacun avec sa correspondance iOS et Android");
}

console.log("Géométrie et niveaux");
// on rejoue le vrai code du jeu, découpé dans index.html, sans le recopier
const debut = jeu.indexOf("/* ========== 1.");
const fin = jeu.indexOf("/* ========== 3.");
const debN = jeu.indexOf("/* ========== 5.");
const finN = jeu.indexOf("/* ========== 6.");
if (debut < 0 || fin < 0 || debN < 0 || finN < 0) faute("découpe impossible : les intertitres de sections ont changé");
else {
  const ctx = { window: { matchMedia: () => ({ matches: false }) }, matchMedia: () => ({ matches: false }), console };
  vm.createContext(ctx);
  vm.runInContext(jeu.slice(debut, fin) + "\n" + jeu.slice(debN, finN) + "\nthis.__=({S,perm,delta,PAS,angle,CEN,MONDES,niveauDef,jourDef,genererMelange,appliquer,estResolu,resoluCol,TOUS});", ctx);
  const G = ctx.__;
  let tours = 0, pasOk = true, sensOk = true, arriveeOk = true;
  for (let a = 0; a < 3; a++) for (let L = -1; L <= 1; L++) for (const q of [1, -1]) {
    tours++;
    const d = G.delta(a, L, q), m = G.perm(a, L, q), signes = new Set();
    for (const k in m) {
      const i = +k, s = G.S[i];
      if (s.a === a) continue;
      signes.add(Math.sign(d[i]));
      const c = G.CEN[a], r = Math.hypot(s.xy[0] - c[0], s.xy[1] - c[1]), aa = G.angle(s.xy, c) + d[i];
      if (Math.hypot(c[0] + r * Math.cos(aa) - G.S[m[i]].xy[0], c[1] + r * Math.sin(aa) - G.S[m[i]].xy[1]) > 1e-9) arriveeOk = false;
    }
    if (signes.size !== 1) sensOk = false;
    if (Math.abs(G.PAS[a][L + 1] - Math.PI / 2) > 1e-9) pasOk = false;
  }
  sensOk ? ok(tours + " tours : toutes les pastilles d'un cercle tournent dans le même sens") : faute("une pastille tourne à contresens");
  arriveeOk ? ok("chaque pastille arrive exactement à sa place") : faute("une pastille n'arrive pas à sa place");
  pasOk ? ok("un quart de tour vaut π/2 sur les 9 cercles") : faute("PAS différent de π/2");
  // tous les niveaux : longueur annoncée, jamais résolus au départ, et identiques d'une ouverture à l'autre
  let niv = 0, mauvais = [];
  G.MONDES.forEach((M, w) => M.coups.forEach((n, i) => {
    niv++;
    const d1 = G.niveauDef(w, i), d2 = G.niveauDef(w, i);
    let col = G.resoluCol();
    d1.melange.forEach((mv) => { col = G.appliquer(col, mv); });
    if (d1.melange.length !== n || G.estResolu(col) || JSON.stringify(d1.melange) !== JSON.stringify(d2.melange)) mauvais.push(d1.id);
  }));
  mauvais.length ? faute("niveaux défectueux : " + mauvais.join(", ")) : ok(niv + " niveaux : bonne longueur, jamais résolus au départ, toujours les mêmes");
  // les 64 niveaux du chemin (les huit premiers de chaque monde) ne bougent plus : les joueurs y ont leurs étoiles
  let empreinte = "";
  for (let w = 0; w < 8; w++) for (let i = 0; i < 8; i++) { const d = G.niveauDef(w, i); empreinte += d.id + ":" + d.melange.map((m) => m.a + "," + m.L + "," + m.q).join(";") + "|"; }
  empreinte = require("crypto").createHash("sha256").update(empreinte).digest("hex").slice(0, 16);
  empreinte === "74fee1046c1c4b57" ? ok("les 64 niveaux du chemin sont inchangés") : faute("les 64 niveaux du chemin ont changé (empreinte " + empreinte + ")");
  // les neuf anneaux ne vont jamais dans un monde gratuit : ils restent l'avantage du jeu complet (le client, le 14/10/2026)
  const neufLibres = G.MONDES.map((M, w) => w < CFG.mondesGratuits && M.anneaux.length === 9 ? w + 1 : 0).filter(Boolean);
  neufLibres.length ? faute("monde gratuit à neuf anneaux : " + neufLibres.join(", ")) : ok("aucun monde gratuit à neuf anneaux");
  // une orbite de plus à chaque monde, de deux jusqu'aux neuf (le client, le 14/10/2026) : chaque monde garde celles du précédent
  const pas = G.MONDES.every((M, w) => M.anneaux.length === w + 2 && (w === 0 || G.MONDES[w - 1].anneaux.every((a) => M.anneaux.includes(a))));
  // une vraie progression (le client, le 14/10/2026) : le chemin ne raccourcit jamais, un seul niveau à un coup, et aucun
  // mélange ne se réduit (dans une suite de coups sur un même axe, une orbite ne revient pas : U D U′ vaudrait D)
  const reduits = [], plats = [];
  G.MONDES.forEach((M, w) => M.coups.forEach((n, i) => {
    let axe = -1, vues = new Set(), red = false;
    for (const m of G.niveauDef(w, i).melange) { if (m.a !== axe) { axe = m.a; vues = new Set(); } if (vues.has(m.L)) red = true; vues.add(m.L); }
    if (red) reduits.push(G.niveauDef(w, i).id);
    if (i > 0 && i < 8 && n < M.coups[i - 1]) plats.push(G.niveauDef(w, i).id);
  }));
  const unCoup = G.MONDES.reduce((t, M) => t + M.coups.filter((n) => n === 1).length, 0);
  !reduits.length && !plats.length && unCoup <= 1 ? ok("progression : aucun mélange réductible, le chemin ne raccourcit jamais, un seul niveau à un coup") : faute("progression : réductibles " + reduits.join(" ") + " ; plus courts que le précédent " + plats.join(" ") + " ; niveaux à un coup : " + unCoup);
  // les seuils d'étoiles des mondes : jamais toutes les étoiles du chemin d'avant, au plus les trois quarts (le client)
  const seuilsTrop = G.MONDES.map((M, w) => { const c = M.etoiles; return c && (c.jaunes || c.bleues) > 3 * 0.75 ? w + 1 : 0; }).filter(Boolean);
  seuilsTrop.length ? faute("seuil d'étoiles trop haut (plus des trois quarts) : monde " + seuilsTrop.join(", ")) : ok("seuils d'étoiles : au plus les trois quarts des étoiles du chemin d'avant");
  pas && G.MONDES[G.MONDES.length - 1].anneaux.length === 9 ? ok(G.MONDES.length + " mondes : une orbite de plus à chaque monde, jusqu'aux neuf") : faute("les mondes n'ajoutent pas une orbite à la fois jusqu'aux neuf");
}

console.log(fautes ? "\n" + fautes + " faute(s)." : "\nTout est en ordre.");
process.exit(fautes ? 1 : 0);
