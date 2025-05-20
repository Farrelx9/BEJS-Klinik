const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");
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
        dokter: dokter || "drg. Irna",
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
  const { page = 1, limit = 5, search = "" } = req.query;
  try {
    const { skip, take } = getPagination(page, limit);
    const searchTerm = search.trim();

    // Buat where clause dinamis
    const whereClause = {
      AND: [],
    };

    if (searchTerm) {
      whereClause.AND.push({
        OR: [
          {
            pasien: {
              nama: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            keluhan: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            diagnosa: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    // ✅ Gunakan format valid untuk Prisma v6.7.0
    whereClause.AND.push({
      pasien: {
        is: {},
      },
    });

    // Ambil data dari database
    const records = await prisma.rekam_Medis.findMany({
      include: {
        pasien: true,
      },
      where: whereClause,
      skip,
      take,
    });

    const totalItems = await prisma.rekam_Medis.count({
      where: whereClause,
    });

    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    return res.json({
      data: records.map((record) => ({
        id_rekam_medis: record.id_rekam_medis,
        id_pasien: record.id_pasien,

        // 🔹 Mapping pasien
        nama_pasien: record.pasien.nama,
        alamat_pasien: record.pasien.alamat,
        jenis_kelamin_pasien: record.pasien.jenis_kelamin,
        tanggal_lahir_pasien: record.pasien.tanggal_lahir,

        // 🔹 Field rekam medis
        keluhan: record.keluhan,
        diagnosa: record.diagnosa,
        tindakan: record.tindakan,
        resep_obat: record.resep_obat,
        dokter: record.dokter,
        tanggal: record.tanggal.toISOString().split("T")[0],
        createdAt: record.createdAt,
      })),
      meta: {
        totalItems: meta.totalItems,
        currentPage: meta.page,
        totalPages: meta.totalPages || 1,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching medical records:", error.message);
    return res.status(500).json({ error: "Gagal mengambil data rekam medis" });
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
    // Validasi minimal field penting
    if (!diagnosa || !tindakan) {
      return res
        .status(400)
        .json({ error: "Diagnosis dan Tindakan harus diisi" });
    }

    const rekamMedis = await prisma.rekam_Medis.update({
      where: { id_rekam_medis: id },
      data: {
        ...(id_pasien !== undefined && { id_pasien }),
        ...(keluhan !== undefined && { keluhan }),
        ...(diagnosa !== undefined && { diagnosa }),
        ...(tindakan !== undefined && { tindakan }),
        ...(resep_obat !== undefined && { resep_obat }),
        ...(dokter !== undefined ? { dokter } : { dokter: "drg. Irna" }),
        ...(tanggal !== undefined && {
          tanggal: new Date(tanggal),
        }),
        ...(tindakan_id !== undefined && { tindakan_id }),
      },
    });

    res.json(rekamMedis);
  } catch (error) {
    console.error("Gagal memperbarui rekam medis:", error.message);
    res.status(500).json({
      error: "Gagal memperbarui rekam medis",
      details: error.message,
    });
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
