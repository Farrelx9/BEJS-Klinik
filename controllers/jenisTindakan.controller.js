const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// 1. Tambah jenis tindakan baru
exports.createJenisTindakan = async (req, res) => {
  const { nama_tindakan, deskripsi, harga } = req.body;

  // Validasi input
  if (!nama_tindakan || !harga) {
    return res
      .status(400)
      .json({ error: "Nama tindakan dan harga wajib diisi" });
  }

  try {
    const newTindakan = await prisma.jenis_Tindakan.create({
      data: {
        nama_tindakan,
        deskripsi,
        harga: parseInt(harga), // Pastikan harga adalah integer
      },
    });

    res.status(201).json(newTindakan);
  } catch (error) {
    console.error("Error creating jenis tindakan:", error);
    res.status(500).json({
      error: "Gagal menambahkan jenis tindakan",
      details: error.message,
    });
  }
};
// 2. Ambil semua jenis tindakan
exports.getAllJenisTindakan = async (req, res) => {
  const { page = 1, limit = 5, search } = req.query;

  try {
    let whereClause = {};

    // Filter pencarian berdasarkan nama_tindakan
    if (search && search.trim()) {
      whereClause.nama_tindakan = {
        contains: search,
        mode: "insensitive", // Case-insensitive pencarian
      };
    }

    const totalItems = await prisma.jenis_Tindakan.count({
      where: whereClause,
    });

    const { skip, limit: parsedLimit } = getPagination(page, limit);

    const tindakanList = await prisma.jenis_Tindakan.findMany({
      where: whereClause,
      skip,
      take: parsedLimit,
    });

    const meta = getPaginationMeta(totalItems, parsedLimit, parseInt(page));

    res.json({ success: true, data: tindakanList, meta });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil daftar tindakan" });
  }
};

// 3. Ambil satu tindakan berdasarkan ID
exports.getJenisTindakanById = async (req, res) => {
  const { id } = req.params;

  try {
    const tindakan = await prisma.jenis_Tindakan.findUnique({
      where: { id_tindakan: id },
    });

    if (!tindakan) {
      return res.status(404).json({ error: "Jenis tindakan tidak ditemukan" });
    }

    res.json(tindakan);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data tindakan" });
  }
};

// 4. Update jenis tindakan
exports.updateJenisTindakan = async (req, res) => {
  const { id } = req.params;
  const { nama_tindakan, deskripsi, harga } = req.body;

  try {
    const updated = await prisma.jenis_Tindakan.update({
      where: { id_tindakan: id },
      data: {
        nama_tindakan,
        deskripsi,
        harga,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "Gagal memperbarui jenis tindakan",
      details: error.message,
    });
  }
};

// 5. Hapus jenis tindakan
exports.deleteJenisTindakan = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.jenis_Tindakan.delete({
      where: { id_tindakan: id },
    });
    res.json({ message: "Jenis tindakan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({
      error: "Gagal menghapus jenis tindakan",
      details: error.message,
    });
  }
};
