import "dotenv/config";
import mysql from "mysql2/promise";

const brendiMenuUrl = "https://pedido.brendi.com.br/om-sushi";
const fallbackCoverPhoto = "https://images.brendi.com.br/optimized/687388f26d7618231471fb19da13b1de";
const fallbackProducts = [
  ["Combinado 20 Pecas tradicional", "", "Destaques Promocionais", 5999, fallbackCoverPhoto, true],
  ["Combo de Salmao - 40 unidades", "8 Sashimi de Salmao 8 Uramaki de Salmao 8 Niguiri de Salmao 8 Jhou de Salmao macaricado 8 Hossomaki de Salmao", "Combinados", 11000, fallbackCoverPhoto, true],
];

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function priceToCents(value) {
  const normalized = String(value || "")
    .replace(/[^\d,]/g, "")
    .replace(",", ".");
  return Math.round(Number(normalized || 0) * 100);
}

async function fetchBrendiProducts() {
  const response = await fetch(brendiMenuUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Brendi retornou HTTP ${response.status}`);
  }

  const html = await response.text();
  const sectionRegex = /<section id="category-[\s\S]*?data-category="([^"]+)"[\s\S]*?<div class="products-list[^"]*"[^>]*>([\s\S]*?)(?=<\/section>)/g;
  const cardRegex = /data-cy="product-card-[^"]+"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?[\s\S]*?<span[^>]*>R\$\s*([^<]+)<\/span>[\s\S]*?<img[^>]+src="([^"]+)"/g;
  const parsedProducts = [];
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(html))) {
    const category = decodeHtml(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    let cardMatch;

    while ((cardMatch = cardRegex.exec(sectionBody))) {
      const name = decodeHtml(cardMatch[1]);
      const description = decodeHtml(cardMatch[2]);
      const itemPrice = priceToCents(cardMatch[3]);
      const imageUrl = cardMatch[4];

      if (!name || !itemPrice) continue;

      parsedProducts.push([
        name,
        description,
        category,
        itemPrice,
        imageUrl,
        category === "Destaques Promocionais" || parsedProducts.length < 6,
      ]);
    }
  }

  if (!parsedProducts.length) {
    throw new Error("Nenhum produto encontrado no cardapio Brendi");
  }

  return parsedProducts;
}

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
    ["rest_om_sushi", "OM Sushi", "contato@omsushi.com", "senha123", "(11) 99999-4322"]
  );

  return getOne("SELECT id FROM users WHERE openId = ?", ["rest_om_sushi"]);
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
      "OM Sushi",
      "om-sushi",
      "Sushi premium, sashimis, temakis e combinados controlados pelo Chamo.",
      "00.000.000/0001-22",
      "(11) 99999-4322",
      "contato@omsushi.com",
      "/assets/om-sushi-logo.jpeg",
      fallbackCoverPhoto,
      "#DC2626",
      "Sushi fresco, cortes bem feitos e combinados para pedir direto pelo site da casa.",
      "Rua do Sushi",
      "22",
      "Centro",
      "Sao Paulo",
      "SP",
      "01000-000",
      2,
      JSON.stringify({ todos: "18:00-23:30" }),
      799,
      35,
      3000,
      490,
      280,
    ]
  );

  return getOne("SELECT id FROM restaurants WHERE slug = ?", ["om-sushi"]);
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

async function resetMenu(restaurantId) {
  await connection.execute("DELETE FROM menuItems WHERE restaurantId = ?", [restaurantId]);
  await connection.execute("DELETE FROM menuCategories WHERE restaurantId = ?", [restaurantId]);
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
  let products = fallbackProducts;

  try {
    products = await fetchBrendiProducts();
    console.log(`Cardapio Brendi importado: ${products.length} produtos`);
  } catch (error) {
    console.warn("Nao foi possivel importar a Brendi, usando fallback:", error.message);
  }

  const user = await ensureUser();
  const restaurant = await ensureRestaurant(user.id);
  await resetMenu(restaurant.id);

  const categoryNames = [...new Set(products.map((product) => product[2]))];
  const categoryIds = new Map();

  for (const [index, name] of categoryNames.entries()) {
    categoryIds.set(name, await ensureMenuCategory(restaurant.id, name, index + 1));
  }

  for (const product of products) {
    await ensureMenuItem(restaurant.id, categoryIds.get(product[2]), product);
  }

  console.log("OM Sushi pronto no motor do Chamo: slug om-sushi");
} finally {
  await connection.end();
}
