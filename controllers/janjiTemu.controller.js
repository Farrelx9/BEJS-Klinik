const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { handleJanjiTemuCreated } = require("./notifikasi.controller");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

exports.getAvailableJanjiTemu = async (req, res) => {
  try {
    const { page = 1, limit = 5, tanggal } = req.query;

    const { skip, limit: limitNumber } = getPagination(page, limit);

    // Buat where clause dinamis
    const whereClause = {
      id_pasien: null,
      status: "tersedia",
      tanggal_waktu: {
        gte: new Date(),
      },
    };

    // Jika ada parameter tanggal, tambahkan filter
    if (tanggal) {
      const selectedDate = new Date(tanggal);
      whereClause.tanggal_waktu = {
        gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
      };
    }

    // Debugging: Cek isi whereClause
    console.log("FilterWhereClause:", {
      whereClause,
      rawTanggal: req.query.tanggal,
      parsedTanggal: tanggal ? new Date(tanggal) : null,
    });

    // Ambil data janji temu dengan pagination
    const data = await prisma.janjiTemu.findMany({
      where: whereClause,
      orderBy: {
        tanggal_waktu: "asc",
      },
      skip,
      take: limitNumber,
    });

    // Hitung total data untuk metadata
    const totalItems = await prisma.janjiTemu.count({
      where: whereClause,
    });

    // Debugging: Total item
    console.log("Total Items:", totalItems);

    const meta = getPaginationMeta(totalItems, limitNumber, parseInt(page));

    return res.json({
      success: true,
      data,
      meta,
    });
  } catch (error) {
    console.error("Error fetching janji temu:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data" });
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

  try {
    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: {
        id_pasien,
        status: {
          in: ["pending", "terpesan"],
        },
      },
    });

    res.json({ success: true, data: bookedAppointments });
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
    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: {
        status,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengonfirmasi janji temu" });
  }
};

//book admin

exports.getBookedJanjiTemu = async (req, res) => {
  const { page = 1, limit = 5, statusFilter, search } = req.query;

  try {
    let whereClause = {
      id_pasien: { not: null }, // hanya janji yang dipesan pasien
    };

    // Filter berdasarkan status
    if (
      statusFilter &&
      ["pending", "confirmed", "cancelled", "terpesan"].includes(statusFilter)
    ) {
      whereClause.status = statusFilter;
    } else {
      whereClause.status = {
        in: ["pending", "confirmed", "cancelled", "terpesan"],
      };
    }

    // Filter berdasarkan pencarian
    if (search && search.trim()) {
      whereClause.OR = [
        {
          pasien: {
            nama: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          keluhan: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const totalItems = await prisma.janjiTemu.count({ where: whereClause });

    const { skip, limit: parsedLimit } = getPagination(page, limit);

    const bookedAppointments = await prisma.janjiTemu.findMany({
      where: whereClause,
      include: {
        pasien: true,
      },
      skip,
      take: parsedLimit,
    });

    const meta = getPaginationMeta(totalItems, parsedLimit, parseInt(page));

    res.json({ success: true, data: bookedAppointments, meta });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil booking" });
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
