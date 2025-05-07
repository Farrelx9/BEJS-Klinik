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

// Buat Janji Temu Baru (update versi - pakai User sebagai Pasien)
exports.createJanjiTemu = async (req, res) => {
  try {
    const { id_pasien, tanggal_waktu, keluhan, dokter } = req.body;

    // Validasi input
    if (!id_pasien || !tanggal_waktu || !keluhan) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Validasi format tanggal
    const appointmentDate = new Date(tanggal_waktu);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    // Cek apakah user dengan id_pasien ada dan berperan sebagai pasien
    const user = await prisma.user.findUnique({
      where: { id: id_pasien },
      select: {
        id: true,
        nama: true,
        role: true,
        noTelp: true,
        alamat: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (user.role !== "pasien") {
      return res.status(403).json({ message: "User bukan pasien" });
    }

    // Buat janji temu
    const janjiTemu = await prisma.janjiTemu.create({
      data: {
        id_pasien,
        tanggal_waktu: appointmentDate,
        keluhan,
        dokter: dokter || "drg. Irna",
        status: "Menunggu", // Set default status
      },
    });

    res.status(201).json({
      message: "Janji temu berhasil dibuat",
      data: janjiTemu,
      pasien: {
        id: user.id,
        nama: user.nama,
        noTelp: user.noTelp,
        alamat: user.alamat,
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
          },
        },
      },
      orderBy: {
        tanggal_waktu: "asc",
      },
    });

    res.json({ data: janjiTemu });
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

    res.json({ data: janjiTemu });
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
    });

    res.json({
      message: "Status janji temu berhasil diupdate",
      data: janjiTemu,
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};

// Dapatkan Janji Temu by Pasien ID
exports.getJanjiTemuByPasien = async (req, res) => {
  try {
    const { id_pasien } = req.params;

    const janjiTemu = await prisma.janjiTemu.findMany({
      where: { id_pasien },
      orderBy: {
        tanggal_waktu: "desc",
      },
    });

    res.json({ data: janjiTemu });
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
    });

    res.json({
      message: "Janji temu berhasil dibatalkan",
      data: janjiTemu,
    });
  } catch (error) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};
