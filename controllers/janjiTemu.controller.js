const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { handleJanjiTemuCreated } = require("./notifikasi.controller");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const { sendNotification } = require("./notifikasi.controller");

exports.getAvailableJanjiTemu = async (req, res) => {
  try {
    const { page = 1, limit = 5, tanggal } = req.query;

    const { skip, take } = getPagination(page, limit);

    // Buat where clause dinamis untuk janji temu tersedia
    let whereClause = {
      id_pasien: null,
      status: "tersedia",
      tanggal_waktu: {
        gte: new Date(), // Janji temu mulai dari sekarang
      },
    };

    // Filter berdasarkan tanggal jika ada
    if (tanggal) {
      const selectedDate = new Date(tanggal);

      if (isNaN(selectedDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Tanggal tidak valid" });
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.tanggal_waktu = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    // Ambil data janji temu sesuai filter
    const data = await prisma.janjiTemu.findMany({
      where: whereClause,
      orderBy: {
        tanggal_waktu: "asc",
      },
      skip,
      take,
    });

    // Hitung total items untuk pagination
    const totalItems = await prisma.janjiTemu.count({
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
    console.error("Error fetching available appointments:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data janji temu" });
  }
};

exports.bookJanjiTemu = async (req, res) => {
  const { id } = req.params;
  const { id_pasien, keluhan } = req.body;

  if (!id_pasien || !keluhan) {
    return res
      .status(400)
      .json({ success: false, message: "Data tidak lengkap" });
  }

  try {
    // Cek apakah janji temu ada
    const existing = await prisma.janjiTemu.findUnique({
      where: { id_janji: id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Janji temu tidak ditemukan" });
    }

    // Update janji temu dengan status "pending"
    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: {
        id_pasien,
        keluhan,
        status: "pending", // Ubah status menjadi "pending"
      },
    });

    try {
      await handleJanjiTemuCreated(updated);
      console.log("Notifikasi berhasil dikirim");
    } catch (notifError) {
      console.error("Gagal mengirim notifikasi:", notifError);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Booking gagal" });
  }
};

exports.getBookedJanjiTemuByPasien = async (req, res) => {
  const { id_pasien } = req.params;
  const { page = 1, limit = 5 } = req.query;

  try {
    // Update status janji temu yang sudah lewat menjadi 'selesai'
    await prisma.janjiTemu.updateMany({
      where: {
        id_pasien,
        status: "confirmed",
        tanggal_waktu: {
          lt: new Date(),
        },
      },
      data: {
        status: "selesai",
      },
    });

    const totalItems = await prisma.janjiTemu.count({
      where: {
        id_pasien,
        status: {
          in: ["pending", "confirmed", "cancelled", "selesai"],
        },
      },
    });

    const { skip, take } = getPagination(page, limit);

    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: {
        id_pasien,
        status: {
          in: ["pending", "confirmed", "cancelled", "selesai"],
        },
      },
      include: {
        pasien: true,
        review: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    const formattedData = bookedAppointments.map((app) => {
      const fullDate = app.tanggal_waktu ? new Date(app.tanggal_waktu) : null;

      return {
        id_janji: app.id_janji || "",
        id_pasien: app.id_pasien || "",
        nama_pasien: app.pasien?.nama || "",
        noTelp_pasien: app.pasien?.noTelp || "",

        // Format tanggal dalam format YYYY-MM-DD
        tanggal_waktu: fullDate ? fullDate.toISOString().split("T")[0] : "",

        // Format waktu dalam format HH:mm WIB
        waktu_janji: fullDate
          ? fullDate.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",

        keluhan: app.keluhan || "",
        status: app.status || "",
        createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : "",
        // Tambahkan data review
        review: app.review || [], // Bisa berupa array atau kosong
      };
    });

    // Response yang lebih sederhana
    return res.status(200).json({
      success: true,
      data: formattedData,
      meta: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / take),
        hasNextPage: skip + take < totalItems,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data janji temu",
    });
  }
};

//admin

exports.confirmJanjiTemu = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["confirmed", "cancelled"].includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Status tidak valid" });
  }

  try {
    const janjiTemu = await prisma.janjiTemu.findUnique({
      where: { id_janji: id },
      include: { pasien: true },
    });

    if (!janjiTemu) {
      return res
        .status(404)
        .json({ success: false, message: "Janji temu tidak ditemukan" });
    }

    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { status },
      include: { pasien: true },
    });

    let judulNotif = "";
    let pesanNotif = "";

    if (status === "confirmed") {
      judulNotif = "Janji Temu Dikonfirmasi";
      pesanNotif = `Janji temu Anda pada ${new Date(
        janjiTemu.tanggal_waktu
      ).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })} telah dikonfirmasi.`;
    } else if (status === "cancelled") {
      judulNotif = "Janji Temu Dibatalkan";
      pesanNotif = `Sayangnya, janji temu Anda pada ${new Date(
        janjiTemu.tanggal_waktu
      ).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })} dibatalkan oleh admin.`;
    }

    let notifSuccess = true;

    if (janjiTemu.id_pasien) {
      try {
        await sendNotification(janjiTemu.id_pasien, judulNotif, pesanNotif);
      } catch (notifError) {
        console.error("Gagal kirim notifikasi:", notifError.message);
        notifSuccess = false;
      }
    }

    // Format response agar konsisten
    return res.json({
      success: true,
      data: {
        id_janji: updated.id_janji,
        id_pasien: updated.id_pasien,
        nama_pasien: updated.pasien?.nama || "-",
        noTelp_pasien: updated.pasien?.noTelp || "-",
        tanggal_waktu: updated.tanggal_waktu
          ? new Date(updated.tanggal_waktu).toISOString().split("T")[0]
          : "-",
        waktu_janji: updated.tanggal_waktu
          ? new Date(updated.tanggal_waktu).toLocaleTimeString("id-ID")
          : "-",
        keluhan: updated.keluhan || "-",
        status: updated.status || "-",
        pembayaran: updated.pembayaran || "-",
        createdAt: updated.createdAt
          ? new Date(updated.createdAt).toISOString()
          : "-",
      },
      notificationSent: notifSuccess,
    });
  } catch (error) {
    console.error("Error confirming appointment:", {
      error: error.message,
      stack: error.stack,
      id: id,
      body: req.body,
    });
    return res.status(500).json({
      success: false,
      message: "Gagal mengonfirmasi janji temu",
    });
  }
};

//book admin
exports.getBookedJanjiTemu = async (req, res) => {
  const { page = 1, limit = 5, statusFilter, search } = req.query;

  try {
    // Update status janji temu yang sudah lewat menjadi 'selesai'
    await prisma.janjiTemu.updateMany({
      where: {
        status: "confirmed",
        tanggal_waktu: {
          lt: new Date(), // Tanggal janji temu sudah lewat dari hari ini
        },
      },
      data: {
        status: "selesai",
      },
    });

    // Buat where clause dinamis
    let whereClause = {
      // Hapus filter id_pasien not null karena mungkin ada data yang belum diisi
      AND: [],
    };

    // Filter berdasarkan status
    if (
      statusFilter &&
      ["pending", "confirmed", "cancelled", "selesai"].includes(statusFilter)
    ) {
      whereClause.AND.push({ status: statusFilter });
    } else {
      whereClause.AND.push({
        status: {
          in: ["pending", "confirmed", "cancelled", "selesai"],
        },
      });
    }

    // Filter pencarian
    if (search && search.trim()) {
      whereClause.AND.push({
        OR: [
          {
            pasien: {
              nama: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
          },
          {
            keluhan: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        ],
      });
    }

    // Hitung total item sesuai filter
    const totalItems = await prisma.janjiTemu.count({
      where: whereClause,
    });

    // Pagination
    const { skip, take } = getPagination(page, limit);

    // Ambil data dengan pagination & sorting
    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: whereClause,
      include: {
        pasien: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate meta pagination
    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    // Format data untuk response
    const formattedData = bookedAppointments.map((app) => ({
      id_janji: app.id_janji,
      id_pasien: app.id_pasien,
      nama_pasien: app.pasien?.nama || "-",
      noTelp_pasien: app.pasien?.noTelp || "-",
      tanggal_waktu: app.tanggal_waktu
        ? new Date(app.tanggal_waktu).toISOString().split("T")[0]
        : "-",
      waktu_janji: app.tanggal_waktu
        ? new Date(app.tanggal_waktu).toLocaleTimeString("id-ID")
        : "-",
      keluhan: app.keluhan || "-",
      status: app.status || "-",
      createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : "-",
    }));

    // Log untuk debugging
    console.log("Where Clause:", whereClause);
    console.log("Total Items:", totalItems);
    console.log("Booked Appointments:", bookedAppointments.length);

    return res.status(200).json({
      success: true,
      data: formattedData,
      meta: {
        totalItems: meta.totalItems,
        currentPage: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching booked appointments:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar janji temu",
      details: error.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  const { id } = req.params;
  const { pembayaran } = req.body;

  if (!["cash", "transfer"].includes(pembayaran)) {
    return res
      .status(400)
      .json({ success: false, message: "Metode pembayaran tidak valid" });
  }

  try {
    const janjiTemu = await prisma.janjiTemu.findUnique({
      where: { id_janji: id },
      include: { pasien: true },
    });

    if (
      !janjiTemu ||
      (janjiTemu.status !== "confirmed" && janjiTemu.status !== "selesai")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Pembayaran hanya bisa diupdate untuk janji temu yang sudah dikonfirmasi atau selesai.",
      });
    }

    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { pembayaran },
      include: { pasien: true },
    });

    // Format response agar konsisten
    res.json({
      success: true,
      data: {
        id_janji: updated.id_janji,
        id_pasien: updated.id_pasien,
        nama_pasien: updated.pasien?.nama || "-",
        noTelp_pasien: updated.pasien?.noTelp || "-",
        tanggal_waktu: updated.tanggal_waktu
          ? new Date(updated.tanggal_waktu).toISOString().split("T")[0]
          : "-",
        waktu_janji: updated.tanggal_waktu
          ? new Date(updated.tanggal_waktu).toLocaleTimeString("id-ID")
          : "-",
        keluhan: updated.keluhan || "-",
        status: updated.status || "-",
        pembayaran: updated.pembayaran || "-",
        createdAt: updated.createdAt
          ? new Date(updated.createdAt).toISOString()
          : "-",
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengupdate pembayaran" });
  }
};

// === CANCEL JANJI TEMU BY PATIENT ===
exports.cancelJanjiTemu = async (req, res) => {
  const { id } = req.params;
  const { id_pasien } = req.body; // ID pasien untuk validasi

  if (!id_pasien) {
    return res.status(400).json({
      success: false,
      message: "ID pasien diperlukan untuk validasi",
    });
  }

  try {
    // Cek apakah janji temu ada dan milik pasien yang bersangkutan
    const janjiTemu = await prisma.janjiTemu.findUnique({
      where: { id_janji: id },
      include: { pasien: true },
    });

    if (!janjiTemu) {
      return res.status(404).json({
        success: false,
        message: "Janji temu tidak ditemukan",
      });
    }

    // Validasi bahwa janji temu milik pasien yang bersangkutan
    if (janjiTemu.id_pasien !== id_pasien) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk membatalkan janji temu ini",
      });
    }

    // Cek apakah status janji temu bisa dibatalkan
    if (janjiTemu.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Hanya janji temu dengan status 'pending' yang dapat dibatalkan",
      });
    }

    // Cek apakah janji temu sudah lewat
    if (new Date(janjiTemu.tanggal_waktu) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat membatalkan janji temu yang sudah lewat",
      });
    }

    // Kirim notifikasi ke pasien SEBELUM update (karena setelah update id_pasien jadi null)
    let notifSuccess = true;
    try {
      const judulNotif = "Janji Temu Dibatalkan";
      const pesanNotif = `Janji temu Anda pada ${new Date(
        janjiTemu.tanggal_waktu
      ).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })} telah dibatalkan.`;

      await sendNotification(id_pasien, judulNotif, pesanNotif);
    } catch (notifError) {
      console.error("Gagal kirim notifikasi:", notifError.message);
      notifSuccess = false;
    }

    // Update status menjadi cancelled
    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: {
        status: "cancelled",
        // Reset id_pasien dan keluhan agar slot bisa digunakan lagi
        id_pasien: null,
        keluhan: "", // Set ke string kosong, bukan null
      },
    });

    return res.json({
      success: true,
      message: "Janji temu berhasil dibatalkan",
      data: updated,
      notificationSent: notifSuccess,
    });
  } catch (error) {
    console.error("Error canceling appointment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal membatalkan janji temu",
    });
  }
};
