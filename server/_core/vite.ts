import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// Obter __dirname equivalente em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Em produção, quando rodamos `node dist/index.js`:
  // - O código compilado está em dist/
  // - O frontend compilado está em dist/public/
  // - __dirname aponta para dist/ (onde está o código compilado)
  // Então dist/public é: path.resolve(__dirname, "public")
  
  // Em desenvolvimento (quando testando build localmente):
  // - Estamos na raiz do projeto
  // - Precisamos ir para dist/public relativo à raiz
  
  let distPath: string;
  
  if (process.env.NODE_ENV === "development") {
    // Modo desenvolvimento: caminho relativo à raiz do projeto
    distPath = path.resolve(__dirname, "../..", "dist", "public");
  } else {
    // Modo produção: quando rodando de dist/index.js, __dirname é dist/
    // Então dist/public é relativo a dist/
    distPath = path.resolve(__dirname, "public");
  }
  
  if (!fs.existsSync(distPath)) {
    const rootDistPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(rootDistPath)) {
      distPath = rootDistPath;
    }
  }

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`Current directory: ${__dirname}`);
    console.error(`Expected path: ${distPath}`);
    return;
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`Could not find index.html at: ${indexPath}`);
      res.status(404).send("Frontend build not found. Please run 'pnpm build' first.");
      return;
    }
    res.sendFile(indexPath);
  });
}
