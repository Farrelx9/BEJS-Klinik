const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
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
  const {
    nama,
    noTelp,
    alamat,
    tanggal_lahir,
    jenis_kelamin,
    email,
    password,
  } = req.body;

  try {
    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user dan pasien dalam transaksi
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Buat user baru
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "pasien",
          is_verified: true, // Langsung verified karena dibuat admin
          createdAt: new Date(),
        },
      });

      // 2. Buat pasien dan hubungkan ke user
      const newPasien = await prisma.pasien.create({
        data: {
          user_id: newUser.id,
          nama,
          noTelp,
          alamat,
          tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
          jenis_kelamin,
          createdAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              is_verified: true,
            },
          },
        },
      });

      return newPasien;
    });

    return res.status(201).json({
      success: true,
      message: "Pasien berhasil dibuat dengan akun login",
      data: {
        id_pasien: result.id_pasien,
        nama: result.nama,
        email: result.user.email,
        noTelp: result.noTelp,
        alamat: result.alamat,
        tanggal_lahir: result.tanggal_lahir,
        jenis_kelamin: result.jenis_kelamin,
        profilePicture: result.profilePicture,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          is_verified: result.user.is_verified,
        },
      },
    });
  } catch (error) {
    console.error("Gagal menambahkan pasien:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan pasien",
      error: error.message,
    });
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
    return res.status(400).json({
      success: false,
      message: "ID pasien tidak valid",
    });
  }

  try {
    // Hapus semua relasi terlebih dahulu dalam transaksi
    await prisma.$transaction(async (prisma) => {
      // 1. Ambil data pasien untuk mendapatkan user_id
      const pasien = await prisma.pasien.findUnique({
        where: { id_pasien },
        select: { user_id: true },
      });

      if (!pasien) {
        throw new Error("Pasien tidak ditemukan");
      }

      // 2. Hapus review yang terkait
      await prisma.review.deleteMany({
        where: { id_pasien },
      });

      // 3. Hapus notifikasi yang terkait
      await prisma.notifikasi.deleteMany({
        where: { id_pasien },
      });

      // 4. Hapus rekap pembayaran yang terkait
      await prisma.rekapPembayaran.deleteMany({
        where: { id_pasien },
      });

      // 5. Hapus pesan chat yang terkait (via konsultasi chat)
      const konsultasiChats = await prisma.konsultasi_Chat.findMany({
        where: { id_pasien },
        select: { id_chat: true },
      });

      for (const chat of konsultasiChats) {
        await prisma.pesan_Chat.deleteMany({
          where: { id_chat: chat.id_chat },
        });
      }

      // 6. Hapus rekam medis yang terkait
      await prisma.rekam_Medis.deleteMany({
        where: { id_pasien },
      });

      // 7. Hapus janji temu yang terkait
      await prisma.janjiTemu.deleteMany({
        where: { id_pasien },
      });

      // 8. Hapus pembayaran yang terkait
      await prisma.pembayaran.deleteMany({
        where: { id_pasien },
      });

      // 9. Hapus konsultasi chat yang terkait
      await prisma.konsultasi_Chat.deleteMany({
        where: { id_pasien },
      });

      // 10. Hapus OTP yang terkait dengan user
      if (pasien.user_id) {
        await prisma.otp.deleteMany({
          where: { id_user: pasien.user_id },
        });
      }

      // 11. Hapus pasien
      await prisma.pasien.delete({
        where: { id_pasien },
      });

      // 12. Hapus user jika ada
      if (pasien.user_id) {
        await prisma.user.delete({
          where: { id: pasien.user_id },
        });
      }
    });

    return res.json({
      success: true,
      message: "Pasien dan semua data terkait berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal menghapus pasien:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus pasien",
      error: error.message,
    });
  }
};
