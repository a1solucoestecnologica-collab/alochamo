import type { Express, Request, Response } from "express";
import * as db from "./db";

type PublicStoreItem = {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number | null;
};

type PublicStoreTheme = {
  tone: string;
  publicSiteUrl: string | null;
  accentColor: string;
  darkColor: string;
  surfaceColor: string;
  textColor: string;
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  catalogKicker: string;
  catalogTitle: string;
  featuredKicker: string;
  featuredTitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  productCtaLabel: string;
  cardImageFit: "cover" | "contain";
};

const storeThemeDefaults: Record<string, Partial<PublicStoreTheme>> = {
  "frango-galactico": {
    tone: "galaxy",
    publicSiteUrl: "/loja/frango-galactico/catalogo",
    accentColor: "#FFC72C",
    darkColor: "#180A2A",
    surfaceColor: "#FFF9E8",
    textColor: "#1F1235",
    heroEyebrow: "Frango galactico pelo Chamo",
    heroHighlight: "crocante de outro planeta.",
    catalogKicker: "Cardapio galactico",
    catalogTitle: "Escolha sua missao",
    featuredTitle: "Recomendados pra tripulacao",
    primaryCtaLabel: "Ver cardapio",
    productCtaLabel: "Pedir pelo Chamo",
    cardImageFit: "contain",
  },
  "rancho-figueira": {
    tone: "rancho",
    publicSiteUrl: "/loja/rancho-figueira/catalogo",
    accentColor: "#7C2D12",
    darkColor: "#23120B",
    surfaceColor: "#FFF7ED",
    textColor: "#24120A",
    heroEyebrow: "Rancho Figueira pelo Chamo",
    heroHighlight: "na chapa, do jeito certo.",
    catalogKicker: "Cardapio do rancho",
    catalogTitle: "Escolha sua porcao",
    featuredTitle: "Destaques do Rancho",
    primaryCtaLabel: "Ver cardapio",
    productCtaLabel: "Pedir pelo Chamo",
    cardImageFit: "cover",
  },
  "om-sushi": {
    tone: "sushi",
    publicSiteUrl: "/loja/om-sushi/catalogo",
    accentColor: "#DC2626",
    darkColor: "#09090B",
    surfaceColor: "#FAFAFA",
    textColor: "#18181B",
    heroEyebrow: "Sushi premium pelo Chamo",
    heroHighlight: "no ponto certo.",
    catalogKicker: "Cardapio",
    catalogTitle: "Escolha seu combinado",
    featuredTitle: "Mais pedidos da casa",
    primaryCtaLabel: "Ver cardapio",
    productCtaLabel: "Pedir pelo Chamo",
    cardImageFit: "cover",
  },
};

function publicHeaders(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function buildPublicStoreTheme(restaurant: Record<string, any>): PublicStoreTheme {
  const defaults = storeThemeDefaults[restaurant.slug] || {};
  const restaurantName = restaurant.name || "Restaurante";

  return {
    tone: defaults.tone || "default",
    publicSiteUrl: defaults.publicSiteUrl || null,
    accentColor: restaurant.primaryColor || defaults.accentColor || "#FF4B00",
    darkColor: defaults.darkColor || "#111111",
    surfaceColor: defaults.surfaceColor || "#FFFFFF",
    textColor: defaults.textColor || "#1F1A17",
    heroEyebrow: defaults.heroEyebrow || `${restaurantName} pelo Chamo`,
    heroTitle: defaults.heroTitle || restaurantName,
    heroHighlight: defaults.heroHighlight || "pronto para vender.",
    heroSubtitle:
      defaults.heroSubtitle ||
      restaurant.bio ||
      restaurant.description ||
      "Cardapio, site e atendimento conectados ao motor Chamo.",
    catalogKicker: defaults.catalogKicker || "Cardapio",
    catalogTitle: defaults.catalogTitle || "Escolha seu pedido",
    featuredKicker: defaults.featuredKicker || "Destaques",
    featuredTitle: defaults.featuredTitle || "Mais pedidos da casa",
    primaryCtaLabel: defaults.primaryCtaLabel || "Ver cardapio",
    secondaryCtaLabel: defaults.secondaryCtaLabel || "Destaques",
    productCtaLabel: defaults.productCtaLabel || "Pedir pelo Chamo",
    cardImageFit: defaults.cardImageFit || "cover",
  };
}

function toPublicRestaurant(restaurant: Record<string, any>) {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    email: restaurant.email,
    logoUrl: restaurant.logoUrl,
    coverUrl: restaurant.coverUrl,
    primaryColor: restaurant.primaryColor,
    bio: restaurant.bio,
    street: restaurant.street,
    number: restaurant.number,
    neighborhood: restaurant.neighborhood,
    city: restaurant.city,
    state: restaurant.state,
    deliveryFee: restaurant.deliveryFee,
    averagePrepTime: restaurant.averagePrepTime,
    minimumOrder: restaurant.minimumOrder,
    rating: restaurant.rating,
    totalReviews: restaurant.totalReviews,
    openingHours: restaurant.openingHours,
    operatingHours: restaurant.operatingHours || [],
    theme: buildPublicStoreTheme(restaurant),
  };
}

function groupItemsByCategory(items: PublicStoreItem[], categories: Array<{ id: number; name: string }>) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.categoryId === category.id && item.isAvailable),
  })).filter((category) => category.items.length > 0 || categoryNames.has(category.id));
}

export function registerPublicStoreRoutes(app: Express) {
  app.options("/api/chamo/stores", (_req, res) => {
    publicHeaders(res);
    res.status(204).end();
  });

  app.options("/api/chamo/store", (_req, res) => {
    publicHeaders(res);
    res.status(204).end();
  });

  app.options("/api/public/stores", (_req, res) => {
    publicHeaders(res);
    res.status(204).end();
  });

  app.options("/api/public/stores/:slug", (_req, res) => {
    publicHeaders(res);
    res.status(204).end();
  });

  app.get("/api/public/stores", async (_req: Request, res: Response) => {
    publicHeaders(res);

    try {
      const restaurants = await db.getApprovedRestaurants();

      res.json({
        assetsBaseUrl: `${_req.protocol}://${_req.get("host")}`,
        stores: restaurants.map((restaurant) => toPublicRestaurant(restaurant)),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[PublicStore] Failed to list stores:", error);
      res.status(500).json({ error: "STORE_LIST_FAILED" });
    }
  });

  app.get("/api/chamo/stores", async (req: Request, res: Response) => {
    publicHeaders(res);

    try {
      const restaurants = await db.getApprovedRestaurants();

      res.json({
        assetsBaseUrl: `${req.protocol}://${req.get("host")}`,
        stores: restaurants.map((restaurant) => toPublicRestaurant(restaurant)),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[PublicStore] Failed to list stores:", error);
      res.status(500).json({ error: "STORE_LIST_FAILED" });
    }
  });

  app.get("/api/chamo/store", async (req: Request, res: Response) => {
    publicHeaders(res);

    const slug = String(req.query.slug || "");
    if (!slug) {
      res.status(400).json({ error: "STORE_SLUG_REQUIRED" });
      return;
    }

    try {
      const restaurant = await db.getRestaurantBySlug(slug);

      if (!restaurant) {
        res.status(404).json({ error: "STORE_NOT_FOUND" });
        return;
      }

      const [categories, rawItems, combos, reviews] = await Promise.all([
        db.getMenuCategoriesByRestaurant(restaurant.id),
        db.getMenuItemsByRestaurant(restaurant.id),
        db.getCombosByRestaurant(restaurant.id),
        db.getReviewsByRestaurant(restaurant.id),
      ]);

      const items = rawItems.filter((item) => item.isAvailable);

      res.json({
        restaurant: toPublicRestaurant(restaurant),
        theme: buildPublicStoreTheme(restaurant),
        assetsBaseUrl: `${req.protocol}://${req.get("host")}`,
        categories,
        items,
        sections: groupItemsByCategory(items, categories),
        featuredItems: items.filter((item) => item.isFeatured),
        combos: combos.filter((combo) => combo.isAvailable),
        reviews,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[PublicStore] Failed to load store:", error);
      res.status(500).json({ error: "STORE_LOAD_FAILED" });
    }
  });

  app.get("/api/public/stores/:slug", async (req: Request, res: Response) => {
    publicHeaders(res);

    try {
      const restaurant = await db.getRestaurantBySlug(req.params.slug);

      if (!restaurant) {
        res.status(404).json({ error: "STORE_NOT_FOUND" });
        return;
      }

      const [categories, rawItems, combos, reviews] = await Promise.all([
        db.getMenuCategoriesByRestaurant(restaurant.id),
        db.getMenuItemsByRestaurant(restaurant.id),
        db.getCombosByRestaurant(restaurant.id),
        db.getReviewsByRestaurant(restaurant.id),
      ]);

      const items = rawItems.filter((item) => item.isAvailable);

      res.json({
        restaurant: toPublicRestaurant(restaurant),
        theme: buildPublicStoreTheme(restaurant),
        assetsBaseUrl: `${req.protocol}://${req.get("host")}`,
        categories,
        items,
        sections: groupItemsByCategory(items, categories),
        featuredItems: items.filter((item) => item.isFeatured),
        combos: combos.filter((combo) => combo.isAvailable),
        reviews,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[PublicStore] Failed to load store:", error);
      res.status(500).json({ error: "STORE_LOAD_FAILED" });
    }
  });
}
