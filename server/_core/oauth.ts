import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        userType: "cliente",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // OAuth callback para admin - verifica se usuario eh admin antes de criar sessao
  app.get("/api/oauth/admin/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Procurar usuario por openId ou email
      let user = await db.getUserByOpenId(userInfo.openId);
      if (!user && userInfo.email) {
        user = await db.getUserByEmail(userInfo.email);
      }

      // Se nao existe ou nao eh admin, negar acesso
      if (!user || user.userType !== "admin") {
        console.log(
          `[OAuth Admin] Acesso negado para ${userInfo.email || userInfo.openId}`
        );
        res.status(403).json({ error: "Acesso negado: usuario nao eh admin" });
        return;
      }

      // Atualizar usuario com dados do OAuth
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || user.name,
        email: userInfo.email ?? user.email,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? user.loginMethod,
        userType: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[OAuth Admin] Login bem-sucedido para ${user.email}`);
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[OAuth] Admin callback failed", error);
      res.status(500).json({ error: "OAuth admin callback failed" });
    }
  });
}
