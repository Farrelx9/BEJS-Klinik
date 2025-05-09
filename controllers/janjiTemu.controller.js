const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

exports.getAvailableJanjiTemu = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const { skip, limit: limitNumber } = getPagination(page, limit);

    // Ambil data janji temu dengan pagination
    const data = await prisma.janjiTemu.findMany({
      where: {
        id_pasien: null,
        status: "tersedia",
        tanggal_waktu: {
          gte: new Date(),
        },
      },
      orderBy: {
        tanggal_waktu: "asc",
      },
      skip,
      take: limitNumber,
    });

    // Hitung total data untuk metadata
    const totalItems = await prisma.janjiTemu.count({
      where: {
        id_pasien: null,
        status: "tersedia",
        tanggal_waktu: {
          gte: new Date(),
        },
      },
    });

    const meta = getPaginationMeta(totalItems, limitNumber, parseInt(page));

    return res.json({
      success: true,
      data,
      meta,
    });
  } catch (error) {
    console.error(error);
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
    const updated = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { id_pasien, keluhan, status: "terpesan" },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Booking gagal" });
  }
};
