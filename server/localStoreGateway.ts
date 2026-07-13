import type { Express, Request, Response } from "express";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

type StaticStoreConfig = {
  root: string;
  slug: string;
  catalogFile: string;
  defaultProductFile: string;
  injectChamoScript?: boolean;
  productFile: (productId: string) => string;
};

const projectRoot = process.cwd();

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const staticStores: Record<string, StaticStoreConfig> = {
  "frango-galactico": {
    root: path.join(projectRoot, "FRANGOGALACTICO"),
    slug: "frango-galactico",
    catalogFile: path.join(projectRoot, "FRANGOGALACTICO", "pages", "catalogo.html"),
    defaultProductFile: path.join(projectRoot, "FRANGOGALACTICO", "pages", "produto-p1.html"),
    productFile(productId: string) {
      const clean = productId.replace(/[^\w-]/g, "");
      const direct = path.join(projectRoot, "FRANGOGALACTICO", "pages", `produto-${clean}.html`);
      return existsSync(direct) ? direct : this.defaultProductFile;
    },
  },
  "rancho-figueira": {
    root: path.join(projectRoot, "RANCHO FIGUEIRA"),
    slug: "rancho-figueira",
    catalogFile: path.join(projectRoot, "RANCHO FIGUEIRA", "catalogo.html"),
    defaultProductFile: path.join(projectRoot, "RANCHO FIGUEIRA", "produto_picanha-na-chapa.html"),
    productFile(productId: string) {
      const clean = productId.replace(/[^\w-]/g, "");
      const direct = path.join(projectRoot, "RANCHO FIGUEIRA", `produto_${clean}.html`);
      return existsSync(direct) ? direct : this.defaultProductFile;
    },
  },
  "om-sushi": {
    root: path.join(projectRoot, "OMSUSHI", "dist", "public"),
    slug: "om-sushi",
    catalogFile: path.join(projectRoot, "OMSUSHI", "dist", "public", "index.html"),
    defaultProductFile: path.join(projectRoot, "OMSUSHI", "dist", "public", "index.html"),
    injectChamoScript: false,
    productFile() {
      return this.defaultProductFile;
    },
  },
};

function safeJoin(root: string, relativePath: string) {
  const file = path.normalize(path.join(root, relativePath));
  return file.startsWith(root) ? file : null;
}

function rewriteStoreHtml(html: string, store: StaticStoreConfig) {
  const prefix = `/loja/${store.slug}`;
  let next = html
    .replace(/<script class="\$tsr"[\s\S]*?<\/script>/g, "")
    .replace(/<script defer src="\/~flock\.js"[\s\S]*?<\/script>/g, "")
    .replace(/(src|href)="\/assets\//g, `$1="${prefix}/assets/`)
    .replace(/(src|href)="\/__l5e\//g, `$1="${prefix}/__l5e/`)
    .replace(/href="\/catalogo"/g, `href="${prefix}/catalogo"`)
    .replace(/href="\/produto\//g, `href="${prefix}/produto/`)
    .replace(/href="\/#/g, `href="${prefix}#`)
    .replace(/href="\/"/g, `href="${prefix}"`);

  if (store.injectChamoScript !== false) {
    next = next
      .replace(/<script type="module"[^>]*src="(?:\/loja\/[^/]+)?\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, "")
      .replace(/<script[^>]+type="module"[^>]+src="(?:\/loja\/[^/]+)?\/assets\/index-[^"]+\.js"[^>]*><\/script>/g, "")
      .replace(/<link rel="modulepreload" href="(?:\/loja\/[^/]+)?\/assets\/[^"]+\.js"\/?>/g, "");

    const config = `<style id="chamo-hide-external-badge">#lovable-badge{display:none!important}</style><script>window.CHAMO_STORE_CONFIG={slug:"${store.slug}",endpoint:"/api/chamo/store?slug=${store.slug}"};document.addEventListener("DOMContentLoaded",()=>document.getElementById("lovable-badge")?.remove());</script>`;
    const script = `<script defer src="${prefix}/assets/chamo-store.js?v=unified"></script>`;
    const hasScript = next.includes("/assets/chamo-store.js") || next.includes(`${prefix}/assets/chamo-store.js`);

    if (!next.includes("window.CHAMO_STORE_CONFIG")) {
      next = next.replace("</body>", `${config}</body>`);
    }

    if (!hasScript) {
      next = next.replace("</body>", `${script}</body>`);
    }
  }

  return next;
}

async function sendFile(res: Response, file: string) {
  const ext = path.extname(file);
  const data = await readFile(file);
  res
    .status(200)
    .set("Content-Type", contentTypes[ext] || "application/octet-stream")
    .set("Cache-Control", ext === ".html" || ext === ".js" ? "no-store" : "public, max-age=300")
    .send(data);
}

async function sendHtml(res: Response, file: string, store: StaticStoreConfig) {
  const html = await readFile(file, "utf8");
  res
    .status(200)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "no-store")
    .send(rewriteStoreHtml(html, store));
}

function resolveStaticStoreFile(store: StaticStoreConfig, rest = "") {
  const cleanRest = decodeURIComponent(rest).replace(/^\/+/, "");

  if (!cleanRest) return store.catalogFile;
  if (cleanRest === "catalogo") return store.catalogFile;

  const productMatch = cleanRest.match(/^produto\/([\w-]+)$/);
  if (productMatch) return store.productFile(productMatch[1]);

  if (
    cleanRest.startsWith("assets/") ||
    cleanRest.startsWith("__l5e/") ||
    cleanRest === "favicon.ico" ||
    cleanRest === "favicon.png"
  ) {
    return safeJoin(store.root, cleanRest);
  }

  const direct = safeJoin(store.root, cleanRest);
  if (direct && existsSync(direct)) return direct;

  return path.join(store.root, "index.html");
}

async function handleStaticStore(req: Request, res: Response) {
  const slug = String(req.params[0] || "");
  const rest = String(req.params[1] || "");
  const store = staticStores[slug];

  if (!store) {
    res.status(404).send("Loja nao encontrada");
    return;
  }

  if (!rest || rest === "/") {
    res.redirect(302, `/loja/${store.slug}/catalogo`);
    return;
  }

  const file = resolveStaticStoreFile(store, rest);
  if (!file || !existsSync(file)) {
    res.status(404).send("Arquivo nao encontrado");
    return;
  }

  if (path.extname(file) === ".html") {
    await sendHtml(res, file, store);
    return;
  }

  await sendFile(res, file);
}

export function registerLocalStoreGateway(app: Express) {
  app.get(/^\/loja\/(frango-galactico|rancho-figueira|om-sushi)(?:\/(.*))?$/, (req, res, next) => {
    handleStaticStore(req, res).catch(next);
  });
}
