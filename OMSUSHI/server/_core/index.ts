import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const defaultStoreSlug = process.env.CHAMO_STORE_SLUG || "om-sushi";
  const chamoEngineUrl = (process.env.CHAMO_ENGINE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/chamo/stores", async (_req, res) => {
    try {
      const response = await fetch(`${chamoEngineUrl}/api/public/stores`);
      const body = await response.text();
      res
        .status(response.status)
        .set("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8")
        .set("Cache-Control", "no-store")
        .send(body);
    } catch {
      res.status(502).json({
        error: "CHAMO_ENGINE_UNAVAILABLE",
        message: "Nao foi possivel conectar ao motor do Chamo",
      });
    }
  });

  app.get("/api/chamo/store", async (req, res) => {
    const slug = String(req.query.slug || defaultStoreSlug);

    try {
      const response = await fetch(`${chamoEngineUrl}/api/public/stores/${encodeURIComponent(slug)}`);
      const body = await response.text();
      res
        .status(response.status)
        .set("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8")
        .set("Cache-Control", "no-store")
        .send(body);
    } catch {
      res.status(502).json({
        error: "CHAMO_ENGINE_UNAVAILABLE",
        message: "Nao foi possivel conectar ao motor do Chamo",
      });
    }
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
