const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cron = require("node-cron");

async function generateJanjiTemu() {
  try {
    console.log("🔄 generateJanjiTemu dimulai...");

    await prisma.$connect();

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    console.log(
      `📅 Membersihkan janji temu tersedia dari ${now} hingga ${nextMonth}`
    );
    await prisma.janjiTemu.deleteMany({
      where: {
        tanggal_waktu: {
          lte: nextMonth,
        },
        id_pasien: null,
        status: "tersedia",
      },
    });

    console.log("✅ Janji temu lama dihapus");

    const workHours = ["16:00", "17:00", "18:00", "19:00", "20:00"];
    let currentDate = new Date(now);

    while (currentDate <= nextMonth) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let time of workHours) {
          const [hour, minute] = time.split(":").map(Number);
          const appointmentTime = new Date(currentDate);
          appointmentTime.setHours(hour, minute, 0, 0);

          const existing = await prisma.janjiTemu.findFirst({
            where: { tanggal_waktu: appointmentTime },
          });

          if (!existing) {
            await prisma.janjiTemu.create({
              data: {
                id_pasien: null,
                tanggal_waktu: appointmentTime,
                keluhan: "",
                status: "tersedia",
                dokter: "drg.Irna",
              },
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("🎉 Generate janji temu selesai.");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error saat generate janji temu:", error.message);
    await prisma.$disconnect();
  }
}

// // Jalankan manual untuk test
// (async () => {
//   await generateJanjiTemu();
// })();

// Atur cron job
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("⏰ Cron job diaktifkan...");
    await generateJanjiTemu();
  },
  {
    timezone: "Asia/Jakarta",
  }
);
