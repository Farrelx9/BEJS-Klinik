const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// 1. Mulai sesi chat setelah pilih jadwal
exports.mulaiSesiChat = async (req, res) => {
  const { id_pasien, waktu_mulai } = req.body;

  try {
    // Ambil data pasien beserta user untuk validasi email
    const pasien = await prisma.pasien.findUnique({
      where: { id_pasien },
      include: { user: true },
    });

    if (!pasien || !pasien.user || !pasien.user.email) {
      return res.status(400).json({
        success: false,
        message: "Email pasien tidak ditemukan atau tidak valid",
      });
    }

    // Buat sesi chat baru
    const sesiBaru = await prisma.konsultasi_Chat.create({
      data: {
        id_pasien,
        waktu_mulai: new Date(waktu_mulai),
        status: "pending", // Status awal sebelum ACC admin / pembayaran
      },
    });

    return res.json({ success: true, data: sesiBaru });
  } catch (error) {
    console.error("Gagal mulai sesi:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mulai sesi chat",
    });
  }
};

// 2. Kirim pesan ke chat
exports.kirimPesan = async (req, res) => {
  const { isi, pengirim, id_chat } = req.body;

  if (!isi || !pengirim || !id_chat) {
    return res.status(400).json({
      success: false,
      message: "Semua field (isi, pengirim, id_chat) harus diisi",
    });
  }

  try {
    const chatSession = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
      include: { pasien: { include: { user: true } } },
    });

    if (!chatSession || chatSession.status !== "aktif") {
      return res.status(400).json({
        success: false,
        message: "Sesi chat tidak aktif atau tidak ditemukan",
      });
    }

    const pesanBaru = await prisma.pesan_Chat.create({
      data: {
        isi,
        pengirim,
        id_chat,
      },
    });

    return res.json({ success: true, data: pesanBaru });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengirim pesan",
    });
  }
};

// 3. Ambil riwayat chat
exports.getRiwayatChat = async (req, res) => {
  const { id_chat } = req.params;

  try {
    const riwayat = await prisma.pesan_Chat.findMany({
      where: { id_chat },
      orderBy: { waktu_kirim: "asc" },
    });

    return res.json({ success: true, data: riwayat });
  } catch (error) {
    console.error("Gagal ambil riwayat chat:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal ambil riwayat chat",
    });
  }
};

// 4. Selesaikan sesi chat
exports.selesaikanSesi = async (req, res) => {
  const { id_chat } = req.params;

  try {
    const sesiSelesai = await prisma.konsultasi_Chat.update({
      where: { id_chat },
      data: {
        waktu_selesai: new Date(),
        status: "selesai",
      },
    });

    return res.json({ success: true, data: sesiSelesai });
  } catch (error) {
    console.error("Gagal menyelesaikan sesi:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal menyelesaikan sesi",
    });
  }
};

// 5. Cek apakah pasien punya sesi aktif
exports.getSesiAktifByPasien = async (req, res) => {
  const { id_pasien } = req.params;

  try {
    const sesi = await prisma.konsultasi_Chat.findFirst({
      where: {
        id_pasien,
        status: "aktif",
      },
      include: { pasien: { include: { user: true } } },
    });

    if (!sesi || !sesi.pasien || !sesi.pasien.user?.email) {
      return res.json({
        success: false,
        message: "Tidak ada sesi aktif atau email tidak tersedia",
        data: null,
      });
    }

    return res.json({ success: true, data: sesi });
  } catch (error) {
    console.error("Gagal ambil sesi aktif:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil sesi aktif",
    });
  }
};

// 6. [Baru] Ambil semua jadwal chat yang tersedia dengan pagination
exports.getAvailableChatSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 5, tanggal } = req.query;

    const { skip, take } = getPagination(page, limit);

    // Buat where clause dinamis
    let whereClause = {
      id_pasien: null,
      status: "tersedia",
    };

    // Filter berdasarkan tanggal jika ada
    if (tanggal) {
      const selectedDate = new Date(tanggal);

      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Tanggal tidak valid",
        });
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.waktu_mulai = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    // Ambil data jadwal chat sesuai filter dan pagination
    const data = await prisma.konsultasi_Chat.findMany({
      where: whereClause,
      orderBy: {
        waktu_mulai: "asc",
      },
      skip,
      take,
    });

    // Hitung total items
    const totalItems = await prisma.konsultasi_Chat.count({
      where: whereClause,
    });

    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    return res.json({
      success: true,
      data,
      meta: {
        totalItems: meta.totalItems,
        currentPage: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Gagal ambil jadwal chat:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal chat",
    });
  }
};

// 7. [Baru] Pasien memilih jadwal chat
exports.pilihJadwal = async (req, res) => {
  const { id_jadwal, id_pasien } = req.body;

  if (!id_jadwal || !id_pasien) {
    return res.status(400).json({
      success: false,
      message: "ID jadwal atau ID pasien kosong",
    });
  }

  try {
    // Cari jadwal chat berdasarkan id_chat
    const chat = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat: id_jadwal },
    });

    // Pastikan jadwal tersedia
    if (!chat || chat.status !== "tersedia") {
      return res.status(400).json({
        success: false,
        message: "Jadwal tidak tersedia atau sudah dibooking",
      });
    }

    // Update jadwal chat
    const updatedChat = await prisma.konsultasi_Chat.update({
      where: { id_chat: id_jadwal },
      data: {
        id_pasien,
        status: "pending",
      },
    });

    return res.json({
      success: true,
      data: updatedChat,
      redirect_to_pembayaran: `/pembayaran?id=${updatedChat.id_chat}`,
    });
  } catch (error) {
    console.error("Gagal memilih jadwal:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal booking jadwal konsultasi",
    });
  }
};

// 8. Ambil semua chat untuk admin (hanya yang sudah dibooking)
exports.getAllChatsForAdmin = async (req, res) => {
  const { page = 1, limit = 5 } = req.query;

  try {
    const data = await prisma.konsultasi_Chat.findMany({
      where: {
        id_pasien: {
          not: null, // Hanya chat yang sudah dibooking oleh pasien
        },
      },
      include: {
        pasien: true, // Ambil semua field pasien, termasuk 'nama'
        messages: {
          orderBy: { waktu_kirim: "desc" },
          take: 1,
        },
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { waktu_mulai: "desc" },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Gagal ambil semua chat:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 9. [Baru] Admin mengaktifkan sesi chat
exports.aktifkanSesiChat = async (req, res) => {
  const { id_chat } = req.params;

  try {
    // Cek apakah sesi ada dan statusnya pending
    const sesi = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
    });

    if (!sesi || sesi.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Sesi tidak ditemukan atau bukan status pending",
      });
    }

    // Update status menjadi aktif
    const updatedSesi = await prisma.konsultasi_Chat.update({
      where: { id_chat },
      data: {
        status: "aktif",
        waktu_mulai: new Date(), // Jika belum punya waktu mulai, isi sekarang
      },
    });

    return res.json({ success: true, data: updatedSesi });
  } catch (error) {
    console.error("Gagal aktifkan sesi:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengaktifkan sesi",
    });
  }
};

// 10. [Baru] Ambil detail chat beserta riwayat pesan
exports.getChatDetail = async (req, res) => {
  const { id_chat } = req.params;

  try {
    // Cari sesi chat berdasarkan id_chat
    const chatSession = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
      include: {
        pasien: {
          select: {
            id_pasien: true,
            nama: true, // Ambil nama langsung dari pasien
          },
        },
        messages: {
          orderBy: { waktu_kirim: "asc" },
        },
      },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Sesi chat tidak ditemukan",
      });
    }

    return res.json({ success: true, data: chatSession });
  } catch (error) {
    console.error("Gagal ambil detail chat:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail chat",
    });
  }
};
