# Documentação de Implementação do CRM - Chamô

## ETAPA 0 - LEVANTAMENTO

### Stack Tecnológica

- **ORM**: Drizzle ORM v0.44.5
- **Database**: MySQL (mysql2)
- **Backend**: Express + tRPC v11.6.0
- **Frontend**: React 19 + TypeScript + Wouter (roteamento)
- **Autenticação**: JWT via cookies HTTP-only (Manus SDK)

### Estrutura de Pastas

```
chamo/
├── drizzle/
│   ├── schema.ts          # Schema do banco (Drizzle)
│   └── migrations/         # Migrações SQL
├── server/
│   ├── routers.ts          # Rotas tRPC principais
│   ├── db.ts              # Funções auxiliares de DB
│   └── _core/
│       ├── context.ts     # Contexto tRPC (user)
│       └── trpc.ts        # Setup tRPC (protectedProcedure, etc)
└── client/
    └── src/
        ├── pages/         # Páginas React
        └── components/   # Componentes React
```

### Entidades Existentes e Campos Relevantes

#### 1. `users` (Tabela única para todos os tipos)
- `id` (PK, autoincrement)
- `openId` (unique, varchar 64) - Identificador do Manus SDK
- `name` (text)
- `email` (varchar 320)
- `password` (varchar 255) - Para restaurante/admin
- `cpf` (varchar 14, unique) - Para cliente
- `phone` (varchar 20)
- `userType` (enum: "cliente" | "restaurante" | "admin")
- `role` (enum: "user" | "admin")
- `createdAt`, `updatedAt`, `lastSignedIn`

**Observação**: Cliente faz login por CPF (sem senha). Restaurante/admin por email+senha.

#### 2. `restaurants`
- `id` (PK)
- `userId` (FK → users.id, unique) - **Chave para multi-tenant**
- `name`, `slug`, `description`
- `status` (enum: "pending" | "approved" | "rejected" | "suspended")
- `createdAt`, `updatedAt`

**Multi-tenant**: Cada restaurante está vinculado a um `userId`. Para obter o restaurante do usuário logado: `getRestaurantByUserId(ctx.user.id)`.

#### 3. `orders`
- `id` (PK)
- `orderNumber` (varchar 20, unique)
- `customerId` (FK → users.id) - Cliente que fez o pedido
- `restaurantId` (FK → restaurants.id) - **Chave para multi-tenant**
- `subtotal`, `deliveryFee`, `serviceFee`, `discount`, `total` (todos em centavos)
- `status` (enum: "received" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled")
- `createdAt`, `updatedAt`, `deliveredAt`

#### 4. `orderItems`
- `id` (PK)
- `orderId` (FK → orders.id)
- `itemId` (FK → menuItems.id, nullable)
- `comboId` (FK → combos.id, nullable)
- `name`, `quantity`
- `unitPrice`, `subtotal` (centavos)
- `notes`

### Sistema de Autenticação

#### Contexto tRPC
- `ctx.user: User | null` - Vem do `createContext()` que chama `sdk.authenticateRequest(req)`
- Se não autenticado, `ctx.user = null`

#### Middlewares de Proteção

1. **`protectedProcedure`** (server/_core/trpc.ts)
   - Requer `ctx.user !== null`
   - Lança `UNAUTHORIZED` se não autenticado

2. **`restaurantProcedure`** (server/routers.ts:19-28)
   ```typescript
   const restaurantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
     const restaurant = await db.getRestaurantByUserId(ctx.user.id);
     if (!restaurant && ctx.user.userType !== 'restaurante') {
       throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso apenas para restaurantes' });
     }
     return next({ ctx });
   });
   ```
   - Verifica se usuário tem restaurante vinculado
   - Para obter `restaurantId` em rotas: `const restaurant = await db.getRestaurantByUserId(ctx.user.id);`

3. **`adminProcedure`** (server/routers.ts:11-16)
   ```typescript
   const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
     if (ctx.user.role !== 'admin' && ctx.user.userType !== 'admin') {
       throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
     }
     return next({ ctx });
   });
   ```

### Padrão de Rotas/API

#### Estrutura tRPC
- Rotas organizadas em `router()` aninhados
- Exemplo: `appRouter.restaurants.getMine` → `GET /api/trpc/restaurants.getMine`
- Rotas do restaurante usam `restaurantProcedure`
- Rotas admin usam `adminProcedure`

#### Exemplo de Rota Protegida Multi-tenant
```typescript
getMine: restaurantProcedure.query(async ({ ctx }) => {
  return db.getRestaurantByUserId(ctx.user.id);
}),
```

### Como Checar Permissões/Tenant

#### Para Restaurante
```typescript
// 1. Obter restaurante do usuário logado
const restaurant = await db.getRestaurantByUserId(ctx.user.id);
if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

// 2. Usar restaurant.id em queries (garantir que pedidos/clientes pertencem ao restaurante)
const orders = await db.getOrdersByRestaurant(restaurant.id);
```

#### Para Admin
```typescript
// Admin pode ver todos os restaurantes
// Usar filtro opcional por restaurantId se necessário
if (ctx.user.role === 'admin') {
  // Acesso total
}
```

### Painel do Restaurante

- **Rota**: `/painel-restaurante`
- **Componente**: `client/src/pages/RestaurantDashboard.tsx`
- **Sidebar**: Menu lateral com abas (pedidos, cardápio, promoções, etc.)
- **Padrão**: Usa `trpc` hooks do cliente para chamar rotas

### Padrões de Código

1. **Funções DB**: Todas em `server/db.ts`, retornam arrays ou objetos
2. **Validação**: Zod schemas nos inputs tRPC
3. **Erros**: `TRPCError` com códigos apropriados
4. **Valores monetários**: Sempre em **centavos** (int)

---

## PLANO DE IMPLEMENTAÇÃO

### ETAPA 1 - Modelo de Dados (Migração)

Criar tabelas novas (não modificar existentes):
- `crm_customer_snapshot` - Snapshot de estatísticas do cliente
- `crm_campaign` - Campanhas de marketing
- `crm_campaign_log` - Log de envio de campanhas

### ETAPA 2 - Serviço de Stats

- `server/modules/crm/crmStats.service.ts`
- Função `recomputeStats(restaurantId)` que calcula snapshots
- Endpoint para disparar recompute (admin ou restaurante)

### ETAPA 3 - API tRPC

- `appRouter.restaurant.crm.*` - Rotas do restaurante
- `appRouter.admin.crm.*` - Rotas do admin
- Todas protegidas com multi-tenant

### ETAPA 4 - UI

- Adicionar "CRM" no sidebar do `RestaurantDashboard`
- Páginas: Overview, Clientes, Detalhe Cliente, Campanhas
- Rotas: `/painel-restaurante/crm/*`

### ETAPA 5 - Testes e Documentação

- Testar isolamento multi-tenant
- Documentar como rodar migrações e recompute

---

## OBSERVAÇÕES IMPORTANTES

1. **NÃO modificar** tabelas/rotas existentes
2. **Multi-tenant**: Sempre filtrar por `restaurantId` obtido via `getRestaurantByUserId(ctx.user.id)`
3. **Cliente = users com userType='cliente'**: Usar `orders.customerId` para identificar clientes
4. **Valores em centavos**: Todos os campos monetários são `int` em centavos
5. **Login cliente**: Continua simples (CPF), sem senha/SMS

---

## IMPLEMENTAÇÃO COMPLETA

### Arquivos Criados/Modificados

#### Backend
- `drizzle/schema.ts` - Adicionadas tabelas CRM
- `server/db.ts` - Funções auxiliares CRM
- `server/modules/crm/crmStats.service.ts` - Serviço de cálculo de estatísticas
- `server/routers.ts` - Rotas tRPC do CRM (restaurante e admin)

#### Frontend
- `client/src/components/CrmOverview.tsx` - Overview do CRM
- `client/src/components/CrmCustomersList.tsx` - Lista de clientes
- `client/src/components/CrmCustomerDetail.tsx` - Detalhe do cliente
- `client/src/components/CrmCampaigns.tsx` - Gestão de campanhas
- `client/src/components/CrmWrapper.tsx` - Wrapper de navegação
- `client/src/pages/RestaurantDashboard.tsx` - Adicionado menu CRM
- `client/src/App.tsx` - Adicionada rota de detalhe do cliente
- `client/src/lib/utils.ts` - Adicionada função formatCurrency

### Como Rodar Migrações

1. Configure a variável de ambiente `DATABASE_URL` no seu `.env`
2. Execute: `pnpm db:push`
   - Isso gera e aplica a migração automaticamente

### Como Disparar Recompute de Stats

#### Via Admin (tRPC)
```typescript
// Recomputar todos os restaurantes
trpc.admin.crm.recompute.useMutation({ restaurantId: undefined })

// Recomputar restaurante específico
trpc.admin.crm.recompute.useMutation({ restaurantId: 1 })
```

#### Via Código
```typescript
import { recomputeStats } from './server/modules/crm/crmStats.service';

// Recomputar stats de um restaurante
await recomputeStats(restaurantId);
```

### Rotas e Telas

#### Painel do Restaurante
- **Rota principal**: `/painel-restaurante` → Tab "CRM"
- **Sub-seções**:
  - Overview: Métricas gerais e últimos clientes ativos
  - Clientes: Lista paginada com filtros (status, busca)
  - Campanhas: Criação e listagem de campanhas
- **Detalhe do cliente**: `/painel-restaurante/crm/clientes/:id`

#### Admin
- **Rota**: `/admin` → Seção CRM (a ser implementada na UI do admin)
- **Endpoints disponíveis**:
  - `admin.crm.overview` - Visão geral por restaurante
  - `admin.crm.recompute` - Disparar recompute de stats

### Estrutura das Rotas tRPC

```
appRouter
├── restaurant.crm
│   ├── overview
│   ├── customers (lista paginada)
│   ├── getCustomer (detalhe)
│   └── campaigns
│       ├── list
│       └── create
└── admin.crm
    ├── overview
    └── recompute
```

### Próximos Passos (Opcional)

1. Adicionar UI de recompute no painel do restaurante
2. Implementar envio real de campanhas (WhatsApp/Email)
3. Adicionar gráficos e análises mais detalhadas
4. Implementar segmentação avançada de clientes
5. Adicionar notificações push para campanhas
