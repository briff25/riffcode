// Serves out/ the way Apache on Pair will: folder/index.html, then 404.html.
//   npm run build && node scripts/serve-out.mjs [port]
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const PORT = Number(process.argv[2] ?? 8791);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const file = path.join(ROOT, clean);
  if (!file.startsWith(ROOT)) return null;
  try {
    const s = await stat(file);
    return s.isDirectory() ? path.join(file, "index.html") : file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  let file = await resolve(req.url ?? "/");
  let status = 200;
  try {
    if (!file) throw new Error("missing");
    let body = await readFile(file);
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    const headers = { "Content-Type": type };
    // Mirror Apache mod_deflate on Pair for text types.
    if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers["accept-encoding"] ?? "")) {
      body = gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    res.writeHead(status, headers);
    res.end(body);
  } catch {
    status = 404;
    file = path.join(ROOT, "404.html");
    res.writeHead(status, { "Content-Type": TYPES[".html"] });
    res.end(await readFile(file).catch(() => "Not found"));
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Serving out/ at http://127.0.0.1:${PORT}`));
