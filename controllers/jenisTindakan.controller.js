const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Tambah jenis tindakan baru
exports.createJenisTindakan = async (req, res) => {
  const { nama_tindakan, deskripsi, harga } = req.body;

  try {
    const tindakan = await prisma.jenis_Tindakan.create({
      data: {
        nama_tindakan,
        deskripsi,
        harga,
      },
    });
    res.status(201).json(tindakan);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Gagal menambahkan jenis tindakan",
        details: error.message,
      });
  }
};

// 2. Ambil semua jenis tindakan
exports.getAllJenisTindakan = async (req, res) => {
  try {
    const tindakanList = await prisma.jenis_Tindakan.findMany();
    res.json(tindakanList);
  } catch (error) {
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        error: "Gagal menghapus jenis tindakan",
        details: error.message,
      });
  }
};
