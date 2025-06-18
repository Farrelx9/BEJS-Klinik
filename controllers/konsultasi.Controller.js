const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const {
  sendUnreadNotification,
  sendUnreadCountUpdate,
  sendNewMessageToPatient,
  sendNewPatientMessageToAdmin,
  sendChatUpdateToPatient,
  sendChatUpdateToAdmin,
  sendUnreadCountUpdateToAdmin,
} = require("../utils/socket");

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

// 2. Kirim pesan ke chat - PERBAIKAN
exports.kirimPesan = async (req, res) => {
  const { isi, pengirim, id_chat } = req.body;

  // Validasi input dasar
  if (!isi || !pengirim || !id_chat) {
    return res.status(400).json({
      success: false,
      message: "Semua field (isi, pengirim, id_chat) harus diisi",
    });
  }

  try {
    // Cek apakah sesi chat ada dan aktif
    const chatSession = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
      include: {
        pasien: {
          include: {
            user: true,
          },
        },
        // Tambahkan dokter jika ada relasi
        dokter: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!chatSession || chatSession.status !== "aktif") {
      return res.status(400).json({
        success: false,
        message: "Sesi chat tidak aktif atau tidak ditemukan",
      });
    }

    // Buat pesan baru
    const pesanBaru = await prisma.pesan_Chat.create({
      data: {
        isi,
        pengirim,
        id_chat,
        is_read: false,
      },
    });

    // ===== SOCKET NOTIFICATION LOGIC YANG DIPERBAIKI =====

    if (pengirim === "dokter") {
      // Jika dokter kirim pesan ke pasien
      if (chatSession.pasien?.user?.id_user) {
        // 1. Kirim notifikasi pesan baru ke pasien
        sendNewMessageToPatient(chatSession.pasien.user.id_user, {
          chatId: id_chat,
          message: isi,
        });

        // 2. Hitung unread count untuk pasien
        const unreadCount = await prisma.pesan_Chat.count({
          where: {
            id_chat,
            pengirim: "dokter",
            is_read: false,
          },
        });

        // 3. Update unread count ke pasien
        sendUnreadCountUpdate(
          chatSession.pasien.user.id_user,
          id_chat,
          unreadCount
        );

        // 4. Update chat untuk dokter
        if (chatSession.dokter?.user?.id_user) {
          sendChatUpdateToAdmin(chatSession.dokter.user.id_user, id_chat);
        }
      }
    } else if (pengirim === "pasien") {
      // Jika pasien kirim pesan ke dokter

      // 1. Hitung unread count untuk dokter
      const unreadCount = await prisma.pesan_Chat.count({
        where: {
          id_chat,
          pengirim: "pasien",
          is_read: false,
        },
      });

      // 2. Kirim notifikasi pesan baru ke dokter (broadcast ke semua admin)
      sendNewPatientMessageToAdmin("admin", {
        chatId: id_chat,
        message: isi,
      });

      // 3. Update unread count ke admin
      sendUnreadCountUpdateToAdmin("admin", id_chat, unreadCount);

      // 4. Update chat untuk pasien
      if (chatSession.pasien?.user?.id_user) {
        sendChatUpdateToPatient(chatSession.pasien.user.id_user, id_chat);
      }
    }

    return res.json({
      success: true,
      data: pesanBaru,
    });
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
    // Fetch chat messages along with their reviews
    const riwayat = await prisma.pesan_Chat.findMany({
      where: { id_chat },
      orderBy: { waktu_kirim: "asc" },
      include: {
        reviews: true, // Include reviews for each message
      },
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

// 6. Ambil semua jadwal chat yang tersedia dengan pagination
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

// 7. Pasien memilih jadwal chat
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
    const { skip, take } = getPagination(page, limit);

    // Ambil data chat sesuai filter dan pagination
    const [data, total] = await Promise.all([
      prisma.konsultasi_Chat.findMany({
        where: {
          id_pasien: { not: null }, // Hanya chat yang sudah di-book oleh pasien
        },
        include: {
          pasien: true,
          messages: {
            orderBy: { waktu_kirim: "desc" },
            take: 1,
          },
        },
        skip,
        take,
        orderBy: { waktu_mulai: "desc" },
      }),
      prisma.konsultasi_Chat.count({
        where: {
          id_pasien: { not: null },
        },
      }),
    ]);

    const meta = getPaginationMeta(total, take, page);

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
    console.error("Gagal ambil semua chat:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 9. Admin mengaktifkan sesi chat
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

// 10. Ambil detail chat beserta riwayat pesan
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
        review: true,
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

// 11. Ambil semua chat untuk pasien tertentu
exports.getChatListForPasien = async (req, res) => {
  const { id_pasien } = req.params;
  const { page = 1, limit = 5 } = req.query;

  try {
    const { skip, take } = getPagination(page, limit);

    // Ambil semua chat untuk pasien ini
    const [data, total] = await Promise.all([
      prisma.konsultasi_Chat.findMany({
        where: {
          id_pasien,
        },
        include: {
          pasien: {
            select: {
              nama: true,
            },
          },
          messages: {
            orderBy: { waktu_kirim: "desc" },
            take: 1,
          },
        },
        skip,
        take,
        orderBy: {
          waktu_mulai: "desc",
        },
      }),
      prisma.konsultasi_Chat.count({
        where: {
          id_pasien,
        },
      }),
    ]);

    const meta = getPaginationMeta(total, take, parseInt(page));

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
    console.error("Gagal ambil daftar chat pasien:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar chat untuk pasien",
    });
  }
};

// 12. Ambil jumlah pesan belum dibaca
exports.getUnreadMessagesByIdChat = async (req, res) => {
  const { id_chat } = req.params;
  const user = req.user; // Harus ada dari middleware auth

  try {
    console.log("Checking unread messages for chat:", id_chat);
    console.log("User role:", user.role);

    // Cek apakah sesi chat ada
    const chatSession = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat: id_chat },
    });

    if (!chatSession) {
      console.log("Chat session not found:", id_chat);
      return res.status(404).json({
        success: false,
        message: "Sesi chat tidak ditemukan",
      });
    }

    let unreadCount = 0;

    // Bedakan logika berdasarkan role user
    if (user.role === "dokter") {
      // Dokter: lihat pesan dari pasien yang belum dibaca
      unreadCount = await prisma.pesan_Chat.count({
        where: {
          id_chat: id_chat,
          pengirim: "pasien",
          is_read: false,
        },
      });
    } else if (user.role === "pasien") {
      // Pasien: lihat pesan dari dokter yang belum dibaca
      unreadCount = await prisma.pesan_Chat.count({
        where: {
          id_chat: id_chat,
          pengirim: "dokter",
          is_read: false,
        },
      });
    } else {
      console.log("Invalid user role:", user.role);
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya dokter dan pasien yang diizinkan.",
      });
    }

    console.log("Unread count:", unreadCount);

    return res.json({
      success: true,
      data: {
        id_chat,
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    console.error("Gagal ambil jumlah pesan belum dibaca:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil jumlah pesan belum dibaca",
      error: error.message,
    });
  }
};

// 13. Mark all unread messages as read for a chat - PERBAIKAN
exports.markAllMessagesAsRead = async (req, res) => {
  const { id_chat } = req.params;
  const user = req.user;

  try {
    // Cek apakah sesi chat ada
    const chatSession = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
      include: {
        pasien: {
          include: {
            user: true,
          },
        },
        dokter: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: "Sesi chat tidak ditemukan",
      });
    }

    let updatedCount = 0;

    // Bedakan logika berdasarkan role user
    if (user.role === "dokter") {
      // Dokter menandai pesan dari pasien sebagai dibaca
      const result = await prisma.pesan_Chat.updateMany({
        where: {
          id_chat,
          pengirim: "pasien",
          is_read: false,
        },
        data: { is_read: true },
      });
      updatedCount = result.count;

      // Hitung ulang unread count untuk dokter
      const unreadCount = await prisma.pesan_Chat.count({
        where: {
          id_chat,
          pengirim: "pasien",
          is_read: false,
        },
      });

      // Kirim update unread count ke dokter
      if (chatSession.dokter?.user?.id_user) {
        sendUnreadCountUpdateToAdmin(
          chatSession.dokter.user.id_user,
          id_chat,
          unreadCount
        );
      }

      // Update chat untuk pasien
      if (chatSession.pasien?.user?.id_user) {
        sendChatUpdateToPatient(chatSession.pasien.user.id_user, id_chat);
      }
    } else if (user.role === "pasien") {
      // Pasien menandai pesan dari dokter sebagai dibaca
      const result = await prisma.pesan_Chat.updateMany({
        where: {
          id_chat,
          pengirim: "dokter",
          is_read: false,
        },
        data: { is_read: true },
      });
      updatedCount = result.count;

      // Hitung ulang unread count untuk pasien
      const unreadCount = await prisma.pesan_Chat.count({
        where: {
          id_chat,
          pengirim: "dokter",
          is_read: false,
        },
      });

      // Kirim update unread count ke pasien
      if (chatSession.pasien?.user?.id_user) {
        sendUnreadCountUpdate(
          chatSession.pasien.user.id_user,
          id_chat,
          unreadCount
        );
      }

      // Update chat untuk dokter
      if (chatSession.dokter?.user?.id_user) {
        sendChatUpdateToAdmin(chatSession.dokter.user.id_user, id_chat);
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya dokter dan pasien yang diizinkan.",
      });
    }

    return res.json({
      success: true,
      message: `${updatedCount} pesan ditandai sudah dibaca`,
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Gagal update status pesan:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal update status pesan",
      error: error.message,
    });
  }
};
