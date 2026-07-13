import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Iniciando seed do banco de dados...");

try {
  // Criar categorias de restaurantes
  console.log("Criando categorias de restaurantes...");
  await db.insert(schema.restaurantCategories).values([
    { name: "Pizza", slug: "pizza", icon: "🍕", order: 1, isActive: true },
    { name: "Hambúrguer", slug: "hamburguer", icon: "🍔", order: 2, isActive: true },
    { name: "Japonesa", slug: "japonesa", icon: "🍱", order: 3, isActive: true },
    { name: "Italiana", slug: "italiana", icon: "🍝", order: 4, isActive: true },
    { name: "Brasileira", slug: "brasileira", icon: "🍲", order: 5, isActive: true },
    { name: "Lanches", slug: "lanches", icon: "🥪", order: 6, isActive: true },
    { name: "Sobremesas", slug: "sobremesas", icon: "🍰", order: 7, isActive: true },
  ]);

  // Criar usuários restaurantes
  console.log("Criando usuários de restaurantes...");
  await db.insert(schema.users).values([
    {
      openId: "rest_pizza_1",
      name: "Pizzaria Bella Napoli",
      email: "contato@bellanapoli.com",
      password: "senha123",
      phone: "(11) 98765-4321",
      userType: "restaurante",
      role: "user",
    },
    {
      openId: "rest_burger_1",
      name: "Burger House",
      email: "contato@burgerhouse.com",
      password: "senha123",
      phone: "(11) 98765-4322",
      userType: "restaurante",
      role: "user",
    },
    {
      openId: "rest_sushi_1",
      name: "Sushi Master",
      email: "contato@sushimaster.com",
      password: "senha123",
      phone: "(11) 98765-4323",
      userType: "restaurante",
      role: "user",
    },
  ]);

  // Buscar IDs dos usuários criados
  const users = await db.select().from(schema.users).where(schema.users.userType, "restaurante");
  const [pizzaUser, burgerUser, sushiUser] = users;

  // Criar restaurantes
  console.log("Criando restaurantes...");
  await db.insert(schema.restaurants).values([
    {
      userId: pizzaUser.id,
      name: "Pizzaria Bella Napoli",
      slug: "pizzaria-bella-napoli",
      description: "As melhores pizzas artesanais da cidade, feitas com ingredientes frescos e massa tradicional italiana.",
      cpfCnpj: "12.345.678/0001-90",
      phone: "(11) 98765-4321",
      email: "contato@bellanapoli.com",
      street: "Rua das Pizzas",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      categoryId: 1,
      openingHours: JSON.stringify({ seg_sex: "18:00-23:00", sab_dom: "12:00-23:00" }),
      deliveryFee: 500,
      averagePrepTime: 40,
      minimumOrder: 2000,
      status: "approved",
      approvedAt: new Date(),
      rating: 450,
      totalReviews: 120,
    },
    {
      userId: burgerUser.id,
      name: "Burger House",
      slug: "burger-house",
      description: "Hambúrgueres artesanais com carne de primeira qualidade e ingredientes selecionados.",
      cpfCnpj: "12.345.678/0001-91",
      phone: "(11) 98765-4322",
      email: "contato@burgerhouse.com",
      street: "Av. dos Hambúrgueres",
      number: "456",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-568",
      categoryId: 2,
      openingHours: JSON.stringify({ todos: "11:00-23:00" }),
      deliveryFee: 600,
      averagePrepTime: 35,
      minimumOrder: 1500,
      status: "approved",
      approvedAt: new Date(),
      rating: 480,
      totalReviews: 95,
    },
    {
      userId: sushiUser.id,
      name: "Sushi Master",
      slug: "sushi-master",
      description: "Culinária japonesa autêntica com os melhores peixes frescos e receitas tradicionais.",
      cpfCnpj: "12.345.678/0001-92",
      phone: "(11) 98765-4323",
      email: "contato@sushimaster.com",
      street: "Rua Japão",
      number: "789",
      neighborhood: "Liberdade",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-569",
      categoryId: 3,
      openingHours: JSON.stringify({ ter_dom: "18:00-23:00" }),
      deliveryFee: 800,
      averagePrepTime: 45,
      minimumOrder: 3000,
      status: "approved",
      approvedAt: new Date(),
      rating: 490,
      totalReviews: 150,
    },
  ]);

  // Buscar restaurantes criados
  const restaurants = await db.select().from(schema.restaurants);
  const [pizzaRest, burgerRest, sushiRest] = restaurants;

  // Criar categorias de cardápio para Pizzaria
  console.log("Criando categorias de cardápio...");
  await db.insert(schema.menuCategories).values([
    { restaurantId: pizzaRest.id, name: "Pizzas Tradicionais", order: 1, isActive: true },
    { restaurantId: pizzaRest.id, name: "Pizzas Especiais", order: 2, isActive: true },
    { restaurantId: pizzaRest.id, name: "Bebidas", order: 3, isActive: true },
    { restaurantId: burgerRest.id, name: "Hambúrgueres", order: 1, isActive: true },
    { restaurantId: burgerRest.id, name: "Acompanhamentos", order: 2, isActive: true },
    { restaurantId: burgerRest.id, name: "Bebidas", order: 3, isActive: true },
    { restaurantId: sushiRest.id, name: "Sushis", order: 1, isActive: true },
    { restaurantId: sushiRest.id, name: "Sashimis", order: 2, isActive: true },
    { restaurantId: sushiRest.id, name: "Combinados", order: 3, isActive: true },
  ]);

  // Buscar categorias criadas
  const menuCategories = await db.select().from(schema.menuCategories);

  // Criar itens do cardápio - Pizzaria
  console.log("Criando itens do cardápio...");
  await db.insert(schema.menuItems).values([
    {
      restaurantId: pizzaRest.id,
      categoryId: menuCategories[0].id,
      name: "Pizza Margherita",
      description: "Molho de tomate, mussarela, manjericão fresco e azeite",
      price: 4500,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 40,
    },
    {
      restaurantId: pizzaRest.id,
      categoryId: menuCategories[0].id,
      name: "Pizza Calabresa",
      description: "Molho de tomate, mussarela, calabresa e cebola",
      price: 4800,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 40,
    },
    {
      restaurantId: pizzaRest.id,
      categoryId: menuCategories[1].id,
      name: "Pizza Quatro Queijos",
      description: "Mussarela, gorgonzola, parmesão e provolone",
      price: 5500,
      isAvailable: true,
      isFeatured: false,
      preparationTime: 40,
    },
    {
      restaurantId: pizzaRest.id,
      categoryId: menuCategories[2].id,
      name: "Refrigerante Lata",
      description: "Coca-Cola, Guaraná ou Fanta",
      price: 500,
      isAvailable: true,
      isFeatured: false,
    },
  ]);

  // Criar itens do cardápio - Burger House
  await db.insert(schema.menuItems).values([
    {
      restaurantId: burgerRest.id,
      categoryId: menuCategories[3].id,
      name: "Classic Burger",
      description: "Pão brioche, hambúrguer 180g, queijo cheddar, alface, tomate e molho especial",
      price: 2800,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 30,
    },
    {
      restaurantId: burgerRest.id,
      categoryId: menuCategories[3].id,
      name: "Bacon Burger",
      description: "Pão brioche, hambúrguer 180g, bacon crocante, queijo cheddar e molho barbecue",
      price: 3200,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 30,
    },
    {
      restaurantId: burgerRest.id,
      categoryId: menuCategories[4].id,
      name: "Batata Frita",
      description: "Porção de batatas fritas crocantes",
      price: 1200,
      isAvailable: true,
      isFeatured: false,
    },
  ]);

  // Criar itens do cardápio - Sushi Master
  await db.insert(schema.menuItems).values([
    {
      restaurantId: sushiRest.id,
      categoryId: menuCategories[6].id,
      name: "Sushi de Salmão",
      description: "8 unidades de sushi com salmão fresco",
      price: 3500,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 45,
    },
    {
      restaurantId: sushiRest.id,
      categoryId: menuCategories[7].id,
      name: "Sashimi Misto",
      description: "12 fatias de sashimi variado (salmão, atum e peixe branco)",
      price: 4500,
      isAvailable: true,
      isFeatured: true,
      preparationTime: 45,
    },
    {
      restaurantId: sushiRest.id,
      categoryId: menuCategories[8].id,
      name: "Combinado Especial",
      description: "20 peças variadas de sushi e sashimi",
      price: 7500,
      isAvailable: true,
      isFeatured: false,
      preparationTime: 50,
    },
  ]);

  // Criar adicionais
  console.log("Criando adicionais...");
  await db.insert(schema.additionals).values([
    { restaurantId: pizzaRest.id, name: "Borda recheada", price: 800, isAvailable: true },
    { restaurantId: pizzaRest.id, name: "Queijo extra", price: 500, isAvailable: true },
    { restaurantId: burgerRest.id, name: "Bacon extra", price: 400, isAvailable: true },
    { restaurantId: burgerRest.id, name: "Queijo extra", price: 300, isAvailable: true },
    { restaurantId: sushiRest.id, name: "Shoyu", price: 0, isAvailable: true },
    { restaurantId: sushiRest.id, name: "Wasabi", price: 0, isAvailable: true },
  ]);

  // Criar usuário admin
  console.log("Criando usuário administrador...");
  await db.insert(schema.users).values({
    openId: "admin_1",
    name: "Administrador",
    email: "admin@chamo.com",
    password: "admin123",
    phone: "(11) 99999-9999",
    userType: "admin",
    role: "admin",
  });

  // Criar banner
  console.log("Criando banners...");
  await db.insert(schema.banners).values([
    {
      title: "Bem-vindo ao Chamô",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
      order: 1,
      isActive: true,
    },
    {
      title: "Delivery rápido e fácil",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop",
      order: 2,
      isActive: true,
    },
  ]);

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📝 Credenciais criadas:");
  console.log("Admin: admin@chamo.com / admin123");
  console.log("Pizzaria: contato@bellanapoli.com / senha123");
  console.log("Burger: contato@burgerhouse.com / senha123");
  console.log("Sushi: contato@sushimaster.com / senha123");
  
} catch (error) {
  console.error("❌ Erro ao executar seed:", error);
} finally {
  await connection.end();
  process.exit(0);
}
