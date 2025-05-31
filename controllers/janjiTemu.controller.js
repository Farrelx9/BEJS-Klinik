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
    // Hitung total data untuk meta
    const totalItems = await prisma.janjiTemu.count({
      where: {
        id_pasien,
        status: {
          in: ["pending", "confirmed", "cancelled"],
        },
      },
    });

    const { skip, take } = getPagination(page, limit);

    // Ambil data dengan pagination
    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: {
        id_pasien,
        status: {
          in: ["pending", "confirmed", "cancelled"],
        },
      },
      skip,
      take,
    });

    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    res.json({
      success: true,
      data: bookedAppointments,
      meta,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil booking" });
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
    });

    let judulNotif = "";
    let pesanNotif = "";

    const formattedDate = new Date(janjiTemu.tanggal_waktu)
      .toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
      .replace("GMT+07:00", "WIB");

    if (status === "confirmed") {
      judulNotif = "Janji Temu Dikonfirmasi";
      pesanNotif = `Janji temu Anda pada ${formattedDate} telah dikonfirmasi.`;
    } else if (status === "cancelled") {
      judulNotif = "Janji Temu Dibatalkan";
      pesanNotif = `Sayangnya, janji temu Anda pada ${formattedDate} dibatalkan oleh admin.`;
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

    return res.json({
      success: true,
      data: updated,
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
    // Buat where clause dinamis
    let whereClause = {
      id_pasien: { not: null }, // hanya janji yang dipesan pasien
      AND: [],
    };

    // Filter berdasarkan status
    if (
      statusFilter &&
      ["pending", "confirmed", "cancelled"].includes(statusFilter)
    ) {
      whereClause.AND.push({ status: statusFilter });
    } else {
      whereClause.AND.push({
        status: {
          in: ["pending", "confirmed", "cancelled"],
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

    // Ambil data dengan pagination
    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: whereClause,
      include: {
        pasien: true,
      },
      skip,
      take,
    });

    // Generate meta pagination
    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    return res.json({
      success: true,
      data: bookedAppointments.map((app) => ({
        id_janji: app.id_janji,
        id_pasien: app.id_pasien,

        nama_pasien: app.pasien?.nama || "-",
        noTelp_pasien: app.pasien?.noTelp || "-",

        tanggal_waktu: new Date(app.tanggal_waktu).toISOString().split("T")[0],
        waktu_janji: new Date(app.tanggal_waktu).toLocaleTimeString("id-ID"),

        keluhan: app.keluhan || "-",
        status: app.status || "-",
        createdAt: app.createdAt,
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
    });

    if (!janjiTemu || janjiTemu.status !== "confirmed") {
      return res
        .status(400)
        .json({ success: false, message: "Janji temu belum dikonfirmasi" });
    }

    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { pembayaran },
    });

    // Pastikan respons berisi data janji temu terbaru
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengupdate pembayaran" });
  }
};
