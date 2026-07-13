import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createRestaurantContext(restaurantId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-restaurant",
    email: "test@restaurant.com",
    name: "Test Restaurant",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      headers: {},
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };

  return ctx;
}

describe("Menu Items Bulk Update", () => {
  it("should update multiple items availability", async () => {
    const ctx = createRestaurantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Marcar itens como indisponíveis (usando IDs de itens existentes do seed)
    const result = await caller.menu.items.bulkUpdate({
      ids: [1, 2], // IDs de itens do Sushi Master
      isAvailable: false,
    });

    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBeLessThanOrEqual(2);
  });

  it("should mark items as available", async () => {
    const ctx = createRestaurantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Marcar itens como disponíveis
    const result = await caller.menu.items.bulkUpdate({
      ids: [1, 2],
      isAvailable: true,
    });

    expect(result.count).toBeGreaterThan(0);
  });
});
