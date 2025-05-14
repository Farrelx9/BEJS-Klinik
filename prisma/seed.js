const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const userAdmin = require("./seeder/admin_seeder");
const userDokter = require("./seeder/dokter_seeder");

async function main() {
  // Run seeders
  await userAdmin(prisma);
  await userDokter(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
