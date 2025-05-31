const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cron = require("node-cron");

// Import dayjs dan plugin yang diperlukan
const dayjs = require("dayjs");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");

// Extend dayjs dengan plugin
dayjs.extend(utc);
dayjs.extend(timezone);

// Fungsi utama generate janji temu
async function generateJanjiTemu() {
  try {
    console.log("🔄 generateJanjiTemu dimulai...");

    await prisma.$connect();

    // Gunakan dayjs dengan zona waktu Jakarta/WIB
    const now = dayjs().tz("Asia/Jakarta");
    const nextMonth = now.add(1, "month");

    const startDate = now.toDate();
    const endDate = nextMonth.toDate();

    console.log(
      `📅 Membersihkan janji temu tersedia dari ${startDate} hingga ${endDate}`
    );
    await prisma.janjiTemu.deleteMany({
      where: {
        tanggal_waktu: {
          lte: endDate,
        },
        id_pasien: null,
        status: "tersedia",
      },
    });

    console.log("✅ Janji temu lama dihapus");

    const workHours = ["16:00", "17:00", "18:00", "19:00", "20:00"];

    let currentDay = dayjs(startDate).tz("Asia/Jakarta"); // mulai dari hari ini

    while (currentDay.isBefore(nextMonth)) {
      const dayOfWeek = currentDay.day(); // 0 = Minggu, 6 = Sabtu

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Senin - Jumat
        for (let time of workHours) {
          const [hour, minute] = time.split(":").map(Number);
          const appointmentTime = currentDay
            .hour(hour)
            .minute(minute)
            .second(0)
            .millisecond(0)
            .toDate();

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

      currentDay = currentDay.add(1, "day"); // lanjut ke hari berikutnya
    }

    console.log("🎉 Generate janji temu selesai.");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error saat generate janji temu:", error.message);
    await prisma.$disconnect();
  }
}

// Jalankan manual untuk test (opsional)
// (async () => {
//   await generateJanjiTemu();
// })();

// Atur cron job
cron.schedule(
  "0 0 * * *", // Setiap hari jam 00:00
  async () => {
    console.log("⏰ Cron job diaktifkan...");
    await generateJanjiTemu();
  },
  {
    timezone: "Asia/Jakarta", // Pastikan cron berjalan di zona waktu WIB
  }
);

module.exports = { generateJanjiTemu };
