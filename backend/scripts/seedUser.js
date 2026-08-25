const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node seedUser.js <email> <password>');
    process.exit(1);
  }

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const usuario = await prisma.usuario.upsert({
    where: { email: email },
    update: { password_hash },
    create: {
      email,
      password_hash
    }
  });

  console.log(`Usuario creado/actualizado exitosamente: ${usuario.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
