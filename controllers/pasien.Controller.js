const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// Fungsi untuk mendapatkan semua pasien dengan pagination
exports.getAllPasien = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const { skip, limit: take } = getPagination(page, limit);

    // Ambil data pasien dengan pagination
    const pasiens = await prisma.pasien.findMany({
      skip,
      take,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Hitung total data
    const total = await prisma.pasien.count();

    // Format respons
    const formattedPasiens = pasiens.map((p) => ({
      id_pasien: p.id_pasien,
      nama: p.nama,
      email: p.user.email,
      noTelp: p.noTelp,
      alamat: p.alamat,
      tanggal_lahir: p.tanggal_lahir,
      jenis_kelamin: p.jenis_kelamin,
      profilePicture: p.profilePicture
        ? `http://localhost:3000/uploads/profile/${p.profilePicture}`
        : null,
      createdAt: p.createdAt,
    }));

    const meta = getPaginationMeta(total, take, parseInt(page));

    return res.json({
      data: formattedPasiens,
      meta,
    });
  } catch (error) {
    console.error("Error fetching pasien:", error.message);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};
