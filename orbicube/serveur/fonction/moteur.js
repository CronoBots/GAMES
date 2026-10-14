// Le moteur du cube, recopié du jeu (www/index.html, sections 1 et 5) pour que le serveur rejoue les coups des défis.
// Sans import ni export : il pose globalThis.Moteur, lu par la fonction (Deno) et par le vérificateur (Node), qui
// contrôle qu'il donne les mêmes mélanges que le jeu. Changer l'un sans l'autre fait échouer `npm run verifier`.
(function () {
  function faceDe(n) { return n[0] > 0 ? 0 : n[0] < 0 ? 1 : n[1] > 0 ? 2 : n[1] < 0 ? 3 : n[2] > 0 ? 4 : 5; }
  var S = [], CLE = {};
  for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
    var p = [x, y, z];
    for (var a = 0; a < 3; a++) if (Math.abs(p[a]) === 1) { var n = [0, 0, 0]; n[a] = p[a]; CLE[p + "|" + n] = S.length; S.push({ p: p, n: n, a: a, s: p[a] }); }
  }
  function resoluCol() { return S.map(function (s) { return faceDe(s.n); }); }
  function rot90(v, a) { var x = v[0], y = v[1], z = v[2]; return a === 0 ? [x, -z, y] : a === 1 ? [z, y, -x] : [-y, x, z]; }
  var PERM = {};
  function perm(a, L, q) {
    var k = a + "," + L + "," + q; if (PERM[k]) return PERM[k]; var m = {};
    for (var i = 0; i < 54; i++) { var s = S[i]; if (s.p[a] !== L) continue; var pp = s.p, nn = s.n; for (var j = 0; j < (q > 0 ? 1 : 3); j++) { pp = rot90(pp, a); nn = rot90(nn, a); } m[i] = CLE[pp + "|" + nn]; }
    return PERM[k] = m;
  }
  function appliquer(col, mv) { var m = perm(mv.a, mv.L, mv.q), nc = col.slice(); for (var k in m) nc[m[k]] = col[+k]; return nc; }
  function estResolu(col) { var g = {}; for (var i = 0; i < 54; i++) { var k = S[i].a + "," + S[i].s; if (g[k] === undefined) g[k] = col[i]; else if (g[k] !== col[i]) return false; } return true; }
  var MV = { R: [0, 1, -1], M: [0, 0, 1], L: [0, -1, 1], U: [1, 1, -1], E: [1, 0, 1], D: [1, -1, 1], F: [2, 1, -1], S: [2, 0, -1], B: [2, -1, 1] };
  var SIXFACES = ["U", "D", "L", "R", "F", "B"];
  function graine(str) {
    var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  function genererMelange(rnd, anneaux, n) {
    var out = []; for (var essai = 0; essai < 50; essai++) {
      out = []; var prec = null, axe = -1, vues = {}, col = resoluCol();
      for (var i = 0; i < n; i++) {
        var b, m, k = 0; do { b = anneaux[Math.floor(rnd() * anneaux.length)]; m = MV[b]; k++; } while (k < 200 && anneaux.length > 1 && (b === prec || (m[0] === axe && vues[m[1]])));
        if (m[0] !== axe) { axe = m[0]; vues = {}; } vues[m[1]] = true; prec = b;
        var mv = { a: m[0], L: m[1], q: rnd() < .5 ? 1 : -1 }; out.push(mv); col = appliquer(col, mv);
      }
      if (!estResolu(col)) return out;
    } return out;
  }
  // les défis, comme jourDef() et semaineDef() du jeu
  function melangeDefi(tableau, cle) { return tableau === "jour" ? genererMelange(graine("jour-" + cle), SIXFACES, 8) : genererMelange(graine("semaine-" + cle), SIXFACES, 14); }
  // « U », « U′ » (ou U'), « U2 » : la notation que le jeu envoie (nomDe) ; null si un coup est illisible
  function lireCoup(t) {
    var m = /^([RMLUEDFSB])(2|′|')?$/.exec(t); if (!m) return null; var v = MV[m[1]];
    return { a: v[0], L: v[1], q: m[2] && m[2] !== "2" ? -v[2] : v[2], d: m[2] === "2" ? 2 : 1 };
  }
  // le cube du défi est-il résolu par ces coups ? Rend le nombre de coups (un demi-tour compte un), ou -1
  function verifier(tableau, cle, coups) {
    if (!Array.isArray(coups) || coups.length > 400) return -1;
    var col = resoluCol(); melangeDefi(tableau, cle).forEach(function (mv) { col = appliquer(col, mv); });
    for (var i = 0; i < coups.length; i++) { var mv = lireCoup(String(coups[i])); if (!mv) return -1; col = appliquer(col, mv); if (mv.d === 2) col = appliquer(col, mv); }
    return estResolu(col) ? coups.length : -1;
  }
  globalThis.Moteur = { melangeDefi: melangeDefi, verifier: verifier, lireCoup: lireCoup };
})();
