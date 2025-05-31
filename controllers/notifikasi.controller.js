const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// Fungsi untuk mengirim notifikasi
async function sendNotification(id_pasien, judul, pesan) {
  try {
    const notifikasi = await prisma.notifikasi.create({
      data: {
        id_pasien,
        judul,
        pesan,
      },
    });
    return notifikasi;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error("Failed to send notification");
  }
}

// Fungsi untuk mendapatkan semua notifikasi pasien
async function getNotificationsByPasienId(req, res) {
  const { id_pasien } = req.params;

  // Ambil query params untuk pagination
  const { page = 1, limit = 5 } = req.query;

  try {
    const { skip, take } = getPagination(page, limit);

    // Hitung total notifikasi pasien
    const totalItems = await prisma.notifikasi.count({
      where: { id_pasien },
    });

    // Ambil data notifikasi dengan pagination
    const notifications = await prisma.notifikasi.findMany({
      where: { id_pasien },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    return res.status(200).json({
      success: true,
      data: notifications.map((notif) => ({
        ...notif,
        tanggal: new Date(notif.createdAt).toISOString().split("T")[0],
        waktu: new Date(notif.createdAt).toLocaleTimeString("id-ID"),
      })),
      meta: {
        totalItems: meta.totalItems,
        currentPage: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil notifikasi",
      details: error.message,
    });
  }
}

async function markAllNotificationsAsRead(req, res) {
  const { id_pasien } = req.params;

  try {
    await prisma.notifikasi.updateMany({
      where: {
        id_pasien,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    // Kembalikan response sukses
    res.status(200).json({
      success: true,
      message: "Semua notifikasi ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("Gagal tandai semua notifikasi:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui notifikasi",
    });
  }
}
// Contoh: Trigger notifikasi saat registrasi
async function handleUserRegistration(userId) {
  const pasien = await prisma.pasien.findUnique({
    where: { user_id: userId },
  });

  if (!pasien) {
    throw new Error("Pasien tidak ditemukan");
  }

  await sendNotification(
    pasien.id_pasien,
    "Registrasi Berhasil",
    "Selamat! Akun Anda telah berhasil dibuat."
  );
}

// Contoh: Trigger notifikasi saat membuat janji temu
async function handleJanjiTemuCreated(janjiTemu) {
  const { id_pasien } = janjiTemu;

  // Ubah format waktu menjadi WIB
  const formattedDate = new Date(janjiTemu.tanggal_waktu).toLocaleString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }
  );

  await sendNotification(
    id_pasien,
    "Janji Temu Dibuat",
    `Anda telah membuat janji temu pada ${formattedDate}.`
  );
}

async function handleProfileUpdate(userId) {
  const pasien = await prisma.pasien.findUnique({
    where: { user_id: userId },
  });

  if (!pasien) {
    throw new Error("Pasien tidak ditemukan");
  }

  await sendNotification(
    pasien.id_pasien,
    "Profil Diperbarui",
    "Profil Anda telah berhasil diperbarui."
  );
}

async function handleChangePassword(userId) {
  const pasien = await prisma.pasien.findUnique({
    where: { user_id: userId },
  });

  if (!pasien) {
    throw new Error("Pasien tidak ditemukan");
  }

  await sendNotification(
    pasien.id_pasien,
    "Kata Sandi Berhasil Diubah",
    "Kata sandi akun Anda telah berhasil diubah."
  );
}
// Tambahkan lainnya jika perlu, misalnya untuk pembayaran, konsultasi, dll...

module.exports = {
  getNotificationsByPasienId,
  handleUserRegistration,
  handleJanjiTemuCreated,
  markAllNotificationsAsRead,
  handleProfileUpdate,
  handleChangePassword,
  sendNotification,
};
