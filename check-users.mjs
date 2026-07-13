import * as db from './server/db.ts';

async function main() {
  try {
    const users = await db.getAllUsers();
    console.log('Usuários no banco:');
    users.forEach(u => {
      console.log(`- ${u.email || u.cpf} (userType: ${u.userType}, openId: ${u.openId})`);
    });
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
