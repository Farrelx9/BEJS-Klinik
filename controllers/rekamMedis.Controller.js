const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// === 1. Tambah Rekam Medis ===
exports.createRekamMedis = async (req, res) => {
  const {
    id_pasien,
    keluhan,
    diagnosa,
    tindakan,
    resep_obat,
    dokter,
    tanggal,
  } = req.body;

  try {
    const newRecord = await prisma.rekam_Medis.create({
      data: {
        id_pasien,
        keluhan,
        diagnosa,
        tindakan,
        resep_obat,
        dokter,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
      },
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Gagal menambahkan rekam medis:", error.message);
    res.status(500).json({ error: "Gagal menambahkan rekam medis" });
  }
};

// 2. Ambil Semua Rekam Medis
exports.getAllRekamMedis = async (req, res) => {
  try {
    const rekamMedisList = await prisma.rekam_Medis.findMany({
      include: {
        pasien: true,
        jenisTindakan: true,
      },
    });
    res.json(rekamMedisList);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data rekam medis" });
  }
};

// 3. Ambil Rekam Medis Berdasarkan ID
exports.getRekamMedisById = async (req, res) => {
  const { id } = req.params;

  try {
    const rekamMedis = await prisma.rekam_Medis.findUnique({
      where: { id_rekam_medis: id },
      include: {
        pasien: true,
        jenisTindakan: true,
      },
    });

    if (!rekamMedis) {
      return res.status(404).json({ error: "Rekam medis tidak ditemukan" });
    }

    res.json(rekamMedis);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil rekam medis" });
  }
};

// 4. Update Rekam Medis
exports.updateRekamMedis = async (req, res) => {
  const { id } = req.params;
  const {
    id_pasien,
    keluhan,
    diagnosa,
    tindakan,
    resep_obat,
    dokter,
    tanggal,
    tindakan_id,
  } = req.body;

  try {
    const rekamMedis = await prisma.rekam_Medis.update({
      where: { id_rekam_medis: id },
      data: {
        id_pasien,
        keluhan,
        diagnosa,
        tindakan,
        resep_obat,
        dokter,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        tindakan_id,
      },
    });
    res.json(rekamMedis);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Gagal memperbarui rekam medis", details: error.message });
  }
};

// 5. Hapus Rekam Medis
exports.deleteRekamMedis = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.rekam_Medis.delete({
      where: { id_rekam_medis: id },
    });
    res.json({ message: "Rekam medis berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Gagal menghapus rekam medis", details: error.message });
  }
};
