import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
const defaultStoreSlug = process.env.CHAMO_STORE_SLUG || "rancho-figueira";
const chamoEngineUrl = (process.env.CHAMO_ENGINE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function productFile(productId) {
  const clean = String(productId || "").replace(/[^\w-]/g, "");
  const direct = path.join(root, `produto_${clean}.html`);
  if (existsSync(direct)) return direct;
  return path.join(root, "produto_picanha-na-chapa.html");
}

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const requested = path.normalize(path.join(root, cleanPath));

  if (!requested.startsWith(root)) {
    return path.join(root, "index.html");
  }

  if (existsSync(requested) && !urlPath.endsWith("/")) {
    return requested;
  }

  if (cleanPath === "catalogo") {
    return path.join(root, "catalogo.html");
  }

  const storeHomeMatch = cleanPath.match(/^loja\/([\w-]+)$/);
  if (storeHomeMatch) {
    return path.join(root, "index.html");
  }

  const storeCatalogMatch = cleanPath.match(/^loja\/([\w-]+)\/catalogo$/);
  if (storeCatalogMatch) {
    return path.join(root, "catalogo.html");
  }

  const storeProductMatch = cleanPath.match(/^loja\/([\w-]+)\/produto\/([\w-]+)$/);
  if (storeProductMatch) {
    return productFile(storeProductMatch[2]);
  }

  const productMatch = cleanPath.match(/^produto\/([\w-]+)$/);
  if (productMatch) {
    return productFile(productMatch[1]);
  }

  return path.join(root, "index.html");
}

function enhanceHtml(html) {
  const cleanHtml = html
    .replace(/<script defer src="\/~flock\.js"[\s\S]*?<\/script>/g, "")
    .replace(/<script[^>]+type="module"[^>]+src="\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, "");

  const config = `<style id="chamo-hide-external-badge">#lovable-badge{display:none!important}</style><script>window.CHAMO_STORE_CONFIG={slug:"${defaultStoreSlug}",endpoint:"/api/chamo/store?slug=${defaultStoreSlug}"};document.addEventListener("DOMContentLoaded",()=>document.getElementById("lovable-badge")?.remove());</script><script defer src="/assets/chamo-store.js?v=rancho-layout-2"></script>`;
  return cleanHtml.includes("/assets/chamo-store.js")
    ? cleanHtml
    : cleanHtml.replace("</body>", `${config}</body>`);
}

createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  if (requestUrl.pathname === "/api/chamo/stores") {
    try {
      const response = await fetch(`${chamoEngineUrl}/api/public/stores`);
      const body = await response.text();

      res.writeHead(response.status, {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        error: "CHAMO_ENGINE_UNAVAILABLE",
        message: "Nao foi possivel conectar ao motor do Chamo",
      }));
    }
    return;
  }

  if (requestUrl.pathname === "/api/chamo/store") {
    const slug = requestUrl.searchParams.get("slug") || defaultStoreSlug;

    try {
      const response = await fetch(`${chamoEngineUrl}/api/public/stores/${encodeURIComponent(slug)}`);
      const body = await response.text();

      res.writeHead(response.status, {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        error: "CHAMO_ENGINE_UNAVAILABLE",
        message: "Nao foi possivel conectar ao motor do Chamo",
      }));
    }
    return;
  }

  const file = resolveFile(req.url || "/");
  const ext = path.extname(file);

  try {
    const data = await readFile(file);
    if (ext === ".html") {
      res.writeHead(200, {
        "Content-Type": types[ext],
        "Cache-Control": "no-store",
      });
      res.end(enhanceHtml(data.toString("utf8")));
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".js" ? "no-store" : "public, max-age=300",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo nao encontrado");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Rancho Figueira rodando em http://127.0.0.1:${port}`);
});
