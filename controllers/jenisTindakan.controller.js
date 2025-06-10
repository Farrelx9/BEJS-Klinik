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
  const { page = 1, limit = 10, search } = req.query;

  try {
    // Validasi dan parsing parameter halaman & limit
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, Math.min(parseInt(limit) || 5, 100));

    // Buat where clause untuk pencarian
    let whereClause = {};
    if (search && search.trim()) {
      whereClause.nama_tindakan = {
        contains: search,
        mode: "insensitive", // Case-insensitive pencarian
      };
    }

    // Hitung total data sesuai filter
    const totalItems = await prisma.jenis_Tindakan.count({
      where: whereClause,
    });

    // Hitung skip & take untuk pagination
    const { skip, take } = getPagination(pageNumber, limitNumber);

    const tindakanList = await prisma.jenis_Tindakan.findMany({
      where: whereClause,
      skip,
      take,
      select: {
        id_tindakan: true,
        nama_tindakan: true,
        deskripsi: true,
        harga: true,
      },
      orderBy: {
        createdAt: "desc", // <-- URUTKAN BERDASARKAN CREATED AT TERBARU
      },
    });

    // Hitung metadata pagination
    const meta = getPaginationMeta(totalItems, take, pageNumber);

    // Kirim respons JSON yang selaras
    return res.json({
      success: true,
      data: tindakanList,
      meta: {
        totalItems: meta.totalItems,
        page: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
        itemCount: take,
      },
    });
  } catch (error) {
    console.error("Error fetching jenis tindakan:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar jenis tindakan",
      error: error.message,
    });
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

// 4. Ambil semua jenis tindakan TANPA PAGINATION
exports.getAllJenisTindakanNoPagination = async (req, res) => {
  const { search } = req.query;

  try {
    // Buat where clause untuk pencarian
    let whereClause = {};
    if (search && search.trim()) {
      whereClause.nama_tindakan = {
        contains: search,
        mode: "insensitive", // Case-insensitive pencarian
      };
    }

    // Ambil semua data sesuai filter
    const allTindakan = await prisma.jenis_Tindakan.findMany({
      where: whereClause,
      select: {
        id_tindakan: true,
        nama_tindakan: true,
        deskripsi: true,
        harga: true,
      },
      orderBy: {
        createdAt: "desc", // Urutkan dari yang terbaru
      },
    });

    return res.json({
      success: true,
      count: allTindakan.length,
      data: allTindakan,
    });
  } catch (error) {
    console.error("Error fetching all jenis tindakan:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil seluruh daftar jenis tindakan",
      error: error.message,
    });
  }
};