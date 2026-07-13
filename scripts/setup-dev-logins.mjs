import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const devUsers = [
  {
    openId: "admin_1",
    name: "Administrador",
    email: "admin@chamo.com",
    password: "admin123",
    phone: "(11) 99999-9999",
    userType: "admin",
    role: "admin",
  },
  {
    openId: "rest_pizza_1",
    name: "Pizzaria Bella Napoli",
    email: "contato@bellanapoli.com",
    password: "senha123",
    phone: "(11) 98765-4321",
    userType: "restaurante",
    role: "user",
    restaurant: {
      name: "Pizzaria Bella Napoli",
      slug: "pizzaria-bella-napoli",
      categoryId: 1,
    },
  },
  {
    openId: "rest_burger_1",
    name: "Burger House",
    email: "contato@burgerhouse.com",
    password: "senha123",
    phone: "(11) 98765-4322",
    userType: "restaurante",
    role: "user",
    restaurant: {
      name: "Burger House",
      slug: "burger-house",
      categoryId: 2,
    },
  },
  {
    openId: "rest_sushi_1",
    name: "Sushi Master",
    email: "contato@sushimaster.com",
    password: "senha123",
    phone: "(11) 98765-4323",
    userType: "restaurante",
    role: "user",
    restaurant: {
      name: "Sushi Master",
      slug: "sushi-master",
      categoryId: 3,
    },
  },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  for (const user of devUsers) {
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [user.email]
    );

    let userId = existing[0]?.id;

    if (!userId) {
      const [result] = await connection.query(
        `INSERT INTO users (openId, name, email, password, phone, userType, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.openId,
          user.name,
          user.email,
          user.password,
          user.phone,
          user.userType,
          user.role,
        ]
      );
      userId = result.insertId;
      console.log(`✓ Usuário criado: ${user.email}`);
    } else {
      await connection.query(
        `UPDATE users SET openId = ?, name = ?, password = ?, phone = ?, userType = ?, role = ?
         WHERE id = ?`,
        [
          user.openId,
          user.name,
          user.password,
          user.phone,
          user.userType,
          user.role,
          userId,
        ]
      );
      console.log(`✓ Usuário atualizado: ${user.email}`);
    }

    if (!user.restaurant) continue;

    const [existingRestaurant] = await connection.query(
      "SELECT id FROM restaurants WHERE slug = ? LIMIT 1",
      [user.restaurant.slug]
    );

    if (existingRestaurant[0]?.id) {
      await connection.query(
        "UPDATE restaurants SET userId = ?, status = 'approved', approvedAt = NOW() WHERE id = ?",
        [userId, existingRestaurant[0].id]
      );
      console.log(`✓ Restaurante vinculado: ${user.restaurant.name}`);
      continue;
    }

    await connection.query(
      `INSERT INTO restaurants (
        userId, name, slug, description, cpfCnpj, phone, email,
        street, number, neighborhood, city, state, zipCode, categoryId,
        openingHours, deliveryFee, averagePrepTime, minimumOrder, status, approvedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
      [
        userId,
        user.restaurant.name,
        user.restaurant.slug,
        `${user.restaurant.name} - conta de desenvolvimento`,
        "00.000.000/0001-00",
        user.phone,
        user.email,
        "Rua Exemplo",
        "100",
        "Centro",
        "São Paulo",
        "SP",
        "01000-000",
        user.restaurant.categoryId,
        JSON.stringify({ todos: "11:00-23:00" }),
        600,
        35,
        1500,
      ]
    );
    console.log(`✓ Restaurante criado: ${user.restaurant.name}`);
  }

  console.log("\n✅ Contas de desenvolvimento prontas.");
} finally {
  await connection.end();
}
