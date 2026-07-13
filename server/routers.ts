import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";
import { users, orders } from "../drizzle/schema";

// Middleware para verificar role de admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.userType !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
  }
  return next({ ctx });
});

// Middleware para verificar se é restaurante
const restaurantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Verificar se usuário tem restaurante vinculado
  const restaurant = await db.getRestaurantByUserId(ctx.user.id);
  
  if (!restaurant && ctx.user.userType !== 'restaurante') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso apenas para restaurantes' });
  }
  
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // AUTENTICAÇÃO
  // ============================================
  auth: router({
    me: publicProcedure.query(async (opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      
      // Determinar userType baseado no restaurante vinculado
      // IMPORTANTE: Admin tem prioridade maxima
      const restaurant = await db.getRestaurantByUserId(user.id);
      let effectiveUserType = user.userType;
      
      // Se nao eh admin, verificar se tem restaurante vinculado
      if (user.userType !== 'admin' && restaurant) {
        effectiveUserType = 'restaurante';
      }
      
      return { ...user, userType: effectiveUserType };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Login por CPF (cliente)
    loginCpf: publicProcedure
      .input(z.object({ cpf: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByCpf(input.cpf);
        if (!user) {
          return { exists: false, needsRegistration: true };
        }
        
        // Criar sessão JWT e setar cookie HTTP-only
        const { sdk } = await import('./_core/sdk');
        const userOpenId = user.openId || `cpf_${input.cpf}`;
        const sessionToken = await sdk.createSessionToken(userOpenId, { name: String(user.name || '') });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        return { exists: true, user };
      }),

    // Cadastro de cliente
    registerClient: publicProcedure
      .input(z.object({
        cpf: z.string(),
        name: z.string(),
        phone: z.string(),
        birthDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByCpf(input.cpf);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF já cadastrado' });
        }

        await db.createUser({
          cpf: input.cpf,
          name: input.name,
          phone: input.phone,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
          userType: 'cliente',
          openId: `cpf_${input.cpf}`,
        });

        const user = await db.getUserByCpf(input.cpf);
        return { success: true, user };
      }),

    // Login por email+senha (restaurante/admin)
    loginEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        console.log('[loginEmail] User from DB:', { id: user?.id, email: user?.email, role: user?.role, userType: user?.userType });
        
        if (!user || user.password !== input.password) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha incorretos' });
        }

        // Determinar userType baseado no role e restaurante vinculado
        let effectiveUserType = user.userType;
        
        // Se o usuário é admin, manter como admin (prioridade máxima)
        if (user.role === 'admin') {
          effectiveUserType = 'admin';
        } else {
          // Caso contrário, verificar se tem restaurante vinculado
          const restaurant = await db.getRestaurantByUserId(user.id);
          if (restaurant) {
            effectiveUserType = 'restaurante';
            
            // Verificar se o restaurante foi aprovado
            if (restaurant.status !== 'approved') {
              throw new TRPCError({ 
                code: 'FORBIDDEN', 
                message: 'Seu restaurante ainda não foi aprovado pelo administrador' 
              });
            }
          }
        }

        // Criar sessão JWT e setar cookie HTTP-only
        const { sdk } = await import('./_core/sdk');
        const userOpenId = user.openId || `email_${input.email}`;
        const sessionToken = await sdk.createSessionToken(userOpenId, { name: String(user.name || '') });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        // Retornar usuário com userType efetivo
        const userWithEffectiveType = { ...user, userType: effectiveUserType };
        console.log('[loginEmail] Returning user:', { id: user.id, email: user.email, userType: effectiveUserType });
        return { success: true, user: userWithEffectiveType };
      }),

    // Cadastro de restaurante
    registerRestaurant: publicProcedure
      .input(z.object({
        // Dados do usuário
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        phone: z.string(),
        cpfCnpj: z.string(),
        
        // Dados do restaurante
        restaurantName: z.string(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        
        // Endereço
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        
        // Operação
        openingHours: z.string().optional(),
        deliveryFee: z.number(),
        averagePrepTime: z.number(),
        minimumOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email já cadastrado' });
        }

        // Criar usuário
        await db.createUser({
          name: input.name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          userType: 'restaurante',
          openId: `email_${input.email}`,
        });

        const user = await db.getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Criar restaurante
        const slug = input.restaurantName.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + '-' + nanoid(6);

        await db.createRestaurant({
          userId: user.id,
          name: input.restaurantName,
          slug,
          description: input.description,
          cpfCnpj: input.cpfCnpj,
          phone: input.phone,
          email: input.email,
          categoryId: input.categoryId,
          street: input.street,
          number: input.number,
          complement: input.complement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          openingHours: input.openingHours,
          deliveryFee: input.deliveryFee,
          averagePrepTime: input.averagePrepTime,
          minimumOrder: input.minimumOrder,
          status: 'pending',
        });

        return { success: true, message: 'Cadastro enviado! Aguarde aprovação do administrador.' };
      }),

    // Atualizar perfil
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============================================
  // RESTAURANTES
  // ============================================
  restaurants: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getApprovedRestaurants(input);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const restaurant = await db.getRestaurantBySlug(input.slug);
        if (!restaurant) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurante não encontrado' });
        }
        return restaurant;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRestaurantById(input.id);
      }),

    // Restaurante logado
    getMine: restaurantProcedure.query(async ({ ctx }) => {
      return db.getRestaurantByUserId(ctx.user.id);
    }),

    update: restaurantProcedure
      .input(z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        logoUrl: z.string().optional(),
        coverUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        bio: z.string().optional(),
        openingHours: z.string().optional(),
        deliveryFee: z.number().optional(),
        averagePrepTime: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.updateRestaurant(restaurant.id, input);
        return { success: true };
      }),
  }),

  // ============================================
  // CATEGORIAS
  // ============================================
  categories: router({
    list: publicProcedure.query(() => db.getRestaurantCategories()),
  }),

  // ============================================
  // CARDÁPIO
  // ============================================
  menu: router({
    // Categorias do cardápio
    categories: router({
      // Endpoint público para visualização
      listByRestaurant: publicProcedure
        .input(z.object({ restaurantId: z.number() }))
        .query(({ input }) => db.getMenuCategoriesByRestaurant(input.restaurantId)),

      // Endpoint protegido para gestão
      list: restaurantProcedure
        .query(async ({ ctx }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          return db.getMenuCategoriesByRestaurant(restaurant.id);
        }),

      create: restaurantProcedure
        .input(z.object({
          name: z.string(),
          description: z.string().optional(),
          order: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          
          await db.createMenuCategory({
            restaurantId: restaurant.id,
            ...input,
          });
          return { success: true };
        }),

      update: restaurantProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          order: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          const { id, ...data } = input;
          await db.updateMenuCategoryForRestaurant(id, restaurant.id, data);
          return { success: true };
        }),

      delete: restaurantProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          await db.deleteMenuCategoryForRestaurant(input.id, restaurant.id);
          return { success: true };
        }),
    }),

    // Itens do cardápio
    items: router({
      // Endpoint público para visualização
      listByRestaurant: publicProcedure
        .input(z.object({ restaurantId: z.number() }))
        .query(({ input }) => db.getMenuItemsByRestaurant(input.restaurantId)),

      // Endpoint protegido para gestão
      list: restaurantProcedure
        .query(async ({ ctx }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          return db.getMenuItemsByRestaurant(restaurant.id);
        }),

      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(({ input }) => db.getMenuItemById(input.id)),

      search: publicProcedure
        .input(z.object({
          search: z.string(),
          restaurantId: z.number().optional(),
          categoryId: z.number().optional(),
        }))
        .query(({ input }) => db.searchMenuItems(input.search, {
          restaurantId: input.restaurantId,
          categoryId: input.categoryId,
        })),

      create: restaurantProcedure
        .input(z.object({
          categoryId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          imageUrl: z.string().optional(),
          preparationTime: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const category = await db.getMenuCategoryById(input.categoryId);
          if (!category || category.restaurantId !== restaurant.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Categoria nao pertence a este restaurante' });
          }
          
          await db.createMenuItem({
            restaurantId: restaurant.id,
            ...input,
          });
          return { success: true };
        }),

      update: restaurantProcedure
        .input(z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          imageUrl: z.string().optional(),
          isAvailable: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          preparationTime: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          if (input.categoryId) {
            const category = await db.getMenuCategoryById(input.categoryId);
            if (!category || category.restaurantId !== restaurant.id) {
              throw new TRPCError({ code: 'FORBIDDEN', message: 'Categoria nao pertence a este restaurante' });
            }
          }

          const { id, ...data } = input;
          await db.updateMenuItemForRestaurant(id, restaurant.id, data);
          return { success: true };
        }),

      delete: restaurantProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          await db.deleteMenuItemForRestaurant(input.id, restaurant.id);
          return { success: true };
        }),

      duplicate: restaurantProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          
          const newItem = await db.duplicateMenuItem(input.id, restaurant.id);
          return { success: true, item: newItem };
        }),

      bulkUpdate: restaurantProcedure
        .input(z.object({
          ids: z.array(z.number()),
          isAvailable: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          
          const { ids, ...data } = input;
          await db.bulkUpdateMenuItems(restaurant.id, ids, data);
          return { success: true, count: ids.length };
        }),
    }),

    // Variações de tamanho
    variations: router({      
      listByItem: publicProcedure
        .input(z.object({ itemId: z.number() }))
        .query(({ input }) => db.getVariationsByItemId(input.itemId)),

      create: restaurantProcedure
        .input(z.object({
          itemId: z.number(),
          size: z.string(),
          price: z.number(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const item = await db.getMenuItemById(input.itemId);
          if (!item || item.restaurantId !== restaurant.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Item nao pertence a este restaurante' });
          }

          await db.createVariation(input);
          return { success: true };
        }),

      update: restaurantProcedure
        .input(z.object({
          id: z.number(),
          size: z.string().optional(),
          price: z.number().optional(),
          isAvailable: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const variation = await db.getVariationById(input.id);
          const item = variation ? await db.getMenuItemById(variation.itemId) : null;
          if (!variation || !item || item.restaurantId !== restaurant.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Variacao nao pertence a este restaurante' });
          }

          const { id, ...data } = input;
          await db.updateVariation(id, data);
          return { success: true };
        }),

      delete: restaurantProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const variation = await db.getVariationById(input.id);
          const item = variation ? await db.getMenuItemById(variation.itemId) : null;
          if (!variation || !item || item.restaurantId !== restaurant.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Variacao nao pertence a este restaurante' });
          }

          await db.deleteVariation(input.id);
          return { success: true };
        }),
    }),

    // Adicionais
    additionals: router({
      list: restaurantProcedure
        .query(async ({ ctx }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          return db.getAdditionalsByRestaurant(restaurant.id);
        }),

      getByItem: publicProcedure
        .input(z.object({ itemId: z.number() }))
        .query(({ input }) => db.getAdditionalsByItem(input.itemId)),

      create: restaurantProcedure
        .input(z.object({
          name: z.string(),
          price: z.number(),
          isAvailable: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          
          await db.createAdditional({
            restaurantId: restaurant.id,
            ...input,
          });
          return { success: true };
        }),

      update: restaurantProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          price: z.number().optional(),
          isAvailable: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          const { id, ...data } = input;
          await db.updateAdditionalForRestaurant(id, restaurant.id, data);
          return { success: true };
        }),

      delete: restaurantProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          await db.deleteAdditionalForRestaurant(input.id, restaurant.id);
          return { success: true };
        }),
    }),
  }),

  // ============================================
  // PEDIDOS
  // ============================================
  orders: router({
    create: protectedProcedure
      .input(z.object({
        restaurantId: z.number(),
        items: z.array(z.object({
          itemId: z.number().optional(),
          comboId: z.number().optional(),
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          notes: z.string().optional(),
          additionals: z.array(z.object({
            additionalId: z.number(),
            name: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
          })).optional(),
        })),
        deliveryAddress: z.object({
          street: z.string(),
          number: z.string(),
          complement: z.string().optional(),
          neighborhood: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
        }),
        subtotal: z.number(),
        deliveryFee: z.number(),
        discount: z.number().optional(),
        couponCode: z.string().optional(),
        voucherCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log('[orders.create] Input received:', JSON.stringify(input, null, 2));
          console.log('[orders.create] Items count:', input.items?.length || 0);
          console.log('[orders.create] Items:', JSON.stringify(input.items, null, 2));
          console.log('[orders.create] User ID:', ctx.user.id);
          
          const serviceFee = 99; // R$ 0,99
          const subtotalNum = Number(input.subtotal) || 0;
          const deliveryFeeNum = Number(input.deliveryFee) || 0;
          const discountNum = Number(input.discount) || 0;
          const total = subtotalNum + deliveryFeeNum + serviceFee - discountNum;
          
          console.log('[orders.create] Calculated values:', { subtotalNum, deliveryFeeNum, discountNum, serviceFee, total });

          const result = await db.createOrder({
            customerId: ctx.user.id,
            restaurantId: Number(input.restaurantId),
            deliveryStreet: input.deliveryAddress.street,
            deliveryNumber: input.deliveryAddress.number,
            deliveryComplement: input.deliveryAddress.complement || null,
            deliveryNeighborhood: input.deliveryAddress.neighborhood,
            deliveryCity: input.deliveryAddress.city,
            deliveryState: input.deliveryAddress.state,
            deliveryZipCode: input.deliveryAddress.zipCode,
            subtotal: subtotalNum,
            deliveryFee: deliveryFeeNum,
            serviceFee,
            discount: discountNum,
            total,
            couponCode: input.couponCode,
            voucherCode: input.voucherCode,
            notes: input.notes,
            status: 'received',
          });

          // Criar itens do pedido
          // O resultado do Drizzle insert é [ResultSetHeader, undefined]
          const insertResult = result as any;
          const orderId = Number(insertResult[0]?.insertId || insertResult.insertId || 0);
          console.log('[orders.create] Order created with ID:', orderId);
          console.log('[orders.create] Insert result structure:', JSON.stringify(insertResult));
          console.log('[orders.create] Starting items loop, items count:', input.items.length);
          
          if (!input.items || input.items.length === 0) {
            console.log('[orders.create] WARNING: No items to create!');
          }
          
          let itemIndex = 0;
          console.log('[orders.create] Starting items loop, items count:', input.items?.length);
          console.log('[orders.create] Items array:', JSON.stringify(input.items));
          for (const item of input.items) {
            console.log(`[orders.create] Processing item ${itemIndex + 1}/${input.items.length}:`, item.name);
            const unitPriceNum = Number(item.unitPrice) || 0;
            const quantityNum = Number(item.quantity) || 1;
            const itemSubtotal = unitPriceNum * quantityNum;
            
            console.log('[orders.create] Creating order item:', {
              orderId,
              itemId: item.itemId,
              name: item.name,
              quantity: quantityNum,
              unitPrice: unitPriceNum,
              subtotal: itemSubtotal,
            });
            
            console.log('[orders.create] Calling db.createOrderItem with:', {
              orderId,
              itemId: item.itemId || null,
              comboId: item.comboId || null,
              name: item.name,
              quantity: quantityNum,
              unitPrice: unitPriceNum,
              subtotal: itemSubtotal,
              notes: item.notes || null,
            });
            
            try {
              const itemResult = await db.createOrderItem({
                orderId,
                itemId: item.itemId || null,
                comboId: item.comboId || null,
                name: item.name,
                quantity: quantityNum,
                unitPrice: unitPriceNum,
                subtotal: itemSubtotal,
                notes: item.notes || null,
              });
              console.log('[orders.create] Order item created successfully:', itemResult);
              
              // Obter ID do item criado
              const orderItemId = Number((itemResult as any)[0]?.insertId || 0);
              console.log('[orders.create] Order item ID:', orderItemId);
              
              // Criar adicionais do item
              if (item.additionals && item.additionals.length > 0 && orderItemId > 0) {
                console.log(`[orders.create] Creating ${item.additionals.length} additionals for item ${orderItemId}`);
                for (const additional of item.additionals) {
                  const additionalSubtotal = Number(additional.unitPrice) * Number(additional.quantity);
                  await db.createOrderItemAdditional({
                    orderItemId,
                    additionalId: Number(additional.additionalId),
                    name: additional.name,
                    quantity: Number(additional.quantity),
                    unitPrice: Number(additional.unitPrice),
                    subtotal: additionalSubtotal,
                  });
                }
                console.log('[orders.create] Additionals created successfully');
              }
            } catch (itemError: any) {
              console.error('[orders.create] Error creating order item:', itemError);
              throw itemError;
            }
            
            itemIndex++;
          }
          
          console.log(`[orders.create] Finished creating ${itemIndex} items`);

          return { success: true, orderId };
        } catch (error: any) {
          console.error('[orders.create] Error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Erro ao criar pedido',
          });
        }
      }),

    myOrders: protectedProcedure.query(({ ctx }) => {
      return db.getOrdersByCustomer(ctx.user.id);
    }),

    // Para restaurantes - pedidos do restaurante do usuário logado
    restaurantOrders: protectedProcedure.query(async ({ ctx }) => {
      const restaurant = await db.getRestaurantByUserId(ctx.user.id);
      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurante não encontrado' });
      return db.getOrdersByRestaurant(restaurant.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),

    // Para restaurantes
    listByRestaurant: restaurantProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        return db.getOrdersByRestaurant(restaurant.id, input?.status);
      }),

    updateStatus: restaurantProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['received', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        await db.updateOrderStatusForRestaurant(input.orderId, restaurant.id, input.status);
        return { success: true };
      }),
  }),

  // ============================================
  // CUPONS E VOUCHERS
  // ============================================
  coupons: router({
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const coupon = await db.getCouponByCode(input.code);
        if (!coupon) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Cupom inválido' });
        }
        
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cupom esgotado' });
        }

        return coupon;
      }),

    listByRestaurant: restaurantProcedure
      .query(async ({ ctx }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        return db.getCouponsByRestaurant(restaurant.id);
      }),

    create: restaurantProcedure
      .input(z.object({
        code: z.string(),
        type: z.enum(['percentage', 'fixed']),
        value: z.number(),
        minimumOrder: z.number().optional(),
        maxDiscount: z.number().optional(),
        usageLimit: z.number().optional(),
        validFrom: z.string(),
        validUntil: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

        await db.createCoupon({
          ...input,
          restaurantId: restaurant.id,
          validFrom: new Date(input.validFrom),
          validUntil: new Date(input.validUntil),
        });
        return { success: true };
      }),

    delete: restaurantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        await db.deleteCouponForRestaurant(input.id, restaurant.id);
        return { success: true };
      }),
  }),

  vouchers: router({
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const voucher = await db.getVoucherByCode(input.code);
        if (!voucher) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Voucher inválido' });
        }
        
        if (voucher.usageLimit && (voucher.usedCount || 0) >= voucher.usageLimit) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Voucher esgotado' });
        }

        const item = await db.getMenuItemById(voucher.itemId);
        return { voucher, item };
      }),

    create: adminProcedure
      .input(z.object({
        code: z.string(),
        itemId: z.number(),
        restaurantId: z.number(),
        usageLimit: z.number().optional(),
        validFrom: z.string(),
        validUntil: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createVoucher({
          ...input,
          validFrom: new Date(input.validFrom),
          validUntil: new Date(input.validUntil),
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ============================================
  // AVALIAÇÕES
  // ============================================
  reviews: router({
    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        restaurantId: z.number(),
        foodRating: z.number().min(0).max(500),
        packagingRating: z.number().min(0).max(500),
        timeRating: z.number().min(0).max(500),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const overallRating = Math.round((input.foodRating + input.packagingRating + input.timeRating) / 3);
        
        await db.createReview({
          ...input,
          customerId: ctx.user.id,
          overallRating,
        });
        return { success: true };
      }),

    listByRestaurant: publicProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(({ input }) => db.getReviewsByRestaurant(input.restaurantId)),

    respond: restaurantProcedure
      .input(z.object({
        reviewId: z.number(),
        response: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        await db.updateReviewResponseForRestaurant(input.reviewId, restaurant.id, input.response);
        return { success: true };
      }),

    getByOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return db.getReviewByOrder(input.orderId);
      }),
  }),

  // ============================================
  // FAVORITOS
  // ============================================
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => db.getFavoritesByUser(ctx.user.id)),

    add: protectedProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addFavorite(ctx.user.id, input.restaurantId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.restaurantId);
        return { success: true };
      }),
  }),

  // ============================================
  // ENDEREÇOS
  // ============================================
  addresses: router({
    list: protectedProcedure.query(({ ctx }) => db.getAddressesByUserId(ctx.user.id)),
    
    getDefault: protectedProcedure.query(async ({ ctx }) => {
      const addresses = await db.getAddressesByUserId(ctx.user.id);
      return addresses.find(addr => addr.isDefault) || addresses[0] || null;
    }),

    create: protectedProcedure
      .input(z.object({
        street: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createAddress({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAddress(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAddress(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // ADMIN
  // ============================================
  admin: router({
    // Aprovação de restaurantes
    pendingRestaurants: adminProcedure.query(() => db.getPendingRestaurants()),

    approveRestaurant: adminProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateRestaurant(input.restaurantId, {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
        });
        return { success: true };
      }),

    rejectRestaurant: adminProcedure
      .input(z.object({
        restaurantId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateRestaurant(input.restaurantId, {
          status: 'rejected',
          rejectionReason: input.reason,
        });
        return { success: true };
      }),

    suspendRestaurant: adminProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateRestaurant(input.restaurantId, { status: 'suspended' });
        return { success: true };
      }),

    // Banners
    banners: router({
      list: publicProcedure.query(() => db.getActiveBanners()),

      create: adminProcedure
        .input(z.object({
          title: z.string(),
          imageUrl: z.string(),
          linkUrl: z.string().optional(),
          order: z.number().optional(),
          validFrom: z.string().optional(),
          validUntil: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.createBanner({
            ...input,
            validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
            validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          });
          return { success: true };
        }),
    }),

    // Categorias
    categories: router({
      create: adminProcedure
        .input(z.object({
          name: z.string(),
          slug: z.string(),
          icon: z.string().optional(),
          order: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.createRestaurantCategory(input);
          return { success: true };
        }),
    }),

    crm: router({
      overview: adminProcedure.query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const restaurants = await db.getApprovedRestaurants();

        const overview = await Promise.all(
          restaurants.map(async (restaurant) => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const totalCustomersResult = await dbInstance
              .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const totalCustomers = totalCustomersResult[0]?.count || 0;

            const activeCustomersResult = await dbInstance
              .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const activeCustomers = activeCustomersResult[0]?.count || 0;

            const orders30dResult = await dbInstance
              .select({ count: sql<number>`COUNT(*)` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const orders30d = orders30dResult[0]?.count || 0;

            const avgTicketResult = await dbInstance
              .select({ avg: sql<number>`AVG(${orders.total})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const avgTicketCents = Math.round(avgTicketResult[0]?.avg || 0);

            const lastOrderResult = await dbInstance
              .select({ lastOrderAt: orders.createdAt })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.status} != 'cancelled'`
                )
              )
              .orderBy(sql`${orders.createdAt} DESC`)
              .limit(1);
            const lastOrderAt = lastOrderResult[0]?.lastOrderAt || null;

            return {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              totalCustomers,
              activeCustomers,
              orders30d,
              avgTicketCents,
              lastOrderAt,
            };
          })
        );

        return { restaurants: overview };
      }),

      recompute: adminProcedure
        .input(z.object({ restaurantId: z.number().optional() }))
        .mutation(async ({ input }) => {
          const { recomputeStats } = await import('./modules/crm/crmStats.service');

          if (input.restaurantId) {
            const result = await recomputeStats(input.restaurantId);
            return {
              success: true,
              restaurantId: input.restaurantId,
              ...result,
            };
          }

          const restaurants = await db.getApprovedRestaurants();
          const results = await Promise.all(
            restaurants.map(async (restaurant) => {
              const result = await recomputeStats(restaurant.id);
              return {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                ...result,
              };
            })
          );

          const totalProcessed = results.reduce((sum, result) => sum + result.processed, 0);
          const totalErrors = results.reduce((sum, result) => sum + result.errors, 0);

          return {
            success: true,
            totalProcessed,
            totalErrors,
            results,
          };
        }),
    }),

    // Limpeza de pedidos de teste (sem itens)
    cleanupTestOrders: adminProcedure
      .mutation(async () => {
        const result = await db.deleteOrdersWithoutItems();
        return { success: true, deletedCount: result };
      }),
  }),

  // ============================================
  // BANNERS (público)
  // ============================================
  banners: router({
    list: publicProcedure.query(() => db.getActiveBanners()),
  }),

  // ============================================
  // VOUCHERS EM DESTAQUE
  // ============================================
  // Horários de funcionamento
  hours: router({
    list: restaurantProcedure
      .query(async ({ ctx }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        return db.getRestaurantHours(restaurant.id);
      }),

    upsert: restaurantProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        isClosed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        
        await db.upsertRestaurantHour({
          restaurantId: restaurant.id,
          ...input,
        });
        return { success: true };
      }),

    delete: restaurantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRestaurantHour(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // COMBOS
  // ============================================
  combos: router({
    list: restaurantProcedure
      .query(async ({ ctx }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        return db.getCombosByRestaurant(restaurant.id);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getComboWithItems(input.id);
      }),

    create: restaurantProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        imageUrl: z.string().optional(),
        items: z.array(z.object({
          itemId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const comboId = await db.createCombo({
          restaurantId: restaurant.id,
          name: input.name,
          description: input.description,
          price: input.price,
          imageUrl: input.imageUrl,
        });
        
        // Adicionar itens ao combo
        for (const item of input.items) {
          await db.addItemToCombo({
            comboId: Number(comboId),
            itemId: item.itemId,
            quantity: item.quantity,
          });
        }
        
        return { success: true, comboId };
      }),

    update: restaurantProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCombo(id, data);
        return { success: true };
      }),

    delete: restaurantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCombo(input.id);
        return { success: true };
      }),

    // Gerenciar itens do combo
    addItem: restaurantProcedure
      .input(z.object({
        comboId: z.number(),
        itemId: z.number(),
        quantity: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.addItemToCombo(input);
        return { success: true };
      }),

    removeItem: restaurantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeItemFromCombo(input.id);
        return { success: true };
      }),
  }),

  featuredVouchers: router({
    list: publicProcedure.query(() => db.getFeaturedVouchers()),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string(),
        code: z.string(),
        discountType: z.enum(["percentage", "fixed", "free_item"]),
        discountValue: z.number().optional(),
        menuItemId: z.number().optional(),
        minOrderValue: z.number().optional(),
        maxDiscount: z.number().optional(),
        usageLimit: z.number().optional(),
        order: z.number().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createFeaturedVoucher({
          ...input,
          validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        });
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFeaturedVoucher(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFeaturedVoucher(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // CRM - RESTAURANTE
  // ============================================
  restaurant: router({
    crm: router({
      overview: restaurantProcedure.query(async ({ ctx }) => {
        const restaurant = await db.getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Total de clientes
        const totalCustomersResult = await dbInstance
          .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
          .from(orders)
          .where(
            and(
              sql`${orders.restaurantId} = ${restaurant.id}`,
              sql`${orders.status} != 'cancelled'`
            )
          );
        const totalCustomers = totalCustomersResult[0]?.count || 0;

        // Clientes ativos (pedido nos últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeCustomersResult = await dbInstance
          .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
          .from(orders)
          .where(
            and(
              sql`${orders.restaurantId} = ${restaurant.id}`,
              sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
              sql`${orders.status} != 'cancelled'`
            )
          );
        const activeCustomers = activeCustomersResult[0]?.count || 0;

        // Clientes inativos (> 30 dias)
        const inactiveCustomers = totalCustomers - activeCustomers;

        // Ticket médio (últimos 30 dias)
        const avgTicketResult = await dbInstance
          .select({ avg: sql<number>`AVG(${orders.total})` })
          .from(orders)
          .where(
            and(
              sql`${orders.restaurantId} = ${restaurant.id}`,
              sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
              sql`${orders.status} != 'cancelled'`
            )
          );
        const avgTicketCents = Math.round(avgTicketResult[0]?.avg || 0);

        // Pedidos nos últimos 30 dias
        const orders30dResult = await dbInstance
          .select({ count: sql<number>`COUNT(*)` })
          .from(orders)
          .where(
            and(
              sql`${orders.restaurantId} = ${restaurant.id}`,
              sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
              sql`${orders.status} != 'cancelled'`
            )
          );
        const orders30d = orders30dResult[0]?.count || 0;

        // Crescimento de clientes (últimos 30 dias vs 30 dias anteriores)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const customersPrevious30dResult = await dbInstance
          .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
          .from(orders)
          .where(
            and(
              sql`${orders.restaurantId} = ${restaurant.id}`,
              sql`${orders.createdAt} >= ${sixtyDaysAgo}`,
              sql`${orders.createdAt} < ${thirtyDaysAgo}`,
              sql`${orders.status} != 'cancelled'`
            )
          );
        const customersPrevious30d = customersPrevious30dResult[0]?.count || 0;
        const customersGrowth30d = activeCustomers - customersPrevious30d;

        // Últimos 10 clientes ativos (com snapshot)
        const recentSnapshots = await db.getCrmCustomerSnapshotsByRestaurant(restaurant.id, {
          status: 'ALL',
        });
        const recentActiveCustomers = recentSnapshots
          .slice(0, 10)
          .map((item) => ({
            customerId: item.snapshot.customerId,
            customerName: item.customer.name || 'Cliente',
            customerPhone: item.customer.phone || '',
            customerCpf: item.customer.cpf || '',
            lastOrderAt: item.snapshot.lastOrderAt,
            ordersCount: item.snapshot.ordersCount,
            totalSpentCents: item.snapshot.totalSpentCents,
            status: item.snapshot.status,
          }));

        return {
          totalCustomers,
          activeCustomers,
          inactiveCustomers,
          avgTicketCents,
          orders30d,
          customersGrowth30d,
          recentActiveCustomers,
        };
      }),

      customers: restaurantProcedure
        .input(
          z.object({
            status: z.enum(['ALL', 'NEW', 'RECURRING', 'INACTIVE', 'VIP']).optional().default('ALL'),
            q: z.string().optional(),
            page: z.number().optional().default(1),
            pageSize: z.number().optional().default(20),
          })
        )
        .query(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const snapshots = await db.getCrmCustomerSnapshotsByRestaurant(restaurant.id, {
            status: input.status,
            search: input.q,
          });

          // Paginação
          const start = (input.page - 1) * input.pageSize;
          const end = start + input.pageSize;
          const paginated = snapshots.slice(start, end);

          return {
            customers: paginated.map((item) => ({
              customerId: item.snapshot.customerId,
              customerName: item.customer.name || 'Cliente',
              customerPhone: item.customer.phone || '',
              customerCpf: item.customer.cpf || '',
              lastOrderAt: item.snapshot.lastOrderAt,
              ordersCount: item.snapshot.ordersCount,
              totalSpentCents: item.snapshot.totalSpentCents,
              avgTicketCents: item.snapshot.avgTicketCents,
              status: item.snapshot.status,
            })),
            total: snapshots.length,
            page: input.page,
            pageSize: input.pageSize,
          };
        }),

      getCustomer: restaurantProcedure
        .input(z.object({ customerId: z.number() }))
        .query(async ({ ctx, input }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

          const snapshot = await db.getCrmCustomerSnapshot(restaurant.id, input.customerId);
          if (!snapshot) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
          }

          // Buscar dados do cliente usando o customerId (que é users.id)
          const dbInstance = await db.getDb();
          if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const customerResult = await dbInstance
            .select()
            .from(users)
            .where(eq(users.id, input.customerId))
            .limit(1);
          const customer = customerResult[0];
          if (!customer) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Dados do cliente não encontrados' });
          }

          // Buscar últimos 20 pedidos do cliente neste restaurante
          const dbInstanceForOrders = await db.getDb();
          if (!dbInstanceForOrders) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          
          const customerOrdersRaw = await dbInstanceForOrders
            .select()
            .from(orders)
            .where(
              and(
                eq(orders.restaurantId, restaurant.id),
                eq(orders.customerId, input.customerId),
                sql`${orders.status} != 'cancelled'`
              )
            )
            .orderBy(sql`${orders.createdAt} DESC`)
            .limit(20);

          const ordersWithItems = await Promise.all(
            customerOrdersRaw.map(async (order) => {
              const items = await db.getOrderItems(order.id);
              return {
                ...order,
                items,
              };
            })
          );

          return {
            customer: {
              id: customer.id,
              name: customer.name || 'Cliente',
              phone: customer.phone || '',
              cpf: customer.cpf || '',
            },
            stats: {
              firstOrderAt: snapshot.firstOrderAt,
              lastOrderAt: snapshot.lastOrderAt,
              ordersCount: snapshot.ordersCount,
              totalSpentCents: snapshot.totalSpentCents,
              avgTicketCents: snapshot.avgTicketCents,
              status: snapshot.status,
              frequencyDaysAvg: snapshot.frequencyDaysAvg ? Number(snapshot.frequencyDaysAvg) : null,
            },
            recentOrders: ordersWithItems,
          };
        }),

      campaigns: router({
        list: restaurantProcedure.query(async ({ ctx }) => {
          const restaurant = await db.getRestaurantByUserId(ctx.user.id);
          if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
          return db.getCrmCampaignsByRestaurant(restaurant.id);
        }),

        create: restaurantProcedure
          .input(
            z.object({
              title: z.string().min(1),
              messageText: z.string().min(1),
              imageUrl: z.string().optional(),
              targetSegment: z.enum(['ALL', 'NEW', 'RECURRING', 'INACTIVE', 'VIP']).default('ALL'),
            })
          )
          .mutation(async ({ ctx, input }) => {
            const restaurant = await db.getRestaurantByUserId(ctx.user.id);
            if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

            await db.createCrmCampaign({
              restaurantId: restaurant.id,
              title: input.title,
              messageText: input.messageText,
              imageUrl: input.imageUrl || null,
              targetSegment: input.targetSegment,
              createdByUserId: ctx.user.id,
              sentAt: null,
            });

            return { success: true };
          }),
      }),
    }),
  }),

  // ============================================
  // CRM - ADMIN LEGACY
  // ============================================
  adminLegacyCrm: router({
    crm: router({
      overview: adminProcedure.query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Buscar todos os restaurantes aprovados
        const restaurants = await db.getApprovedRestaurants();

        const overview = await Promise.all(
          restaurants.map(async (restaurant) => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Total de clientes
            const totalCustomersResult = await dbInstance
              .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const totalCustomers = totalCustomersResult[0]?.count || 0;

            // Clientes ativos
            const activeCustomersResult = await dbInstance
              .select({ count: sql<number>`COUNT(DISTINCT ${orders.customerId})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const activeCustomers = activeCustomersResult[0]?.count || 0;

            // Pedidos últimos 30 dias
            const orders30dResult = await dbInstance
              .select({ count: sql<number>`COUNT(*)` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const orders30d = orders30dResult[0]?.count || 0;

            // Ticket médio
            const avgTicketResult = await dbInstance
              .select({ avg: sql<number>`AVG(${orders.total})` })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.createdAt} >= ${thirtyDaysAgo}`,
                  sql`${orders.status} != 'cancelled'`
                )
              );
            const avgTicketCents = Math.round(avgTicketResult[0]?.avg || 0);

            // Último pedido
            const lastOrderResult = await dbInstance
              .select({ lastOrderAt: orders.createdAt })
              .from(orders)
              .where(
                and(
                  sql`${orders.restaurantId} = ${restaurant.id}`,
                  sql`${orders.status} != 'cancelled'`
                )
              )
              .orderBy(sql`${orders.createdAt} DESC`)
              .limit(1);
            const lastOrderAt = lastOrderResult[0]?.lastOrderAt || null;

            return {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              totalCustomers,
              activeCustomers,
              orders30d,
              avgTicketCents,
              lastOrderAt,
            };
          })
        );

        return { restaurants: overview };
      }),

      recompute: adminProcedure
        .input(z.object({ restaurantId: z.number().optional() }))
        .mutation(async ({ input }) => {
          const { recomputeStats } = await import('./modules/crm/crmStats.service');

          if (input.restaurantId) {
            // Recomputar apenas um restaurante
            const result = await recomputeStats(input.restaurantId);
            return {
              success: true,
              restaurantId: input.restaurantId,
              ...result,
            };
          } else {
            // Recomputar todos os restaurantes
            const restaurants = await db.getApprovedRestaurants();
            const results = await Promise.all(
              restaurants.map(async (restaurant) => {
                const result = await recomputeStats(restaurant.id);
                return {
                  restaurantId: restaurant.id,
                  restaurantName: restaurant.name,
                  ...result,
                };
              })
            );

            const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
            const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

            return {
              success: true,
              totalProcessed,
              totalErrors,
              results,
            };
          }
        }),
    }),
  }),

});

export type AppRouter = typeof appRouter;
