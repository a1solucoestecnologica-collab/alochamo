import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(() => db.getCategories()),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(({ input }) => db.getProducts(input?.categoryId)),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getProductById(input)),
  }),

  cart: router({
    list: protectedProcedure.query(({ ctx }) => db.getCartItems(ctx.user.id)),
    
    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(({ ctx, input }) => db.addToCart(ctx.user.id, input.productId, input.quantity)),
    
    update: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(1) }))
      .mutation(({ input }) => db.updateCartItem(input.cartItemId, input.quantity)),
    
    remove: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => db.removeFromCart(input)),
    
    clear: protectedProcedure
      .mutation(({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  orders: router({
    list: protectedProcedure.query(({ ctx }) => db.getOrders(ctx.user.id)),
    
    getById: protectedProcedure
      .input(z.number())
      .query(({ input }) => db.getOrderById(input)),
    
    create: protectedProcedure
      .input(z.object({
        totalPrice: z.number(),
        deliveryAddress: z.string(),
        deliveryPhone: z.string(),
        paymentMethod: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          priceAtPurchase: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderResult = await db.createOrder({
          userId: ctx.user.id,
          totalPrice: input.totalPrice,
          deliveryAddress: input.deliveryAddress,
          deliveryPhone: input.deliveryPhone,
          paymentMethod: input.paymentMethod,
        });
        
        const orderId = (orderResult as any).insertId;
        
        await db.addOrderItems(
          input.items.map(item => ({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          }))
        );
        
        await db.clearCart(ctx.user.id);
        
        return { orderId };
      }),
    
    getItems: protectedProcedure
      .input(z.number())
      .query(({ input }) => db.getOrderItems(input)),
  }),
});

export type AppRouter = typeof appRouter;
