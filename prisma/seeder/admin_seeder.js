const { Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function userAdmin(prisma) {
  try {
    const encryptedPassword = await bcrypt.hash("Admin123", 10);

    await prisma.user.upsert({
      where: { email: "admin@gmail.com" },
      update: {},
      create: {
        email: "admin@gmail.com",
        password: encryptedPassword,
        is_verified: true,
        role: Role.admin,
      },
    });

    console.log("Admin data seeded successfully");
  } catch (error) {
    console.error("Error seeding admin:", error);
    throw error; // Re-throw error untuk proper error handling
  }
}

module.exports = userAdmin;
