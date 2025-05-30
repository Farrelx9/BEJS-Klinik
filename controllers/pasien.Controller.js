const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { getPagination, getPaginationMeta } = require("../utils/pagination");

// === GET ALL PASIEN ===
exports.getAllPasien = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;

    // Validasi input
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, Math.min(parseInt(limit) || 5, 100));

    const { skip, take } = getPagination(pageNumber, limitNumber);

    // Buat where clause dinamis untuk pencarian
    const whereClause = {};

    if (search.trim()) {
      whereClause.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { noTelp: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Ambil data pasien dengan relasi ke user.email
    const pasiens = await prisma.pasien.findMany({
      where: whereClause,
      skip,
      take: limitNumber,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Hitung total item untuk metadata
    const totalItems = await prisma.pasien.count({
      where: whereClause,
    });

    // Format respons
    const formattedPasiens = pasiens.map((p) => ({
      id_pasien: p.id_pasien,
      nama: p.nama,
      email: p.user?.email || null,
      noTelp: p.noTelp,
      alamat: p.alamat,
      tanggal_lahir: p.tanggal_lahir,
      jenis_kelamin: p.jenis_kelamin,
      profilePicture: p.profilePicture || null,
      createdAt: p.createdAt,
    }));

    const meta = getPaginationMeta(totalItems, limitNumber, pageNumber);

    return res.json({
      success: true,
      data: formattedPasiens,
      meta: {
        totalItems: meta.totalItems,
        page: meta.page,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
        itemCount: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching pasien:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pasien",
      error: error.message,
    });
  }
};

// === CREATE PASIEN ===
exports.createPasien = async (req, res) => {
  const { nama, noTelp, alamat, tanggal_lahir, jenis_kelamin } = req.body;

  try {
    const newPasien = await prisma.pasien.create({
      data: {
        nama,
        noTelp,
        alamat,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
        jenis_kelamin,

        // ✅ Sertakan `user: null` jika relasi opsional
        user_id: null,
      },
    });

    return res.status(201).json(newPasien);
  } catch (error) {
    console.error("Gagal menambahkan pasien:", error.message);
    return res.status(500).json({ error: "Gagal menambahkan pasien" });
  }
};

// === UPDATE PASIEN ===
exports.updatePasien = async (req, res) => {
  const { id_pasien } = req.params;
  const { nama, noTelp, alamat, tanggal_lahir, jenis_kelamin } = req.body;

  if (!id_pasien) {
    return res.status(400).json({ error: "ID pasien tidak ditemukan" });
  }

  try {
    const updatedPasien = await prisma.pasien.update({
      where: { id_pasien },
      data: {
        ...(nama && { nama }),
        ...(noTelp !== undefined && { noTelp }),
        ...(alamat && { alamat }),
        ...(tanggal_lahir && { tanggal_lahir: new Date(tanggal_lahir) }),
        ...(jenis_kelamin && { jenis_kelamin }),
      },
    });

    return res.json(updatedPasien);
  } catch (error) {
    console.error("Gagal memperbarui pasien:", error.message);
    return res.status(500).json({ error: "Gagal memperbarui pasien" });
  }
};

// === DELETE PASIEN ===
exports.deletePasien = async (req, res) => {
  const { id_pasien } = req.params;

  if (!id_pasien) {
    return res.status(400).json({ error: "ID pasien tidak valid" });
  }

  try {
    // Hapus semua relasi terlebih dahulu dalam transaksi
    await prisma.$transaction(async (prisma) => {
      // Hapus rekam medis yang terkait (kemungkinan punya relasi lanjutan)
      await prisma.rekam_Medis.deleteMany({
        where: { id_pasien },
      });

      // Hapus pesan chat yang terkait
      await prisma.pesan_Chat.deleteMany({
        where: { id_pasien },
      });

      // Hapus janji temu yang terkait
      await prisma.janjiTemu.deleteMany({
        where: { id_pasien },
      });

      // Hapus konsultasi chat yang terkait
      await prisma.konsultasi_Chat.deleteMany({
        where: { id_pasien },
      });

      // Hapus pembayaran yang terkait
      await prisma.pembayaran.deleteMany({
        where: { id_pasien },
      });

      // Terakhir hapus pasien itu sendiri
      await prisma.pasien.delete({
        where: { id_pasien },
      });
    });

    return res.json({ message: "Pasien dan data terkait berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus pasien:", error.message);
    return res.status(500).json({
      error: "Gagal menghapus pasien",
      details: error.message,
    });
  }
};
