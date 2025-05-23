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
    // Validasi input wajib
    if (!id_pasien || !diagnosa || !tindakan) {
      return res.status(400).json({
        error: "ID Pasien, Diagnosa, dan Tindakan harus diisi",
      });
    }

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

    return res.status(201).json(newRecord);
  } catch (error) {
    console.error("Gagal menambahkan rekam medis:", error.message);
    return res.status(500).json({ error: "Gagal menambahkan rekam medis" });
  }
};

// === 2. Ambil Semua Rekam Medis (Hanya Satu Terbaru per Pasien)
exports.getAllRekamMedis = async (req, res) => {
  const { page = 1, limit = 5, search = "" } = req.query;

  try {
    const { skip, take } = getPagination(page, limit);
    const searchTerm = search.trim();

    // Ambil semua rekam medis dari database
    const allRecords = await prisma.rekam_Medis.findMany({
      include: {
        pasien: true,
      },
      where: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Validasi apakah ada data
    if (!allRecords.length) {
      return res.json({
        data: [],
        meta: getPaginationMeta(0, take, parseInt(page)),
      });
    }

    // Urutkan berdasarkan tanggal terbaru
    const sortedByDate = [...allRecords].sort(
      (a, b) =>
        new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt)
    );

    // Grup hanya ambil satu rekam medis terbaru per pasien
    const groupedMap = {};
    for (const record of sortedByDate) {
      const pasienId = record.id_pasien;

      if (!pasienId) {
        console.warn("Record tanpa id_pasien:", record);
        continue;
      }

      if (!groupedMap[pasienId]) {
        groupedMap[pasienId] = record;
      }
    }

    const latestPerPasien = Object.values(groupedMap);

    // Pagination setelah grouping
    const paginatedData = latestPerPasien.slice(skip, skip + take);

    // Hitung total items
    const totalItems = latestPerPasien.length;
    const meta = getPaginationMeta(totalItems, take, parseInt(page));

    // Kirim response ke frontend
    return res.json({
      data: paginatedData.map((record) => ({
        id_rekam_medis: record.id_rekam_medis,
        id_pasien: record.id_pasien,

        // 🔹 Data pasien
        nama_pasien: record.pasien?.nama || "-",
        alamat_pasien: record.pasien?.alamat || "-",
        jenis_kelamin_pasien: record.pasien?.jenis_kelamin || "-",
        tanggal_lahir_pasien: record.pasien?.tanggal_lahir
          ? new Date(record.pasien.tanggal_lahir).toISOString().split("T")[0]
          : null,

        // 🔹 Field rekam medis
        keluhan: record.keluhan || "-",
        diagnosa: record.diagnosa || "-",
        tindakan: record.tindakan || "-",
        resep_obat: record.resep_obat || "-",
        dokter: record.dokter || "-",
        tanggal: record.tanggal
          ? new Date(record.tanggal).toISOString().split("T")[0]
          : new Date(record.createdAt).toISOString().split("T")[0],
        createdAt: record.createdAt,
      })),
      meta: {
        totalItems,
        currentPage: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching medical records:", error.message);
    return res.status(500).json({ error: "Gagal mengambil data rekam medis" });
  }
};

// === 3. Ambil Semua Riwayat Rekam Medis Berdasarkan ID Pasien ===
exports.getRekamMedisByPasien = async (req, res) => {
  const { id_pasien } = req.params;

  try {
    const records = await prisma.rekam_Medis.findMany({
      where: { id_pasien },
      include: {
        pasien: true,
      },
      orderBy: {
        tanggal: "desc", // Urutkan dari yang terbaru
      },
    });

    if (!records.length) {
      return res.status(404).json({
        error: "Tidak ada riwayat rekam medis ditemukan",
      });
    }

    const formattedRecords = records.map((record) => ({
      id_rekam_medis: record.id_rekam_medis,
      id_pasien: record.id_pasien,

      nama_pasien: record.pasien.nama || "-",
      alamat_pasien: record.pasien.alamat || "-",
      jenis_kelamin_pasien: record.pasien.jenis_kelamin || "-",
      tanggal_lahir_pasien: record.pasien.tanggal_lahir || null,

      keluhan: record.keluhan || "-",
      diagnosa: record.diagnosa || "-",
      tindakan: record.tindakan || "-",
      resep_obat: record.resep_obat || "-",
      dokter: record.dokter || "-",
      tanggal: record.tanggal.toISOString(), // Kirim ISO string
      createdAt: record.createdAt,
    }));

    return res.json(formattedRecords);
  } catch (error) {
    console.error("Gagal mengambil riwayat rekam medis:", error.message);
    return res
      .status(500)
      .json({ error: "Gagal mengambil riwayat rekam medis" });
  }
};

// === 4. Ambil Rekam Medis Berdasarkan ID ===
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

    return res.json({
      id_rekam_medis: rekamMedis.id_rekam_medis,
      id_pasien: rekamMedis.id_pasien,
      nama_pasien: rekamMedis.pasien?.nama || "-",
      alamat_pasien: rekamMedis.pasien?.alamat || "-",
      jenis_kelamin_pasien: rekamMedis.pasien?.jenis_kelamin || "-",
      tanggal_lahir_pasien: rekamMedis.pasien?.tanggal_lahir || null,

      keluhan: rekamMedis.keluhan || "-",
      diagnosa: rekamMedis.diagnosa || "-",
      tindakan: rekamMedis.tindakan || "-",
      resep_obat: rekamMedis.resep_obat || "-",
      dokter: rekamMedis.dokter || "-",
      tanggal: rekamMedis.tanggal.toISOString(),
      createdAt: rekamMedis.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ error: "Gagal mengambil rekam medis" });
  }
};

// === 5. Update Rekam Medis ===
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
    const updatedRecord = await prisma.rekam_Medis.update({
      where: { id_rekam_medis: id },
      data: {
        ...(id_pasien !== undefined && { id_pasien }),
        ...(keluhan !== undefined && { keluhan }),
        ...(diagnosa !== undefined && { diagnosa }),
        ...(tindakan !== undefined && { tindakan }),
        ...(resep_obat !== undefined && { resep_obat }),
        ...(dokter !== undefined ? { dokter } : {}),
        ...(tanggal !== undefined && { tanggal: new Date(tanggal) }),
        ...(tindakan_id !== undefined && { tindakan_id }),
      },
    });

    return res.json(updatedRecord);
  } catch (error) {
    console.error("Gagal memperbarui rekam medis:", error.message);
    return res.status(500).json({ error: "Gagal memperbarui rekam medis" });
  }
};

// === 6. Hapus Rekam Medis ===
exports.deleteRekamMedis = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.rekam_Medis.delete({
      where: { id_rekam_medis: id },
    });

    return res.json({ message: "Rekam medis berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ error: "Gagal menghapus rekam medis" });
  }
};
