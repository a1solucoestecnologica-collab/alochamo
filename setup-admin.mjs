#!/usr/bin/env node

/**
 * Script para configurar usuário admin para login OAuth
 * Verifica se o usuário existe e atualiza o userType para 'admin'
 */

import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "chamo",
});

try {
  // Listar todos os usuários
  console.log("\n📋 Usuários no banco de dados:");
  const [users] = await connection.query(
    "SELECT id, email, cpf, userType, openId FROM users ORDER BY createdAt DESC"
  );

  users.forEach((u) => {
    console.log(
      `  - ID: ${u.id}, Email: ${u.email}, CPF: ${u.cpf}, Type: ${u.userType}, OpenID: ${u.openId ? "✓" : "✗"}`
    );
  });

  // Procurar por usuário admin
  console.log("\n🔍 Procurando por usuário admin...");
  const [adminUsers] = await connection.query(
    "SELECT id, email, cpf, userType FROM users WHERE email LIKE '%admin%' OR email LIKE '%jalexander%' OR userType = 'admin'"
  );

  if (adminUsers.length > 0) {
    console.log(`✓ Encontrado ${adminUsers.length} usuário(s) admin:`);
    adminUsers.forEach((u) => {
      console.log(`  - ${u.email} (Type: ${u.userType})`);
    });

    // Se não for admin, atualizar
    for (const user of adminUsers) {
      if (user.userType !== "admin") {
        console.log(`\n⚙️ Atualizando ${user.email} para admin...`);
        await connection.query("UPDATE users SET userType = ? WHERE id = ?", [
          "admin",
          user.id,
        ]);
        console.log(`✓ Usuário atualizado para admin`);
      }
    }
  } else {
    console.log("✗ Nenhum usuário admin encontrado");
    console.log(
      "\n💡 Dica: Crie um usuário admin fazendo login com OAuth primeiro,"
    );
    console.log(
      "   depois execute este script para marcar como admin no banco."
    );
  }

  console.log("\n✅ Script concluído!\n");
} catch (error) {
  console.error("❌ Erro:", error.message);
} finally {
  await connection.end();
}
