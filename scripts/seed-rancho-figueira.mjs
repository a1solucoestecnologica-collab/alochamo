import "dotenv/config";
import mysql from "mysql2/promise";

const products = [
  ["Picanha na Chapa", "Picanha fatiada na chapa, servida no ponto da casa com acompanhamentos.", "Carnes na Chapa", 8990, "/assets/product-picanha-DGhvMPMe.jpg", true],
  ["Alcatra Acebolada", "Alcatra macia acebolada, feita na chapa para dividir.", "Carnes na Chapa", 6990, "/assets/product-alcatra-Djbbjewl.jpg", true],
  ["Alcatra Cremosa", "Alcatra com creme especial do Rancho e finalizacao quente.", "Carnes na Chapa", 7490, "/assets/product-alcatra-Djbbjewl.jpg", false],
  ["Calabresa Acebolada", "Calabresa dourada com cebola puxada na chapa.", "Porcoes", 3990, "/assets/product-calabresa-pae0t6di.jpg", true],
  ["Porquinho Alho e Oleo", "Porcao de porquinho ao alho e oleo, bem temperada.", "Porcoes", 5290, "/assets/product-porco-D-NWFIcm.jpg", false],
  ["Frango Crocante", "Porcao de frango crocante com tempero do Rancho.", "Frango", 4490, "/assets/product-frango-_nsaDnXr.jpg", true],
  ["Frango Desossado", "Frango desossado, suculento e pronto para compartilhar.", "Frango", 4990, "/assets/product-frango-_nsaDnXr.jpg", false],
  ["Petisco de Frango", "Petisco de frango para acompanhar bebida gelada.", "Frango", 3790, "/assets/product-frango-_nsaDnXr.jpg", false],
  ["File de Tilapia", "File de tilapia empanado, sequinho e crocante.", "Peixes", 5490, "/assets/product-tilapia-Bjfr4k0U.jpg", true],
  ["Ceviche de Tilapia", "Tilapia fresca em preparo leve e citrico.", "Peixes", 4890, "/assets/product-ceviche-DnkLgVO0.jpg", false],
  ["Bolinho de Bacalhau", "Bolinho de bacalhau crocante por fora e cremoso por dentro.", "Bolinhos", 4290, "/assets/product-bolinhos-BozvSXZ8.jpg", true],
  ["Bolinho de Carne Seca", "Bolinho de carne seca com recheio generoso.", "Bolinhos", 3990, "/assets/product-bolinhos-BozvSXZ8.jpg", false],
  ["Bolinha de Queijo", "Bolinha de queijo dourada, ideal para abrir a mesa.", "Bolinhos", 3290, "/assets/product-bolinhos-BozvSXZ8.jpg", false],
  ["Coxinha de Costela", "Coxinha recheada com costela desfiada.", "Bolinhos", 3790, "/assets/product-bolinhos-BozvSXZ8.jpg", false],
  ["Batata Queijo e Bacon", "Batata palito com queijo cremoso e bacon crocante.", "Acompanhamentos", 3690, "/assets/product-batata-CxV1gzDM.jpg", true],
  ["Mandioca Queijo e Bacon", "Mandioca frita com queijo e bacon.", "Acompanhamentos", 3890, "/assets/product-mandioca-CHuRj9Ce.jpg", false],
  ["Polenta Queijo e Bacon", "Polenta frita com queijo e bacon.", "Acompanhamentos", 3490, "/assets/product-polenta-JqJtNaRG.jpg", false],
  ["Arroz Rancho", "Arroz da casa para acompanhar carnes e porcoes.", "Acompanhamentos", 1990, "/assets/product-arroz-CLMWgxFl.jpg", false],
];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nao configurado");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function getOne(sql, params) {
  const [rows] = await connection.execute(sql, params);
  return rows[0];
}

async function ensureUser() {
  await connection.execute(
    `INSERT INTO users (openId, name, email, password, phone, userType, role)
     VALUES (?, ?, ?, ?, ?, 'restaurante', 'user')
     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), userType = 'restaurante'`,
    ["rest_rancho_figueira", "Rancho Figueira", "contato@ranchofigueira.com", "senha123", "(11) 99999-4173"]
  );

  return getOne("SELECT id FROM users WHERE openId = ?", ["rest_rancho_figueira"]);
}

async function ensureRestaurant(userId) {
  await connection.execute(
    `INSERT INTO restaurants
      (userId, name, slug, description, cpfCnpj, phone, email, logoUrl, coverUrl, primaryColor, bio,
       street, number, neighborhood, city, state, zipCode, categoryId, openingHours,
       deliveryFee, averagePrepTime, minimumOrder, status, approvedAt, rating, totalReviews)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), description = VALUES(description), phone = VALUES(phone), email = VALUES(email),
       logoUrl = VALUES(logoUrl), coverUrl = VALUES(coverUrl), primaryColor = VALUES(primaryColor),
       bio = VALUES(bio), deliveryFee = VALUES(deliveryFee), averagePrepTime = VALUES(averagePrepTime),
       minimumOrder = VALUES(minimumOrder), status = 'approved', rating = VALUES(rating), totalReviews = VALUES(totalReviews)`,
    [
      userId,
      "Rancho Figueira",
      "rancho-figueira",
      "Carnes na chapa, porcoes generosas e petiscos de boteco controlados pelo Chamo.",
      "00.000.000/0001-73",
      "(11) 99999-4173",
      "contato@ranchofigueira.com",
      "/assets/rancho-logo.png",
      "/assets/hero-rancho-Cf1O0UuZ.jpg",
      "#7C2D12",
      "Picanha, alcatra, tilapia e porcoes fartas para pedir direto do Rancho.",
      "Estrada da Figueira",
      "173",
      "Centro",
      "Sao Paulo",
      "SP",
      "01000-000",
      2,
      JSON.stringify({ todos: "11:00-23:00" }),
      699,
      35,
      2500,
      490,
      320,
    ]
  );

  return getOne("SELECT id FROM restaurants WHERE slug = ?", ["rancho-figueira"]);
}

async function ensureMenuCategory(restaurantId, name, order) {
  const existing = await getOne(
    "SELECT id FROM menuCategories WHERE restaurantId = ? AND name = ? LIMIT 1",
    [restaurantId, name]
  );

  if (existing) {
    await connection.execute(
      "UPDATE menuCategories SET `order` = ?, isActive = true WHERE id = ?",
      [order, existing.id]
    );
    return existing.id;
  }

  const [result] = await connection.execute(
    "INSERT INTO menuCategories (restaurantId, name, `order`, isActive) VALUES (?, ?, ?, true)",
    [restaurantId, name, order]
  );
  return result.insertId;
}

async function ensureMenuItem(restaurantId, categoryId, product) {
  const [name, description, , itemPrice, imageUrl, isFeatured] = product;
  const existing = await getOne(
    "SELECT id FROM menuItems WHERE restaurantId = ? AND name = ? LIMIT 1",
    [restaurantId, name]
  );

  if (existing) {
    await connection.execute(
      `UPDATE menuItems
       SET categoryId = ?, description = ?, price = ?, imageUrl = ?, isAvailable = true, isFeatured = ?, preparationTime = 35
       WHERE id = ?`,
      [categoryId, description, itemPrice, imageUrl, isFeatured, existing.id]
    );
    return;
  }

  await connection.execute(
    `INSERT INTO menuItems
      (restaurantId, categoryId, name, description, price, imageUrl, isAvailable, isFeatured, preparationTime)
     VALUES (?, ?, ?, ?, ?, ?, true, ?, 35)`,
    [restaurantId, categoryId, name, description, itemPrice, imageUrl, isFeatured]
  );
}

try {
  const user = await ensureUser();
  const restaurant = await ensureRestaurant(user.id);
  const categoryNames = [...new Set(products.map((product) => product[2]))];
  const categoryIds = new Map();

  for (const [index, name] of categoryNames.entries()) {
    categoryIds.set(name, await ensureMenuCategory(restaurant.id, name, index + 1));
  }

  for (const product of products) {
    await ensureMenuItem(restaurant.id, categoryIds.get(product[2]), product);
  }

  console.log("Rancho Figueira pronto no motor do Chamo: slug rancho-figueira");
} finally {
  await connection.end();
}
