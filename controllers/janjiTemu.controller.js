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

    // Update janji temu
    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: {
        id_pasien,
        keluhan,
        status: "terpesan",
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
