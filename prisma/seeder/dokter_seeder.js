const { Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function userAdmin(prisma) {
  try {
    const encryptedPassword = await bcrypt.hash("Dokter123", 10);

    await prisma.user.upsert({
      where: { email: "dokter@gmail.com" },
      update: {},
      create: {
        email: "dokter@gmail.com",
        password: encryptedPassword,
        is_verified: true,
        role: Role.dokter,
      },
    });

    console.log("Dokter data seeded successfully");
  } catch (error) {
    console.error("Error seeding admin:", error);
    throw error; // Re-throw error untuk proper error handling
  }
}

module.exports = userAdmin;
