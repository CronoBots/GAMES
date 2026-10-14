// Un faux serveur du classement, en mémoire, pour le parcours de test (outils/tester.js) : mêmes actions et mêmes
// réponses que la vraie fonction (serveur/fonction/index.ts), avec le même moteur et le même filtre de pseudos.
// repondre(corps) rend { statut, json }.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

module.exports = function classementEssai() {
  const ctx = {};
  vm.createContext(ctx);
  for (const f of ["moteur.js", "filtre.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "serveur", "fonction", f), "utf8"), ctx);
  const { Moteur, Filtre } = ctx;
  const joueurs = new Map(), scores = new Map(), signal = new Map();
  const h = (t) => crypto.createHash("sha256").update(t).digest("hex");
  const norm = (c) => String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^ORBI/, "");
  const pris = (p, sauf) => [...joueurs.values()].some((j) => j.id !== sauf && j.pseudo.toLowerCase() === p.toLowerCase());
  const libre = () => { let p; do p = "Player" + (1000 + Math.floor(Math.random() * 9000)); while (pris(p)); return p; };
  const r = (json, statut = 200) => ({ statut, json });
  const pub = (j) => ({ pid: j.id, pseudo: j.pseudo, niveau: j.rang, mecene: j.mecene });
  // des joueurs déjà là, pour que la liste ait de quoi montrer
  for (let i = 0; i < 6; i++) {
    const id = crypto.randomUUID();
    joueurs.set(id, { id, pseudo: ["Astra", "Nova_7", "Kepler", "Lune", "Orion.B", "Vega"][i], code: "", jeton: "", rang: 30 - i * 4, xp: 9000 - i * 1200,
      etoiles: 150 - i * 15, etoiles_temps: 120 - i * 12, voies: Math.max(0, 5 - i), sansfin: 14 - i, mecene: i === 1 });
  }
  function moi(c) { const j = joueurs.get(c.id); return j && j.jeton === h(String(c.jeton || "")) ? j : null; }
  function repondre(c) {
    if (!c || typeof c !== "object") return r({ erreur: "json" }, 400);
    switch (c.a) {
      case "inscrire": {
        const id = crypto.randomUUID(), code = "ORBI-" + crypto.randomBytes(6).toString("hex").toUpperCase().replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3"), jeton = crypto.randomBytes(20).toString("hex");
        const pseudo = /^Player\d{4,8}$/.test(String(c.pseudo)) && !pris(String(c.pseudo)) ? String(c.pseudo) : libre();
        joueurs.set(id, { id, pseudo, code: h(norm(code)), jeton: h(jeton), rang: 1, xp: 0, etoiles: 0, etoiles_temps: 0, voies: 0, sansfin: 0, mecene: false });
        return r({ id, jeton, code, pseudo });
      }
      case "recuperer": {
        const j = [...joueurs.values()].find((x) => x.code && x.code === h(norm(c.code)));
        if (!j) return r({ erreur: "code" }, 404);
        const jeton = crypto.randomBytes(20).toString("hex"); j.jeton = h(jeton);
        return r({ id: j.id, jeton, pseudo: j.pseudo, sauvegarde: j.sauvegarde || null });
      }
      case "classement": {
        const j = moi(c), t = String(c.tableau);
        if (t === "jour" || t === "semaine") {
          const k = t + ":" + c.cle, l = [...scores.values()].filter((s) => s.t === k).sort((a, b) => a.coups - b.coups || a.temps - b.temps);
          const liste = l.slice(0, 50).map((s, i) => ({ ...pub(joueurs.get(s.j)), place: i + 1, valeur: s.coups, temps: s.temps }));
          const i = j ? l.findIndex((s) => s.j === j.id) : -1;
          return r({ liste, moi: i >= 0 ? { place: i + 1, valeur: l[i].coups, temps: l[i].temps } : null, total: l.length });
        }
        const v = { rang: (x) => x.xp, etoiles: (x) => x.etoiles + x.etoiles_temps, sansfin: (x) => x.sansfin }[t];
        if (!v) return r({ erreur: "tableau" }, 400);
        const l = [...joueurs.values()].filter((x) => v(x) > 0).sort((a, b) => v(b) - v(a)), aff = (x) => t === "rang" ? x.rang : v(x);
        const i = j ? l.indexOf(j) : -1;
        return r({ liste: l.slice(0, 50).map((x, k) => ({ ...pub(x), place: k + 1, valeur: aff(x) })), moi: i >= 0 ? { place: i + 1, valeur: aff(j) } : null, total: l.length });
      }
      case "profil": {
        const j = joueurs.get(c.pid);
        if (!j) return r({ erreur: "absent" }, 404);
        return r({ ...pub(j), etoiles: j.etoiles, etoilesT: j.etoiles_temps, voies: j.voies, sansfin: j.sansfin,
          scores: [...scores.values()].filter((s) => s.j === j.id).map((s) => ({ tableau: s.t, coups: s.coups, temps_ms: s.temps })) });
      }
    }
    const j = moi(c);
    if (!j) return r({ erreur: "ailleurs" }, 401);
    switch (c.a) {
      case "pseudo": {
        const v = Filtre.valide(c.nom);
        if (!v.ok) return r({ erreur: v.erreur }, 400);
        if (pris(v.pseudo, j.id)) return r({ erreur: "pris" }, 409);
        j.pseudo = v.pseudo; return r({ pseudo: v.pseudo });
      }
      case "stats": Object.assign(j, { rang: c.rang, xp: c.xp, etoiles: c.etoiles, etoiles_temps: c.etoilesT, voies: c.voies, sansfin: c.sansfin, mecene: !!c.mecene }); return r({ ok: true });
      case "score": {
        const n = Moteur.verifier(String(c.tableau), String(c.cle), c.coups);
        if (n < 1 || c.temps < n * 120) return r({ erreur: "refuse" }, 422);
        const k = j.id + "|" + c.tableau + ":" + c.cle, av = scores.get(k);
        if (!av || n < av.coups || (n === av.coups && c.temps < av.temps)) scores.set(k, { j: j.id, t: c.tableau + ":" + c.cle, coups: n, temps: c.temps });
        return r({ ok: true, coups: n });
      }
      case "signaler": {
        const s = signal.get(c.pid) || new Set(); s.add(j.id); signal.set(c.pid, s);
        if (s.size >= 3 && joueurs.get(c.pid)) { joueurs.get(c.pid).pseudo = libre(); signal.delete(c.pid); }
        return r({ ok: true });
      }
      case "sauver": j.sauvegarde = c.sauvegarde; return r({ ok: true });
      case "supprimer": joueurs.delete(j.id); for (const [k, s] of scores) if (s.j === j.id) scores.delete(k); return r({ ok: true });
    }
    return r({ erreur: "action" }, 400);
  }
  return { repondre, joueurs, scores };
};
