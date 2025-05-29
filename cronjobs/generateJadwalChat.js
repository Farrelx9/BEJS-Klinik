const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cron = require("node-cron");

/**
 * Cronjob: Generate Jadwal Chat Harian
 * Hanya hapus & generate ulang jadwal yang benar-benar tersedia dan belum dibayar
 */
async function generateJadwalChat() {
  try {
    console.log("🔄 Memulai generate jadwal chat...");

    await prisma.$connect();

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Hapus hanya jadwal 'tersedia' dan belum punya pembayaran
    await prisma.konsultasi_Chat.deleteMany({
      where: {
        waktu_mulai: {
          lte: nextMonth, // Hapus semua jadwal hingga bulan depan
        },
        id_pasien: null, // Belum dipilih pasien
        status: "tersedia", // Hanya yang tersedia
        pembayaran: null, // Tidak ada pembayaran
      },
    });

    console.log("✅ Jadwal chat kosong dihapus");

    // Jam aktif: 10:00 - 20:00
    const startHour = 10;
    const endHour = 20;

    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= nextMonth) {
      const dayOfWeek = currentDate.getDay(); // 0 = Minggu, 1 = Senin, dst.

      // Hanya generate untuk Senin - Sabtu
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        let waktu_mulai = new Date(currentDate);
        waktu_mulai.setHours(startHour, 0, 0, 0);

        const waktu_selesai = new Date(waktu_mulai);
        waktu_selesai.setHours(endHour, 0, 0, 0);

        while (waktu_mulai < waktu_selesai) {
          await prisma.konsultasi_Chat.create({
            data: {
              id_pasien: null,
              waktu_mulai: new Date(waktu_mulai),
              status: "tersedia",
            },
          });

          console.log(`📅 Jadwal dibuat: ${waktu_mulai}`);

          // Tambah 1 jam
          waktu_mulai = new Date(waktu_mulai.getTime() + 60 * 60 * 1000);
        }
      }

      // Lanjut ke tanggal berikutnya
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("🎉 Generate jadwal chat selesai.");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Gagal generate jadwal chat:", error.message);
    await prisma.$disconnect();
  }
}

// Untuk testing manual
// (async () => {
//   await generateJadwalChat();
// })();

// Schedule cron job harian
cron.schedule(
  "0 0 * * *", // Setiap hari pukul 00:00
  async () => {
    console.log("⏰ Cron job generate jadwal chat diaktifkan...");
    await generateJadwalChat();
  },
  {
    timezone: "Asia/Jakarta",
  }
);

module.exports = generateJadwalChat;
