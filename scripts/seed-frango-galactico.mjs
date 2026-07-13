import "dotenv/config";
import mysql from "mysql2/promise";

const products = [
  ["Balde Galactico 10 pedacos", "Nosso balde classico com 10 pedacos de frango super crocante.", "Baldes", 5990, "/assets/product-balde-D5KbkVCK.jpg", true],
  ["Balde Cosmo Familia 16 pedacos", "Balde generoso para dividir com a tripulacao inteira.", "Baldes", 8990, "/assets/product-balde-D5KbkVCK.jpg", true],
  ["Galactico Burger Duplo", "Burger duplo com queijo, molho da casa e crocancia intergalactica.", "Burgers", 3290, "/assets/product-burger-DZ0zNbCz.jpg", true],
  ["Cheese Nebulosa", "Burger com queijo cremoso, pao macio e molho especial.", "Burgers", 2690, "/assets/product-burger-DZ0zNbCz.jpg", true],
  ["Marte Bacon Burger", "Burger com bacon crocante, queijo e barbecue.", "Burgers", 3490, "/assets/product-burger-DZ0zNbCz.jpg", false],
  ["Combo Astronauta", "Burger, fritas e bebida para uma missao completa.", "Combos", 4290, "/assets/product-combo-DSwPja3F.jpg", true],
  ["Combo Foguete Duplo", "Dois lanches, acompanhamentos e bebida para duas pessoas.", "Combos", 7990, "/assets/product-combo-DSwPja3F.jpg", true],
  ["Frango Frito Cosmo 6p", "Seis pedacos dourados e crocantes.", "Frango Frito", 3990, "/assets/product-balde-D5KbkVCK.jpg", false],
  ["Wings Orbita Picante", "Asinhas picantes com molho da casa.", "Wings", 2990, "/assets/product-balde-D5KbkVCK.jpg", false],
  ["Nuggets Estelares", "Nuggets crocantes para beliscar sem pressa.", "Nuggets", 2190, "/assets/product-balde-D5KbkVCK.jpg", false],
  ["Batata Meteoro", "Batata frita sequinha e crocante.", "Acompanhamentos", 1590, "/assets/product-combo-DSwPja3F.jpg", false],
  ["Milkshake Cometa Chocolate", "Milkshake cremoso de chocolate.", "Sobremesas", 1890, "/assets/product-milkshake-D5aKb9u6.jpg", true],
  ["Refrigerante Lata", "Bebida gelada para acompanhar sua missao.", "Bebidas", 690, "/assets/product-milkshake-D5aKb9u6.jpg", false],
  ["Combo Kids Meteoro", "Combo infantil com lanche, acompanhamento e brinde.", "Kids", 2690, "/assets/product-combo-DSwPja3F.jpg", false],
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
    ["rest_frango_galactico", "Frango Galactico", "contato@frangogalactico.com", "senha123", "(11) 99999-4317"]
  );

  return getOne("SELECT id FROM users WHERE openId = ?", ["rest_frango_galactico"]);
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
      "Frango Galactico",
      "frango-galactico",
      "O melhor frango das galaxias, com entrega rapida e cardapio controlado pelo Chamo.",
      "00.000.000/0001-00",
      "(11) 99999-4317",
      "contato@frangogalactico.com",
      "/assets/logo-frango-ktDjBhpo.png",
      "/assets/hero-banner-Cy0DQ7eI.jpg",
      "#FFC72C",
      "Baldes crocantes, burgers e combos para pedir direto da sua base.",
      "Rua das Estrelas",
      "42",
      "Centro",
      "Sao Paulo",
      "SP",
      "01000-000",
      2,
      JSON.stringify({ todos: "11:00-23:00" }),
      599,
      30,
      2000,
      490,
      500,
    ]
  );

  return getOne("SELECT id FROM restaurants WHERE slug = ?", ["frango-galactico"]);
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
       SET categoryId = ?, description = ?, price = ?, imageUrl = ?, isAvailable = true, isFeatured = ?, preparationTime = 30
       WHERE id = ?`,
      [categoryId, description, itemPrice, imageUrl, isFeatured, existing.id]
    );
    return;
  }

  await connection.execute(
    `INSERT INTO menuItems
      (restaurantId, categoryId, name, description, price, imageUrl, isAvailable, isFeatured, preparationTime)
     VALUES (?, ?, ?, ?, ?, ?, true, ?, 30)`,
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

  console.log("Frango Galactico pronto no motor do Chamo: slug frango-galactico");
} finally {
  await connection.end();
}
