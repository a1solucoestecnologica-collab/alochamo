import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4317);
const defaultStoreSlug = process.env.CHAMO_STORE_SLUG || "frango-galactico";
const chamoEngineUrl = (process.env.CHAMO_ENGINE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

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
    return path.join(root, "pages", "catalogo.html");
  }

  const storeStaticMatch = cleanPath.match(/^loja\/[\w-]+\/(assets\/.+|__l5e\/.+|favicon\.(?:ico|png))$/);
  if (storeStaticMatch) {
    const storeAsset = path.normalize(path.join(root, storeStaticMatch[1]));
    if (storeAsset.startsWith(root)) {
      return storeAsset;
    }
  }

  const storeHomeMatch = cleanPath.match(/^loja\/([\w-]+)$/);
  if (storeHomeMatch) {
    return path.join(root, "index.html");
  }

  const storeCatalogMatch = cleanPath.match(/^loja\/([\w-]+)\/catalogo$/);
  if (storeCatalogMatch) {
    return path.join(root, "pages", "catalogo.html");
  }

  const storeProductMatch = cleanPath.match(/^loja\/([\w-]+)\/produto\/([\w-]+)$/);
  if (storeProductMatch) {
    return path.join(root, "pages", "produto-p1.html");
  }

  const productMatch = cleanPath.match(/^produto\/(p\d+)$/);
  if (productMatch) {
    const productPage = path.join(root, "pages", `produto-${productMatch[1]}.html`);
    if (existsSync(productPage)) {
      return productPage;
    }
  }

  if (cleanPath.match(/^produto\/[\w-]+$/)) {
    return path.join(root, "pages", "produto-p1.html");
  }

  return path.join(root, "index.html");
}

function stripLegacyAppRuntime(html) {
  return html
    .replace(/<script class="\$tsr"[\s\S]*?<\/script>/g, "")
    .replace(/<script type="module"[^>]*src="\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, "")
    .replace(/<link rel="modulepreload" href="\/assets\/[^"]+\.js"\/?>/g, "");
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
    } catch (error) {
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
    } catch (error) {
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
      const html = stripLegacyAppRuntime(data.toString("utf8"));
      res.writeHead(200, {
        "Content-Type": types[ext],
        "Cache-Control": "no-store",
      });
      res.end(html);
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
  console.log(`Frango Galactico rodando em http://127.0.0.1:${port}`);
});
