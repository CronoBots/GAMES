// Filtre des pseudos (Apple l'exige pour un texte visible par les autres joueurs) : mots grossiers, insultes et
// haine dans les cinq langues du jeu, cherchés après avoir retiré accents, espaces et chiffres déguisés (« c0nn4rd »).
// Le signalement par les joueurs rattrape ce qu'il laisse passer. Pose globalThis.Filtre.
(function () {
  var MOTS = [
    // français
    "connard", "connasse", "conasse", "salope", "salaud", "pute", "putain", "encule", "enculer", "batard", "bite", "couille",
    "chatte", "nique", "niquer", "ntm", "fdp", "pd", "pede", "tapette", "gouine", "negro", "negre", "bougnoul", "youpin",
    "nazi", "hitler", "pedophile", "pedo", "viol", "violer", "merde", "abruti", "debile", "mongol", "trisomique",
    // anglais
    "fuck", "fuk", "shit", "bitch", "cunt", "dick", "cock", "pussy", "whore", "slut", "nigger", "nigga", "fag", "faggot",
    "retard", "rape", "rapist", "asshole", "bastard", "wank", "twat", "porn", "sex", "kkk",
    // néerlandais
    "kut", "lul", "hoer", "klootzak", "kanker", "tering", "mongool", "flikker", "neuken",
    // allemand
    "scheisse", "scheiss", "arschloch", "fotze", "hure", "wichser", "schwuchtel", "ficken", "missgeburt", "spast",
    // espagnol
    "puta", "puto", "mierda", "cabron", "pendejo", "gilipollas", "coño", "cono", "joder", "maricon", "zorra", "polla", "verga",
  ];
  // mots trop courts pour être cherchés au milieu d'un autre (« pd » dans « updater ») : seulement le pseudo entier ou un mot entier
  var COURTS = { pd: 1, ntm: 1, fdp: 1, kut: 1, lul: 1, sex: 1, kkk: 1, pute: 1, bite: 1, viol: 1, fuk: 1, cono: 1, puta: 1, puto: 1, pede: 1, pedo: 1, hure: 1, dick: 1, cock: 1, fag: 1, rape: 1, porn: 1, nazi: 1, polla: 1, tering: 1, verga: 1 };
  function normal(t) {
    return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s");
  }
  function grossier(pseudo) {
    var mots = normal(pseudo).split(/[^a-zñ]+/).filter(Boolean), colle = mots.join("");
    return MOTS.some(function (m) { m = normal(m); return COURTS[m] ? mots.indexOf(m) >= 0 || colle === m : colle.indexOf(m) >= 0; });
  }
  // lettres latines (accents compris ; NFKC ramène les lettres pleine chasse et les ligatures, et les alphabets
  // qui imitent le latin, cyrillique ou grec, sont refusés : « аdmin » avec un а cyrillique passait le filtre), chiffres, espace, point, tiret, souligné ; 3 à 16 signes ; ni « Player » suivi de chiffres
  // (réservé aux pseudos donnés par le jeu), ni « Orbicube » ou « CronoBots » (on ne se fait pas passer pour le jeu)
  function valide(pseudo) {
    var p = String(pseudo || "").normalize("NFKC").trim().replace(/\s+/g, " ");
    if (p.length < 3 || p.length > 16) return { ok: false, erreur: "longueur" };
    if (!/^[\p{Script=Latin}0-9 ._-]+$/u.test(p)) return { ok: false, erreur: "signes" };
    if (/^player\s*\d+$/i.test(p) || /orbicube|cronobots|admin|moderat/i.test(normal(p))) return { ok: false, erreur: "reserve" };
    if (grossier(p)) return { ok: false, erreur: "grossier" };
    return { ok: true, pseudo: p };
  }
  globalThis.Filtre = { valide: valide, grossier: grossier };
})();
