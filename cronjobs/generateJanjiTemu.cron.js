const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cron = require("node-cron");

async function generateJanjiTemu() {
  try {
    console.log("Menjalankan cron job untuk generate janji temu...");

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Hapus jadwal lama (opsional)
    await prisma.janjiTemu.deleteMany({
      where: {
        tanggal_waktu: {
          gte: now,
          lte: nextMonth,
        },
        id_pasien: null,
      },
    });

    const workHours = ["16:00", "17:00", "18:00", "19:00", "20:00"];

    let currentDate = new Date(now);
    while (currentDate <= nextMonth) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let time of workHours) {
          const [hour, minute] = time.split(":").map(Number);
          const appointmentTime = new Date(currentDate);
          appointmentTime.setHours(hour, minute, 0, 0);

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

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Janji temu berhasil di-generate untuk 1 bulan ke depan.");
  } catch (error) {
    console.error("Error saat generate janji temu:", error.message);
  }
}

// Jadwalkan cron
cron.schedule("0 0 * * *", generateJanjiTemu);

module.exports = generateJanjiTemu;
