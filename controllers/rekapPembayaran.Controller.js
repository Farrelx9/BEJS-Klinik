const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

async function createRekapPembayaran(req, res) {
  const { id_pasien, tanggal, total_pembayaran, jumlah_transaksi } = req.body;

  if (
    !id_pasien ||
    !tanggal ||
    total_pembayaran === undefined ||
    jumlah_transaksi === undefined
  ) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    // Cek apakah pasien ada
    const pasien = await prisma.pasien.findUnique({
      where: { id_pasien },
    });

    if (!pasien) {
      return res.status(400).json({ error: "ID Pasien tidak ditemukan" });
    }

    // Pastikan tanggal dalam format Date
    const parsedTanggal = new Date(tanggal);
    if (isNaN(parsedTanggal.getTime())) {
      return res.status(400).json({ error: "Format tanggal salah" });
    }

    // Simpan rekap pembayaran
    const newRekap = await prisma.rekapPembayaran.create({
      data: {
        id_pasien,
        tanggal: parsedTanggal,
        total_pembayaran: parseInt(total_pembayaran),
        jumlah_transaksi: parseInt(jumlah_transaksi),
      },
    });

    return res.status(201).json(newRekap);
  } catch (error) {
    console.error("Error saat membuat rekap:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Relasi ke pasien gagal. ID Pasien mungkin tidak valid.",
      });
    }

    if (error.code === "P2002") {
      return res.status(400).json({
        error:
          "ID pasien duplikat tidak diperbolehkan jika ada unique constraint",
      });
    }

    return res.status(500).json({ error: "Gagal menyimpan rekap pembayaran" });
  }
}

// 2. Mengambil Semua Data Rekap Pembayaran (dengan pagination & search)
async function getAllRekapPembayaran(req, res) {
  const { page = 1, limit = 5, q: searchQuery = "" } = req.query;

  try {
    // Build where clause untuk pencarian
    const whereClause = {};
    if (searchQuery) {
      whereClause.pasien = {
        nama: {
          contains: searchQuery,
          mode: "insensitive",
        },
      };
    }

    // Hitung total data sesuai filter
    const totalItems = await prisma.rekapPembayaran.count({
      where: whereClause,
    });

    // Ambil data dengan pagination
    const { skip, take } = getPagination(page, limit);
    const rekapList = await prisma.rekapPembayaran.findMany({
      where: whereClause,
      include: {
        pasien: true,
      },
      orderBy: {
        tanggal: "desc",
      },
      skip,
      take,
    });

    // Generate metadata pagination
    const meta = getPaginationMeta(totalItems, parseInt(limit), parseInt(page));

    return res.json({
      data: rekapList,
      meta,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Gagal mengambil daftar rekap pembayaran" });
  }
}

// 3. Mengambil Rekap Berdasarkan ID
async function getRekapById(req, res) {
  const { id } = req.params;

  try {
    const rekap = await prisma.rekapPembayaran.findUnique({
      where: {
        id_rekap: id,
      },
      include: {
        pasien: true,
      },
    });

    if (!rekap) {
      return res
        .status(404)
        .json({ error: "Rekap pembayaran tidak ditemukan" });
    }

    return res.json(rekap);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal mengambil rekap pembayaran" });
  }
}

// 4. Mengambil Rekap Berdasarkan ID Pasien
async function getRekapByPasien(req, res) {
  const { id_pasien } = req.params;

  try {
    const rekapList = await prisma.rekapPembayaran.findMany({
      where: {
        id_pasien,
      },
      include: {
        pasien: true,
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    return res.json(rekapList);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Gagal mengambil rekap pembayaran berdasarkan pasien" });
  }
}

// 5. Menghapus Rekap Pembayaran
async function deleteRekapPembayaran(req, res) {
  const { id } = req.params;

  try {
    await prisma.rekapPembayaran.delete({
      where: {
        id_rekap: id,
      },
    });

    return res.json({ message: "Rekap pembayaran berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal menghapus rekap pembayaran" });
  }
}

// Update Rekap Pembayaran
async function updateRekapPembayaran(req, res) {
  const { id } = req.params;
  const { id_pasien, tanggal, total_pembayaran, jumlah_transaksi } = req.body;

  // Validasi input
  if (
    !id_pasien ||
    !tanggal ||
    total_pembayaran === undefined ||
    jumlah_transaksi === undefined
  ) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  try {
    // Pastikan pasien dengan id_pasien ini ada
    const pasien = await prisma.pasien.findUnique({
      where: { id_pasien: id_pasien },
    });

    if (!pasien) {
      return res.status(400).json({ error: "Pasien tidak ditemukan" });
    }

    // Pastikan rekap dengan id_rekap ini ada
    const rekap = await prisma.rekapPembayaran.findUnique({
      where: { id_rekap: id },
    });

    if (!rekap) {
      return res
        .status(404)
        .json({ error: "Rekap pembayaran tidak ditemukan" });
    }

    // Lakukan update
    const updatedRekap = await prisma.rekapPembayaran.update({
      where: { id_rekap: id },
      data: {
        id_pasien,
        tanggal: new Date(tanggal),
        total_pembayaran: parseInt(total_pembayaran),
        jumlah_transaksi: parseInt(jumlah_transaksi),
      },
    });

    return res.json(updatedRekap);
  } catch (error) {
    console.error("Error saat update rekap pembayaran:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "Rekap pembayaran tidak ditemukan untuk ID tersebut." });
    }

    return res
      .status(500)
      .json({ error: "Gagal memperbarui rekap pembayaran" });
  }
}

module.exports = {
  createRekapPembayaran,
  getAllRekapPembayaran,
  getRekapById,
  getRekapByPasien,
  deleteRekapPembayaran,
  updateRekapPembayaran,
};
