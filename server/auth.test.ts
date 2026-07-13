import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Autenticação", () => {
  it("deve retornar null quando não autenticado", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("deve retornar usuário quando autenticado", async () => {
    const mockUser: AuthenticatedUser = {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      cpf: null,
      phone: null,
      password: null,
      birthDate: null,
      userType: "cliente",
      role: "user",
      loginMethod: "cpf",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });
});

describe("Restaurantes", () => {
  it("deve listar restaurantes aprovados", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.restaurants.list();
    
    expect(Array.isArray(result)).toBe(true);
    // Todos os restaurantes retornados devem estar aprovados
    result.forEach(restaurant => {
      expect(restaurant.status).toBe("approved");
    });
  });

  it("deve filtrar restaurantes por categoria", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.restaurants.list({ categoryId: 1 });
    
    expect(Array.isArray(result)).toBe(true);
    // Todos os restaurantes devem ser da categoria 1 (se houver)
    if (result.length > 0) {
      result.forEach(restaurant => {
        expect(restaurant.categoryId).toBe(1);
      });
    }
  });
});

describe("Categorias", () => {
  it("deve listar categorias ativas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.list();
    
    expect(Array.isArray(result)).toBe(true);
    // Todas as categorias devem estar ativas
    result.forEach(category => {
      expect(category.isActive).toBe(true);
    });
  });
});

describe("Banners", () => {
  it("deve listar banners ativos", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.banners.list();
    
    expect(Array.isArray(result)).toBe(true);
    // Todos os banners devem estar ativos
    result.forEach(banner => {
      expect(banner.isActive).toBe(true);
    });
  });
});
