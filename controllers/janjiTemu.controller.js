const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Valid status values
const VALID_STATUS = [
  "Menunggu",
  "Diterima",
  "Ditolak",
  "Dibatalkan",
  "Selesai",
];

// Buat Janji Temu Baru
exports.createJanjiTemu = async (req, res) => {
  try {
    const { user_id, tanggal_waktu, keluhan, dokter } = req.body;

    // Validasi input
    if (!user_id || !tanggal_waktu || !keluhan) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Validasi format tanggal
    const appointmentDate = new Date(tanggal_waktu);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    // Cek apakah user dengan user_id ada dan berperan sebagai pasien
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      include: {
        pasien: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "pasien") {
      return res.status(403).json({ message: "User bukan pasien" });
    }

    if (!user.pasien) {
      return res.status(400).json({ message: "Data pasien tidak lengkap" });
    }

    // Buat janji temu
    const janjiTemu = await prisma.janjiTemu.create({
      data: {
        id_pasien: user.pasien.id_pasien,
        tanggal_waktu: appointmentDate,
        keluhan,
        dokter: dokter || "drg.Irna",
        status: "Menunggu", // Set default status
      },
      include: {
        pasien: true,
      },
    });

    res.status(201).json({
      message: "Janji temu berhasil dibuat",
      data: {
        id_janji: janjiTemu.id_janji,
        id_pasien: janjiTemu.id_pasien,
        tanggal_waktu: janjiTemu.tanggal_waktu,
        keluhan: janjiTemu.keluhan,
        status: janjiTemu.status,
        dokter: janjiTemu.dokter,
        createdAt: janjiTemu.createdAt,
        pasien: {
          nama: janjiTemu.pasien.nama,
          noTelp: janjiTemu.pasien.noTelp,
          alamat: janjiTemu.pasien.alamat,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Dapatkan Semua Janji Temu
exports.getAllJanjiTemu = async (req, res) => {
  try {
    const janjiTemu = await prisma.janjiTemu.findMany({
      include: {
        pasien: {
          select: {
            nama: true,
            noTelp: true,
            alamat: true,
          },
        },
      },
      orderBy: {
        tanggal_waktu: "asc",
      },
    });

    res.json({
      data: janjiTemu.map((jt) => ({
        id_janji: jt.id_janji,
        id_pasien: jt.id_pasien,
        tanggal_waktu: jt.tanggal_waktu,
        keluhan: jt.keluhan,
        status: jt.status,
        dokter: jt.dokter,
        createdAt: jt.createdAt,
        pasien: jt.pasien,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Dapatkan Janji Temu by ID
exports.getJanjiTemuById = async (req, res) => {
  try {
    const { id } = req.params;

    const janjiTemu = await prisma.janjiTemu.findUnique({
      where: { id_janji: id },
      include: {
        pasien: {
          select: {
            nama: true,
            noTelp: true,
            alamat: true,
          },
        },
      },
    });

    if (!janjiTemu) {
      return res.status(404).json({ message: "Janji temu tidak ditemukan" });
    }

    res.json({
      data: {
        id_janji: janjiTemu.id_janji,
        id_pasien: janjiTemu.id_pasien,
        tanggal_waktu: janjiTemu.tanggal_waktu,
        keluhan: janjiTemu.keluhan,
        status: janjiTemu.status,
        dokter: janjiTemu.dokter,
        createdAt: janjiTemu.createdAt,
        pasien: janjiTemu.pasien,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Update Status Janji Temu
exports.updateStatusJanjiTemu = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status wajib diisi" });
    }

    // Validasi status
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid",
        validStatus: VALID_STATUS,
      });
    }

    const janjiTemu = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { status },
      include: {
        pasien: {
          select: {
            nama: true,
            noTelp: true,
            alamat: true,
          },
        },
      },
    });

    res.json({
      message: "Status janji temu berhasil diupdate",
      data: {
        id_janji: janjiTemu.id_janji,
        id_pasien: janjiTemu.id_pasien,
        tanggal_waktu: janjiTemu.tanggal_waktu,
        keluhan: janjiTemu.keluhan,
        status: janjiTemu.status,
        dokter: janjiTemu.dokter,
        createdAt: janjiTemu.createdAt,
        pasien: janjiTemu.pasien,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Dapatkan Janji Temu by User ID
exports.getJanjiTemuByPasien = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Cari user dan pasien terkait
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      include: {
        pasien: true,
      },
    });

    if (!user || !user.pasien) {
      return res.status(404).json({ message: "Data pasien tidak ditemukan" });
    }

    const janjiTemu = await prisma.janjiTemu.findMany({
      where: { id_pasien: user.pasien.id_pasien },
      include: {
        pasien: {
          select: {
            nama: true,
            noTelp: true,
            alamat: true,
          },
        },
      },
      orderBy: {
        tanggal_waktu: "desc",
      },
    });

    res.json({
      data: janjiTemu.map((jt) => ({
        id_janji: jt.id_janji,
        id_pasien: jt.id_pasien,
        tanggal_waktu: jt.tanggal_waktu,
        keluhan: jt.keluhan,
        status: jt.status,
        dokter: jt.dokter,
        createdAt: jt.createdAt,
        pasien: jt.pasien,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Batalkan Janji Temu
exports.cancelJanjiTemu = async (req, res) => {
  try {
    const { id } = req.params;

    const janjiTemu = await prisma.janjiTemu.update({
      where: { id_janji: id },
      data: { status: "Dibatalkan" },
      include: {
        pasien: {
          select: {
            nama: true,
            noTelp: true,
            alamat: true,
          },
        },
      },
    });

    res.json({
      message: "Janji temu berhasil dibatalkan",
      data: {
        id_janji: janjiTemu.id_janji,
        id_pasien: janjiTemu.id_pasien,
        tanggal_waktu: janjiTemu.tanggal_waktu,
        keluhan: janjiTemu.keluhan,
        status: janjiTemu.status,
        dokter: janjiTemu.dokter,
        createdAt: janjiTemu.createdAt,
        pasien: janjiTemu.pasien,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};
