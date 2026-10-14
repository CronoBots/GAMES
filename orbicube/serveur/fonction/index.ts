// La fonction « orbicube » (Supabase Edge Function, Deno) : tout le classement passe par elle.
// Le jeu l'appelle en POST avec { a: action, id, jeton, ... }. Pas de compte : un identifiant tiré au hasard et un jeton
// propre au téléphone ; le code de récupération rend le profil sur un autre téléphone (et détache l'ancien).
// Les scores des défis ne sont pas crus sur parole : la fonction rejoue les coups sur le mélange du défi.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import "./moteur.js";
import "./filtre.js";

// deno-lint-ignore no-explicit-any
const G = globalThis as any;
const Moteur = G.Moteur, Filtre = G.Filtre;
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const ENTETES = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const rendre = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });
const refus = (erreur: string, statut = 400) => rendre({ erreur }, statut);

async function empreinte(t: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hasard(n: number, alphabet: string) {
  const o = crypto.getRandomValues(new Uint8Array(n));
  return [...o].map((b) => alphabet[b % alphabet.length]).join("");
}
// le code : 12 signes sans les confusions (0/O, 1/I/L), soit 60 bits ; « ORBI-7KQ2-M9XD-4TPA »
const SIGNES = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const nouveauCode = () => { const c = hasard(12, SIGNES); return "ORBI-" + c.slice(0, 4) + "-" + c.slice(4, 8) + "-" + c.slice(8); };
const normCode = (c: string) => String(c || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^ORBI/, "");
const nouveauJeton = () => hasard(40, "0123456789abcdefghijklmnopqrstuvwxyz");
const entier = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

// un pseudo « Player4821 » libre (5 chiffres, puis 6, si les 4 sont pris)
async function pseudoLibre() {
  for (let i = 0; i < 12; i++) {
    const p = "Player" + hasard(4 + Math.floor(i / 4), "0123456789");
    const { count } = await db.from("joueurs").select("id", { count: "exact", head: true }).ilike("pseudo", p);
    if (!count) return p;
  }
  return "Player" + hasard(8, "0123456789");
}

// le joueur qui appelle : son identifiant et le jeton de CE téléphone ; sinon le profil est passé ailleurs (ou supprimé)
async function moi(c: { id?: string; jeton?: string }) {
  if (!c.id || !c.jeton || !/^[0-9a-f-]{36}$/.test(c.id)) return null;
  const { data } = await db.from("joueurs").select("*").eq("id", c.id).maybeSingle();
  if (!data || data.jeton_hash !== await empreinte(c.jeton)) return null;
  return data;
}

// les tableaux des défis : « jour:20261014 » (la veille, le jour et le lendemain, pour les fuseaux) ou « semaine:2026-S42 »
function cleJour(d: Date) { return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0"); }
function cleSemaine(t: number) {
  const d = new Date(t); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7);
  const a = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return d.getUTCFullYear() + "-S" + String(1 + Math.round(((+d - +a) / 864e5 - 3 + (a.getUTCDay() + 6) % 7) / 7)).padStart(2, "0");
}
function cleValide(tableau: string, cle: string) {
  const n = Date.now(), j = 864e5;
  if (tableau === "jour") return [n - j, n, n + j].map((t) => cleJour(new Date(t))).includes(cle);
  if (tableau === "semaine") return [n - 7 * j, n, n + 7 * j].map(cleSemaine).includes(cle);
  return false;
}

const PUBLIC = "id,pseudo,rang,etoiles,etoiles_temps,voies,sansfin,mecene";
const ligne = (j: Record<string, unknown>) => ({ pid: j.id, pseudo: j.pseudo, niveau: j.rang, mecene: j.mecene });

async function classement(tableau: string, cle: string, j: Record<string, unknown> | null) {
  if (tableau === "jour" || tableau === "semaine") {
    if (!/^[0-9S-]{6,10}$/.test(cle)) return refus("cle");
    const t = tableau + ":" + cle;
    const { data } = await db.from("scores").select("coups,temps_ms,joueurs(" + PUBLIC + ")").eq("tableau", t)
      .order("coups").order("temps_ms").order("quand").limit(50);
    // deno-lint-ignore no-explicit-any
    const liste = (data || []).map((s: any, i: number) => ({ ...ligne(s.joueurs), place: i + 1, valeur: s.coups, temps: s.temps_ms }));
    let mien = null;
    if (j) {
      const { data: s } = await db.from("scores").select("coups,temps_ms").eq("tableau", t).eq("joueur", j.id).maybeSingle();
      if (s) {
        const { count } = await db.from("scores").select("joueur", { count: "exact", head: true }).eq("tableau", t)
          .or(`coups.lt.${s.coups},and(coups.eq.${s.coups},temps_ms.lt.${s.temps_ms})`);
        mien = { place: (count || 0) + 1, valeur: s.coups, temps: s.temps_ms };
      }
    }
    const { count: total } = await db.from("scores").select("joueur", { count: "exact", head: true }).eq("tableau", t);
    return rendre({ liste, moi: mien, total: total || 0 });
  }
  const col = ({ rang: "xp", etoiles: "etoiles_total", sansfin: "sansfin" } as Record<string, string>)[tableau];
  if (!col) return refus("tableau");
  const { data } = await db.from("joueurs").select(PUBLIC + "," + col).gt(col, 0).order(col, { ascending: false }).order("cree_le").limit(50);
  // deno-lint-ignore no-explicit-any
  const val = (x: any) => tableau === "rang" ? x.rang : x[col];
  // deno-lint-ignore no-explicit-any
  const liste = (data || []).map((x: any, i: number) => ({ ...ligne(x), place: i + 1, valeur: val(x) }));
  let mien = null;
  if (j && Number(j[col]) > 0) {
    const { count } = await db.from("joueurs").select("id", { count: "exact", head: true }).gt(col, j[col] as number);
    mien = { place: (count || 0) + 1, valeur: val(j) };
  }
  const { count: total } = await db.from("joueurs").select("id", { count: "exact", head: true }).gt(col, 0);
  return rendre({ liste, moi: mien, total: total || 0 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: ENTETES });
  if (req.method !== "POST") return refus("methode", 405);
  // deno-lint-ignore no-explicit-any
  let c: any;
  try { c = await req.json(); } catch { return refus("json"); }
  if (!c || typeof c !== "object") return refus("json");
  try {
    switch (c.a) {
      // un nouveau joueur : identifiant, jeton du téléphone, code de récupération et pseudo « Player… »
      case "inscrire": {
        const code = nouveauCode(), jeton = nouveauJeton();
        // le pseudo que le téléphone affichait déjà (« Player4821 »), s'il est libre
        let pseudo = /^Player\d{4,8}$/.test(String(c.pseudo)) ? String(c.pseudo) : "";
        if (pseudo) { const { count } = await db.from("joueurs").select("id", { count: "exact", head: true }).ilike("pseudo", pseudo); if (count) pseudo = ""; }
        if (!pseudo) pseudo = await pseudoLibre();
        const { data, error } = await db.from("joueurs").insert({ pseudo, code_hash: await empreinte(normCode(code)), jeton_hash: await empreinte(jeton) }).select("id").single();
        if (error) return refus("serveur", 500);
        return rendre({ id: data.id, jeton, code, pseudo });
      }
      // le code de récupération sur un autre téléphone : nouveau jeton, l'ancien téléphone est détaché
      case "recuperer": {
        const n = normCode(c.code);
        if (n.length !== 12) return refus("code");
        const { data: j } = await db.from("joueurs").select("id,pseudo,sauvegarde").eq("code_hash", await empreinte(n)).maybeSingle();
        if (!j) return refus("code", 404);
        const jeton = nouveauJeton();
        await db.from("joueurs").update({ jeton_hash: await empreinte(jeton), vu_le: new Date().toISOString() }).eq("id", j.id);
        return rendre({ id: j.id, jeton, pseudo: j.pseudo, sauvegarde: j.sauvegarde || null });
      }
      case "classement": {
        const j = await moi(c);
        return await classement(String(c.tableau || ""), String(c.cle || ""), j);
      }
      // la fiche publique d'un joueur : ce que les autres voient (profil limité, décision du client du 14/10/2026)
      case "profil": {
        if (!/^[0-9a-f-]{36}$/.test(String(c.pid))) return refus("pid");
        const { data } = await db.from("joueurs").select(PUBLIC).eq("id", c.pid).maybeSingle();
        if (!data) return refus("absent", 404);
        const { data: sc } = await db.from("scores").select("tableau,coups,temps_ms").eq("joueur", c.pid).order("quand", { ascending: false }).limit(20);
        return rendre({ ...ligne(data), etoiles: data.etoiles, etoilesT: data.etoiles_temps, voies: data.voies, sansfin: data.sansfin, scores: sc || [] });
      }
    }
    // tout le reste demande d'être ce joueur, sur ce téléphone
    const j = await moi(c);
    if (!j) return refus("ailleurs", 401);
    await db.from("joueurs").update({ vu_le: new Date().toISOString() }).eq("id", j.id);
    switch (c.a) {
      case "moi": return rendre({ pseudo: j.pseudo, code: null });
      case "pseudo": {
        const v = Filtre.valide(c.nom);
        if (!v.ok) return refus(v.erreur);
        if (v.pseudo.toLowerCase() === String(j.pseudo).toLowerCase()) {
          await db.from("joueurs").update({ pseudo: v.pseudo }).eq("id", j.id);
          return rendre({ pseudo: v.pseudo });
        }
        const { count } = await db.from("joueurs").select("id", { count: "exact", head: true }).ilike("pseudo", v.pseudo.replace(/[%_\\]/g, "\\$&"));
        if (count) return refus("pris", 409);
        const { error } = await db.from("joueurs").update({ pseudo: v.pseudo }).eq("id", j.id);
        if (error) return refus("pris", 409);
        await db.from("signalements").delete().eq("joueur", j.id);
        return rendre({ pseudo: v.pseudo });
      }
      // ce que le profil public montre : bornes larges, rien d'autre n'est gardé
      case "stats": {
        await db.from("joueurs").update({
          rang: Math.max(1, entier(c.rang, 999)), xp: entier(c.xp, 1e8), etoiles: entier(c.etoiles, 999), etoiles_temps: entier(c.etoilesT, 999),
          voies: entier(c.voies, 8), sansfin: entier(c.sansfin, 999), mecene: !!c.mecene,
        }).eq("id", j.id);
        return rendre({ ok: true });
      }
      // un défi réussi : les coups rejoués sur le mélange du défi ; on garde le meilleur (moins de coups, puis plus vite)
      case "score": {
        const tableau = String(c.tableau), cle = String(c.cle);
        if (!cleValide(tableau, cle)) return refus("cle");
        const n = Moteur.verifier(tableau, cle, c.coups);
        if (n < 1) return refus("refuse", 422);
        const temps = entier(c.temps, 864e5);
        if (temps < n * 120) return refus("refuse", 422);   // plus vite qu'un geste humain
        const t = tableau + ":" + cle;
        const { data: av } = await db.from("scores").select("coups,temps_ms").eq("joueur", j.id).eq("tableau", t).maybeSingle();
        if (!av || n < av.coups || (n === av.coups && temps < av.temps_ms))
          await db.from("scores").upsert({ joueur: j.id, tableau: t, coups: n, temps_ms: temps, quand: new Date().toISOString() });
        return rendre({ ok: true, coups: n });
      }
      case "signaler": {
        if (!/^[0-9a-f-]{36}$/.test(String(c.pid)) || c.pid === j.id) return refus("pid");
        await db.from("signalements").upsert({ joueur: c.pid, par: j.id });
        const { count } = await db.from("signalements").select("par", { count: "exact", head: true }).eq("joueur", c.pid);
        if ((count || 0) >= 3) {   // trois joueurs différents : le pseudo redevient « Player… »
          await db.from("joueurs").update({ pseudo: await pseudoLibre() }).eq("id", c.pid);
          await db.from("signalements").delete().eq("joueur", c.pid);
        }
        return rendre({ ok: true });
      }
      // la sauvegarde de la progression, rendue par le code de récupération (300 Ko au plus)
      case "sauver": {
        const s = JSON.stringify(c.sauvegarde || null);
        if (s.length > 300000) return refus("taille", 413);
        await db.from("joueurs").update({ sauvegarde: c.sauvegarde || null, sauvegarde_maj: new Date().toISOString() }).eq("id", j.id);
        return rendre({ ok: true });
      }
      // le joueur efface tout : profil, pseudo, scores, sauvegarde, signalements
      case "supprimer": {
        await db.from("joueurs").delete().eq("id", j.id);
        return rendre({ ok: true });
      }
    }
    return refus("action");
  } catch (_e) {
    return refus("serveur", 500);
  }
});
