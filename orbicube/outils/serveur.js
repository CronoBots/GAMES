// Petit serveur statique pour les outils : le jeu se teste en HTTP, comme sur le web et dans Capacitor.
const http = require("http");
const fs = require("fs");
const path = require("path");
const WWW = path.join(__dirname, "..", "www");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2",
  ".png": "image/png", ".webmanifest": "application/manifest+json" };
module.exports = function servir() {
  const s = http.createServer((req, res) => {
    const f = path.join(WWW, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Access-Control-Allow-Origin": "*" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => s.listen(0, "127.0.0.1", () => r({ url: "http://127.0.0.1:" + s.address().port + "/", fermer: () => s.close() })));
};
