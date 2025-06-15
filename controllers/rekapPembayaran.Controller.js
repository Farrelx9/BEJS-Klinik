const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Membuat Rekap Pembayaran Baru
async function createRekapPembayaran(req, res) {
  const {
    id_pasien,
    tanggal,
    total_pembayaran,
    jumlah_transaksi,
    tipe = "per_pasien",
  } = req.body;

  if (
    !id_pasien ||
    !tanggal ||
    total_pembayaran === undefined ||
    jumlah_transaksi === undefined
  ) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    const newRekap = await prisma.rekapPembayaran.create({
      data: {
        id_pasien,
        tanggal,
        total_pembayaran,
        jumlah_transaksi,
        tipe,
      },
    });

    return res.status(201).json(newRekap);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal menyimpan rekap pembayaran" });
  }
}

// 2. Mengambil Semua Data Rekap Pembayaran
async function getAllRekapPembayaran(req, res) {
  try {
    const rekapList = await prisma.rekapPembayaran.findMany({
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

module.exports = {
  createRekapPembayaran,
  getAllRekapPembayaran,
  getRekapById,
  getRekapByPasien,
  deleteRekapPembayaran,
};
